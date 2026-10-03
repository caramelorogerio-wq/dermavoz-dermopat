export type ResumoAmostra = {
  fragmentos: number;
  blocos: number;
  seccionado: boolean;
  inclusao: "total" | "reserva";
  codigoFaturacao: "31057" | "31077";
};

export type Amostra = {
  id: string;
  titulo: string;
  texto: string;
  resumo: ResumoAmostra;
};

export const resumoVazio = (): ResumoAmostra => ({
  fragmentos: 0,
  blocos: 1,
  seccionado: false,
  inclusao: "total",
  codigoFaturacao: "31057",
});

export const novoId = () =>
  `a-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

export const novaAmostra = (
  titulo = "",
  texto = "",
  resumo?: Partial<ResumoAmostra>,
): Amostra => ({
  id: novoId(),
  titulo,
  texto,
  resumo: { ...resumoVazio(), ...resumo },
});

/**
 * Converte comandos de voz de aspas em aspas reais.
 * "abrir aspas lesão do dorso fechar aspas" -> "«lesão do dorso»" (aspas ")
 */
export function normalizarAspasDitadas(texto: string): string {
  const abrir = /\b(?:abrir|abre|abrindo)\s+aspas\b[\s,:;-]*/gi;
  // "fechar aspas" fecha as aspas e consome um eventual ponto final logo a
  // seguir, que passa a funcionar como separador com traço ("-") entre o
  // título e o corpo do texto.
  const fechar = /[\s,]*\b(?:fechar|fecha|fechando)\s+aspas\b(?:\s*\.)?/gi;
  /** Marcador temporário para a aspa de fecho ditada (distinta de aspas soltas). */
  const FECHAR = "\uE000";

  return texto
    .replace(abrir, '"')
    .replace(fechar, FECHAR)
    .replace(/"\s+/g, '"')
    .replace(/\s+"/g, '"')
    .replace(/"([^"]*?)\uE000/g, (_m, dentro: string) => `"${dentro.trim()}" -`)
    .replace(/\uE000/g, '"')
    .replace(/"([^"]*)"/g, (_m, dentro: string) => `"${dentro.trim()}"`);
}

const limparAspas = (valor: string) =>
  valor.replace(/^["'«»“”\s]+|["'«»“”\s,.:;-]+$/g, "").trim();

/**
 * Separação heurística usada quando a IA não está disponível:
 * procura linhas/frases iniciadas por "amostra ...:" ou "amostra A -".
 */
export function separarAmostrasHeuristica(
  texto: string,
): { titulo: string; texto: string }[] {
  const limpo = normalizarAspasDitadas(texto.replace(/\r\n/g, "\n")).trim();

  if (!limpo) return [];

  const marcador =
    /(?:^|\n|\.\s+)\s*amostra\s*(?:n[.º°]?\s*)?(?:"([^"\n]{1,80})"|([^\n:.\-–]{0,80}))\s*[:\-–]?\s*/gi;


  const cortes: { indice: number; titulo: string; fim: number }[] = [];

  let m: RegExpExecArray | null;

  while ((m = marcador.exec(limpo)) !== null) {
    cortes.push({
      indice: m.index,
      titulo: limparAspas(m[1] ?? m[2] ?? ""),
      fim: m.index + m[0].length,
    });
  }

  if (cortes.length === 0) return [];

  const blocos: { titulo: string; texto: string }[] = [];

  cortes.forEach((corte, i) => {
    const fimBloco =
      i + 1 < cortes.length ? cortes[i + 1]!.indice : limpo.length;

    const corpo = limpo.slice(corte.fim, fimBloco).trim();

    if (!corpo) return;

    blocos.push({
      titulo: corte.titulo || `Amostra ${blocos.length + 1}`,
      texto: corpo,
    });
  });

  const preambulo = limpo.slice(0, cortes[0]!.indice).trim();

  if (preambulo && blocos.length > 0) {
    blocos[0] = {
      ...blocos[0]!,
      texto: `${preambulo}\n\n${blocos[0]!.texto}`.trim(),
    };
  }

  return blocos;
}

export const textoCompleto = (amostras: Amostra[]) =>
  amostras
    .filter((a) => a.texto.trim() || a.titulo.trim())
    .map((a) =>
      a.titulo.trim()
        ? `${a.titulo.trim()}\n${a.texto.trim()}`
        : a.texto.trim(),
    )
    .join("\n\n")
    .trim();

export const contarPalavras = (texto: string) =>
  texto.trim() ? texto.trim().split(/\s+/).length : 0;
