import { count } from 'drizzle-orm';

import semente from '@/assets/seed-exercicios.json';

import { db } from './client';
import { exercicios } from './schema';

type LinhaSemente = {
  nome: string;
  grupoMuscularPrimario: string;
  gruposSecundarios: string;
  equipamento: string;
  categoria: string;
};

/**
 * Popula a base de exercicios na primeira execucao.
 *
 * O JSON e importado estaticamente: o Metro embute o arquivo no bundle,
 * entao ele ja esta em memoria quando o app abre — nao ha download nem
 * leitura de disco.
 */
export async function popularExerciciosSeVazio() {
  const [{ total }] = await db.select({ total: count() }).from(exercicios);
  if (total > 0) return { inseridos: 0, jaExistia: total };

  const linhas = semente as LinhaSemente[];

  // SQLite tem limite de ~999 parametros por statement. Inserimos em lotes
  // dentro de uma unica transacao: ~870 exercicios entram em menos de 100ms.
  const TAMANHO_LOTE = 100;
  await db.transaction(async (tx) => {
    for (let i = 0; i < linhas.length; i += TAMANHO_LOTE) {
      const lote = linhas.slice(i, i + TAMANHO_LOTE).map((e) => ({
        nome: e.nome,
        grupoMuscularPrimario: e.grupoMuscularPrimario,
        gruposSecundarios: e.gruposSecundarios,
        equipamento: e.equipamento,
        categoria: e.categoria,
        ehCustomizado: false,
        descansoSegundos: 90,
      }));
      await tx.insert(exercicios).values(lote);
    }
  });

  return { inseridos: linhas.length, jaExistia: 0 };
}
