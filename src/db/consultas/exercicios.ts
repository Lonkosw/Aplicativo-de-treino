import { and, asc, desc, eq, like, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercicios, series, treinoExercicios, treinos } from '@/db/schema';
import { calcularRecordes, type Recordes } from '@/lib/calculos';

export type FiltroExercicios = {
  busca?: string;
  grupo?: string | null;
  equipamento?: string | null;
};

/**
 * Devolve o *query builder* (não executa). É isso que o `useLiveQuery`
 * espera: ele roda a consulta e a repete sozinho quando as tabelas
 * envolvidas mudam.
 */
export function queryExercicios({ busca, grupo, equipamento }: FiltroExercicios = {}) {
  const condicoes = [];
  if (busca?.trim()) condicoes.push(like(exercicios.nome, `%${busca.trim()}%`));
  if (grupo) condicoes.push(eq(exercicios.grupoMuscularPrimario, grupo));
  if (equipamento) condicoes.push(eq(exercicios.equipamento, equipamento));

  return db
    .select()
    .from(exercicios)
    .where(condicoes.length ? and(...condicoes) : undefined)
    .orderBy(asc(exercicios.nome));
}

export function queryGruposMusculares() {
  return db
    .selectDistinct({ valor: exercicios.grupoMuscularPrimario })
    .from(exercicios)
    .orderBy(asc(exercicios.grupoMuscularPrimario));
}

export function queryEquipamentos() {
  return db
    .selectDistinct({ valor: exercicios.equipamento })
    .from(exercicios)
    .orderBy(asc(exercicios.equipamento));
}

export function queryExercicio(id: number) {
  return db.select().from(exercicios).where(eq(exercicios.id, id)).limit(1);
}

export async function obterExercicio(id: number) {
  const [linha] = await db.select().from(exercicios).where(eq(exercicios.id, id)).limit(1);
  return linha ?? null;
}

export async function criarExercicio(dados: {
  nome: string;
  grupoMuscularPrimario: string;
  equipamento: string;
  categoria?: string;
  instrucoes?: string | null;
  descansoSegundos?: number;
}) {
  const [criado] = await db
    .insert(exercicios)
    .values({
      nome: dados.nome.trim(),
      grupoMuscularPrimario: dados.grupoMuscularPrimario,
      gruposSecundarios: '',
      equipamento: dados.equipamento,
      categoria: dados.categoria ?? 'Musculação',
      instrucoes: dados.instrucoes?.trim() || null,
      ehCustomizado: true,
      descansoSegundos: dados.descansoSegundos ?? 90,
    })
    .returning();
  return criado;
}

export async function atualizarDescanso(exercicioId: number, segundos: number) {
  await db
    .update(exercicios)
    .set({ descansoSegundos: Math.max(0, Math.round(segundos)) })
    .where(eq(exercicios.id, exercicioId));
}

export async function excluirExercicio(id: number) {
  await db.delete(exercicios).where(eq(exercicios.id, id));
}

/** Quantos treinos já usaram este exercício — usado para avisar antes de excluir. */
export async function contarUsoEmTreinos(exercicioId: number) {
  const [linha] = await db
    .select({ total: sql<number>`count(distinct ${treinoExercicios.treinoId})` })
    .from(treinoExercicios)
    .where(eq(treinoExercicios.exercicioId, exercicioId));
  return linha?.total ?? 0;
}

export type ItemHistorico = {
  treinoId: number;
  treinoNome: string;
  data: Date;
  series: { numeroSerie: number; peso: number; repeticoes: number; tipo: string }[];
  volume: number;
  melhorPeso: number;
};

