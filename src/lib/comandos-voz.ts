/**
 * Reconhecimento de comandos de voz em pt-PT para o fluxo do DermaVoz.
 *
 * Cada frase captada pelo navegador é normalizada (sem acentos, sem
 * pontuação) e comparada com os padrões abaixo. Só as frases iniciadas pela
 * palavra de activação ("App") são tratadas como comando — tudo o resto
 * é ditado normal e é ignorado por este módulo.
 */

export type ResumoComando = {
  fragmentos?: number;
  blocos?: number;
  seccionado?: boolean;
  inclusao?: "total" | "reserva";
  codigoFaturacao?: "31057" | "31077";
};

export type Comando =
  | { tipo: "analise"; valor: string }
  | { tipo: "iniciar-gravacao" }
  | { tipo: "parar-gravacao" }
  | { tipo: "nova-amostra" }
  | { tipo: "ir-amostra"; indice: number }
  | { tipo: "apagar-amostra" }
  | { tipo: "resumo"; resumo: ResumoComando }
  | { tipo: "resumo-guiado" }
  | { tipo: "separar" }
  | { tipo: "otimizar" }
  | { tipo: "guardar" }
  | { tipo: "exportar" }
  | { tipo: "copiar" }
  | { tipo: "novo-relatorio" }
  | { tipo: "sair" }
  | { tipo: "ajuda" }
  | { tipo: "confirmar" }
  | { tipo: "cancelar" }
  | { tipo: "repetir" };

/** Acções que só executam depois de um "confirmar". */
export const COMANDOS_DESTRUTIVOS: ReadonlySet<Comando["tipo"]> = new Set([
  "apagar-amostra",
  "novo-relatorio",
  "sair",
]);

export const PALAVRA_ACTIVACAO = "App";

const NUMEROS: Record<string, number> = {
  zero: 0,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  meia: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  catorze: 14,
  quatorze: 14,
  quinze: 15,
  dezasseis: 16,
  dezesseis: 16,
  dezassete: 17,
  dezessete: 17,
  dezoito: 18,
  dezanove: 19,
  dezenove: 19,
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
  cem: 100,
  cento: 100,
  duzentos: 200,
  trezentos: 300,
  quatrocentos: 400,
  quinhentos: 500,
  seiscentos: 600,
  setecentos: 700,
  oitocentos: 800,
  novecentos: 900,
  mil: 1000,
};


const LETRAS_DITADAS: Record<string, string> = {
  alfa: "A",
  bravo: "B",
  charlie: "C",
  delta: "D",
  eco: "E",
  echo: "E",
  foxtrot: "F",
  golf: "G",
  hotel: "H",
  india: "I",
  juliet: "J",
  kilo: "K",
  lima: "L",
  mike: "M",
  november: "N",
  oscar: "O",
  papa: "P",
  quebec: "Q",
  romeu: "R",
  romeo: "R",
  sierra: "S",
  tango: "T",
  uniform: "U",
  victor: "V",
  whiskey: "W",
  xray: "X",
  yankee: "Y",
  zulu: "Z",

  // Nomes das letras em português (já normalizados, sem acentos).
  be: "B",
  ce: "C",
  de: "D",
  efe: "F",
  ge: "G",
  je: "G",
  aga: "H",
  aca: "H",
  jota: "J",
  capa: "K",
  ka: "K",
  ele: "L",
  eme: "M",
  ene: "N",
  pe: "P",
  que: "Q",
  erre: "R",
  esse: "S",
  te: "T",
  ve: "V",
  dablio: "W",
  dabliu: "W",
  xis: "X",
  ipsilon: "Y",
  ze: "Z",
};

/** Separadores que podem ser ditados dentro de um código. */
const SEPARADORES: Record<string, string> = {
  traco: "-",
  hifen: "-",
  menos: "-",
  barra: "/",
  ponto: ".",
};


export const normalizar = (frase: string) =>
  frase
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const VARIANTES_ACTIVACAO = [
  "app",
  "ap",
  "apo",
  "apps",
  "dermavoz",
  "derma voz",
  "derma vos",
  "dermavos",
  "dermabos",
  "derma boz",
];

