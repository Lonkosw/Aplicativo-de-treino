export function normalizarTexto(texto: string | null | undefined): string {
  if (!texto) return "";
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function somenteDigitos(texto: string | null | undefined): string {
  return texto ? String(texto).replace(/\D/g, "") : "";
}

// Remove caracteres de controle e limita o tamanho. Usado em tudo que vem de
// páginas de terceiros antes de ir para o banco ou para o prompt da IA.
export function limparTexto(valor: unknown, max: number): string {
  if (valor === null || valor === undefined) return "";
  return String(valor)
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function chaveNome(pais: string, estado: string, cidade: string, nome: string): string {
  return [pais, estado, cidade, nome].map(normalizarTexto).join("|");
}
