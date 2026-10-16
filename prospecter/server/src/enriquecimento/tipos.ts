export interface Redes {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
  // links wa.me / api.whatsapp.com encontrados no site
  whatsapp?: string[];
}

export interface DiagnosticoSite {
  urlFinal: string;
  online: boolean;
  statusHttp?: number;
  erro?: string;
  tempoRespostaMs?: number;
  https: boolean;
  // <meta name="viewport"> — sem ele o site quase certamente quebra no celular
  responsivo: boolean;
  plataforma?: string;
  titulo?: string;
  temDescricao: boolean;
  metaPixel: boolean;
  googleAnalytics: boolean;
  googleAds: boolean;
  formularioContato: boolean;
  botaoWhatsapp: boolean;
  anoCopyright?: number;
  paginasLidas: string[];
}

export interface PerfilInstagram {
  usuario: string;
  url: string;
  // "ok": dados lidos; "bloqueado": tela de login/limite; "inexistente": 404;
  // "erro": falha de rede.
  status: "ok" | "bloqueado" | "inexistente" | "erro";
  fonte?: "meta" | "api_publica";
  nome?: string;
  bio?: string;
  seguidores?: number;
  seguindo?: number;
  publicacoes?: number;
  linkExterno?: string;
  contaComercial?: boolean;
  categoria?: string;
  ultimaPublicacao?: string;
}
