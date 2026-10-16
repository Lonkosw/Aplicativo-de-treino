import { existsSync } from "node:fs";

// .env opcional na raiz do server/ (Node 22 lê sem dependência extra).
if (existsSync(".env")) process.loadEnvFile(".env");

function texto(nome: string, padrao: string): string {
  const v = process.env[nome];
  return v === undefined || v.trim() === "" ? padrao : v.trim();
}

function inteiro(nome: string, padrao: number, min: number, max: number): number {
  const v = Number.parseInt(process.env[nome] ?? "", 10);
  if (Number.isNaN(v)) return padrao;
  return Math.min(max, Math.max(min, v));
}

export const config = {
  porta: inteiro("PORTA", 3737, 1, 65535),
  host: texto("HOST", "127.0.0.1"),
  apiToken: texto("API_TOKEN", ""),
  dbCaminho: texto("DB_CAMINHO", "./dados/prospecter.db"),
  groqApiKey: texto("GROQ_API_KEY", ""),
  groqModelo: texto("GROQ_MODELO", "llama-3.3-70b-versatile"),
  groqLote: inteiro("GROQ_LOTE", 8, 1, 20),
  oferta: texto(
    "OFERTA",
    "criação de sites profissionais, sistemas sob medida e software (SaaS) para pequenos negócios",
  ),
  concorrencia: inteiro("CONCORRENCIA", 3, 1, 10),
  instagramIntervaloMs: inteiro("INSTAGRAM_INTERVALO_MS", 5000, 1000, 120000),
  reenriquecerDias: inteiro("REENRIQUECER_DIAS", 30, 1, 365),
};

export type Config = typeof config;
