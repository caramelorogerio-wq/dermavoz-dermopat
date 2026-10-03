import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  PageNumber,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TabStopPosition,
  TabStopType,
  TextRun,
  WidthType,
} from "docx";


export type ResumoDocx = {
  fragmentos: number;
  blocos: number;
  seccionado: boolean;
  inclusao: "total" | "reserva";
  codigoFaturacao: string;
};

export type TemplateDocx = "clinico" | "simples" | "carta";

export const TEMPLATES: {
  valor: TemplateDocx;
  nome: string;
  descricao: string;
}[] = [
  {
    valor: "clinico",
    nome: "Clínico",
    descricao:
      "Cabeçalho com serviço, linha separadora e rodapé com paginação.",
  },
  {
    valor: "simples",
    nome: "Simples",
    descricao: "Sem cabeçalho nem rodapé, apenas título e texto.",
  },
  {
    valor: "carta",
    nome: "Carta",
    descricao:
      "Cabeçalho centrado com instituição e rodapé com confidencialidade.",
  },
];

export type AmostraDocx = {
  titulo: string;
  texto: string;
  resumo: ResumoDocx;
};

export type RelatorioDocx = {
  numeroAnalise: string;
  /** Amostras da análise. Cada uma gera uma secção própria. */
  amostras?: AmostraDocx[];
  /** Compatibilidade: relatório de amostra única. */
  texto?: string;
  resumo?: ResumoDocx;
  template?: TemplateDocx;
  instituicao?: string;
  servico?: string;
  medico?: string;
};


