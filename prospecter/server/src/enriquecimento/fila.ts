import { asc, eq, inArray, sql } from "drizzle-orm";
import type { Config } from "../config";
import type { Banco } from "../db/cliente";
import { leads, type Lead, type NovoLead } from "../db/schema";
import { termoDoLead } from "../leads";
import { buscar, redePadrao, type Rede } from "../util/rede";
import { classificarUrl, usuarioInstagram } from "../util/url";
import { analisarLote, ErroGroq } from "./groq";
import { analisarInstagram } from "./instagram";
import { pontuar } from "./pontuacao";
import { analisarSite, extrairDaPagina } from "./site";
import type { DiagnosticoSite, PerfilInstagram, Redes } from "./tipos";

export interface Logger {
  info: (obj: object | string, msg?: string) => void;
  warn: (obj: object | string, msg?: string) => void;
  error: (obj: object | string, msg?: string) => void;
}

export interface Dependencias {
  rede?: Rede;
  fetchGroq?: typeof fetch;
  esperarGroq?: (ms: number) => Promise<void>;
  baseInstagram?: string;
  baseApiInstagram?: string;
}

const MAX_TENTATIVAS = 3;
const MAX_TENTATIVAS_IA = 3;
const PAUSA_IA_ERRO_PERMANENTE_MS = 5 * 60_000;

// Coleta pública de um lead: site (ou agregador de links) + Instagram.
export async function coletarLead(
  lead: Pick<Lead, "site" | "redes">,
  cfg: Pick<Config, "instagramIntervaloMs">,
  dep: Dependencias = {},
): Promise<{ diagnostico: DiagnosticoSite | null; emails: string[]; redes: Redes; instagram: PerfilInstagram | null }> {
  const rede = dep.rede ?? redePadrao;
  let diagnostico: DiagnosticoSite | null = null;
  let emails: string[] = [];
  const redes: Redes = {};

  const alvo = classificarUrl(lead.site);
  if (alvo.tipo === "site") {
    const r = await analisarSite(alvo.url.toString(), rede);
    diagnostico = r.diagnostico;
    emails = r.emails;
    Object.assign(redes, r.redes);
  } else if (alvo.tipo === "agregador") {
    // Linktree & cia.: não é site próprio, mas lista as redes do negócio.
    const pag = await buscar(alvo.url.toString(), { timeoutMs: 10000 }, rede);
    if (pag.ok) {
      const r = extrairDaPagina(pag.corpo, pag.urlFinal);
      emails = [...r.emails].slice(0, 10);
      Object.assign(redes, r.redes);
    }
  } else if (alvo.tipo === "rede") {
    if (alvo.rede === "instagram") {
      const u = usuarioInstagram(alvo.url.toString());
      if (u) redes.instagram = `https://www.instagram.com/${u}/`;
    } else if (alvo.rede === "whatsapp") {
      redes.whatsapp = [alvo.url.toString()];
    } else {
      redes[alvo.rede] = alvo.url.toString();
    }
  }

  let instagram: PerfilInstagram | null = null;
  const usuario = usuarioInstagram(redes.instagram);
  if (usuario) {
    instagram = await analisarInstagram(
      usuario,
      cfg.instagramIntervaloMs,
      rede,
      dep.baseInstagram,
      dep.baseApiInstagram,
    );
  }
  return { diagnostico, emails, redes, instagram };
}

export class Enriquecedor {
  private ativo = false;
  private despertar: (() => void)[] = [];
  private iaPausadaAte = 0;
  private loops: Promise<void>[] = [];

  constructor(
    private readonly db: Banco,
    private readonly cfg: Config,
    private readonly log: Logger,
    private readonly dep: Dependencias = {},
  ) {}

  iniciar() {
    if (this.ativo) return;
    this.ativo = true;
    // Um processo que caiu no meio deixa leads "processando" órfãos.
    this.db.update(leads).set({ status: "pendente" }).where(eq(leads.status, "processando")).run();
    for (let i = 0; i < this.cfg.concorrencia; i++) this.loops.push(this.loopColeta());
    if (this.cfg.groqApiKey) this.loops.push(this.loopIa());
  }

  async parar() {
    this.ativo = false;
    this.notificar();
    await Promise.all(this.loops);
    this.loops = [];
  }

  // Chamado quando chegam leads novos: acorda os loops ociosos.
  notificar() {
    const fila = this.despertar;
    this.despertar = [];
    fila.forEach((f) => f());
  }