/** Histórico de cargas de um exercício, do mais recente para o mais antigo. */
export async function historicoDoExercicio(exercicioId: number, limite = 40): Promise<ItemHistorico[]> {
  const linhas = await db
    .select({
      treinoId: treinos.id,
      treinoNome: treinos.nome,
      data: treinos.iniciadoEm,
      numeroSerie: series.numeroSerie,
      peso: series.peso,
      repeticoes: series.repeticoes,
      tipo: series.tipo,
    })
    .from(series)
    .innerJoin(treinoExercicios, eq(series.treinoExercicioId, treinoExercicios.id))
    .innerJoin(treinos, eq(treinoExercicios.treinoId, treinos.id))
    .where(
      and(
        eq(treinoExercicios.exercicioId, exercicioId),
        eq(series.concluida, true),
        sql`${treinos.finalizadoEm} is not null`,
      ),
    )
    .orderBy(desc(treinos.iniciadoEm), asc(series.numeroSerie));

  const porTreino = new Map<number, ItemHistorico>();
  for (const l of linhas) {
    let item = porTreino.get(l.treinoId);
    if (!item) {
      if (porTreino.size >= limite) continue;
      item = {
        treinoId: l.treinoId,
        treinoNome: l.treinoNome,
        data: l.data,
        series: [],
        volume: 0,
        melhorPeso: 0,
      };
      porTreino.set(l.treinoId, item);
    }
    item.series.push({
      numeroSerie: l.numeroSerie,
      peso: l.peso,
      repeticoes: l.repeticoes,
      tipo: l.tipo,
    });
    if (l.tipo !== 'aquecimento') {
      item.volume += l.peso * l.repeticoes;
      item.melhorPeso = Math.max(item.melhorPeso, l.peso);
    }
  }
  return [...porTreino.values()];
}

/**
 * Recordes pessoais de um exercício considerando apenas treinos finalizados.
 * `ignorarTreinoId` permite comparar a série atual contra o histórico
 * *anterior* ao treino em andamento.
 */
export async function recordesDoExercicio(
  exercicioId: number,
  ignorarTreinoId?: number,
): Promise<Recordes> {
  const condicoes = [eq(treinoExercicios.exercicioId, exercicioId), eq(series.concluida, true)];
  if (ignorarTreinoId != null) {
    condicoes.push(sql`${treinoExercicios.treinoId} <> ${ignorarTreinoId}`);
  }

  const linhas = await db
    .select({
      peso: series.peso,
      repeticoes: series.repeticoes,
      tipo: series.tipo,
      concluida: series.concluida,
    })
    .from(series)
    .innerJoin(treinoExercicios, eq(series.treinoExercicioId, treinoExercicios.id))
    .where(and(...condicoes));

  return calcularRecordes(linhas);
}

/**
 * Séries do exercício no treino anterior mais recente — são os valores
 * cinzas de referência mostrados em cada linha da tela de treino ativo.
 */
export async function seriesDoTreinoAnterior(exercicioId: number, treinoAtualId?: number) {
  const condicoes = [eq(treinoExercicios.exercicioId, exercicioId), eq(series.concluida, true)];
  if (treinoAtualId != null) condicoes.push(sql`${treinos.id} <> ${treinoAtualId}`);

  const [ultimo] = await db
    .select({ treinoId: treinos.id, data: treinos.iniciadoEm })
    .from(series)
    .innerJoin(treinoExercicios, eq(series.treinoExercicioId, treinoExercicios.id))
    .innerJoin(treinos, eq(treinoExercicios.treinoId, treinos.id))
    .where(and(...condicoes, sql`${treinos.finalizadoEm} is not null`))
    .orderBy(desc(treinos.iniciadoEm))
    .limit(1);

  if (!ultimo) return { treinoId: null as number | null, data: null as Date | null, series: [] };

  const linhas = await db
    .select({
      numeroSerie: series.numeroSerie,
      peso: series.peso,
      repeticoes: series.repeticoes,
      tipo: series.tipo,
    })
    .from(series)
    .innerJoin(treinoExercicios, eq(series.treinoExercicioId, treinoExercicios.id))
    .where(
      and(
        eq(treinoExercicios.treinoId, ultimo.treinoId),
        eq(treinoExercicios.exercicioId, exercicioId),
        eq(series.concluida, true),
      ),
    )
    .orderBy(asc(series.numeroSerie));

  return { treinoId: ultimo.treinoId, data: ultimo.data, series: linhas };
}