const linha = (rotulo: string, valor: string) =>
  new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${rotulo}: `, bold: true, font: "Century Gothic", size: 20 }),
      new TextRun({ text: valor, font: "Century Gothic", size: 20 }),
    ],
  });

/** Largura útil da página A4 com as margens usadas nos modelos. */
const LARGURA_UTIL = 9638;
const COLUNA = LARGURA_UTIL / 2;

const SEM_BORDAS = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const celula = (campo?: [string, string], largura = COLUNA) =>
  new TableCell({
    width: { size: largura, type: WidthType.DXA },
    borders: SEM_BORDAS,
    margins: { top: 20, bottom: 20, left: 0, right: 120 },
    children: [
      new Paragraph({
        spacing: { after: 0 },
        children: campo
          ? [
              new TextRun({
                text: `${campo[0]}: `,
                bold: true,
                font: "Century Gothic",
                size: 20,
              }),
              new TextRun({
                text: campo[1],
                font: "Century Gothic",
                size: 20,
              }),
            ]
          : [new TextRun({ text: "", font: "Century Gothic", size: 20 })],
      }),
    ],
  });

/** Campos do resumo técnico em colunas paralelas, sem grelha visível.
 *  Em relatórios com várias amostras usa uma só coluna para dar destaque
 *  ao intervalo contínuo de blocos. */
const tabelaResumo = (campos: [string, string][], colunas: 1 | 2 = 2) => {
  const linhas: TableRow[] = [];

  if (colunas === 1) {
    for (const campo of campos) {
      linhas.push(
        new TableRow({
          children: [celula(campo, LARGURA_UTIL)],
        }),
      );
    }
  } else {
    for (let i = 0; i < campos.length; i += 2) {
      linhas.push(
        new TableRow({
          children: [celula(campos[i]), celula(campos[i + 1])],
        }),
      );
    }
  }

  return new Table({
    width: { size: LARGURA_UTIL, type: WidthType.DXA },
    columnWidths: colunas === 1 ? [LARGURA_UTIL] : [COLUNA, COLUNA],
    borders: SEM_BORDAS,
    rows: linhas,
  });
};

const celulaTexto = (texto: string, negrito = false) =>
  new TableCell({
    width: { size: COLUNA, type: WidthType.DXA },
    borders: SEM_BORDAS,
    margins: { top: 20, bottom: 20, left: 0, right: 120 },
    children: [
      new Paragraph({
        spacing: { after: 0 },
        children: [
          new TextRun({
            text: texto,
            bold: negrito,
            font: "Century Gothic",
            size: 20,
          }),
        ],
      }),
    ],
  });

/** Quadro final com os códigos de facturação de cada amostra. */
const tabelaFaturacao = (entradas: [string, string][]) =>
  new Table({
    width: { size: LARGURA_UTIL, type: WidthType.DXA },
    columnWidths: [COLUNA, COLUNA],
    borders: SEM_BORDAS,
    rows: entradas.map(([nome, codigo]) =>
      new TableRow({
        children: [celulaTexto(nome, true), celulaTexto(codigo)],
      }),
    ),
  });

/** "1 a 3", "4 a 6" ou "4" (bloco único). Há sempre pelo menos 1 bloco. */
export const intervaloBlocos = (inicio: number, quantidade: number) => {
  const n = Math.max(1, quantidade);
  if (n === 1) return String(inicio);
  return `${inicio} a ${inicio + n - 1}`;
};

/** "N.º do bloco" (1) ou "N.º dos blocos" (2+). */
export const rotuloBlocos = (quantidade: number) =>
  Math.max(1, quantidade) === 1 ? "N.º do bloco" : "N.º dos blocos";



const separador = () =>
  new Paragraph({
    spacing: { after: 120 },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 6,
        color: "1F4E79",
        space: 1,
      },
    },
    children: [new TextRun({ text: "", font: "Century Gothic", size: 20 })],
  });

const rodapePaginas = (nota: string) =>
  new Footer({
    children: [
      new Paragraph({
        tabStops: [
          { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
        ],
        children: [
          new TextRun({ text: nota, size: 18, color: "666666", font: "Century Gothic" }),
          new TextRun({ text: "\tPágina ", size: 18, color: "666666", font: "Century Gothic" }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 18,
            color: "666666",
            font: "Century Gothic",
          }),
          new TextRun({ text: " de ", size: 18, color: "666666", font: "Century Gothic" }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            size: 18,
            color: "666666",
            font: "Century Gothic",
          }),
        ],
      }),
    ],
  });

export async function gerarRelatorioDocx({
  numeroAnalise,
  amostras,

  texto,
  resumo,
  template = "clinico",
  instituicao = "DermaVoz",
  servico = "Serviço de Dermatopatologia",
  medico,
}: RelatorioDocx): Promise<Blob> {
  const titulo = numeroAnalise || "Relatório";
  const data = new Date().toLocaleDateString("pt-PT");

  const lista: AmostraDocx[] =
    amostras && amostras.length > 0
      ? amostras
      : [
          {
            titulo: "",
            texto: texto ?? "",
            resumo: resumo ?? {
              fragmentos: 0,
              blocos: 0,
              seccionado: false,
              inclusao: "total",
              codigoFaturacao: "31057",
            },
          },
        ];

  const varias = lista.length > 1;

  const corpoAmostra = (
    amostra: AmostraDocx,
    indice: number,
    primeiroBloco: number,
  ): (Paragraph | Table)[] => {
    const paragrafos: (Paragraph | Table)[] = [];

    if (varias || amostra.titulo.trim()) {
      paragrafos.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: indice === 0 ? 120 : 360, after: 120 },
          children: [
            new TextRun({
              text:
                amostra.titulo.trim() || `Amostra ${indice + 1}`,
              bold: true,
              size: 24,
              color: "1F4E79",
              font: "Century Gothic",
            }),
          ],
        }),
      );
    }

    paragrafos.push(
      ...amostra.texto
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map(
          (l) =>
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 120 },
              children: [
                new TextRun({ text: l, font: "Century Gothic", size: 20 }),
              ],
            }),
        ),
    );

    const campos: [string, string][] = [
      ["N.º de fragmentos", String(amostra.resumo.fragmentos)],
      [
        rotuloBlocos(amostra.resumo.blocos),
        intervaloBlocos(primeiroBloco, amostra.resumo.blocos),
      ],
      ["Seccionado", amostra.resumo.seccionado ? "Sim" : "Não"],
      [
        "Inclusão",
        amostra.resumo.inclusao === "total" ? "Total" : "Com reserva",
      ],
    ];

    paragrafos.push(
      new Paragraph({
        spacing: { before: 240, after: 80 },
        children: [
          new TextRun({
            text: varias ? "Resumo técnico da amostra" : "Resumo técnico",
            bold: true,
            size: 20,
            font: "Century Gothic",
          }),
        ],
      }),
      tabelaResumo(campos, varias ? 1 : 2),
    );

    return paragrafos;

  };


  const cabecalhoClinico = new Header({
    children: [
      new Paragraph({
        tabStops: [
          { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
        ],
        children: [
          new TextRun({
            text: instituicao,
            bold: true,
            size: 20,
            color: "1F4E79",
            font: "Century Gothic",
          }),
          new TextRun({
            text: `\t${servico}`,
            size: 18,
            color: "666666",
            font: "Century Gothic",
          }),
        ],
      }),
      separador(),
    ],
  });

  const cabecalhoCarta = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: instituicao.toUpperCase(),
            bold: true,
            size: 22,
            color: "1F4E79",
            font: "Century Gothic",
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: servico, size: 18, color: "666666", font: "Century Gothic" }),
        ],
      }),
      separador(),
    ],
  });

  const headers =
    template === "clinico"
      ? { default: cabecalhoClinico }
      : template === "carta"
        ? { default: cabecalhoCarta }
        : undefined;

  const footers =
    template === "clinico"
      ? {
          default: rodapePaginas(
            `${titulo} · ${data}${medico ? ` · ${medico}` : ""}`,
          ),
        }
      : template === "carta"
        ? {
            default: rodapePaginas(
              "Documento clínico confidencial",
            ),
          }
        : undefined;

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Century Gothic", size: 20 } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: {
              top: template === "simples" ? 1134 : 1418,
              right: 1134,
              bottom: template === "simples" ? 1134 : 1418,
              left: 1134,
            },
          },
        },
        ...(headers ? { headers } : {}),
        ...(footers ? { footers } : {}),
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment:
              template === "carta"
                ? AlignmentType.CENTER
                : AlignmentType.LEFT,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: titulo, bold: true, size: 30, font: "Century Gothic" }),
            ],
          }),

          new Paragraph({
            alignment:
              template === "carta"
                ? AlignmentType.CENTER
                : AlignmentType.LEFT,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: `Relatório clínico · ${data}`,
                color: "666666",
                size: 20,
                font: "Century Gothic",
              }),
            ],
          }),

          ...(varias
            ? [
                linha("N.º da análise", titulo),
                linha("N.º de amostras", String(lista.length)),
              ]
            : []),

          ...lista.flatMap((amostra, indice) => {
            const primeiro =
              lista
                .slice(0, indice)
                .reduce((t, a) => t + Math.max(1, a.resumo.blocos), 0) + 1;

            return corpoAmostra(amostra, indice, primeiro);
          }),

          new Paragraph({
            spacing: { before: 360, after: 80 },
            children: [
              new TextRun({
                text:
                  lista.length > 1
                    ? "Códigos de facturação"
                    : "Código de facturação",
                bold: true,
                size: 26,
                font: "Century Gothic",
              }),
            ],
          }),
          tabelaFaturacao(
            lista.map((amostra, indice): [string, string] => [
              varias
                ? amostra.titulo.trim() || `Amostra ${indice + 1}`
                : "Código",
              amostra.resumo.codigoFaturacao,
            ]),
          ),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}
