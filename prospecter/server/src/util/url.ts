// Classificação de URLs vindas do Maps ou de sites: separa site próprio de
// perfis em redes sociais, agregadores de links e encurtadores.

const REDES = {
  instagram: /(^|\.)instagram\.com$/,
  facebook: /(^|\.)(facebook\.com|fb\.com|fb\.me)$/,
  linkedin: /(^|\.)linkedin\.com$/,
  tiktok: /(^|\.)tiktok\.com$/,
  youtube: /(^|\.)(youtube\.com|youtu\.be)$/,
  whatsapp: /(^|\.)(wa\.me|whatsapp\.com)$/,
} satisfies Record<string, RegExp>;
export type NomeRede = keyof typeof REDES;

// Não são "site próprio": agregadores de links, cardápios e páginas de
// terceiros. Um negócio cujo único link é um destes tem presença digital fraca.
const NAO_SITE = /(^|\.)(linktr\.ee|linktree\.com|beacons\.ai|bio\.link|lnk\.bio|taplink\.cc|ifood\.com\.br|goo\.gl|bit\.ly|google\.com|business\.site|wa\.link|x\.com|twitter\.com|pinterest\.com|kwai\.com|threads\.net)$/;

export type TipoUrl =
  | { tipo: "site"; url: URL; dominio: string }
  | { tipo: "rede"; rede: NomeRede; url: URL }
  | { tipo: "agregador"; url: URL }
  | { tipo: "invalida" };

export function paraUrl(bruta: string | null | undefined): URL | null {
  if (!bruta) return null;
  let s = bruta.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u;
  } catch {
    return null;
  }
}

// O Maps às vezes entrega o site embrulhado num redirecionamento do Google
// (google.com/url?q=...). Desembrulha antes de classificar.
function desembrulhar(u: URL): URL {
  if (/(^|\.)google\.[a-z.]+$/.test(u.hostname) && u.pathname === "/url") {
    const alvo = paraUrl(u.searchParams.get("q") ?? u.searchParams.get("url"));
    if (alvo) return alvo;
  }
  return u;
}

export function dominioDe(u: URL): string {
  return u.hostname.toLowerCase().replace(/^www\./, "");
}

export function classificarUrl(bruta: string | null | undefined): TipoUrl {
  const crua = paraUrl(bruta);
  if (!crua) return { tipo: "invalida" };
  const url = desembrulhar(crua);
  const host = url.hostname.toLowerCase();
  for (const [rede, re] of Object.entries(REDES)) {
    if (re.test(host)) return { tipo: "rede", rede: rede as NomeRede, url };
  }
  if (NAO_SITE.test(host)) return { tipo: "agregador", url };
  return { tipo: "site", url, dominio: dominioDe(url) };
}

// Usuário do Instagram a partir de uma URL de perfil. Ignora links de posts,
// reels e páginas do próprio Instagram.
const RESERVADOS_IG = new Set(["p", "reel", "reels", "explore", "stories", "accounts", "about", "developer", "legal", "direct", "tv"]);

export function usuarioInstagram(bruta: string | null | undefined): string | null {
  const c = classificarUrl(bruta);
  if (c.tipo !== "rede" || c.rede !== "instagram") return null;
  const primeiro = c.url.pathname.split("/").filter(Boolean)[0];
  if (!primeiro) return null;
  const usuario = primeiro.toLowerCase();
  if (RESERVADOS_IG.has(usuario)) return null;
  return /^[a-z0-9._]{1,30}$/.test(usuario) ? usuario : null;
}
