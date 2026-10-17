/**
 * Normalização determinística aplicada logo após a transcrição:
 * pontuação ditada → sinais, "N por M" → "N × M", unidades abreviadas.
 * Não altera conteúdo clínico — apenas forma.
 */
const NUM = String.raw`\d+(?:[.,]\d+)?`;

export function normalizarDitado(texto: string): string {
  let t = texto;

  // Unidades
  t = t.replace(/\b(\d+(?:[.,]\d+)?)\s*(?:mil[ií]metros?)\b/gi, "$1 mm");
  t = t.replace(/\b(\d+(?:[.,]\d+)?)\s*(?:cent[ií]metros?)\b/gi, "$1 cm");
  t = t.replace(/\bmil[ií]metros?\b/gi, "mm");
  t = t.replace(/\bcent[ií]metros?\b/gi, "cm");

  // Dimensões: "27 por 10 por 8" / "27 x 10"
  const dim = new RegExp(`(${NUM})\\s+(?:por|x|vezes)\\s+(?=${NUM})`, "gi");
  for (let i = 0; i < 3; i++) t = t.replace(dim, "$1 × ");

  // Pontuação ditada (evita "dois pontos de sutura")
  t = t.replace(/[\s,]*\bponto e v[ií]rgula\b[\s,]*/gi, "; ");
  t = t.replace(/[\s,]*\bdois pontos\b(?!\s+de\b)[\s,]*/gi, ": ");
  t = t.replace(/[\s,]*\bponto final\b[\s,.]*/gi, ". ");
  t = t.replace(/[\s,]*\bpar[aá]grafo\b[\s,.]*/gi, ".\n");
  t = t.replace(/[\s,]*\bponto\b(?!\s+de\b)[\s,.]*/gi, ". ");
  t = t.replace(/[\s,]*\bv[ií]rgula\b[\s,]*/gi, ", ");

  // Limpeza de espaços e sinais duplicados
  t = t.replace(/\s+([.,;:])/g, "$1");
  t = t.replace(/([.,;:])(?:\s*[.,])+/g, "$1");
  t = t.replace(/[ \t]{2,}/g, " ");
  t = t.replace(/^[\s.,;:]+/, "");

  // Maiúscula após ponto e no início
  t = t.replace(/(^|[.]\s+|\n)([a-zà-ÿ])/g, (_m, p, c) => p + c.toUpperCase());

  return t.trim();
}
