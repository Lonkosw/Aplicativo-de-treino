/**
 * Roda as consultas reais do app contra um SQLite em memória.
 *
 *   npm run verificar
 *
 * Não substitui testar no aparelho, mas pega o que mais quebra sem aparecer
 * na tela: SQL errado, agregação inflada por join, transação que não cobre
 * o que deveria e restauração de backup que perde chaves estrangeiras.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { db, sqlite } from '@/db/client';
import { eq, sql as sqlTag } from 'drizzle-orm';

import {
  historicoDoExercicio,
  recordesDoExercicio,
  seriesDoTreinoAnterior,
} from '@/db/consultas/exercicios';
import {
  progressaoDoExercicio,
  resumoDaSemana,
  totaisGerais,
  volumePorGrupoMuscular,
  volumePorSemana,
} from '@/db/consultas/estatisticas';
import {
  adicionarExercicioNaRotina,
  criarRotina,
  duplicarRotina,
  listarItensDaRotina,
  queryRotinas,
  reordenarItensDaRotina,
} from '@/db/consultas/rotinas';
import {
  adicionarSerie,
  atualizarSerie,
  detalheDoTreino,
  finalizarTreino,
  iniciarTreinoDeRotina,
  iniciarTreinoVazio,
  obterTreinoAtivo,
  queryHistoricoTreinos,
  querySeriesDoTreino,
  removerSerie,
} from '@/db/consultas/treinos';
import { exercicios, rotinaExercicios, series, treinoExercicios, treinos } from '@/db/schema';
import { montarBackup, restaurarBackup, validarBackup } from '@/lib/backup';
import { epley1RM, inicioDaSemana, sequenciaDeSemanas, volumeTotal } from '@/lib/calculos';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

let falhas = 0;
let passou = 0;

function teste(nome: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passou += 1;
      console.log(`  ok  ${nome}`);
    })
    .catch((e: Error) => {
      falhas += 1;
      console.log(`FALHA  ${nome}`);
      console.log(`       ${e.message.split('\n').slice(0, 6).join('\n       ')}`);
    });
}

function aplicarMigrations() {
  const journal = JSON.parse(readFileSync(resolve(RAIZ, 'drizzle/meta/_journal.json'), 'utf8'));
  for (const entrada of journal.entries) {
    const conteudo = readFileSync(resolve(RAIZ, `drizzle/${entrada.tag}.sql`), 'utf8');
    for (const comando of conteudo.split('--> statement-breakpoint')) {
      const limpo = comando.trim();
      if (limpo) sqlite.execSync(limpo);
    }
  }
}

async function semear() {
  await db.insert(exercicios).values([
    { nome: 'Supino reto com barra', grupoMuscularPrimario: 'Peito', equipamento: 'Barra', categoria: 'Musculação' },
    { nome: 'Agachamento livre com barra', grupoMuscularPrimario: 'Quadríceps', equipamento: 'Barra', categoria: 'Musculação' },
    { nome: 'Rosca direta com barra', grupoMuscularPrimario: 'Bíceps', equipamento: 'Barra', categoria: 'Musculação' },
  ]);
}

/** Cria um treino finalizado no passado, para os testes de histórico. */
async function treinoHistorico(
  exercicioId: number,
  quandoMs: number,
  seriesDados: { peso: number; repeticoes: number; tipo?: 'normal' | 'aquecimento' }[],
  duracaoSegundos = 3600,
) {
  const inicio = new Date(quandoMs);
  const [t] = await db
    .insert(treinos)
    .values({
      nome: 'Treino',
      iniciadoEm: inicio,
      finalizadoEm: new Date(quandoMs + duracaoSegundos * 1000),
      duracaoSegundos,
    })
    .returning();

  const [te] = await db
    .insert(treinoExercicios)
    .values({ treinoId: t.id, exercicioId, ordem: 0 })
    .returning();

  await db.insert(series).values(
    seriesDados.map((s, i) => ({
      treinoExercicioId: te.id,
      numeroSerie: i + 1,
      peso: s.peso,
      repeticoes: s.repeticoes,
      tipo: s.tipo ?? ('normal' as const),
      concluida: true,
    })),
  );
  return t;
}

