import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

export type Banco = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

const PASTA_MIGRACOES = join(import.meta.dirname, "..", "..", "drizzle");

// Abre (ou cria) o banco e aplica as migrações pendentes. ":memory:" é usado
// nos testes.
export function abrirBanco(caminho: string): Banco {
  if (caminho !== ":memory:") mkdirSync(dirname(caminho), { recursive: true });
  const sqlite = new Database(caminho);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: PASTA_MIGRACOES });
  return db;
}
