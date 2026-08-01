import type { Config } from 'drizzle-kit';

// `driver: 'expo'` faz o drizzle-kit gerar, alem dos .sql, um
// `drizzle/migrations.js` que o app importa e executa em runtime no SQLite
// do aparelho. Na web voce rodaria as migrations no servidor; aqui elas
// viajam dentro do bundle e rodam na primeira abertura do app.
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
