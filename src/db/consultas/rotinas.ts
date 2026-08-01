import { asc, eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercicios, rotinaExercicios, rotinas } from '@/db/schema';

export function queryRotinas() {
  return db
    .select({
      id: rotinas.id,
      nome: rotinas.nome,
      notas: rotinas.notas,
      ordem: rotinas.ordem,
      criadoEm: rotinas.criadoEm,
      totalExercicios: sql<number>`(
        select count(*) from ${rotinaExercicios}
        where ${rotinaExercicios.rotinaId} = ${rotinas.id}
      )`,
    })
    .from(rotinas)
    .orderBy(asc(rotinas.ordem), asc(rotinas.criadoEm));
}

export type ItemRotina = {
  id: number;
  exercicioId: number;
  ordem: number;
  seriesAlvo: number;
  notas: string | null;
  nome: string;
  grupoMuscularPrimario: string;
  equipamento: string;
  descansoSegundos: number;
};

export function queryItensDaRotina(rotinaId: number) {
  return db
    .select({
      id: rotinaExercicios.id,
      exercicioId: rotinaExercicios.exercicioId,
      ordem: rotinaExercicios.ordem,
      seriesAlvo: rotinaExercicios.seriesAlvo,
      notas: rotinaExercicios.notas,
      nome: exercicios.nome,
      grupoMuscularPrimario: exercicios.grupoMuscularPrimario,
      equipamento: exercicios.equipamento,
      descansoSegundos: exercicios.descansoSegundos,
    })
    .from(rotinaExercicios)
    .innerJoin(exercicios, eq(rotinaExercicios.exercicioId, exercicios.id))
    .where(eq(rotinaExercicios.rotinaId, rotinaId))
    .orderBy(asc(rotinaExercicios.ordem));
}

export async function obterRotina(id: number) {
  const [linha] = await db.select().from(rotinas).where(eq(rotinas.id, id)).limit(1);
  return linha ?? null;
}

export async function listarItensDaRotina(rotinaId: number): Promise<ItemRotina[]> {
  return queryItensDaRotina(rotinaId);
}

export async function criarRotina(nome: string, notas?: string | null) {
  const [{ maiorOrdem }] = await db
    .select({ maiorOrdem: sql<number>`coalesce(max(${rotinas.ordem}), -1)` })
    .from(rotinas);

  const [criada] = await db
    .insert(rotinas)
    .values({
      nome: nome.trim() || 'Nova rotina',
      notas: notas?.trim() || null,
      ordem: maiorOrdem + 1,
      criadoEm: new Date(),
    })
    .returning();
  return criada;
}

export async function atualizarRotina(id: number, dados: { nome?: string; notas?: string | null }) {
  const patch: Record<string, unknown> = {};
  if (dados.nome !== undefined) patch.nome = dados.nome.trim() || 'Rotina sem nome';
  if (dados.notas !== undefined) patch.notas = dados.notas?.trim() || null;
  if (Object.keys(patch).length === 0) return;
  await db.update(rotinas).set(patch).where(eq(rotinas.id, id));
}

export async function excluirRotina(id: number) {
  await db.delete(rotinas).where(eq(rotinas.id, id));
}

export async function duplicarRotina(id: number) {
  const original = await obterRotina(id);
  if (!original) return null;

  const itens = await listarItensDaRotina(id);
  const copia = await criarRotina(`${original.nome} (cópia)`, original.notas);

  if (itens.length) {
    await db.insert(rotinaExercicios).values(
      itens.map((i) => ({
        rotinaId: copia.id,
        exercicioId: i.exercicioId,
        ordem: i.ordem,
        seriesAlvo: i.seriesAlvo,
        notas: i.notas,
      })),
    );
  }
  return copia;
}

export async function adicionarExercicioNaRotina(rotinaId: number, exercicioId: number) {
  const [{ maiorOrdem }] = await db
    .select({ maiorOrdem: sql<number>`coalesce(max(${rotinaExercicios.ordem}), -1)` })
    .from(rotinaExercicios)
    .where(eq(rotinaExercicios.rotinaId, rotinaId));

  await db.insert(rotinaExercicios).values({
    rotinaId,
    exercicioId,
    ordem: maiorOrdem + 1,
    seriesAlvo: 3,
  });
}

export async function removerItemDaRotina(itemId: number) {
  await db.delete(rotinaExercicios).where(eq(rotinaExercicios.id, itemId));
}

export async function atualizarItemDaRotina(
  itemId: number,
  dados: { seriesAlvo?: number; notas?: string | null },
) {
  const patch: Record<string, unknown> = {};
  if (dados.seriesAlvo !== undefined) patch.seriesAlvo = Math.max(1, Math.round(dados.seriesAlvo));
  if (dados.notas !== undefined) patch.notas = dados.notas?.trim() || null;
  if (Object.keys(patch).length === 0) return;
  await db.update(rotinaExercicios).set(patch).where(eq(rotinaExercicios.id, itemId));
}

/** Grava a nova ordem depois de arrastar. Recebe os ids já na ordem final. */
export async function reordenarItensDaRotina(idsNaOrdem: number[]) {
  await db.transaction(async (tx) => {
    for (let i = 0; i < idsNaOrdem.length; i++) {
      await tx.update(rotinaExercicios).set({ ordem: i }).where(eq(rotinaExercicios.id, idsNaOrdem[i]));
    }
  });
}
