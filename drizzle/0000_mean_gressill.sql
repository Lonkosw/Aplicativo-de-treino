CREATE TABLE `config` (
	`chave` text PRIMARY KEY NOT NULL,
	`valor` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exercicios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`grupo_muscular_primario` text NOT NULL,
	`grupos_secundarios` text DEFAULT '' NOT NULL,
	`equipamento` text DEFAULT 'Outro' NOT NULL,
	`categoria` text DEFAULT 'Musculacao' NOT NULL,
	`instrucoes` text,
	`eh_customizado` integer DEFAULT false NOT NULL,
	`descanso_segundos` integer DEFAULT 90 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_exercicios_nome` ON `exercicios` (`nome`);--> statement-breakpoint
CREATE INDEX `idx_exercicios_grupo` ON `exercicios` (`grupo_muscular_primario`);--> statement-breakpoint
CREATE TABLE `rotina_exercicios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rotina_id` integer NOT NULL,
	`exercicio_id` integer NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	`series_alvo` integer DEFAULT 3 NOT NULL,
	`notas` text,
	FOREIGN KEY (`rotina_id`) REFERENCES `rotinas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercicio_id`) REFERENCES `exercicios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_rotina_exercicios_rotina` ON `rotina_exercicios` (`rotina_id`);--> statement-breakpoint
CREATE TABLE `rotinas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`notas` text,
	`ordem` integer DEFAULT 0 NOT NULL,
	`criado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `series` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`treino_exercicio_id` integer NOT NULL,
	`numero_serie` integer NOT NULL,
	`peso` real DEFAULT 0 NOT NULL,
	`repeticoes` integer DEFAULT 0 NOT NULL,
	`rpe` real,
	`tipo` text DEFAULT 'normal' NOT NULL,
	`concluida` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`treino_exercicio_id`) REFERENCES `treino_exercicios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_series_treino_exercicio` ON `series` (`treino_exercicio_id`);--> statement-breakpoint
CREATE TABLE `treino_exercicios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`treino_id` integer NOT NULL,
	`exercicio_id` integer NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	`notas` text,
	FOREIGN KEY (`treino_id`) REFERENCES `treinos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercicio_id`) REFERENCES `exercicios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_treino_exercicios_treino` ON `treino_exercicios` (`treino_id`);--> statement-breakpoint
CREATE TABLE `treinos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rotina_id` integer,
	`nome` text NOT NULL,
	`iniciado_em` integer NOT NULL,
	`finalizado_em` integer,
	`duracao_segundos` integer DEFAULT 0 NOT NULL,
	`notas` text,
	FOREIGN KEY (`rotina_id`) REFERENCES `rotinas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_treinos_iniciado_em` ON `treinos` (`iniciado_em`);