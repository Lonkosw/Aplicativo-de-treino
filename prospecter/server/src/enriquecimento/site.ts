import * as cheerio from "cheerio";
import { buscar, redePadrao, type Rede } from "../util/rede";
import { limparTexto } from "../util/texto";
import { classificarUrl, dominioDe, usuarioInstagram } from "../util/url";
import type { DiagnosticoSite, Redes } from "./tipos";

// Assinaturas no HTML das plataformas mais comuns entre pequenos negócios.
// A ordem importa: a primeira que casar vence.
const PLATAFORMAS: [string, RegExp][] = [
  ["Wix", /static\.wixstatic\.com|_wixcssimports|wix\.com website builder/],
  ["Shopify", /cdn\.shopify\.com|shopify\.theme/],
  ["Nuvemshop", /nuvemshop|tiendanube|d26lpennugtm8s\.cloudfront\.net/],
  ["Loja Integrada", /lojaintegrada/],
  ["Tray", /tray\.com\.br|traycdn/],
  ["VTEX", /vtex(commercestable|assets|\.com\.br)|vteximg/],
  ["Squarespace", /squarespace/],
  ["Webflow", /webflow\.(com|io)|data-wf-page/],
  ["Google Sites", /sites\.google\.com|gstatic\.com\/atari/],
  ["Elementor (WordPress)", /elementor/],
  ["WordPress", /wp-content|wp-includes|wordpress/],
  ["Joomla", /joomla/],
  ["Hostinger Builder", /zyrosite|hostinger/],
];

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}/gi;
const EMAIL_LIXO = /\.(png|jpe?g|gif|webp|svg|css|js)$|@(example|exemplo|email|seudominio|dominio|domain|sentry|wixpress|sentry-next)\.|^(seu|nome|email|exemplo|usuario|user)@/i;
const PAGINAS_CONTATO = /contato|contact|fale-conosco|fale conosco|atendimento|sobre|quem-somos|quem somos|about/i;

export interface ResultadoPagina {
  emails: Set<string>;
  redes: Redes;
  linksContato: string[];
}

function adicionarEmail(emails: Set<string>, bruto: string) {
  const e = bruto.trim().toLowerCase().replace(/^mailto:/, "").split("?")[0] ?? "";
  if (e.length > 80 || EMAIL_LIXO.test(e)) return;
  if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}$/.test(e)) emails.add(e);
}

// Extrai contatos e redes de uma página. Função pura: recebe o HTML e a URL
// de onde ele veio (para resolver links relativos).
export function extrairDaPagina(html: string, urlBase: string, acumulado?: ResultadoPagina): ResultadoPagina {
  const r = acumulado ?? { emails: new Set<string>(), redes: {}, linksContato: [] };
  const $ = cheerio.load(html);
  const base = new URL(urlBase);
  const dominioBase = dominioDe(base);

  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") ?? "").trim();
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
    if (href.toLowerCase().startsWith("mailto:")) {
      adicionarEmail(r.emails, decodeURIComponent(href));
      return;
    }
    let abs: URL;
    try {
      abs = new URL(href, base);
    } catch {
      return;
    }
    const c = classificarUrl(abs.toString());
    if (c.tipo === "rede") {
      if (c.rede === "whatsapp") {
        const lista = (r.redes.whatsapp ??= []);
        if (lista.length < 5 && !lista.includes(c.url.toString())) lista.push(c.url.toString());
      } else if (c.rede === "instagram") {
        const u = usuarioInstagram(c.url.toString());
        if (u && !r.redes.instagram) r.redes.instagram = `https://www.instagram.com/${u}/`;
      } else if (!r.redes[c.rede] && !/sharer|share\.php|intent|\/plugins\//.test(c.url.toString())) {
        r.redes[c.rede] = c.url.toString();
      }
      return;
    }
    if (c.tipo === "site" && c.dominio === dominioBase) {
      const texto = $(el).text();
      if (PAGINAS_CONTATO.test(abs.pathname) || PAGINAS_CONTATO.test(texto)) {
        abs.hash = "";
        const s = abs.toString();
        if (s !== base.toString() && !r.linksContato.includes(s)) r.linksContato.push(s);
      }
    }
  });

  $("script, style, noscript").remove();
  const texto = $("body").text();
  for (const m of texto.matchAll(EMAIL_RE)) adicionarEmail(r.emails, m[0]);
  return r;
}