/** Devolve o texto do comando quando a frase começa pela palavra de activação. */
export function extrairComando(frase: string): string | null {
  const n = normalizar(frase);
  for (const v of VARIANTES_ACTIVACAO) {
    if (n === v) return "";
    if (n.startsWith(`${v} `)) return n.slice(v.length + 1).trim();
  }
  return null;
}

const numeroDe = (palavra: string | undefined): number | undefined => {
  if (!palavra) return undefined;
  if (/^\d+$/.test(palavra)) return Number(palavra);
  return NUMEROS[palavra];
};

/**
 * Converte a leitura soletrada de um código em texto.
 *
 * "cê vinte e seis agá zero zero zero zero" → "C26H0000"
 * "dê eme pê traço zero zero um"            → "DMP-001"
 */
function juntarCodigo(texto: string): string {
  const partes = texto.split(" ").filter(Boolean);

  let saida = "";
  let pendente: number | null = null;

  const descarregar = () => {
    if (pendente !== null) {
      saida += String(pendente);
      pendente = null;
    }
  };

  for (const p of partes) {
    // "vinte e seis" — o "e" liga dois números, senão é ignorado.
    if (p === "e") continue;

    if (p === "espaco") {
      descarregar();
      continue;
    }

    if (p in SEPARADORES) {
      descarregar();
      saida += SEPARADORES[p];
      continue;
    }

    if (/^\d+$/.test(p)) {
      descarregar();
      saida += p;
      continue;
    }

    const valor = NUMEROS[p];

    if (valor !== undefined) {
      if (
        pendente !== null &&
        pendente >= 20 &&
        pendente % 10 === 0 &&
        valor < pendente
      ) {
        pendente += valor;
      } else {
        descarregar();
        pendente = valor;
      }
      continue;
    }

    descarregar();

    const letra = LETRAS_DITADAS[p];
    saida += letra ?? p.toUpperCase();
  }

  descarregar();

  return saida.replace(/\s+/g, "").toUpperCase();
}


/** Atalhos curtos: "3 fragmentos", "não seccionado", "código 31077"… */
function lerAtalhoResumo(texto: string): ResumoComando | null {
  const resumo: ResumoComando = {};

  const frag = texto.match(/^(?:sao |são )?(\d+|[a-z]+)\s+fragmentos?$/);
  const fragN = numeroDe(frag?.[1]);
  if (fragN !== undefined) resumo.fragmentos = fragN;

  const blo = texto.match(/^(?:sao |são )?(\d+|[a-z]+)\s+blocos?$/);
  const bloN = numeroDe(blo?.[1]);
  if (bloN !== undefined) resumo.blocos = bloN;

  if (/^nao seccionado$/.test(texto)) resumo.seccionado = false;
  else if (/^seccionado$/.test(texto)) resumo.seccionado = true;

  if (/^(inclusao total|total)$/.test(texto)) resumo.inclusao = "total";
  if (/^(reserva|com reserva|inclusao com reserva)$/.test(texto))
    resumo.inclusao = "reserva";

  if (/^(codigo\s+)?(31057|31 057)$/.test(texto))
    resumo.codigoFaturacao = "31057";
  if (/^(codigo\s+)?(31077|31 077)$/.test(texto))
    resumo.codigoFaturacao = "31077";

  return Object.keys(resumo).length > 0 ? resumo : null;
}

/** Campos do resumo técnico, pela ordem do modo guiado. */
export const CAMPOS_RESUMO = [
  "fragmentos",
  "blocos",
  "seccionado",
  "inclusao",
  "codigoFaturacao",
] as const;

export type CampoResumo = (typeof CAMPOS_RESUMO)[number];

export const PERGUNTAS_RESUMO: Record<
  CampoResumo,
  { pergunta: string; exemplos: string }
> = {
  fragmentos: { pergunta: "Fragmentos?", exemplos: "diga o número — “três”" },
  blocos: { pergunta: "Blocos?", exemplos: "diga o número — “dois”" },
  seccionado: {
    pergunta: "Seccionado?",
    exemplos: "“seccionado” ou “não seccionado”",
  },
  inclusao: { pergunta: "Inclusão?", exemplos: "“total” ou “reserva”" },
  codigoFaturacao: {
    pergunta: "Código de facturação?",
    exemplos: "“31057” ou “31077” (ou “um” / “dois”)",
  },
};

