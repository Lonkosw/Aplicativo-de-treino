import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

// Requisições a URLs que vieram de terceiros (Maps, sites, redes). Por isso:
// timeout, limite de tamanho, redirecionamentos seguidos à mão e bloqueio de
// endereços internos — um "site" apontando para 127.0.0.1 ou para o roteador
// da rede não pode ser lido pelo crawler.

export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

const bloqueados = new BlockList();
for (const [rede, prefixo] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 3],
] as const) bloqueados.addSubnet(rede, prefixo, "ipv4");
for (const [rede, prefixo] of [["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8]] as const)
  bloqueados.addSubnet(rede, prefixo, "ipv6");

function ipBloqueado(ip: string): boolean {
  const mapeado = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapeado?.[1]) return bloqueados.check(mapeado[1], "ipv4");
  return bloqueados.check(ip, isIP(ip) === 6 ? "ipv6" : "ipv4");
}

export async function hostPublico(hostname: string): Promise<boolean> {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
  if (isIP(host)) return !ipBloqueado(host);
  try {
    const enderecos = await lookup(host, { all: true });
    return enderecos.length > 0 && enderecos.every((e) => !ipBloqueado(e.address));
  } catch {
    return false;
  }
}

export interface Resposta {
  ok: boolean;
  status: number;
  urlFinal: string;
  corpo: string;
  tipoConteudo: string;
  tempoMs: number;
  erro?: string;
}

export interface OpcoesBusca {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirecionamentos?: number;
  cabecalhos?: Record<string, string>;
  // Tipos de conteúdo aceitos (prefixo). Outros são descartados sem ler o corpo.
  aceitar?: string[];
}

// Pontos de injeção para os testes (servidor local + fetch real).
export interface Rede {
  fetch: typeof fetch;
  hostPermitido: (hostname: string) => Promise<boolean>;
}

export const redePadrao: Rede = { fetch: (...a) => fetch(...a), hostPermitido: hostPublico };

async function lerComLimite(resp: globalThis.Response, maxBytes: number): Promise<string> {
  if (!resp.body) return "";
  const leitor = resp.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await leitor.read();
    if (done) break;
    partes.push(value);
    total += value.byteLength;
  }
  await leitor.cancel().catch(() => {});
  return new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(partes).subarray(0, maxBytes));
}

export async function buscar(urlInicial: string, opcoes: OpcoesBusca = {}, rede: Rede = redePadrao): Promise<Resposta> {
  const inicio = Date.now();
  const timeoutMs = opcoes.timeoutMs ?? 12000;
  const maxBytes = opcoes.maxBytes ?? 1_500_000;
  const maxRedir = opcoes.maxRedirecionamentos ?? 5;
  const aceitar = opcoes.aceitar ?? ["text/html", "application/xhtml"];
  const sinal = AbortSignal.timeout(timeoutMs);
  const falha = (url: string, erro: string, status = 0): Resposta => ({
    ok: false, status, urlFinal: url, corpo: "", tipoConteudo: "", tempoMs: Date.now() - inicio, erro,
  });

  let url = urlInicial;
  try {
    for (let salto = 0; salto <= maxRedir; salto++) {
      const u = new URL(url);
      if (u.protocol !== "http:" && u.protocol !== "https:") return falha(url, "protocolo não suportado");
      if (!(await rede.hostPermitido(u.hostname))) return falha(url, "endereço não público ou DNS inexistente");

      const resp = await rede.fetch(url, {
        redirect: "manual",
        signal: sinal,
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
          ...opcoes.cabecalhos,
        },
      });

      if (resp.status >= 300 && resp.status < 400) {
        const destino = resp.headers.get("location");
        await resp.body?.cancel().catch(() => {});
        if (!destino) return falha(url, "redirecionamento sem destino", resp.status);
        url = new URL(destino, url).toString();
        continue;
      }

      const tipoConteudo = (resp.headers.get("content-type") ?? "").toLowerCase();
      const aceito = !tipoConteudo || aceitar.some((t) => tipoConteudo.startsWith(t));
      const corpo = aceito ? await lerComLimite(resp, maxBytes) : (await resp.body?.cancel().catch(() => {}), "");
      return {
        ok: resp.ok && aceito,
        status: resp.status,
        urlFinal: url,
        corpo,
        tipoConteudo,
        tempoMs: Date.now() - inicio,
        ...(aceito ? {} : { erro: `conteúdo não suportado (${tipoConteudo})` }),
      };
    }
    return falha(url, "redirecionamentos demais");
  } catch (e) {
    const err = e as Error & { cause?: { code?: string } };
    const motivo = err.name === "TimeoutError" || err.name === "AbortError" ? "tempo esgotado" : (err.cause?.code ?? err.message);
    return falha(url, motivo);
  }
}

export const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
