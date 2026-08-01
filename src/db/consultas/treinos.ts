import { and, asc, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  exercicios,
  rotinaExercicios,
  rotinas,
  series,
  treinoExercicios,
  treinos,
  type TipoSerie,
  type Treino,
} from '@/db/schema';

import { seriesDoTreinoAnterior } from './exercicios';

// ---------------------------------------------------------------------------
// Treino em andamento
// ---------------------------------------------------------------------------

/**
 * Só pode existir um treino em andamento (`finalizadoEm IS NULL`).
 * É esta consulta que restaura a sessão quando o app é reaberto depois de
 * ser morto pelo Android — não há nada guardado só em memória.
 */
export function queryTreinoAtivo() {
  return db.select().from(treinos).where(isNull(treinos.finalizadoEm)).limit(1);
}

export async function obterTreinoAtivo() {
  const [linha] = await queryTreinoAtivo();
  return linha ?? null;
}

export type ItemTreino = {
  id: number;
  exercicioId: number;
  ordem: number;
  notas: string | null;
  nome: string;
  grupoMuscularPrimario: string;
  equipamento: string;
  descansoSegundos: number;
};

export function queryItensDoTreino(treinoId: number) {
  return db
    .select({
      id: treinoExercicios.id,
      exercicioId: treinoExercicios.exercicioId,
      ordem: treinoExercicios.ordem,
      notas: treinoExercicios.notas,
      nome: exercicios.nome,
      grupoMuscularPrimario: exercicios.grupoMuscularPrimario,
      equipamento: exercicios.equipamento,
      descansoSegundos: exercicios.descansoSegundos,
    })
    .from(treinoExercicios)
    .innerJoin(exercicios, eq(treinoExercicios.exercicioId, exercicios.id))
    .where(eq(treinoExercicios.treinoId, treinoId))
    .orderBy(asc(treinoExercicios.ordem));
}

export function querySeriesDoTreino(treinoId: number) {
  return db
    .select({
      id: series.id,
      treinoExercicioId: series.treinoExercicioId,
      numeroSerie: series.numeroSerie,
      peso: series.peso,
      repeticoes: series.repeticoes,
      rpe: series.rpe,
      tipo: series.tipo,
      concluida: series.concluida,
    })
    .from(series)
    .innerJoin(treinoExercicios, eq(series.treinoExercicioId, treinoExercicios.id))
    .where(eq(treinoExercicios.treinoId, treinoId))
    .orderBy(asc(series.treinoExercicioId), asc(series.numeroSerie));
}

// ---------------------------------------------------------------------------
// Iniciar
// ---------------------------------------------------------------------------

function nomePorHorario(agora = new Date()) {
  const h = agora.getHours();
  if (h < 12) return 'Treino da manhã';
  if (h < 18) return 'Treino da tarde';
  return 'Treino da noite';
}

export async function iniciarTreinoVazio() {
  const [criado] = await db
    .insert(treinos)
    .values({ nome: nomePorHorario(), iniciadoEm: new Date(), rotinaId: null })
    .returning();
  return criado;
}

/**
 * Cria o treino já com os exercícios da rotina e as séries-alvo em branco,
 * pré-preenchidas com os valores do último treino do mesmo exercício.
 * Assim, na maioria das séries basta um toque no check.
 */
