import * as cheerio from "cheerio";
import { buscar, esperar, redePadrao, type Rede } from "../util/rede";
import { limparTexto } from "../util/texto";
import type { PerfilInstagram } from "./tipos";

// Leitura da página PÚBLICA de um perfil, sem login. O Instagram costuma
// servir a tela de login para IPs de datacenter e após muitas requisições —
// por isso o intervalo mínimo entre chamadas e o status "bloqueado", que é um
// resultado normal (o lead segue sem esses dados, nada é inventado).

// O mesmo app-id que a página pública usa para carregar o perfil.
const IG_APP_ID = "936619743392459";

// "1,234" "1.234" "12K" "1.2M" "98 mil" "1,2 mi" → número
export function numeroAbreviado(bruto: string): number | undefined {
  const m = bruto.trim().toLowerCase().match(/^([\d.,]+)\s*(k|mil|m|mi|b|bi)?\.?$/);
  if (!m?.[1]) return undefined;
  const mult = { k: 1e3, mil: 1e3, m: 1e6, mi: 1e6, b: 1e9, bi: 1e9 }[m[2] ?? ""] ?? 1;
  if (mult === 1) {
    const inteiro = Number(m[1].replace(/[.,]/g, ""));
    return Number.isFinite(inteiro) ? inteiro : undefined;
  }
  const v = Number.parseFloat(m[1].replace(",", "."));
  return Number.isFinite(v) ? Math.round(v * mult) : undefined;
}

const NUM = String.raw`([\d.,]+\s*(?:k|mil|mi|m|bi|b)?\.?)`;
const RE_CONTADORES = new RegExp(
  `${NUM}\\s*(?:followers|seguidores)\\s*,\\s*${NUM}\\s*(?:following|seguindo)\\s*,\\s*${NUM}\\s*(?:posts|publica[çc][õo]es)`,
  "i",
);

// Lê og:description / description:
//   "1,234 Followers, 56 Following, 78 Posts - See Instagram photos and videos from Nome (@user)"
//   "1.234 seguidores, 56 seguindo, 78 posts - Veja as fotos e vídeos do Instagram de Nome (@user)"
// Algumas versões anexam a bio depois de ': "'.
export function lerMetaPerfil(html: string): Partial<PerfilInstagram> | null {
  const $ = cheerio.load(html);
  const descricao =
    $('meta[property="og:description"]').attr("content") ?? $('meta[name="description"]').attr("content") ?? "";
  const m = descricao.match(RE_CONTADORES);
  if (!m) return null;
  const perfil: Partial<PerfilInstagram> = {
    seguidores: numeroAbreviado(m[1] ?? ""),
    seguindo: numeroAbreviado(m[2] ?? ""),
    publicacoes: numeroAbreviado(m[3] ?? ""),
  };
  const nome = descricao.match(/(?:from|de)\s+(.+?)\s+\(@[\w.]+\)/i)?.[1];
  if (nome) perfil.nome = limparTexto(nome, 100);
  const bio = descricao.match(/\(@[\w.]+\)\s*:\s*["“](.+)["”]\s*$/s)?.[1];
  if (bio) perfil.bio = limparTexto(bio, 400);
  return perfil;
}

interface UsuarioApi {
  full_name?: string;
  biography?: string;
  external_url?: string | null;
  is_business_account?: boolean;
  category_name?: string | null;
  business_category_name?: string | null;
  edge_followed_by?: { count?: number };
  edge_follow?: { count?: number };
  edge_owner_to_timeline_media?: { count?: number; edges?: { node?: { taken_at_timestamp?: number } }[] };
}

export function lerApiPerfil(json: string): Partial<PerfilInstagram> | null {
  let u: UsuarioApi | undefined;
  try {
    u = (JSON.parse(json) as { data?: { user?: UsuarioApi } }).data?.user;
  } catch {
    return null;
  }
  if (!u) return null;
  const midia = u.edge_owner_to_timeline_media;
  const ultima = midia?.edges?.[0]?.node?.taken_at_timestamp;
  const perfil: Partial<PerfilInstagram> = {
    nome: limparTexto(u.full_name, 100) || undefined,
    bio: limparTexto(u.biography, 400) || undefined,
    seguidores: u.edge_followed_by?.count,
    seguindo: u.edge_follow?.count,
    publicacoes: midia?.count,
    contaComercial: u.is_business_account,
    categoria: limparTexto(u.category_name ?? u.business_category_name, 80) || undefined,
    linkExterno: limparTexto(u.external_url, 300) || undefined,
    ultimaPublicacao: ultima ? new Date(ultima * 1000).toISOString().slice(0, 10) : undefined,
  };
  for (const k of Object.keys(perfil) as (keyof typeof perfil)[]) if (perfil[k] === undefined) delete perfil[k];
  return perfil;
}

// Fila global: no máximo uma requisição ao Instagram por intervalo.
let proximaLiberacao = 0;
let cadeia: Promise<void> = Promise.resolve();
function aguardarVez(intervaloMs: number): Promise<void> {
  const vez = cadeia.then(async () => {
    const espera = proximaLiberacao - Date.now();
    if (espera > 0) await esperar(espera);
    proximaLiberacao = Date.now() + intervaloMs;
  });
  cadeia = vez.catch(() => {});
  return vez;
}

export async function analisarInstagram(
  usuario: string,
  intervaloMs: number,
  rede: Rede = redePadrao,
  baseUrl = "https://www.instagram.com",
  baseApi = "https://i.instagram.com",
): Promise<PerfilInstagram> {
  const url = `https://www.instagram.com/${usuario}/`;
  const base: PerfilInstagram = { usuario, url, status: "erro" };

  await aguardarVez(intervaloMs);
  const pagina = await buscar(`${baseUrl}/${usuario}/`, { timeoutMs: 15000 }, rede);
  if (pagina.status === 404) return { ...base, status: "inexistente" };

  let perfil: PerfilInstagram | null = null;
  if (pagina.ok && !/\/accounts\/login|\/challenge/.test(pagina.urlFinal)) {
    const meta = lerMetaPerfil(pagina.corpo);
    if (meta) perfil = { ...base, ...meta, status: "ok", fonte: "meta" };
  }

  // A meta não traz bio confiável nem a data do último post; a mesma API que
  // a página pública consome traz. Se falhar, ficamos com o que a meta deu.
  await aguardarVez(intervaloMs);
  const api = await buscar(
    `${baseApi}/api/v1/users/web_profile_info/?username=${encodeURIComponent(usuario)}`,
    { timeoutMs: 15000, aceitar: ["application/json", "text/javascript"], cabecalhos: { "X-IG-App-ID": IG_APP_ID } },
    rede,
  );
  if (api.ok) {
    const dados = lerApiPerfil(api.corpo);
    if (dados) return { ...base, ...perfil, ...dados, status: "ok", fonte: "api_publica" };
  }
  if (api.status === 404 && !perfil) return { ...base, status: "inexistente" };

  if (perfil) return perfil;
  // Respondeu mas sem dados (login, limite, desafio) = bloqueado; sem resposta = erro de rede.
  return { ...base, status: pagina.status > 0 || api.status > 0 ? "bloqueado" : "erro" };
}