export type RespostaResumo =
  | { tipo: "valor"; resumo: ResumoComando }
  | { tipo: "saltar" }
  | { tipo: "voltar" }
  | { tipo: "repetir" }
  | { tipo: "sair" };

/**
 * Interpreta uma resposta solta dentro do modo guiado do resumo técnico.
 * Não exige a palavra de activação.
 */
export function interpretarRespostaResumo(
  campo: CampoResumo,
  texto: string,
): RespostaResumo | null {
  const t = normalizar(texto);
  if (!t) return null;

  if (/^(saltar|salta|seguinte|proximo|proxima|passar)$/.test(t))
    return { tipo: "saltar" };
  if (/^(voltar|volta|anterior|atras)$/.test(t)) return { tipo: "voltar" };
  if (/^(repetir|repete|outra vez)$/.test(t)) return { tipo: "repetir" };
  if (/^(sair|terminar|termina|fechar|cancelar|pronto|fim)$/.test(t))
    return { tipo: "sair" };

  if (campo === "fragmentos" || campo === "blocos") {
    const n = numeroDe(t.replace(/\s+(fragmentos?|blocos?)$/, "").trim());
    if (n !== undefined) return { tipo: "valor", resumo: { [campo]: n } };
    return null;
  }

  if (campo === "seccionado") {
    if (/^(nao|nao seccionado|nao e seccionado)$/.test(t))
      return { tipo: "valor", resumo: { seccionado: false } };
    if (/^(sim|seccionado|e seccionado)$/.test(t))
      return { tipo: "valor", resumo: { seccionado: true } };
    return null;
  }

  if (campo === "inclusao") {
    if (/^(total|inclusao total|um|1)$/.test(t))
      return { tipo: "valor", resumo: { inclusao: "total" } };
    if (/^(reserva|com reserva|inclusao com reserva|dois|2)$/.test(t))
      return { tipo: "valor", resumo: { inclusao: "reserva" } };
    return null;
  }

  if (/^(31057|31 057|um|1|primeiro)$/.test(t))
    return { tipo: "valor", resumo: { codigoFaturacao: "31057" } };
  if (/^(31077|31 077|dois|2|segundo)$/.test(t))
    return { tipo: "valor", resumo: { codigoFaturacao: "31077" } };

  return null;
}

/** Distância de Levenshtein normalizada (0 a 1, onde 1 = igual). */
function semelhanca(a: string, b: string): number {
  const s1 = normalizar(a).replace(/\s+/g, "");
  const s2 = normalizar(b).replace(/\s+/g, "");
  if (s1 === s2) return 1;
  if (!s1.length || !s2.length) return 0;

  const m = s1.length;
  const n = s2.length;
  const dp = Array<number>(n + 1).fill(0);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j]!;
      if (s1[i - 1] === s2[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(prev, dp[j]!, dp[j - 1]!);
      }
      prev = temp;
    }
  }

  const dist = dp[n] ?? 0;
  return 1 - dist / Math.max(m, n);
}

export type SugestaoComando = {
  frase: string;
  comando: Comando;
  score: number;
};