export async function iniciarTreinoDeRotina(rotinaId: number) {
  const [rotina] = await db.select().from(rotinas).where(eq(rotinas.id, rotinaId)).limit(1);
  if (!rotina) throw new Error('Rotina não encontrada');

  const itens = await db
    .select({
      exercicioId: rotinaExercicios.exercicioId,
      ordem: rotinaExercicios.ordem,
      seriesAlvo: rotinaExercicios.seriesAlvo,
      notas: rotinaExercicios.notas,
    })
    .from(rotinaExercicios)
    .where(eq(rotinaExercicios.rotinaId, rotinaId))
    .orderBy(asc(rotinaExercicios.ordem));

  // As referências do treino anterior são lidas antes da transação para não
  // segurar o lock do SQLite durante várias consultas.
  const referencias = new Map<number, { peso: number; repeticoes: number }[]>();
  for (const item of itens) {
    const anterior = await seriesDoTreinoAnterior(item.exercicioId);
    referencias.set(
      item.exercicioId,
      anterior.series.map((s) => ({ peso: s.peso, repeticoes: s.repeticoes })),
    );
  }

  const [treino] = await db
    .insert(treinos)
    .values({ nome: rotina.nome, iniciadoEm: new Date(), rotinaId })
    .returning();

  for (const item of itens) {
    const [te] = await db
      .insert(treinoExercicios)
      .values({
        treinoId: treino.id,
        exercicioId: item.exercicioId,
        ordem: item.ordem,
        notas: item.notas,
      })
      .returning();

    const ref = referencias.get(item.exercicioId) ?? [];
    const novasSeries = Array.from({ length: Math.max(1, item.seriesAlvo) }, (_, i) => ({
      treinoExercicioId: te.id,
      numeroSerie: i + 1,
      peso: ref[i]?.peso ?? ref[ref.length - 1]?.peso ?? 0,
      repeticoes: ref[i]?.repeticoes ?? ref[ref.length - 1]?.repeticoes ?? 0,
      tipo: 'normal' as TipoSerie,
      concluida: false,
    }));
    await db.insert(series).values(novasSeries);
  }

  return treino;
}

// ---------------------------------------------------------------------------
// Exercícios dentro do treino
// ---------------------------------------------------------------------------

/** Ids dos exercícios já presentes num treino — para marcar na seleção. */
export async function exerciciosJaNoTreino(treinoId: number) {
  const linhas = await db
    .select({ exercicioId: treinoExercicios.exercicioId })
    .from(treinoExercicios)
    .where(eq(treinoExercicios.treinoId, treinoId));
  return linhas.map((l) => l.exercicioId);
}

export async function adicionarExercicioNoTreino(treinoId: number, exercicioId: number) {
  const [{ maiorOrdem }] = await db
    .select({ maiorOrdem: sql<number>`coalesce(max(${treinoExercicios.ordem}), -1)` })
    .from(treinoExercicios)
    .where(eq(treinoExercicios.treinoId, treinoId));

  const [te] = await db
    .insert(treinoExercicios)
    .values({ treinoId, exercicioId, ordem: maiorOrdem + 1 })
    .returning();

  const anterior = await seriesDoTreinoAnterior(exercicioId, treinoId);
  const base = anterior.series[0];
  await db.insert(series).values({
    treinoExercicioId: te.id,
    numeroSerie: 1,
    peso: base?.peso ?? 0,
    repeticoes: base?.repeticoes ?? 0,
    tipo: 'normal',
    concluida: false,
  });

  return te;
}

export async function removerExercicioDoTreino(treinoExercicioId: number) {
  await db.delete(treinoExercicios).where(eq(treinoExercicios.id, treinoExercicioId));
}

export async function atualizarNotasDoExercicio(treinoExercicioId: number, notas: string | null) {
  await db
    .update(treinoExercicios)
    .set({ notas: notas?.trim() || null })
    .where(eq(treinoExercicios.id, treinoExercicioId));
}

/** Callback síncrona: ver a nota em `reordenarItensDaRotina`. */
export function reordenarExerciciosDoTreino(idsNaOrdem: number[]) {
  db.transaction((tx) => {
    for (let i = 0; i < idsNaOrdem.length; i++) {
      tx.update(treinoExercicios).set({ ordem: i }).where(eq(treinoExercicios.id, idsNaOrdem[i])).run();
    }
  });
}

// ---------------------------------------------------------------------------
// Séries
// ---------------------------------------------------------------------------

