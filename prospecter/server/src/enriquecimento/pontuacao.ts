import type { PresencaDigital } from "../db/schema";
import type { DiagnosticoSite, PerfilInstagram, Redes } from "./tipos";

// Pontuação determinística (0–100) de quão "quente" o lead é para quem vende
// sites e software: quanto mais fraca a presença digital — e mais vivo o
// negócio — maior a nota. Roda sempre, com ou sem Groq; a IA refina depois.

export interface EntradaPontuacao {
  temSiteInformado: boolean;
  diagnostico?: DiagnosticoSite | null;
  redes?: Redes | null;
  instagram?: PerfilInstagram | null;
  telefoneE164?: string | null;
  whatsapp?: string | null;
  avaliacoes?: number | null;
  nota?: number | null;
  anoAtual?: number;
}

export interface ResultadoPontuacao {
  presenca: PresencaDigital;
  score: number;
  sinais: string[];
}

export function classificarPresenca(e: EntradaPontuacao): PresencaDigital {
  const temInstagram = !!(e.instagram || e.redes?.instagram);
  const temOutraRede = !!(e.redes?.facebook || e.redes?.tiktok || e.redes?.linkedin || e.redes?.youtube);
  if (e.diagnostico) {
    if (!e.diagnostico.online) return "site_fora_do_ar";
    return problemasDoSite(e.diagnostico, e.anoAtual).length >= 2 ? "site_fraco" : "site_ok";
  }
  if (temInstagram) return "so_instagram";
  if (temOutraRede) return "so_rede_social";
  return "sem_presenca";
}

function problemasDoSite(d: DiagnosticoSite, anoAtual = new Date().getFullYear()): string[] {
  const p: string[] = [];
  if (!d.https) p.push("site sem HTTPS");
  if (!d.responsivo) p.push("site não adaptado para celular");
  if (d.anoCopyright && d.anoCopyright <= anoAtual - 3) p.push(`site desatualizado (© ${d.anoCopyright})`);
  if ((d.tempoRespostaMs ?? 0) > 4000) p.push("site lento");
  if (!d.formularioContato && !d.botaoWhatsapp) p.push("site sem formulário nem botão de WhatsApp");
  if (!d.temDescricao) p.push("site sem descrição para o Google");
  if (d.plataforma === "Google Sites") p.push("site feito no Google Sites");
  return p;
}

export function pontuar(e: EntradaPontuacao): ResultadoPontuacao {
  const presenca = classificarPresenca(e);
  const sinais: string[] = [];
  let score: number;

  switch (presenca) {
    case "so_instagram":
      score = 80;
      sinais.push("só tem Instagram, sem site");
      break;
    case "so_rede_social":
      score = 72;
      sinais.push("só tem rede social, sem site");
      break;
    case "sem_presenca":
      score = 65;
      sinais.push("sem site e sem redes encontradas");
      break;
    case "site_fora_do_ar":
      score = 78;
      sinais.push(`site fora do ar (${e.diagnostico?.erro ?? "sem resposta"})`);
      break;
    default: {
      const problemas = problemasDoSite(e.diagnostico!, e.anoAtual);
      score = 25 + problemas.length * 10;
      sinais.push(...problemas);
      if (!e.diagnostico!.metaPixel && !e.diagnostico!.googleAnalytics) {
        score += 5;
        sinais.push("site sem Pixel nem Analytics");
      }
    }
  }

  // Negócio vivo e com público: vale mais (tem dinheiro e tem a perder).
  const avaliacoes = e.avaliacoes ?? 0;
  if (avaliacoes >= 100) {
    score += 8;
    sinais.push(`${avaliacoes} avaliações no Google`);
  } else if (avaliacoes >= 30) {
    score += 4;
  } else if (avaliacoes < 5) {
    score -= 8;
    sinais.push("poucas avaliações no Google");
  }

  const ig = e.instagram;
  if (ig?.status === "ok") {
    if ((ig.seguidores ?? 0) >= 1000) {
      score += 5;
      sinais.push(`Instagram com ${ig.seguidores} seguidores`);
    }
    if (ig.ultimaPublicacao) {
      const dias = (Date.now() - Date.parse(ig.ultimaPublicacao)) / 86_400_000;
      if (dias > 120) {
        score -= 5;
        sinais.push("Instagram parado há mais de 4 meses");
      }
    }
    if (presenca === "so_instagram" && !ig.linkExterno) sinais.push("bio do Instagram sem link");
  }

  // Sem como chamar no WhatsApp, a abordagem fica mais difícil.
  if (!e.whatsapp) {
    score -= e.telefoneE164 ? 5 : 15;
    sinais.push(e.telefoneE164 ? "telefone fixo (sem WhatsApp direto)" : "sem telefone");
  }

  return { presenca, score: Math.max(0, Math.min(100, Math.round(score))), sinais };
}