const FRASES_COMANDO: { frase: string; comando: Comando }[] = [
  { frase: "análise", comando: { tipo: "ajuda" } }, // placeholder; analise tem valor dinâmico
  { frase: "iniciar gravação", comando: { tipo: "iniciar-gravacao" } },
  { frase: "começar a gravar", comando: { tipo: "iniciar-gravacao" } },
  { frase: "gravar", comando: { tipo: "iniciar-gravacao" } },
  { frase: "parar gravação", comando: { tipo: "parar-gravacao" } },
  { frase: "terminar gravação", comando: { tipo: "parar-gravacao" } },
  { frase: "nova amostra", comando: { tipo: "nova-amostra" } },
  { frase: "próxima amostra", comando: { tipo: "nova-amostra" } },
  { frase: "amostra", comando: { tipo: "ir-amostra", indice: 1 } },
  { frase: "apagar amostra", comando: { tipo: "apagar-amostra" } },
  { frase: "remover amostra", comando: { tipo: "apagar-amostra" } },
  { frase: "separar amostras", comando: { tipo: "separar" } },
  { frase: "dividir amostras", comando: { tipo: "separar" } },
  { frase: "otimizar relatório", comando: { tipo: "otimizar" } },
  { frase: "optimizar", comando: { tipo: "otimizar" } },
  { frase: "guardar relatório", comando: { tipo: "guardar" } },
  { frase: "guardar", comando: { tipo: "guardar" } },
  { frase: "exportar word", comando: { tipo: "exportar" } },
  { frase: "exportar", comando: { tipo: "exportar" } },
  { frase: "copiar texto", comando: { tipo: "copiar" } },
  { frase: "copiar", comando: { tipo: "copiar" } },
  { frase: "novo relatório", comando: { tipo: "novo-relatorio" } },
  { frase: "limpar tudo", comando: { tipo: "novo-relatorio" } },
  { frase: "terminar sessão", comando: { tipo: "sair" } },
  { frase: "sair", comando: { tipo: "sair" } },
  { frase: "resumo técnico", comando: { tipo: "resumo-guiado" } },
  { frase: "preencher resumo", comando: { tipo: "resumo-guiado" } },
  { frase: "ajuda", comando: { tipo: "ajuda" } },
  { frase: "comandos", comando: { tipo: "ajuda" } },
  { frase: "confirmar", comando: { tipo: "confirmar" } },
  { frase: "sim", comando: { tipo: "confirmar" } },
  { frase: "cancelar", comando: { tipo: "cancelar" } },
  { frase: "não", comando: { tipo: "cancelar" } },
  { frase: "repetir", comando: { tipo: "repetir" } },
  { frase: "outra vez", comando: { tipo: "repetir" } },
];

/**
 * Devolve os comandos mais parecidos com o texto ouvido.
 * Limiares: ≥0.9 executa directamente; ≥0.6 sugere; abaixo só lista genérica.
 */