const DIA = 86_400_000;

async function main() {
  aplicarMigrations();
  await semear();

  console.log('\ncálculos puros');

  await teste('volume ignora aquecimento e séries não concluídas', () => {
    const total = volumeTotal([
      { peso: 100, repeticoes: 10, tipo: 'normal', concluida: true },
      { peso: 40, repeticoes: 15, tipo: 'aquecimento', concluida: true },
      { peso: 100, repeticoes: 8, tipo: 'normal', concluida: false },
    ]);
    assert.equal(total, 1000);
  });

  await teste('Epley: 1 repetição devolve o próprio peso', () => {
    assert.equal(Math.round(epley1RM(100, 1) * 100) / 100, 103.33);
    assert.equal(epley1RM(0, 10), 0);
  });

  await teste('início da semana cai numa segunda-feira', () => {
    const d = inicioDaSemana(new Date('2026-08-01T15:00:00'));
    assert.equal(d.getDay(), 1);
    assert.equal(d.getHours(), 0);
  });

  await teste('sequência conta semanas consecutivas', () => {
    const hoje = new Date();
    const datas = [hoje, new Date(hoje.getTime() - 7 * DIA), new Date(hoje.getTime() - 14 * DIA)];
    assert.equal(sequenciaDeSemanas(datas), 3);
    assert.equal(sequenciaDeSemanas([new Date(hoje.getTime() - 60 * DIA)]), 0);
    assert.equal(sequenciaDeSemanas([]), 0);
  });

  console.log('\nchaves estrangeiras e cascade');

  await teste('PRAGMA foreign_keys está ligado', () => {
    const linhas = sqlite.prepareSync('pragma foreign_keys').executeSync([]).getAllSync() as {
      foreign_keys: number;
    }[];
    assert.equal(linhas[0].foreign_keys, 1);
  });

  await teste('apagar treino apaga exercícios e séries em cascade', async () => {
    const t = await treinoHistorico(1, Date.now() - 30 * DIA, [{ peso: 60, repeticoes: 10 }]);
    await db.delete(treinos).where(eq(treinos.id, t.id));
    const restantes = await db.select().from(series);
    const orfas = restantes.filter((s) => s.treinoExercicioId === t.id);
    assert.equal(orfas.length, 0);
  });

  console.log('\ntreino em andamento');

  let treinoAtivoId = 0;

  await teste('iniciar treino vazio cria exatamente um treino ativo', async () => {
    const t = await iniciarTreinoVazio();
    treinoAtivoId = t.id;
    const ativo = await obterTreinoAtivo();
    assert.ok(ativo, 'deveria existir treino ativo');
    assert.equal(ativo.id, t.id);
    assert.equal(ativo.finalizadoEm, null);
  });

  await teste('adicionar série copia os valores da anterior', async () => {
    const [te] = await db
      .insert(treinoExercicios)
      .values({ treinoId: treinoAtivoId, exercicioId: 1, ordem: 0 })
      .returning();
    await db
      .insert(series)
      .values({ treinoExercicioId: te.id, numeroSerie: 1, peso: 80, repeticoes: 8, concluida: true });

    const nova = await adicionarSerie(te.id);
    assert.equal(nova.peso, 80);
    assert.equal(nova.repeticoes, 8);
    assert.equal(nova.numeroSerie, 2);
    assert.equal(nova.concluida, false);
  });

  await teste('remover série renumera as seguintes sem deixar buraco', async () => {
    const [te] = await db
      .insert(treinoExercicios)
      .values({ treinoId: treinoAtivoId, exercicioId: 2, ordem: 1 })
      .returning();
    await db.insert(series).values([
      { treinoExercicioId: te.id, numeroSerie: 1, peso: 100, repeticoes: 5 },
      { treinoExercicioId: te.id, numeroSerie: 2, peso: 100, repeticoes: 5 },
      { treinoExercicioId: te.id, numeroSerie: 3, peso: 100, repeticoes: 5 },
    ]);

    const antes = await db.select().from(series).where(eq(series.treinoExercicioId, te.id));
    const doMeio = antes.find((s) => s.numeroSerie === 2)!;
    await removerSerie(doMeio.id);

    const depois = (await db.select().from(series).where(eq(series.treinoExercicioId, te.id))).sort(
      (a, b) => a.numeroSerie - b.numeroSerie,
    );
    assert.deepEqual(
      depois.map((s) => s.numeroSerie),
      [1, 2],
    );
  });

  await teste('finalizar descarta séries não concluídas e grava duração', async () => {
    const antes = await querySeriesDoTreino(treinoAtivoId);
    const naoConcluidas = antes.filter((s) => !s.concluida).length;
    assert.ok(naoConcluidas > 0, 'fixture precisa ter séries pendentes');

    const finalizado = await finalizarTreino(treinoAtivoId);
    assert.ok(finalizado?.finalizadoEm);

    const depois = await querySeriesDoTreino(treinoAtivoId);
    assert.equal(
      depois.filter((s) => !s.concluida).length,
      0,
      'séries não concluídas deveriam ter sido apagadas',
    );
    assert.equal(await obterTreinoAtivo(), null, 'não deveria restar treino ativo');
  });

  await teste('finalizar remove exercício que ficou sem nenhuma série', async () => {
    const t = await iniciarTreinoVazio();
    const [comSerie] = await db
      .insert(treinoExercicios)
      .values({ treinoId: t.id, exercicioId: 1, ordem: 0 })
      .returning();
    const [semSerie] = await db
      .insert(treinoExercicios)
      .values({ treinoId: t.id, exercicioId: 2, ordem: 1 })
      .returning();

    await db.insert(series).values([
      { treinoExercicioId: comSerie.id, numeroSerie: 1, peso: 50, repeticoes: 10, concluida: true },
      { treinoExercicioId: semSerie.id, numeroSerie: 1, peso: 50, repeticoes: 10, concluida: false },
    ]);

    // Um exercício de OUTRO treino, também sem séries, não pode ser afetado.
    const [outro] = await db
      .insert(treinos)
      .values({ nome: 'Outro', iniciadoEm: new Date(), duracaoSegundos: 0 })
      .returning();
    const [intocado] = await db
      .insert(treinoExercicios)
      .values({ treinoId: outro.id, exercicioId: 3, ordem: 0 })
      .returning();

    await finalizarTreino(t.id);

    const restantes = await db.select().from(treinoExercicios);
    const ids = restantes.map((r) => r.id);
    assert.ok(ids.includes(comSerie.id), 'o exercício com série deveria ficar');
    assert.ok(!ids.includes(semSerie.id), 'o exercício sem série deveria sair');
    assert.ok(ids.includes(intocado.id), 'exercício de outro treino não pode ser removido');

    await db.delete(treinos).where(eq(treinos.id, outro.id));
  });

  console.log('\nhistórico, recordes e referência do treino anterior');

  await teste('recordes usam maior peso, maior volume de série e maior 1RM', async () => {
    await treinoHistorico(3, Date.now() - 20 * DIA, [
      { peso: 30, repeticoes: 10 },
      { peso: 40, repeticoes: 6 },
      { peso: 20, repeticoes: 20, tipo: 'aquecimento' },
    ]);

    const pr = await recordesDoExercicio(3);
    assert.equal(pr.maiorPeso, 40);
    assert.equal(pr.maiorVolumeSerie, 300); // 30 × 10 > 40 × 6
    assert.equal(Math.round(pr.maior1RM * 100) / 100, 48); // 40 × (1 + 6/30)
  });

  await teste('séries do treino anterior vêm do treino mais recente', async () => {
    await treinoHistorico(3, Date.now() - 10 * DIA, [{ peso: 45, repeticoes: 8 }]);
    const anterior = await seriesDoTreinoAnterior(3);
    assert.equal(anterior.series.length, 1);
    assert.equal(anterior.series[0].peso, 45);
  });

  await teste('treino em andamento não vira referência de si mesmo', async () => {
    const emAndamento = await iniciarTreinoVazio();
    const [te] = await db
      .insert(treinoExercicios)
      .values({ treinoId: emAndamento.id, exercicioId: 3, ordem: 0 })
      .returning();
    await db
      .insert(series)
      .values({ treinoExercicioId: te.id, numeroSerie: 1, peso: 999, repeticoes: 1, concluida: true });

    const anterior = await seriesDoTreinoAnterior(3, emAndamento.id);
    assert.notEqual(anterior.series[0]?.peso, 999);
    assert.equal(anterior.series[0]?.peso, 45);

    const prSemOAtual = await recordesDoExercicio(3, emAndamento.id);
    assert.equal(prSemOAtual.maiorPeso, 45);

    await db.delete(treinos).where(eq(treinos.id, emAndamento.id));
  });

  await teste('histórico agrupa por treino e soma volume sem aquecimento', async () => {
    const hist = await historicoDoExercicio(3);
    assert.equal(hist.length, 2);
    const maisAntigo = hist[hist.length - 1];
    assert.equal(maisAntigo.volume, 30 * 10 + 40 * 6);
    assert.equal(maisAntigo.melhorPeso, 40);
  });

  console.log('\nagregações');

  await teste('volume total não é inflado pelo join com séries', async () => {
    const totais = await totaisGerais();
    const todas = await db.select().from(series);
    const esperado = todas
      .filter((s) => s.concluida && s.tipo !== 'aquecimento')
      .reduce((soma, s) => soma + s.peso * s.repeticoes, 0);
    assert.equal(Math.round(totais.volume), Math.round(esperado));
  });

  await teste('tempo total não é multiplicado pelo número de séries', async () => {
    const totais = await totaisGerais();
    const finalizados = (await db.select().from(treinos)).filter((t) => t.finalizadoEm);
    const esperado = finalizados.reduce((s, t) => s + t.duracaoSegundos, 0);
    assert.equal(totais.segundos, esperado);
    assert.equal(totais.treinos, finalizados.length);
  });

  await teste('resumo da semana conta só a semana corrente', async () => {
    const agora = Date.now();
    await treinoHistorico(1, agora - 60 * 60 * 1000, [{ peso: 100, repeticoes: 10 }], 1800);
    const resumo = await resumoDaSemana();
    const inicio = inicioDaSemana(new Date()).getTime();
    const daSemana = (await db.select().from(treinos)).filter(
      (t) => t.finalizadoEm && t.iniciadoEm.getTime() >= inicio,
    );
    assert.equal(resumo.treinos, daSemana.length);
    assert.ok(resumo.volume > 0);
  });

  await teste('volume por semana devolve 8 baldes contíguos', async () => {
    const pontos = await volumePorSemana(8);
    assert.equal(pontos.length, 8);
    for (let i = 1; i < pontos.length; i++) {
      const delta = pontos[i].inicio.getTime() - pontos[i - 1].inicio.getTime();
      assert.equal(Math.round(delta / DIA), 7);
    }
    assert.ok(pontos[pontos.length - 1].volume > 0, 'a semana atual deveria ter volume');
  });

  await teste('volume por grupo muscular agrupa pelo músculo primário', async () => {
    const grupos = await volumePorGrupoMuscular(60);
    const nomes = grupos.map((g) => g.grupo);
    assert.ok(nomes.includes('Peito'), `esperava Peito em ${nomes.join(', ')}`);
    assert.ok(nomes.includes('Bíceps'), `esperava Bíceps em ${nomes.join(', ')}`);
    // Ordenado do maior para o menor.
    for (let i = 1; i < grupos.length; i++) {
      assert.ok(grupos[i - 1].volume >= grupos[i].volume);
    }
  });

  await teste('progressão devolve um ponto por treino, em ordem cronológica', async () => {
    const pontos = await progressaoDoExercicio(3);
    assert.equal(pontos.length, 2);
    assert.ok(pontos[0].data.getTime() < pontos[1].data.getTime());
    assert.equal(pontos[1].melhorPeso, 45);
  });

  await teste('histórico de treinos traz contagem e volume por linha', async () => {
    const linhas = await queryHistoricoTreinos(50);
    assert.ok(linhas.length > 0);
    for (const l of linhas) {
      const detalhe = await detalheDoTreino(l.id);
      assert.equal(l.totalSeries, detalhe!.totalSeries, `séries do treino ${l.id}`);
      assert.equal(Math.round(l.volume), Math.round(detalhe!.volume), `volume do treino ${l.id}`);
    }
  });

  console.log('\nrotinas');

  await teste('reordenar grava a nova ordem no banco', async () => {
    const rotina = await criarRotina('Push A');
    await adicionarExercicioNaRotina(rotina.id, 1);
    await adicionarExercicioNaRotina(rotina.id, 2);
    await adicionarExercicioNaRotina(rotina.id, 3);

    const antes = await listarItensDaRotina(rotina.id);
    assert.deepEqual(
      antes.map((i) => i.exercicioId),
      [1, 2, 3],
    );

    const invertida = [...antes].reverse();
    await reordenarItensDaRotina(invertida.map((i) => i.id));

    const depois = await listarItensDaRotina(rotina.id);
    assert.deepEqual(
      depois.map((i) => i.exercicioId),
      [3, 2, 1],
      'a ordem deveria ter sido persistida pela transação',
    );
  });

  await teste('lista de rotinas conta os exercícios de cada uma', async () => {
    const rotina = await criarRotina('Contagem');
    await adicionarExercicioNaRotina(rotina.id, 1);
    await adicionarExercicioNaRotina(rotina.id, 2);

    const lista = await queryRotinas();
    const alvo = lista.find((r) => r.id === rotina.id);
    assert.ok(alvo, 'a rotina criada deveria aparecer na lista');
    assert.equal(alvo.totalExercicios, 2);
    // Rotinas vazias precisam mostrar zero, não o total global.
    const vazia = await criarRotina('Vazia');
    const listaDepois = await queryRotinas();
    assert.equal(listaDepois.find((r) => r.id === vazia.id)!.totalExercicios, 0);
  });

  await teste('duplicar copia os itens sem mexer no original', async () => {
    const original = (await criarRotina('Pull A'))!;
    await adicionarExercicioNaRotina(original.id, 1);
    await adicionarExercicioNaRotina(original.id, 2);

    const copia = await duplicarRotina(original.id);
    assert.ok(copia);
    assert.notEqual(copia.id, original.id);
    assert.equal(copia.nome, 'Pull A (cópia)');

    const itensCopia = await listarItensDaRotina(copia.id);
    const itensOriginal = await listarItensDaRotina(original.id);
    assert.equal(itensCopia.length, 2);
    assert.deepEqual(
      itensCopia.map((i) => i.exercicioId),
      itensOriginal.map((i) => i.exercicioId),
    );
  });

  await teste('iniciar da rotina cria as séries-alvo já preenchidas', async () => {
    const rotina = await criarRotina('Braço');
    await adicionarExercicioNaRotina(rotina.id, 3);

    const treino = await iniciarTreinoDeRotina(rotina.id);
    const seriesCriadas = await querySeriesDoTreino(treino.id);

    assert.equal(seriesCriadas.length, 3, 'seriesAlvo padrão é 3');
    assert.equal(seriesCriadas[0].peso, 45, 'deveria herdar o peso do último treino');
    assert.equal(seriesCriadas[0].repeticoes, 8);
    assert.ok(seriesCriadas.every((s) => !s.concluida));

    await db.delete(treinos).where(eq(treinos.id, treino.id));
  });

  console.log('\nbackup');

  await teste('exportar e restaurar preserva ids e chaves estrangeiras', async () => {
    const backup = await montarBackup();
    const antesTreinos = backup.dados.treinos.length;
    const antesSeries = backup.dados.series.length;
    assert.ok(antesTreinos > 0 && antesSeries > 0);

    // Simula o arquivo em disco: passa por JSON, então datas viram string.
    const doArquivo = JSON.parse(JSON.stringify(backup));
    const validacao = validarBackup(doArquivo);
    assert.ok(validacao.ok, validacao.ok ? '' : validacao.erro);

    await restaurarBackup(validacao.backup);

    const depoisTreinos = await db.select().from(treinos);
    const depoisSeries = await db.select().from(series);
    assert.equal(depoisTreinos.length, antesTreinos);
    assert.equal(depoisSeries.length, antesSeries);
    assert.ok(depoisTreinos[0].iniciadoEm instanceof Date, 'datas deveriam voltar como Date');

    // Nenhuma série órfã: as FKs continuam apontando para linhas existentes.
    const idsExercicios = new Set((await db.select().from(treinoExercicios)).map((t) => t.id));
    const orfas = depoisSeries.filter((s) => !idsExercicios.has(s.treinoExercicioId));
    assert.equal(orfas.length, 0);
  });

  await teste('restauração falha inteira: rollback devolve os dados antigos', async () => {
    const antes = await db.select().from(treinos);
    assert.ok(antes.length > 0);

    const backup = await montarBackup();
    // Uma série apontando para um treino_exercicio inexistente viola a FK e
    // deve abortar a restauração inteira, sem apagar nada.
    backup.dados.series = [
      ...(backup.dados.series as Record<string, unknown>[]),
      { id: 999999, treinoExercicioId: 987654, numeroSerie: 1, peso: 1, repeticoes: 1, tipo: 'normal', concluida: 1 },
    ];

    assert.throws(() => restaurarBackup(backup), /FOREIGN KEY|constraint/i);

    const depois = await db.select().from(treinos);
    assert.equal(depois.length, antes.length, 'o rollback deveria preservar os treinos');
  });

  await teste('reordenar é atômico: id inexistente não deixa ordem pela metade', async () => {
    const rotina = await criarRotina('Atômica');
    await adicionarExercicioNaRotina(rotina.id, 1);
    await adicionarExercicioNaRotina(rotina.id, 2);
    const itens = await listarItensDaRotina(rotina.id);
    const ordemOriginal = itens.map((i) => i.exercicioId);

    // Segundo update falha (coluna inválida) depois do primeiro ter rodado.
    assert.throws(() => {
      db.transaction((tx) => {
        tx.update(rotinaExercicios).set({ ordem: 5 }).where(eq(rotinaExercicios.id, itens[0].id)).run();
        tx.run(sqlTag.raw('update rotina_exercicios set coluna_inexistente = 1'));
      });
    });

    const depois = await listarItensDaRotina(rotina.id);
    assert.deepEqual(
      depois.map((i) => i.exercicioId),
      ordemOriginal,
      'a transação deveria ter revertido a primeira escrita',
    );
  });

  await teste('validação rejeita arquivo de outro formato', () => {
    assert.equal(validarBackup({ formato: 'outra-coisa' }).ok, false);
    assert.equal(validarBackup(null).ok, false);
    assert.equal(validarBackup({ formato: 'treino-backup', versao: 99, dados: {} }).ok, false);
    assert.equal(
      validarBackup({ formato: 'treino-backup', versao: 1, dados: { exercicios: [] } }).ok,
      false,
    );
  });

  await teste('atualizar série grava imediatamente no banco', async () => {
    const t = await iniciarTreinoVazio();
    const [te] = await db
      .insert(treinoExercicios)
      .values({ treinoId: t.id, exercicioId: 1, ordem: 0 })
      .returning();
    const [s] = await db
      .insert(series)
      .values({ treinoExercicioId: te.id, numeroSerie: 1, peso: 0, repeticoes: 0 })
      .returning();

    await atualizarSerie(s.id, { peso: 82.5 });
    await atualizarSerie(s.id, { repeticoes: 7 });
    await atualizarSerie(s.id, { concluida: true });

    const [lido] = await db.select().from(series).where(eq(series.id, s.id));
    assert.equal(lido.peso, 82.5);
    assert.equal(lido.repeticoes, 7);
    assert.equal(lido.concluida, true);
  });

  console.log(`\n${passou} passaram, ${falhas} falharam\n`);
  process.exit(falhas > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
