import { and, desc, eq, gte, like, ne, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import type { Banco } from "./db/cliente";
import { leads, ocorrencias, PRESENCAS, RELEVANCIAS, STATUS_ENRIQUECIMENTO, type Lead } from "./db/schema";

const lista = <T extends readonly [string, ...string[]]>(valores: T) =>
  z.preprocess((v) => (typeof v === "string" && v ? v.split(",") : undefined), z.array(z.enum(valores)).optional());

export const FiltroSchema = z.object({
  status: lista(STATUS_ENRIQUECIMENTO),
  presenca: lista(PRESENCAS),
  relevancia: lista(RELEVANCIAS),
  // Por padrão os leads que a IA marcou como fora do nicho ficam de fora.
  incluirIrrelevantes: z.preprocess((v) => v === "1" || v === "true", z.boolean()).default(false),
  minScore: z.coerce.number().min(0).max(100).optional(),
  cidade: z.string().max(120).optional(),
  campanha: z.string().max(120).optional(),
  q: z.string().max(120).optional(),
  limite: z.coerce.number().int().min(1).max(5000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});
export type Filtro = z.infer<typeof FiltroSchema>;

// Nota final: a da IA quando existe, senão a heurística.
export const scoreFinal = sql<number>`coalesce(${leads.scoreIa}, ${leads.scoreHeuristico}, 0)`;

function condicoes(f: Filtro): SQL | undefined {
  const c: (SQL | undefined)[] = [];
  if (f.status?.length) c.push(or(...f.status.map((s) => eq(leads.status, s))));
  if (f.presenca?.length) c.push(or(...f.presenca.map((p) => eq(leads.presenca, p))));
  if (f.relevancia?.length) c.push(or(...f.relevancia.map((r) => eq(leads.relevancia, r))));
  else if (!f.incluirIrrelevantes) c.push(or(sql`${leads.relevancia} is null`, ne(leads.relevancia, "nao")));
  if (f.minScore !== undefined) c.push(gte(scoreFinal, f.minScore));
  if (f.cidade) c.push(like(leads.cidade, f.cidade));
  if (f.q) c.push(or(like(leads.nome, `%${f.q}%`), like(leads.categoria, `%${f.q}%`)));
  if (f.campanha)
    c.push(sql`exists (select 1 from ${ocorrencias} o where o.lead_id = ${leads.id} and o.campanha = ${f.campanha})`);
  return c.length ? and(...c) : undefined;
}

export function listarLeads(db: Banco, f: Filtro): { total: number; leads: Lead[] } {
  const onde = condicoes(f);
  const total = db.select({ n: sql<number>`count(*)` }).from(leads).where(onde).get()?.n ?? 0;
  const linhas = db
    .select()
    .from(leads)
    .where(onde)
    .orderBy(desc(scoreFinal), desc(leads.avaliacoes))
    .limit(f.limite)
    .offset(f.offset)
    .all();
  return { total, leads: linhas };
}

export function resumoFila(db: Banco) {
  const linhas = db.select({ status: leads.status, n: sql<number>`count(*)` }).from(leads).groupBy(leads.status).all();
  const porStatus = Object.fromEntries(STATUS_ENRIQUECIMENTO.map((s) => [s, 0])) as Record<string, number>;
  for (const l of linhas) porStatus[l.status] = l.n;
  const presencas = db
    .select({ presenca: leads.presenca, n: sql<number>`count(*)` })
    .from(leads)
    .groupBy(leads.presenca)
    .all();
  return { porStatus, porPresenca: Object.fromEntries(presencas.map((p) => [p.presenca ?? "nao_avaliado", p.n])) };
}

// ---------------------------------------------------------------- CSV

function campo(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = Array.isArray(v) ? v.join(" | ") : String(v);
  // Evita injeção de fórmula ao abrir no Excel/Sheets.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const COLUNAS: [string, (l: Lead) => unknown][] = [
  ["Score", (l) => l.scoreIa ?? l.scoreHeuristico],
  ["Presenca", (l) => l.presenca],
  ["Relevancia", (l) => l.relevancia],
  ["Nome", (l) => l.nomeLimpo || l.nome],
  ["NomeMaps", (l) => l.nome],
  ["Segmento", (l) => l.segmento],
  ["Categoria", (l) => l.categoria],
  ["Cidade", (l) => l.cidade],
  ["Estado", (l) => l.estado],
  ["Telefone", (l) => l.telefone],
  ["WhatsApp", (l) => l.whatsapp],
  ["Emails", (l) => l.emails],
  ["Site", (l) => l.site],
  ["Instagram", (l) => l.redes?.instagram],
  ["SeguidoresInstagram", (l) => l.instagram?.seguidores],
  ["UltimoPostInstagram", (l) => l.instagram?.ultimaPublicacao],
  ["Facebook", (l) => l.redes?.facebook],
  ["PlataformaSite", (l) => l.diagnostico?.plataforma],
  ["Sinais", (l) => l.sinais],
  ["Dores", (l) => l.dores],
  ["AbordagemWhatsApp", (l) => l.abordagem],
  ["Nota", (l) => l.nota],
  ["Avaliacoes", (l) => l.avaliacoes],
  ["Endereco", (l) => l.endereco],
  ["LinkMaps", (l) => l.linkMaps],
  ["PrimeiraColeta", (l) => l.primeiraColeta],
];

export function gerarCsv(linhas: Lead[]): string {
  const saida = [COLUNAS.map(([n]) => n).join(";")];
  for (const l of linhas) saida.push(COLUNAS.map(([, f]) => campo(f(l))).join(";"));
  return "﻿" + saida.join("\r\n");
}
