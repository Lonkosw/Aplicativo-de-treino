import { and, asc, desc, gte, isNotNull, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercicios, series, treinoExercicios, treinos } from '@/db/schema';
import { inicioDaSemana, sequenciaDeSemanas } from '@/lib/calculos';

/** Expressão SQL do volume de uma série válida (concluída, não aquecimento). */
const VOLUME_VALIDO = sql<number>`coalesce(sum(
  case when ${series.concluida} = 1 and ${series.tipo} <> 'aquecimento'
       then ${series.peso} * ${series.repeticoes} else 0 end
), 0)`;

export type ResumoPeriodo = {
  treinos: number;
  volume: number;
  segundos: number;
  series: number;
};

async function resumoDesde(desde: Date): Promise<ResumoPeriodo> {
  // Contagem e tempo saem de uma consulta sem join. Somar duração junto com
  // as séries multiplicaria o total por linha — por isso duas consultas.
  const [linha] = await db
    .select({
      treinos: sql<number>`count(*)`,
      segundos: sql<number>`coalesce(sum(${treinos.duracaoSegundos}), 0)`,
    })
    .from(treinos)
    .where(and(isNotNull(treinos.finalizadoEm), gte(treinos.iniciadoEm, desde)));

  const [agregado] = await db
    .select({
      volume: VOLUME_VALIDO,
      series: sql<number>`coalesce(sum(case when ${series.concluida} = 1 then 1 else 0 end), 0)`,
    })
    .from(series)
    .innerJoin(treinoExercicios, sql`${series.treinoExercicioId} = ${treinoExercicios.id}`)
    .innerJoin(treinos, sql`${treinoExercicios.treinoId} = ${treinos.id}`)
    .where(and(isNotNull(treinos.finalizadoEm), gte(treinos.iniciadoEm, desde)));

  return {
    treinos: linha?.treinos ?? 0,
    segundos: linha?.segundos ?? 0,
    volume: agregado?.volume ?? 0,
    series: agregado?.series ?? 0,
  };
}

/** Resumo da semana corrente (segunda a domingo). */
export function resumoDaSemana() {
  return resumoDesde(inicioDaSemana(new Date()));
}

export async function totaisGerais() {
  const [linha] = await db
    .select({
      treinos: sql<number>`count(*)`,
      segundos: sql<number>`coalesce(sum(${treinos.duracaoSegundos}), 0)`,
    })
    .from(treinos)
    .where(isNotNull(treinos.finalizadoEm));

  const [agregado] = await db
    .select({ volume: VOLUME_VALIDO })
    .from(series)
    .innerJoin(treinoExercicios, sql`${series.treinoExercicioId} = ${treinoExercicios.id}`)
    .innerJoin(treinos, sql`${treinoExercicios.treinoId} = ${treinos.id}`)
    .where(isNotNull(treinos.finalizadoEm));

  const datas = await db
    .select({ data: treinos.iniciadoEm })
    .from(treinos)
    .where(isNotNull(treinos.finalizadoEm))
    .orderBy(desc(treinos.iniciadoEm));

  return {
    treinos: linha?.treinos ?? 0,
    segundos: linha?.segundos ?? 0,
    volume: agregado?.volume ?? 0,
    sequenciaSemanas: sequenciaDeSemanas(datas.map((d) => d.data)),
  };
}

export type PontoSemana = { inicio: Date; volume: number; treinos: number };

