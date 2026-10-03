// Heurísticas de extração de vocabulário pessoal a partir dos relatórios
// anteriores do médico. Puro texto, sem dependências de servidor.

const STOPWORDS = new Set(
  `a o as os um uma uns umas de do da dos das em no na nos nas por para com sem sob sobre entre ao aos à às
   e ou mas que se como quando onde qual quais quanto muito mais menos também já não sim é são foi foram ser
   está estão estava havia há tem têm tinha seu sua seus suas este esta estes estas esse essa esses essas
   aquele aquela isto isso aquilo lhe lhes ele ela eles elas nós vós eu tu me te nos vos pelo pela pelos pelas
   após antes durante desde até então porque pois assim ainda apenas cada todo toda todos todas outro outra
   outros outras mesmo mesma bem mal aqui ali lá dr dra doente relatorio relatório`
    .split(/\s+/)
    .filter(Boolean),
);

const normalizar = (t: string) => t.toLowerCase().normalize("NFC");

/** Extrai os termos mais característicos de um conjunto de textos. */
export function extrairTermos(textos: string[], limite = 60): string[] {
  const contagem = new Map<string, { forma: string; n: number }>();

  for (const texto of textos) {
    const palavras = texto.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? [];
    for (const palavra of palavras) {
      if (palavra.length < 4 && palavra !== palavra.toUpperCase()) continue;
      const chave = normalizar(palavra);
      if (STOPWORDS.has(chave)) continue;
      if (/^\d+$/.test(chave)) continue;
      const actual = contagem.get(chave);
      if (actual) actual.n += 1;
      else contagem.set(chave, { forma: palavra, n: 1 });
    }
  }

  return [...contagem.values()]
    .filter((t) => t.n >= 2)
    .sort((a, b) => b.n - a.n)
    .slice(0, limite)
    .map((t) => t.forma);
}

/**
 * Compara o texto que a IA devolveu com o texto final guardado pelo médico e
 * devolve os pares palavra→correção que o médico alterou manualmente.
 */
export function extrairCorreccoes(antes: string, depois: string, limite = 20) {
  const tokens = (t: string) => t.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? [];
  const a = tokens(antes);
  const b = tokens(depois);
  const pares: Array<{ de: string; para: string }> = [];

  // Alinhamento simples por janela: procura substituições 1-para-1.
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length && pares.length < limite) {
    if (normalizar(a[i]!) === normalizar(b[j]!)) {
      i += 1;
      j += 1;
      continue;
    }
    const proximoIgual = normalizar(a[i + 1] ?? "") === normalizar(b[j + 1] ?? "");
    if (proximoIgual && a[i] && b[j]) {
      const de = a[i]!;
      const para = b[j]!;
      if (de.length > 3 && para.length > 2 && normalizar(de) !== normalizar(para)) {
        pares.push({ de, para });
      }
      i += 1;
      j += 1;
      continue;
    }
    // Inserção ou remoção: avança o lado mais longo.
    if (a.length - i > b.length - j) i += 1;
    else j += 1;
  }

  return pares;
}

/** Limita o tamanho de uma lista de pistas para caber no prompt do STT. */
export function limitarPistas(termos: string[], maxCaracteres = 700): string {
  const saida: string[] = [];
  let total = 0;
  for (const termo of termos) {
    if (total + termo.length + 2 > maxCaracteres) break;
    saida.push(termo);
    total += termo.length + 2;
  }
  return saida.join(", ");
}
