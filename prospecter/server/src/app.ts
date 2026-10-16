import { timingSafeEqual } from "node:crypto";
import cors from "@fastify/cors";
import { eq } from "drizzle-orm";
import Fastify from "fastify";
import { z } from "zod";
import type { Config } from "./config";
import { FiltroSchema, gerarCsv, listarLeads, resumoFila } from "./consultas";
import type { Banco } from "./db/cliente";
import { leads } from "./db/schema";
import { Enriquecedor, type Dependencias } from "./enriquecimento/fila";
import { ingerirLote, LoteSchema } from "./leads";

function tokenConfere(recebido: string, esperado: string): boolean {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function criarApp(db: Banco, cfg: Config, opcoes: { logger?: boolean; dependencias?: Dependencias } = {}) {
  const app = Fastify({ logger: opcoes.logger ?? true, bodyLimit: 10 * 1024 * 1024 });
  const enriquecedor = new Enriquecedor(db, cfg, app.log, opcoes.dependencias);

  // A extensão chama de chrome-extension://<id>. Qualquer outro site aberto no
  // navegador é recusado — inclusive pedidos "simples" que o CORS não barra.
  const origemPermitida = (origem: string | undefined) =>
    !origem || origem.startsWith("chrome-extension://") || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origem);
  app.register(cors, { origin: (origem, cb) => cb(null, origemPermitida(origem)) });

  app.addHook("onRequest", async (req, reply) => {
    if (!origemPermitida(req.headers.origin)) return reply.code(403).send({ erro: "origem não permitida" });
    if (!cfg.apiToken || req.method === "OPTIONS" || req.url === "/saude") return;
    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!tokenConfere(token, cfg.apiToken)) return reply.code(401).send({ erro: "token inválido" });
  });

  app.setErrorHandler((erro, _req, reply) => {
    if (erro instanceof z.ZodError) return reply.code(400).send({ erro: "requisição inválida", detalhes: erro.issues });
    app.log.error(erro);
    return reply.code((erro as { statusCode?: number }).statusCode ?? 500).send({ erro: (erro as Error).message });
  });

  app.get("/saude", async () => ({
    ok: true,
    groq: !!cfg.groqApiKey,
    modelo: cfg.groqApiKey ? cfg.groqModelo : null,
    fila: resumoFila(db),
  }));

  // Lote de leads vindo da extensão.
  app.post("/leads/lote", async (req) => {
    const corpo = LoteSchema.parse(req.body);
    const r = ingerirLote(db, corpo.campanha, corpo.leads, cfg.reenriquecerDias);
    enriquecedor.notificar();
    return { recebidos: r.recebidos, novos: r.novos, atualizados: r.atualizados, invalidos: r.invalidos };
  });

  app.get("/leads", async (req) => listarLeads(db, FiltroSchema.parse(req.query)));

  app.get("/leads/:id", async (req, reply) => {
    const { id } = z.object({ id: z.coerce.number().int() }).parse(req.params);
    const lead = db.select().from(leads).where(eq(leads.id, id)).get();
    return lead ?? reply.code(404).send({ erro: "lead não encontrado" });
  });

  app.post("/leads/reenriquecer", async (req) => {
    const { ids } = z.object({ ids: z.array(z.number().int()).max(5000) }).parse(req.body);
    return { reenfileirados: enriquecedor.reenfileirar(ids) };
  });

  app.get("/fila", async () => resumoFila(db));

  app.get("/exportar.csv", async (req, reply) => {
    const filtro = FiltroSchema.parse({ limite: "5000", ...(req.query as object) });
    const { leads: linhas } = listarLeads(db, filtro);
    const nome = `prospecter_${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}.csv`;
    return reply
      .header("Content-Type", "text/csv; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="${nome}"`)
      .send(gerarCsv(linhas));
  });

  return { app, enriquecedor };
}
