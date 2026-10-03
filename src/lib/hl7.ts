/**
 * Geração de mensagens HL7 de saída a partir de um relatório de
 * dermatopatologia: HL7 v2.5 (ORU^R01) e FHIR R4 (Bundle com
 * DiagnosticReport + Observation + Specimen).
 *
 * Fase 1: apenas geração/pré-visualização e envio HTTPS opcional.
 * Não há recepção de pedidos (ORM) nesta versão.
 */

import type { Amostra } from "./amostras";
import { intervaloBlocos, rotuloBlocos } from "./relatorio-docx";

export type DadosHL7 = {
  numeroAnalise: string;
  amostras: Amostra[];
  instituicao?: string;
  servico?: string;
  medico?: string;
  /** Data/hora do relatório; por omissão, agora. */
  data?: Date;
};

/** AAAAMMDDHHMMSS, formato de data/hora HL7 v2. */
export const dataHL7 = (d: Date) => {
  const p = (n: number, casas = 2) => String(n).padStart(casas, "0");
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
};

/** Escapa os separadores HL7 dentro de um campo de texto. */
export const escaparHL7 = (v: string) =>
  v
    .replace(/\\/g, "\\E\\")
    .replace(/\|/g, "\\F\\")
    .replace(/\^/g, "\\S\\")
    .replace(/&/g, "\\T\\")
    .replace(/~/g, "\\R\\");

const linhasTexto = (texto: string) =>
  texto
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** Descrição legível do resumo técnico de uma amostra. */
const resumoTexto = (a: Amostra, primeiroBloco: number) =>
  [
    `N.º de fragmentos: ${a.resumo.fragmentos}`,
    `${rotuloBlocos(a.resumo.blocos)}: ${intervaloBlocos(primeiroBloco, a.resumo.blocos)}`,
    `Seccionado: ${a.resumo.seccionado ? "Sim" : "Não"}`,
    `Inclusão: ${a.resumo.inclusao === "total" ? "Total" : "Com reserva"}`,
    `Código de facturação: ${a.resumo.codigoFaturacao}`,
  ].join("; ");

/** Primeiro número de bloco desta amostra (numeração contínua na análise). */
const primeiroBloco = (lista: Amostra[], indice: number) =>
  lista.slice(0, indice).reduce((t, a) => t + Math.max(1, a.resumo.blocos), 0) + 1;


/**
 * Mensagem ORU^R01 (resultado de anatomia patológica).
 * Segmentos: MSH, PID mínimo, OBR por amostra e OBX de texto.
 */
export const gerarORU = ({
  numeroAnalise,
  amostras,
  instituicao = "DermaVoz",
  servico = "Serviço de Dermatopatologia",
  medico,
  data = new Date(),
}: DadosHL7): string => {
  const ts = dataHL7(data);
  const analise = escaparHL7(numeroAnalise.trim() || "SEM-NUMERO");
  const usaveis = amostras.filter((a) => a.texto.trim());

  const segmentos: string[] = [];

  segmentos.push(
    [
      "MSH",
      "^~\\&",
      escaparHL7(instituicao),
      escaparHL7(servico),
      "",
      "",
      ts,
      "",
      "ORU^R01^ORU_R01",
      `${analise}-${ts}`,
      "P",
      "2.5",
    ].join("|"),
  );

  // Sem dados demográficos: a app identifica o caso pelo n.º da análise.
  segmentos.push(["PID", "1", "", analise].join("|"));

  usaveis.forEach((a, i) => {
    const ordem = i + 1;
    const titulo = escaparHL7(a.titulo.trim() || `Amostra ${ordem}`);

    segmentos.push(
      [
        "OBR",
        String(ordem),
        analise,
        `${analise}-${ordem}`,
        `${a.resumo.codigoFaturacao}^${titulo}^L`,
        "",
        "",
        ts,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        medico ? escaparHL7(medico) : "",
        "",
        "",
        "",
        "",
        "",
        ts,
        "",
        "F",
      ].join("|"),
    );

    let obx = 0;

    for (const l of linhasTexto(a.texto)) {
      obx += 1;
      segmentos.push(
        [
          "OBX",
          String(obx),
          "TX",
          `MACRO^Exame macroscópico^L`,
          String(ordem),
          escaparHL7(l),
          "",
          "",
          "",
          "",
          "",
          "F",
        ].join("|"),
      );
    }

    obx += 1;
    segmentos.push(
      [
        "OBX",
        String(obx),
        "TX",
        "RESUMO^Resumo técnico^L",
        String(ordem),
        escaparHL7(resumoTexto(a, primeiroBloco(usaveis, i))),
        "",
        "",
        "",
        "",
        "",
        "F",
      ].join("|"),
    );
  });

  // HL7 v2 usa CR como separador de segmento.
  return `${segmentos.join("\r")}\r`;
};

/** Bundle FHIR R4 (transaction) com DiagnosticReport por amostra. */
export const gerarBundleFhir = ({
  numeroAnalise,
  amostras,
  instituicao = "DermaVoz",
  servico = "Serviço de Dermatopatologia",
  medico,
  data = new Date(),
}: DadosHL7) => {
  const analise = numeroAnalise.trim() || "SEM-NUMERO";
  const emissao = data.toISOString();
  const usaveis = amostras.filter((a) => a.texto.trim());

  const entradas = usaveis.flatMap((a, i) => {
    const ordem = i + 1;
    const titulo = a.titulo.trim() || `Amostra ${ordem}`;
    const idEspecime = `Specimen/${analise}-${ordem}`;
    const idRelatorio = `DiagnosticReport/${analise}-${ordem}`;

    return [
      {
        fullUrl: `urn:uuid:${analise}-specimen-${ordem}`,
        resource: {
          resourceType: "Specimen",
          id: `${analise}-${ordem}`,
          accessionIdentifier: { value: `${analise}-${ordem}` },
          type: { text: titulo },
          note: [{ text: resumoTexto(a, primeiroBloco(usaveis, i)) }],
        },
        request: { method: "PUT", url: idEspecime },
      },
      {
        fullUrl: `urn:uuid:${analise}-report-${ordem}`,
        resource: {
          resourceType: "DiagnosticReport",
          id: `${analise}-${ordem}`,
          status: "final",
          category: [
            {
              coding: [
                {
                  system:
                    "http://terminology.hl7.org/CodeSystem/v2-0074",
                  code: "SP",
                  display: "Surgical Pathology",
                },
              ],
            },
          ],
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "60568-3",
                display: "Pathology Synoptic report",
              },
            ],
            text: titulo,
          },
          identifier: [{ value: `${analise}-${ordem}` }],
          effectiveDateTime: emissao,
          issued: emissao,
          performer: [{ display: medico || servico }],
          specimen: [{ reference: idEspecime, display: titulo }],
          conclusion: a.texto.trim(),
          extension: [
            {
              url: "urn:dermavoz:codigo-facturacao",
              valueString: a.resumo.codigoFaturacao,
            },
          ],
        },
        request: { method: "PUT", url: idRelatorio },
      },
    ];
  });

  return {
    resourceType: "Bundle",
    type: "transaction",
    identifier: { value: analise },
    timestamp: emissao,
    meta: { source: instituicao },
    entry: entradas,
  };
};

export const nomeFicheiroHL7 = (numeroAnalise: string, ext: "hl7" | "json") =>
  `${numeroAnalise.trim() || "relatorio"}.${ext}`;
