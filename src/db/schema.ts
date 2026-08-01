import { relations } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Datas sao gravadas como INTEGER (unix ms) e nao como texto ISO.
 * SQLite nao tem tipo DATE nativo; inteiro ordena e indexa de forma
 * confiavel, e o Drizzle converte para `Date` automaticamente no JS.
 */

export const exercicios = sqliteTable(
  'exercicios',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    nome: text('nome').notNull(),
    grupoMuscularPrimario: text('grupo_muscular_primario').notNull(),
    /** CSV — SQLite nao tem array; a lista e curta e so usada para exibir. */
    gruposSecundarios: text('grupos_secundarios').notNull().default(''),
    equipamento: text('equipamento').notNull().default('Outro'),
    categoria: text('categoria').notNull().default('Musculacao'),
    instrucoes: text('instrucoes'),
    ehCustomizado: integer('eh_customizado', { mode: 'boolean' }).notNull().default(false),
    /** Descanso padrao deste exercicio, em segundos. */
    descansoSegundos: integer('descanso_segundos').notNull().default(90),
  },
  (t) => [
    index('idx_exercicios_nome').on(t.nome),
    index('idx_exercicios_grupo').on(t.grupoMuscularPrimario),
  ],
);

export const rotinas = sqliteTable('rotinas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull(),
  notas: text('notas'),
  ordem: integer('ordem').notNull().default(0),
  criadoEm: integer('criado_em', { mode: 'timestamp_ms' }).notNull(),
});

export const rotinaExercicios = sqliteTable(
  'rotina_exercicios',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    rotinaId: integer('rotina_id')
      .notNull()
      .references(() => rotinas.id, { onDelete: 'cascade' }),
    exercicioId: integer('exercicio_id')
      .notNull()
      .references(() => exercicios.id, { onDelete: 'cascade' }),
    ordem: integer('ordem').notNull().default(0),
    seriesAlvo: integer('series_alvo').notNull().default(3),
    notas: text('notas'),
  },
  (t) => [index('idx_rotina_exercicios_rotina').on(t.rotinaId)],
);

export const treinos = sqliteTable(
  'treinos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /**
     * `set null` e nao `cascade`: apagar uma rotina nao pode apagar o
     * historico de treinos ja realizados com ela.
     */
    rotinaId: integer('rotina_id').references(() => rotinas.id, { onDelete: 'set null' }),
    nome: text('nome').notNull(),
    iniciadoEm: integer('iniciado_em', { mode: 'timestamp_ms' }).notNull(),
    /** NULL = treino em andamento. E assim que o app restaura a sessao ativa. */
    finalizadoEm: integer('finalizado_em', { mode: 'timestamp_ms' }),
    duracaoSegundos: integer('duracao_segundos').notNull().default(0),
    notas: text('notas'),
  },
  (t) => [index('idx_treinos_iniciado_em').on(t.iniciadoEm)],
);

export const treinoExercicios = sqliteTable(
  'treino_exercicios',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    treinoId: integer('treino_id')
      .notNull()
      .references(() => treinos.id, { onDelete: 'cascade' }),
    exercicioId: integer('exercicio_id')
      .notNull()
      .references(() => exercicios.id, { onDelete: 'cascade' }),
    ordem: integer('ordem').notNull().default(0),
    notas: text('notas'),
  },
  (t) => [index('idx_treino_exercicios_treino').on(t.treinoId)],
);

export const series = sqliteTable(
  'series',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    treinoExercicioId: integer('treino_exercicio_id')
      .notNull()
      .references(() => treinoExercicios.id, { onDelete: 'cascade' }),
    numeroSerie: integer('numero_serie').notNull(),
    /** kg com uma casa decimal. */
    peso: real('peso').notNull().default(0),
    repeticoes: integer('repeticoes').notNull().default(0),
    rpe: real('rpe'),
    tipo: text('tipo', { enum: ['normal', 'aquecimento', 'falha', 'dropset'] })
      .notNull()
      .default('normal'),
    concluida: integer('concluida', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => [index('idx_series_treino_exercicio').on(t.treinoExercicioId)],
);

/** Chave-valor para preferencias simples (ex.: data do ultimo backup). */
export const config = sqliteTable('config', {
  chave: text('chave').primaryKey(),
  valor: text('valor').notNull(),
});

// -- relations: usadas pelas queries relacionais (db.query.x.findMany) --

export const exerciciosRel = relations(exercicios, ({ many }) => ({
  rotinaExercicios: many(rotinaExercicios),
  treinoExercicios: many(treinoExercicios),
}));

export const rotinasRel = relations(rotinas, ({ many }) => ({
  itens: many(rotinaExercicios),
}));

export const rotinaExerciciosRel = relations(rotinaExercicios, ({ one }) => ({
  rotina: one(rotinas, { fields: [rotinaExercicios.rotinaId], references: [rotinas.id] }),
  exercicio: one(exercicios, { fields: [rotinaExercicios.exercicioId], references: [exercicios.id] }),
}));

export const treinosRel = relations(treinos, ({ one, many }) => ({
  rotina: one(rotinas, { fields: [treinos.rotinaId], references: [rotinas.id] }),
  itens: many(treinoExercicios),
}));

export const treinoExerciciosRel = relations(treinoExercicios, ({ one, many }) => ({
  treino: one(treinos, { fields: [treinoExercicios.treinoId], references: [treinos.id] }),
  exercicio: one(exercicios, { fields: [treinoExercicios.exercicioId], references: [exercicios.id] }),
  series: many(series),
}));

export const seriesRel = relations(series, ({ one }) => ({
  treinoExercicio: one(treinoExercicios, {
    fields: [series.treinoExercicioId],
    references: [treinoExercicios.id],
  }),
}));

// -- tipos inferidos --

export type Exercicio = typeof exercicios.$inferSelect;
export type NovoExercicio = typeof exercicios.$inferInsert;
export type Rotina = typeof rotinas.$inferSelect;
export type RotinaExercicio = typeof rotinaExercicios.$inferSelect;
export type Treino = typeof treinos.$inferSelect;
export type TreinoExercicio = typeof treinoExercicios.$inferSelect;
export type Serie = typeof series.$inferSelect;
export type TipoSerie = Serie['tipo'];