export function sugerirComandos(texto: string): SugestaoComando[] {
  const t = normalizar(texto);
  if (!t) return [];

  const scored = FRASES_COMANDO.map(({ frase, comando }) => ({
    frase,
    comando,
    score: semelhanca(t, frase),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score >= 0.45).slice(0, 3);
}

/**
 * Interpreta o texto que vem depois da palavra de activação.
 * Devolve `null` quando nenhum comando é reconhecido.
 */
export function interpretarComando(texto: string): Comando | null {
  const t = normalizar(texto);
  if (!t) return null;

  if (/^(confirmar|confirmo|sim|confirma)$/.test(t)) return { tipo: "confirmar" };
  if (/^(cancelar|cancela|nao|anular)$/.test(t)) return { tipo: "cancelar" };
  if (/^(repetir|repete|outra vez|diz outra vez)$/.test(t))
    return { tipo: "repetir" };

  if (/^(ajuda|que comandos|comandos|lista de comandos)$/.test(t))
    return { tipo: "ajuda" };

  const analise = t.match(
    /^(?:(?:numero|n|numero de|codigo|codigo de|referencia|referencia de)\s+)?(?:da\s+|de\s+|do\s+)?analise(?:\s+numero)?\s+(.+)$/,
  );
  if (analise?.[1]) {
    const valor = juntarCodigo(analise[1]);
    if (valor) return { tipo: "analise", valor };
  }

  if (/^(iniciar|comecar|come[cç]a|inicia|gravar|grava)( gravacao| a gravar)?$/.test(t))
    return { tipo: "iniciar-gravacao" };

  if (/^(parar|para|terminar|termina|stop)( gravacao| de gravar| a gravacao)?$/.test(t))
    return { tipo: "parar-gravacao" };

  if (/^(nova amostra|adicionar amostra|proxima amostra)$/.test(t))
    return { tipo: "nova-amostra" };

  const irAmostra = t.match(/^(?:ir para |abrir |seleccionar |selecionar )?amostra (\d+|[a-z]+)$/);
  const indice = numeroDe(irAmostra?.[1]);
  if (indice !== undefined && indice >= 1)
    return { tipo: "ir-amostra", indice };

  if (/^(apagar|remover|eliminar) (a )?amostra$/.test(t))
    return { tipo: "apagar-amostra" };

  if (/^(separar amostras|separar|dividir amostras)$/.test(t))
    return { tipo: "separar" };

  if (/^(otimizar|optimizar|otimiza|otimizar relatorio|otimizar com ia|optimizar com ia)$/.test(t))
    return { tipo: "otimizar" };

  if (/^(guardar|guarda|gravar relatorio|guardar relatorio)$/.test(t))
    return { tipo: "guardar" };

  if (/^(exportar|exporta|exportar word|exportar documento|exportar para word)$/.test(t))
    return { tipo: "exportar" };

  if (/^(copiar|copia|copiar texto)$/.test(t)) return { tipo: "copiar" };

  if (/^(novo relatorio|limpar|limpa|apagar tudo)$/.test(t))
    return { tipo: "novo-relatorio" };

  if (/^(terminar sessao|sair|fechar sessao|logout)$/.test(t))
    return { tipo: "sair" };

  if (/^(resumo|resumo tecnico|preencher resumo|preencher resumo tecnico)$/.test(t))
    return { tipo: "resumo-guiado" };

  const atalho = lerAtalhoResumo(t);
  if (atalho) return { tipo: "resumo", resumo: atalho };

  return null;
}

/** Lista mostrada no diálogo de ajuda. */
export const LISTA_COMANDOS: { dizer: string; faz: string }[] = [
  { dizer: "App, análise C26H0000", faz: "Preenche o n.º da análise" },
  {
    dizer: "App, análise cê vinte e seis agá zero zero zero zero",
    faz: "Mesmo código, ditado letra a letra (C26H0000)",
  },
  {
    dizer: "App, análise dê eme pê traço zero zero um",
    faz: "Códigos com traço ou barra (DMP-001)",
  },

  { dizer: "App, iniciar gravação", faz: "Começa a gravar" },
  { dizer: "App, parar", faz: "Pára e transcreve" },
  { dizer: "App, nova amostra", faz: "Cria uma amostra" },
  { dizer: "App, amostra dois", faz: "Muda para essa amostra" },
  { dizer: "App, apagar amostra", faz: "Remove a amostra activa (confirmar)" },
  { dizer: "App, separar amostras", faz: "Separa o ditado em amostras" },
  {
    dizer: "App, resumo técnico",
    faz: "Entra no quadro e pergunta campo a campo",
  },
  {
    dizer: "3 fragmentos · 2 blocos · seccionado · total · 31077",
    faz: "Respostas curtas dentro do modo guiado (sem dizer “App”)",
  },
  { dizer: "saltar / voltar / repetir / sair", faz: "Navegar no modo guiado" },
  { dizer: "App, 3 fragmentos", faz: "Atalho directo, sem modo guiado" },
  { dizer: "App, otimizar", faz: "Otimiza o relatório com IA" },
  { dizer: "App, guardar", faz: "Guarda o relatório" },
  { dizer: "App, exportar", faz: "Gera o ficheiro Word" },
  { dizer: "App, copiar", faz: "Copia o texto" },
  { dizer: "App, repetir", faz: "Repete a última frase ouvida" },
  { dizer: "App, novo relatório", faz: "Limpa tudo (confirmar)" },
  { dizer: "App, terminar sessão", faz: "Sai da conta (confirmar)" },
  { dizer: "App, ajuda", faz: "Mostra esta lista" },
];

/** Palavras que param a gravação mesmo sem a palavra de activação. */
export const PALAVRAS_PARAGEM = [
  "parar",
  "para",
  "pára",
  "stop",
  "terminar",
  "termina",
  "fim de ditado",
  "fim do ditado",
  "parar gravacao",
  "parar gravação",
];

/**
 * Durante a gravação aceita-se uma paragem directa: a frase é só uma
 * palavra de paragem (com ou sem "app" à frente).
 */
export function ehParagemDirecta(texto: string): boolean {
  const t = normalizar(texto).replace(/^app[,\s]+/, "").trim();
  if (!t) return false;
  return PALAVRAS_PARAGEM.some((p) => normalizar(p) === t);
}