  private dormir(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const t = setTimeout(resolve, ms);
      this.despertar.push(() => {
        clearTimeout(t);
        resolve();
      });
    });
  }

  // Reserva atômica (o better-sqlite3 é síncrono: nenhum outro loop roda
  // entre o SELECT e o UPDATE).
  private reservarPendente(): Lead | undefined {
    return this.db
      .update(leads)
      .set({ status: "processando", tentativas: sql`${leads.tentativas} + 1` })
      .where(
        eq(
          leads.id,
          sql`(select id from leads where status = 'pendente' order by id limit 1)`,
        ),
      )
      .returning()
      .get();
  }

  async processarLead(lead: Lead): Promise<void> {
    try {
      const c = await coletarLead(lead, this.cfg, this.dep);
      const p = pontuar({
        temSiteInformado: !!lead.site,
        diagnostico: c.diagnostico,
        redes: c.redes,
        instagram: c.instagram,
        telefoneE164: lead.telefoneE164,
        whatsapp: lead.whatsapp,
        avaliacoes: lead.avaliacoes,
        nota: lead.nota,
      });
      const proximo = this.cfg.groqApiKey ? "aguardando_ia" : "concluido";
      this.db
        .update(leads)
        .set({
          status: proximo,
          erro: null,
          enriquecidoEm: new Date().toISOString(),
          diagnostico: c.diagnostico,
          emails: c.emails,
          redes: c.redes,
          instagram: c.instagram,
          presenca: p.presenca,
          scoreHeuristico: p.score,
          sinais: p.sinais,
        })
        .where(eq(leads.id, lead.id))
        .run();
    } catch (e) {
      const msg = (e as Error).message;
      const desistir = lead.tentativas >= MAX_TENTATIVAS;
      this.log.warn({ leadId: lead.id, erro: msg }, desistir ? "enriquecimento falhou de vez" : "enriquecimento falhou, vai repetir");
      this.db
        .update(leads)
        .set({ status: desistir ? "erro" : "pendente", erro: msg.slice(0, 500) })
        .where(eq(leads.id, lead.id))
        .run();
    }
  }

  private async loopColeta() {
    while (this.ativo) {
      const lead = this.reservarPendente();
      if (!lead) {
        await this.dormir(5000);
        continue;
      }
      await this.processarLead(lead);
    }
  }

  // Processa um lote de leads aguardando IA. Retorna quantos foram tratados.
  async rodadaIa(): Promise<number> {
    const lote = this.db
      .select()
      .from(leads)
      .where(eq(leads.status, "aguardando_ia"))
      .orderBy(asc(leads.id))
      .limit(this.cfg.groqLote)
      .all();
    if (!lote.length) return 0;

    try {
      const analises = await analisarLote(
        lote.map((lead) => ({ lead, termo: termoDoLead(this.db, lead.id) })),
        {
          chave: this.cfg.groqApiKey,
          modelo: this.cfg.groqModelo,
          oferta: this.cfg.oferta,
          fetch: this.dep.fetchGroq,
          esperarMs: this.dep.esperarGroq,
        },
      );
      this.db.transaction((tx) => {
        for (const lead of lote) {
          const a = analises.get(lead.id);
          if (a) {
            tx.update(leads)
              .set({
                status: "concluido",
                relevancia: a.relevancia,
                // "nao" é só marcado (nunca apagado); a nota é limitada para cair no fim da lista.
                scoreIa: Math.round(a.relevancia === "nao" ? Math.min(a.score, 20) : a.score),
                nomeLimpo: a.nome_limpo || null,
                segmento: a.segmento || null,
                dores: a.dores.slice(0, 4),
                abordagem: a.abordagem || null,
                iaModelo: this.cfg.groqModelo,
              })
              .where(eq(leads.id, lead.id))
              .run();
          } else {
            this.falhaIa(tx as unknown as Banco, [lead], "IA não devolveu análise para este lead");
          }
        }
      });
    } catch (e) {
      if (e instanceof ErroGroq && e.permanente) {
        // Chave ou modelo inválido: não adianta queimar tentativas dos leads.
        this.log.error({ erro: e.message }, "Groq recusou a chamada; IA pausada por 5 minutos");
        this.iaPausadaAte = Date.now() + PAUSA_IA_ERRO_PERMANENTE_MS;
        return 0;
      }
      this.log.warn({ erro: (e as Error).message }, "lote da IA falhou");
      this.falhaIa(this.db, lote, (e as Error).message);
    }
    return lote.length;
  }

  private falhaIa(db: Banco, lote: Lead[], erro: string) {
    for (const lead of lote) {
      const tentativas = lead.tentativasIa + 1;
      const mudancas: Partial<NovoLead> = { tentativasIa: tentativas, erro: `IA: ${erro}`.slice(0, 500) };
      // Depois de N falhas o lead fica concluído só com a nota heurística.
      if (tentativas >= MAX_TENTATIVAS_IA) mudancas.status = "concluido";
      db.update(leads).set(mudancas).where(eq(leads.id, lead.id)).run();
    }
  }

  private async loopIa() {
    while (this.ativo) {
      const pausa = this.iaPausadaAte - Date.now();
      if (pausa > 0) {
        await this.dormir(Math.min(pausa, 30_000));
        continue;
      }
      const n = await this.rodadaIa();
      if (n === 0) await this.dormir(5000);
    }
  }

  // Volta leads para a fila (botão "reenriquecer" do futuro painel).
  reenfileirar(ids: number[]) {
    if (!ids.length) return 0;
    const r = this.db
      .update(leads)
      .set({ status: "pendente", tentativas: 0, tentativasIa: 0, erro: null })
      .where(inArray(leads.id, ids))
      .run();
    this.notificar();
    return r.changes;
  }
}

