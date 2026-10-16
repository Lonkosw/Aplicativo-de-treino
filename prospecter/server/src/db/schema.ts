import { sql } from "drizzle-orm";
import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { DiagnosticoSite, PerfilInstagram, Redes } from "../enriquecimento/tipos";

// Ciclo de vida do enriquecimento de um lead:
//   pendente → processando → aguardando_ia → concluido
// Sem chave da Groq, "processando" vai direto para "concluido".
export const STATUS_ENRIQUECIMENTO = ["pendente", "processando", "aguardando_ia", "concluido", "erro"] as const;
export type StatusEnriquecimento = (typeof STATUS_ENRIQUECIMENTO)[number];

// Classificação da presença digital — o principal sinal de "lead quente"
// para quem vende sites e software.
export const PRESENCAS = ["sem_presenca", "so_instagram", "so_rede_social", "site_fora_do_ar", "site_fraco", "site_ok"] as const;
export type PresencaDigital = (typeof PRESENCAS)[number];

export const RELEVANCIAS = ["sim", "talvez", "nao"] as const;
export type Relevancia = (typeof RELEVANCIAS)[number];

const agora = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const leads = sqliteTable(
  "leads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // --- dados vindos do Google Maps (extensão) ---
    placeId: text("place_id").unique(),
    nome: text("nome").notNull(),
    categoria: text("categoria"),
    telefone: text("telefone"),
    telefoneE164: text("telefone_e164"),
    whatsapp: text("whatsapp"),
    endereco: text("endereco"),
    cidade: text("cidade"),
    estado: text("estado"),
    pais: text("pais").notNull().default("BR"),
    lat: real("lat"),
    lng: real("lng"),
    nota: real("nota"),
    avaliacoes: integer("avaliacoes"),
    site: text("site"),
    linkMaps: text("link_maps"),
    // chave de dedup sem telefone: pais|estado|cidade|nome normalizados
    chaveNome: text("chave_nome").notNull(),
    // domínio próprio do site (sem www); vazio para Instagram/Facebook/etc.
    dominio: text("dominio"),
    primeiraColeta: text("primeira_coleta").notNull().default(agora),
    ultimaColeta: text("ultima_coleta").notNull().default(agora),

    // --- enriquecimento ---
    status: text("status", { enum: STATUS_ENRIQUECIMENTO }).notNull().default("pendente"),
    tentativas: integer("tentativas").notNull().default(0),
    tentativasIa: integer("tentativas_ia").notNull().default(0),
    erro: text("erro"),
    enriquecidoEm: text("enriquecido_em"),
    emails: text("emails", { mode: "json" }).$type<string[]>(),
    redes: text("redes", { mode: "json" }).$type<Redes>(),
    instagram: text("instagram", { mode: "json" }).$type<PerfilInstagram>(),
    diagnostico: text("diagnostico", { mode: "json" }).$type<DiagnosticoSite>(),
    presenca: text("presenca", { enum: PRESENCAS }),
    scoreHeuristico: integer("score_heuristico"),
    sinais: text("sinais", { mode: "json" }).$type<string[]>(),

    // --- análise da Groq ---
    relevancia: text("relevancia", { enum: RELEVANCIAS }),
    scoreIa: integer("score_ia"),
    nomeLimpo: text("nome_limpo"),
    segmento: text("segmento"),
    dores: text("dores", { mode: "json" }).$type<string[]>(),
    abordagem: text("abordagem"),
    iaModelo: text("ia_modelo"),
  },
  (t) => [
    index("leads_telefone_idx").on(t.telefoneE164),
    index("leads_chave_nome_idx").on(t.chaveNome),
    index("leads_dominio_idx").on(t.dominio),
    index("leads_status_idx").on(t.status),
  ],
);

// Cada vez que um lead aparece numa campanha/termo. O lead é único no banco
// (dedup global); as ocorrências guardam o histórico de onde ele veio.
export const ocorrencias = sqliteTable(
  "ocorrencias",
  {
    leadId: integer("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    campanha: text("campanha").notNull(),
    termo: text("termo").notNull(),
    coletadoEm: text("coletado_em").notNull().default(agora),
  },
  (t) => [primaryKey({ columns: [t.leadId, t.campanha, t.termo] })],
);

export type Lead = typeof leads.$inferSelect;
export type NovoLead = typeof leads.$inferInsert;