export async function adicionarSerie(treinoExercicioId: number) {
  const anteriores = await db
    .select({
      numeroSerie: series.numeroSerie,
      peso: series.peso,
      repeticoes: series.repeticoes,
      tipo: series.tipo,
    })
    .from(series)
    .where(eq(series.treinoExercicioId, treinoExercicioId))
    .orderBy(desc(series.numeroSerie))
    .limit(1);

  const ultima = anteriores[0];
  const [criada] = await db
    .insert(series)
    .values({
      treinoExercicioId,
      numeroSerie: (ultima?.numeroSerie ?? 0) + 1,
      // Copia os valores da série anterior: "+ Série" já vem pronta.
      peso: ultima?.peso ?? 0,
      repeticoes: ultima?.repeticoes ?? 0,
      tipo: ultima?.tipo === 'aquecimento' ? 'normal' : (ultima?.tipo ?? 'normal'),
      concluida: false,
    })
    .returning();
  return criada;
}

/**
 * Lê a série direto do banco. Usado no instante em que a série é concluída:
 * o teclado grava a cada dígito, e o valor que chegou por props pode estar
 * um render atrás do que já está no SQLite.
 */
export async function obterSerie(serieId: number) {
  const [linha] = await db.select().from(series).where(eq(series.id, serieId)).limit(1);
  return linha ?? null;
}

export async function atualizarSerie(
  serieId: number,
  dados: Partial<{ peso: number; repeticoes: number; rpe: number | null; tipo: TipoSerie; concluida: boolean }>,
) {
  await db.update(series).set(dados).where(eq(series.id, serieId));
}

export async function removerSerie(serieId: number) {
  const [alvo] = await db.select().from(series).where(eq(series.id, serieId)).limit(1);
  if (!alvo) return;

  db.transaction((tx) => {
    tx.delete(series).where(eq(series.id, serieId)).run();
    // Renumera as séries seguintes para não deixar buracos (1, 2, 4...).
    const restantes = tx
      .select({ id: series.id })
      .from(series)
      .where(eq(series.treinoExercicioId, alvo.treinoExercicioId))
      .orderBy(asc(series.numeroSerie))
      .all();
    for (let i = 0; i < restantes.length; i++) {
      tx.update(series).set({ numeroSerie: i + 1 }).where(eq(series.id, restantes[i].id)).run();
    }
  });
}

// ---------------------------------------------------------------------------
// Finalizar / descartar
// ---------------------------------------------------------------------------

export async function finalizarTreino(treinoId: number) {
  const [treino] = await db.select().from(treinos).where(eq(treinos.id, treinoId)).limit(1);
  if (!treino) return null;

  const fim = new Date();
  const duracao = Math.max(0, Math.round((fim.getTime() - treino.iniciadoEm.getTime()) / 1000));

  // Callback síncrona: ver a nota em `reordenarItensDaRotina`.
  db.transaction((tx) => {
    // Séries não concluídas não viram histórico — são apagadas ao finalizar.
    const naoConcluidas = tx
      .select({ id: series.id })
      .from(series)
      .innerJoin(treinoExercicios, eq(series.treinoExercicioId, treinoExercicios.id))
      .where(and(eq(treinoExercicios.treinoId, treinoId), eq(series.concluida, false)))
      .all();

    for (const s of naoConcluidas) {
      tx.delete(series).where(eq(series.id, s.id)).run();
    }

    // Exercícios que ficaram sem nenhuma série também saem.
    const vazios = tx
      .select({ id: treinoExercicios.id })
      .from(treinoExercicios)
      .where(
        and(
          eq(treinoExercicios.treinoId, treinoId),
          // Idem: SQL literal para a correlação não perder o prefixo.
          sql`not exists (select 1 from series s where s.treino_exercicio_id = treino_exercicios.id)`,
        ),
      )
      .all();
    for (const te of vazios) {
      tx.delete(treinoExercicios).where(eq(treinoExercicios.id, te.id)).run();
    }

    tx.update(treinos)
      .set({ finalizadoEm: fim, duracaoSegundos: duracao })
      .where(eq(treinos.id, treinoId))
      .run();
  });

  return { ...treino, finalizadoEm: fim, duracaoSegundos: duracao };
}

