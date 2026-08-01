/**
 * Implementa a fatia da API do `expo-sqlite` que o driver expo do Drizzle
 * usa, em cima do `node:sqlite`. Serve só para rodar as consultas reais do
 * app contra um SQLite de verdade no Node, sem emulador.
 *
 * O driver usa apenas:
 *   client.execSync(sql)
 *   client.prepareSync(sql) -> { executeSync(params), executeForRawResultSync(params) }
 */
import { DatabaseSync } from 'node:sqlite';

function ehLeitura(sql) {
  return /^\s*(select|with|pragma)/i.test(sql) || /\breturning\b/i.test(sql);
}

class StatementShim {
  constructor(db, sql) {
    this.sql = sql;
    this.stmt = db.prepare(sql);
  }

  executeSync(params = []) {
    if (ehLeitura(this.sql)) {
      const linhas = this.stmt.all(...params).map((l) => ({ ...l }));
      return {
        changes: 0,
        lastInsertRowId: 0,
        getAllSync: () => linhas,
        getFirstSync: () => linhas[0],
      };
    }
    const info = this.stmt.run(...params);
    return {
      changes: Number(info.changes),
      lastInsertRowId: Number(info.lastInsertRowid),
      getAllSync: () => [],
      getFirstSync: () => undefined,
    };
  }

  executeForRawResultSync(params = []) {
    const linhas = this.stmt.all(...params).map((l) => Object.values(l));
    return { getAllSync: () => linhas };
  }
}

class DatabaseShim {
  constructor(caminho) {
    this.db = new DatabaseSync(caminho);
  }
  execSync(sql) {
    this.db.exec(sql);
  }
  prepareSync(sql) {
    return new StatementShim(this.db, sql);
  }
  closeSync() {
    this.db.close();
  }
}

export function openDatabaseSync(nome) {
  // Em memória: cada execução da verificação começa do zero.
  return new DatabaseShim(nome === ':memory:' ? ':memory:' : ':memory:');
}

export function openDatabaseAsync(nome) {
  return Promise.resolve(openDatabaseSync(nome));
}

/** Usado pelo `useLiveQuery`; a verificação não renderiza componentes. */
export function addDatabaseChangeListener() {
  return { remove() {} };
}

export const SQLiteProvider = null;

export default { openDatabaseSync, openDatabaseAsync, addDatabaseChangeListener };
