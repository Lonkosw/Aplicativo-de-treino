import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import type { Rede } from "../src/util/rede";

export type Rota = (req: IncomingMessage, res: ServerResponse) => void;

// Servidor HTTP local para simular sites e o Instagram.
export async function servidorFalso(rotas: Record<string, Rota>) {
  const visitas: string[] = [];
  const srv = createServer((req, res) => {
    visitas.push(req.url ?? "");
    const caminho = (req.url ?? "/").split("?")[0] ?? "/";
    const rota = rotas[caminho];
    if (rota) return rota(req, res);
    res.writeHead(404).end("não encontrado");
  });
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
  return { base, visitas, fechar: () => new Promise<void>((r) => srv.close(() => r())) };
}

export const html = (corpo: string, tipo = "text/html; charset=utf-8"): Rota => (_req, res) => {
  res.writeHead(200, { "Content-Type": tipo }).end(corpo);
};

// Rede que permite 127.0.0.1 (o bloqueio de endereços internos é testado à parte).
export const redeLocal: Rede = { fetch: (...a) => fetch(...a), hostPermitido: async () => true };
