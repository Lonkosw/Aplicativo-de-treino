import { somenteDigitos } from "./texto";

// Telefones brasileiros: 10 dígitos (fixo) ou 11 (celular, começa com 9 após
// o DDD). Para outros países confiamos no E.164 que a extensão já calculou.
export function telefoneE164Br(telefone: string | null | undefined): string {
  let d = somenteDigitos(telefone);
  if (!d) return "";
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length !== 10 && d.length !== 11) return "";
  if (d.length === 11 && d[2] !== "9") return "";
  return "55" + d;
}

export function ehCelularBr(e164: string): boolean {
  return e164.startsWith("55") && e164.length === 13 && e164[4] === "9";
}

export function linkWhatsapp(e164: string, pais: string): string {
  if (!e164) return "";
  if (pais === "BR" && !ehCelularBr(e164)) return "";
  return "https://wa.me/" + e164;
}