/** Volume por semana nas últimas `semanas` semanas, incluindo as vazias. */
export async function volumePorSemana(semanas = 8): Promise<PontoSemana[]> {
  const primeiraSemana = inicioDaSemana(new Date());
  primeiraSemana.setDate(primeiraSemana.getDate() - 7 * (semanas - 1));

  const linhas = await db
    .select({
      data: treinos.iniciadoEm,
      treinoId: treinos.id,
      peso: series.peso,
      repeticoes: series.repeticoes,
      tipo: series.tipo,
      concluida: series.concluida,
    })
    .from(treinos)
    .innerJoin(treinoExercicios, sql`${treinoExercicios.treinoId} = ${treinos.id}`)
    .innerJoin(series, sql`${series.treinoExercicioId} = ${treinoExercicios.id}`)
    .where(and(isNotNull(treinos.finalizadoEm), gte(treinos.iniciadoEm, primeiraSemana)));

  const baldes = new Map<number, { volume: number; treinos: Set<number> }>();
  for (let i = 0; i < semanas; i++) {
    const d = new Date(primeiraSemana);
    d.setDate(d.getDate() + 7 * i);
    baldes.set(d.getTime(), { volume: 0, treinos: new Set() });
  }

  for (const l of linhas) {
    const chave = inicioDaSemana(l.data).getTime();
    const balde = baldes.get(chave);
    if (!balde) continue;
    balde.treinos.add(l.treinoId);
    if (l.concluida && l.tipo !== 'aquecimento') balde.volume += l.peso * l.repeticoes;
  }

  return [...baldes.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ms, v]) => ({ inicio: new Date(ms), volume: v.volume, treinos: v.treinos.size }));
}

export type FatiaGrupo = { grupo: string; volume: number };

/** Volume acumulado por grupo muscular primário nos últimos `dias` dias. */
export async function volumePorGrupoMuscular(dias = 30): Promise<FatiaGrupo[]> {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  desde.setHours(0, 0, 0, 0);

  const linhas = await db
    .select({
      grupo: exercicios.grupoMuscularPrimario,
      volume: VOLUME_VALIDO,
    })
    .from(series)
    .innerJoin(treinoExercicios, sql`${series.treinoExercicioId} = ${treinoExercicios.id}`)
    .innerJoin(treinos, sql`${treinoExercicios.treinoId} = ${treinos.id}`)
    .innerJoin(exercicios, sql`${treinoExercicios.exercicioId} = ${exercicios.id}`)
    .where(and(isNotNull(treinos.finalizadoEm), gte(treinos.iniciadoEm, desde)))
    .groupBy(exercicios.grupoMuscularPrimario)
    .orderBy(desc(VOLUME_VALIDO));

  return linhas.filter((l) => l.volume > 0);
}

export type PontoProgressao = { data: Date; melhorPeso: number; melhor1RM: number; volume: number };

/** Série temporal de um exercício para o gráfico de progressão. */
export async function progressaoDoExercicio(exercicioId: number, limite = 30): Promise<PontoProgressao[]> {
  const linhas = await db
    .select({
      treinoId: treinos.id,
      data: treinos.iniciadoEm,
      peso: series.peso,
      repeticoes: series.repeticoes,
      tipo: series.tipo,
    })
    .from(series)
    .innerJoin(treinoExercicios, sql`${series.treinoExercicioId} = ${treinoExercicios.id}`)
    .innerJoin(treinos, sql`${treinoExercicios.treinoId} = ${treinos.id}`)
    .where(
      and(
        sql`${treinoExercicios.exercicioId} = ${exercicioId}`,
        sql`${series.concluida} = 1`,
        sql`${series.tipo} <> 'aquecimento'`,
        isNotNull(treinos.finalizadoEm),
      ),
    )
    .orderBy(asc(treinos.iniciadoEm));

  const porTreino = new Map<number, PontoProgressao>();
  for (const l of linhas) {
    const atual = porTreino.get(l.treinoId) ?? {
      data: l.data,
      melhorPeso: 0,
      melhor1RM: 0,
      volume: 0,
    };
    atual.melhorPeso = Math.max(atual.melhorPeso, l.peso);
    atual.melhor1RM = Math.max(atual.melhor1RM, l.peso * (1 + l.repeticoes / 30));
    atual.volume += l.peso * l.repeticoes;
    porTreino.set(l.treinoId, atual);
  }

  return [...porTreino.values()].slice(-limite);
}
