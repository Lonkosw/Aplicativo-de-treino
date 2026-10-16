import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Banco } from "./db/cliente";
import { leads, ocorrencias, type Lead, type NovoLead } from "./db/schema";
import { linkWhatsapp, telefoneE164Br } from "./util/telefone";
import { chaveNome, limparTexto, normalizarTexto, somenteDigitos } from "./util/texto";
import { classificarUrl } from "./util/url";

// Formato que a extensão envia (os mesmos campos do lead do apex, todos texto).
const textoOpcional = (max: number) =>
  z.preprocess((v) => (v === null || v === undefined ? "" : String(v)), z.string()).transform((v) => limparTexto(v, max));

export const LeadEntradaSchema = z.object({
  nome: textoOpcional(200).refine((v) => v.length > 0, "nome obrigatório"),
  categoria: textoOpcional(120),
  telefone: textoOpcional(40),
  telefoneNormalizado: textoOpcional(20),
  whatsapp: textoOpcional(60),
  endereco: textoOpcional(300),
  nota: textoOpcional(10),
  avaliacoes: textoOpcional(20),
  site: textoOpcional(500),
  lat: textoOpcional(20),
  lng: textoOpcional(20),
  linkMaps: textoOpcional(2000),
  placeId: textoOpcional(80),
  cidade: textoOpcional(120),
  estado: textoOpcional(80),
  pais: textoOpcional(2).transform((v) => v.toUpperCase() || "BR"),
  termo: textoOpcional(120),
});
export type LeadEntrada = z.infer<typeof LeadEntradaSchema>;

export const LoteSchema = z.object({
  campanha: textoOpcional(120).transform((v) => v || "sem-campanha"),
  leads: z.array(z.unknown()).max(2000),
});

