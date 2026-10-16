CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`place_id` text,
	`nome` text NOT NULL,
	`categoria` text,
	`telefone` text,
	`telefone_e164` text,
	`whatsapp` text,
	`endereco` text,
	`cidade` text,
	`estado` text,
	`pais` text DEFAULT 'BR' NOT NULL,
	`lat` real,
	`lng` real,
	`nota` real,
	`avaliacoes` integer,
	`site` text,
	`link_maps` text,
	`chave_nome` text NOT NULL,
	`dominio` text,
	`primeira_coleta` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`ultima_coleta` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`tentativas` integer DEFAULT 0 NOT NULL,
	`tentativas_ia` integer DEFAULT 0 NOT NULL,
	`erro` text,
	`enriquecido_em` text,
	`emails` text,
	`redes` text,
	`instagram` text,
	`diagnostico` text,
	`presenca` text,
	`score_heuristico` integer,
	`sinais` text,
	`relevancia` text,
	`score_ia` integer,
	`nome_limpo` text,
	`segmento` text,
	`dores` text,
	`abordagem` text,
	`ia_modelo` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_place_id_unique` ON `leads` (`place_id`);--> statement-breakpoint
CREATE INDEX `leads_telefone_idx` ON `leads` (`telefone_e164`);--> statement-breakpoint
CREATE INDEX `leads_chave_nome_idx` ON `leads` (`chave_nome`);--> statement-breakpoint
CREATE INDEX `leads_dominio_idx` ON `leads` (`dominio`);--> statement-breakpoint
CREATE INDEX `leads_status_idx` ON `leads` (`status`);--> statement-breakpoint
CREATE TABLE `ocorrencias` (
	`lead_id` integer NOT NULL,
	`campanha` text NOT NULL,
	`termo` text NOT NULL,
	`coletado_em` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	PRIMARY KEY(`lead_id`, `campanha`, `termo`),
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