export async function descartarTreino(treinoId: number) {
  await db.delete(treinos).where(eq(treinos.id, treinoId));
}

export async function renomearTreino(treinoId: number, nome: string) {
  await db.update(treinos).set({ nome: nome.trim() || 'Treino' }).where(eq(treinos.id, treinoId));
}

export async function atualizarNotasDoTreino(treinoId: number, notas: string | null) {
  await db.update(treinos).set({ notas: notas?.trim() || null }).where(eq(treinos.id, treinoId));
}

// ---------------------------------------------------------------------------
// Histórico
// ---------------------------------------------------------------------------

export function queryHistoricoTreinos(limite = 50) {
  return db
    .select({
      id: treinos.id,
      nome: treinos.nome,
      iniciadoEm: treinos.iniciadoEm,
      duracaoSegundos: treinos.duracaoSegundos,
      /**
       * SQL literal, sem `${tabela.coluna}`: num select de tabela única o
       * Drizzle emite as colunas sem o prefixo da tabela, e a subconsulta
       * correlacionada viraria `treino_id = id` — ambíguo.
       */
      totalSeries: sql<number>`(
        select count(*) from series s
        inner join treino_exercicios te on s.treino_exercicio_id = te.id
        where te.treino_id = treinos.id and s.concluida = 1
      )`,
      volume: sql<number>`coalesce((
        select sum(s.peso * s.repeticoes) from series s
        inner join treino_exercicios te on s.treino_exercicio_id = te.id
        where te.treino_id = treinos.id
          and s.concluida = 1 and s.tipo <> 'aquecimento'
      ), 0)`,
    })
    .from(treinos)
    .where(isNotNull(treinos.finalizadoEm))
    .orderBy(desc(treinos.iniciadoEm))
    .limit(limite);
}

export async function obterTreino(treinoId: number) {
  const [linha] = await db.select().from(treinos).where(eq(treinos.id, treinoId)).limit(1);
  return linha ?? null;
}

export async function excluirTreino(treinoId: number) {
  await db.delete(treinos).where(eq(treinos.id, treinoId));
}

export type SerieDoDetalhe = {
  id: number;
  numeroSerie: number;
  peso: number;
  repeticoes: number;
  rpe: number | null;
  tipo: TipoSerie;
};

export type DetalheTreino = {
  treino: Treino;
  exercicios: { id: number; exercicioId: number; nome: string; notas: string | null; series: SerieDoDetalhe[] }[];
  volume: number;
  totalSeries: number;
};

/** Treino completo com exercícios e séries — usado no resumo e no histórico. */
export async function detalheDoTreino(treinoId: number): Promise<DetalheTreino | null> {
  const treino = await obterTreino(treinoId);
  if (!treino) return null;

  const [itens, linhas] = await Promise.all([queryItensDoTreino(treinoId), querySeriesDoTreino(treinoId)]);

  const porItem = new Map<number, SerieDoDetalhe[]>();
  let volume = 0;
  let totalSeries = 0;

  for (const s of linhas) {
    if (!s.concluida) continue;
    totalSeries += 1;
    if (s.tipo !== 'aquecimento') volume += s.peso * s.repeticoes;
    const lista = porItem.get(s.treinoExercicioId) ?? [];
    lista.push({
      id: s.id,
      numeroSerie: s.numeroSerie,
      peso: s.peso,
      repeticoes: s.repeticoes,
      rpe: s.rpe,
      tipo: s.tipo,
    });
    porItem.set(s.treinoExercicioId, lista);
  }

  return {
    treino,
    volume,
    totalSeries,
    exercicios: itens
      .map((i) => ({
        id: i.id,
        exercicioId: i.exercicioId,
        nome: i.nome,
        notas: i.notas,
        series: porItem.get(i.id) ?? [],
      }))
      .filter((i) => i.series.length > 0),
  };
}