export function diagnosticarHtml(html: string, urlFinal: string): Omit<DiagnosticoSite, "online" | "statusHttp" | "tempoRespostaMs" | "paginasLidas" | "erro"> {
  const $ = cheerio.load(html);
  const minusculo = html.toLowerCase();
  const gerador = ($('meta[name="generator"]').attr("content") ?? "").toLowerCase();
  const plataforma = PLATAFORMAS.find(([, re]) => re.test(gerador) || re.test(minusculo))?.[0];

  let anoCopyright: number | undefined;
  const textoCorpo = $("body").text();
  for (const m of textoCorpo.matchAll(/(?:©|copyright|todos os direitos)[^0-9]{0,30}(?:(?:19|20)\d{2}\s*[-–]\s*)?((?:19|20)\d{2})/gi)) {
    const ano = Number(m[1]);
    if (!anoCopyright || ano > anoCopyright) anoCopyright = ano;
  }

  const titulo = limparTexto($("title").first().text(), 150);
  return {
    urlFinal,
    https: urlFinal.startsWith("https://"),
    responsivo: $('meta[name="viewport"]').length > 0,
    ...(plataforma ? { plataforma } : {}),
    ...(titulo ? { titulo } : {}),
    temDescricao: !!($('meta[name="description"]').attr("content") ?? "").trim(),
    metaPixel: /connect\.facebook\.net\/[^"']*fbevents|fbq\(\s*['"]init/.test(minusculo),
    googleAnalytics: /googletagmanager\.com\/(gtag|gtm)|google-analytics\.com|gtag\(\s*['"]config['"]\s*,\s*['"]g-/.test(minusculo),
    googleAds: /gtag\(\s*['"]config['"]\s*,\s*['"]aw-|googleadservices\.com|googlesyndication/.test(minusculo),
    formularioContato: $("form").filter((_, f) => $(f).find('input[type="email"], textarea').length > 0).length > 0,
    botaoWhatsapp: /wa\.me\/|api\.whatsapp\.com\/send|web\.whatsapp\.com\/send/.test(minusculo),
    ...(anoCopyright ? { anoCopyright } : {}),
  };
}

export interface ResultadoSite {
  diagnostico: DiagnosticoSite;
  emails: string[];
  redes: Redes;
}

// Lê a home e até 2 páginas de contato/sobre do mesmo domínio.
export async function analisarSite(url: string, rede: Rede = redePadrao): Promise<ResultadoSite> {
  const home = await buscar(url, {}, rede);
  if (!home.ok) {
    return {
      diagnostico: {
        urlFinal: home.urlFinal,
        online: false,
        statusHttp: home.status || undefined,
        erro: home.erro ?? `HTTP ${home.status}`,
        tempoRespostaMs: home.tempoMs,
        https: home.urlFinal.startsWith("https://"),
        responsivo: false,
        temDescricao: false,
        metaPixel: false,
        googleAnalytics: false,
        googleAds: false,
        formularioContato: false,
        botaoWhatsapp: false,
        paginasLidas: [],
      },
      emails: [],
      redes: {},
    };
  }

  const acumulado = extrairDaPagina(home.corpo, home.urlFinal);
  const diag = diagnosticarHtml(home.corpo, home.urlFinal);
  const paginasLidas = [home.urlFinal];

  for (const link of acumulado.linksContato.slice(0, 2)) {
    const pag = await buscar(link, { timeoutMs: 8000 }, rede);
    if (!pag.ok) continue;
    paginasLidas.push(pag.urlFinal);
    extrairDaPagina(pag.corpo, pag.urlFinal, acumulado);
    const d = diagnosticarHtml(pag.corpo, pag.urlFinal);
    diag.formularioContato ||= d.formularioContato;
    diag.botaoWhatsapp ||= d.botaoWhatsapp;
  }

  return {
    diagnostico: {
      ...diag,
      online: true,
      statusHttp: home.status,
      tempoRespostaMs: home.tempoMs,
      paginasLidas,
    },
    emails: [...acumulado.emails].slice(0, 10),
    redes: acumulado.redes,
  };
}