const numero = (v: string): number | null => {
  const n = Number.parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

// Converte a entrada da extensão nas colunas do banco.
export function normalizarEntrada(e: LeadEntrada): Omit<NovoLead, "id"> {
  const pais = e.pais || "BR";
  const e164 = pais === "BR" ? telefoneE164Br(e.telefone || e.telefoneNormalizado) : somenteDigitos(e.telefoneNormalizado);
  const whatsapp = pais === "BR" ? linkWhatsapp(e164, pais) : e.whatsapp.startsWith("https://wa.me/") ? e.whatsapp : "";
  const site = classificarUrl(e.site);
  const avaliacoes = Number.parseInt(somenteDigitos(e.avaliacoes), 10);
  return {
    placeId: e.placeId ? e.placeId.toLowerCase() : null,
    nome: e.nome,
    categoria: e.categoria || null,
    telefone: e.telefone || null,
    telefoneE164: e164 || null,
    whatsapp: whatsapp || null,
    endereco: e.endereco || null,
    cidade: e.cidade || null,
    estado: e.estado || null,
    pais,
    lat: numero(e.lat),
    lng: numero(e.lng),
    nota: numero(e.nota),
    avaliacoes: Number.isFinite(avaliacoes) ? avaliacoes : null,
    site: site.tipo === "invalida" ? null : site.url.toString(),
    linkMaps: e.linkMaps.startsWith("https://www.google.") ? e.linkMaps : null,
    chaveNome: chaveNome(pais, e.estado, e.cidade, e.nome),
    dominio: site.tipo === "site" ? site.dominio : null,
  };
}

// Dedup global, do identificador mais forte para o mais fraco. Um placeId
// diferente dos dois lados sempre significa negócios distintos (homônimos).
export function encontrarExistente(db: Banco, n: Omit<NovoLead, "id">): Lead | undefined {
  const compativel = (l: Lead | undefined) =>
    l &&
    !(n.placeId && l.placeId && l.placeId !== n.placeId) &&
    !(n.telefoneE164 && l.telefoneE164 && l.telefoneE164 !== n.telefoneE164)
      ? l
      : undefined;
  const mesmaCidade = (l: Lead) => normalizarTexto(l.cidade) === normalizarTexto(n.cidade);

  if (n.placeId) {
    const l = db.select().from(leads).where(eq(leads.placeId, n.placeId)).get();
    if (l) return l;
  }
  if (n.telefoneE164) {
    // Telefone + mesma cidade: redes com central única não se fundem entre cidades.
    const candidatos = db.select().from(leads).where(eq(leads.telefoneE164, n.telefoneE164)).all();
    const l = candidatos.find((c) => mesmaCidade(c) && compativel(c));
    if (l) return l;
  }
  const porNome = db.select().from(leads).where(eq(leads.chaveNome, n.chaveNome)).all().find(compativel);
  if (porNome) return porNome;
  if (n.dominio) {
    const candidatos = db.select().from(leads).where(eq(leads.dominio, n.dominio)).all();
    const l = candidatos.find((c) => mesmaCidade(c) && compativel(c));
    if (l) return l;
  }
  return undefined;
}

const CAMPOS_COMPLETAVEIS = [
  "placeId", "categoria", "telefone", "telefoneE164", "whatsapp", "endereco", "lat", "lng",
  "nota", "avaliacoes", "site", "linkMaps", "dominio", "estado", "cidade",
] as const;

export interface ResultadoIngestao {
  recebidos: number;
  novos: number;
  atualizados: number;
  invalidos: number;
  ids: number[];
}

export function ingerirLote(db: Banco, campanha: string, brutos: unknown[], reenriquecerDias: number): ResultadoIngestao {
  const r: ResultadoIngestao = { recebidos: brutos.length, novos: 0, atualizados: 0, invalidos: 0, ids: [] };
  const limiteVelho = new Date(Date.now() - reenriquecerDias * 86_400_000).toISOString();
  const agora = new Date().toISOString();

  db.transaction((tx) => {
    for (const bruto of brutos) {
      const p = LeadEntradaSchema.safeParse(bruto);
      if (!p.success) {
        r.invalidos++;
        continue;
      }
      const n = normalizarEntrada(p.data);
      const existente = encontrarExistente(tx as unknown as Banco, n);
      let id: number;

      if (existente) {
        const mudancas: Partial<NovoLead> = { ultimaColeta: agora };
        for (const campo of CAMPOS_COMPLETAVEIS) {
          const novo = n[campo];
          if ((existente[campo] === null || existente[campo] === "") && novo !== null && novo !== undefined && novo !== "") {
            (mudancas as Record<string, unknown>)[campo] = novo;
          }
        }
        // Nota e avaliações mudam com o tempo: o valor mais recente vale.
        if (n.nota !== null) mudancas.nota = n.nota;
        if (n.avaliacoes !== null) mudancas.avaliacoes = n.avaliacoes;

        const siteNovo = mudancas.site !== undefined;
        const velho = existente.status === "concluido" && (!existente.enriquecidoEm || existente.enriquecidoEm < limiteVelho);
        if ((siteNovo || velho) && existente.status !== "processando") {
          mudancas.status = "pendente";
          mudancas.tentativas = 0;
          mudancas.tentativasIa = 0;
        }
        tx.update(leads).set(mudancas).where(eq(leads.id, existente.id)).run();
        id = existente.id;
        r.atualizados++;
      } else {
        id = tx.insert(leads).values(n).returning({ id: leads.id }).get().id;
        r.novos++;
      }
      r.ids.push(id);
      tx.insert(ocorrencias)
        .values({ leadId: id, campanha, termo: p.data.termo || "" })
        .onConflictDoNothing()
        .run();
    }
  });
  return r;
}

// Termo mais recente com que o lead foi encontrado — é o critério de
// relevância da IA.
export function termoDoLead(db: Banco, leadId: number): string {
  const o = db
    .select({ termo: ocorrencias.termo })
    .from(ocorrencias)
    .where(and(eq(ocorrencias.leadId, leadId), sql`${ocorrencias.termo} <> ''`))
    .orderBy(desc(ocorrencias.coletadoEm))
    .get();
  return o?.termo ?? "";
}
