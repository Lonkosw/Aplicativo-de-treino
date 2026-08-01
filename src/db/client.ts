import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import * as schema from './schema';

export const NOME_BANCO = 'treino.db';

/**
 * `openDatabaseSync` abre o arquivo SQLite no sandbox do app. Diferente da
 * web, o banco vive no aparelho e sobrevive a fechar o app — e a nossa
 * unica forma de persistencia (nao ha servidor).
 *
 * `enableChangeListener: true` liga o hook `useLiveQuery` do Drizzle:
 * qualquer INSERT/UPDATE/DELETE re-renderiza automaticamente as telas que
 * consultam a tabela afetada. E o equivalente local de um react-query com
 * invalidacao automatica.
 */
export const sqlite: SQLiteDatabase = openDatabaseSync(NOME_BANCO, {
  enableChangeListener: true,
});

// SQLite ignora chaves estrangeiras por padrao — precisa ser ligado por
// conexao, senao os ON DELETE CASCADE do schema nao valem nada.
sqlite.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });

export type BancoDados = typeof db;
