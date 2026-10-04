import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import {
  VOCABULARIO,
  PROMPT_OTIMIZACAO,
  PROMPT_SEPARACAO,
  gatewayError,
} from "./ai-clinico";

const inputSchema = z.object({
  audioBase64: z.string().min(10),
  format: z.enum(["wav", "mp3", "webm", "m4a", "ogg", "aac", "flac"]),
  pistas: z.string().max(1200).optional(),
});

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const request = getRequest();
    const authorization = request.headers.get("authorization");

    if (!authorization?.toLowerCase().startsWith("bearer ")) {
      throw new Error("Sessão não encontrada.");
    }

    const apiUrl =
      process.env["DIGIVOZ_AI_URL"] ??
      "https://digivoz-ai.caramelo-rogerio.workers.dev";

    const internalKey = process.env["DIGIVOZ_AI_KEY"];

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: authorization,
    };

    if (internalKey) {
      headers["X-DermaVoz-Key"] = internalKey;
    }

    const response = await fetch(`${apiUrl}/api/transcrever`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        audioBase64: data.audioBase64,
        format: data.format,
        ...(data.pistas ? { pistas: data.pistas } : {}),
      }),
    });

    const json = (await response.json()) as {
      text?: string;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(
        json.error ?? `Erro na transcrição (${response.status}).`,
      );
    }

    return {
      text: (json.text ?? "").trim(),
    };
  });

export const optimizeReport = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        texto: z.string().min(1),
        exemplos: z.array(z.string()).max(3).optional(),
        correccoes: z
          .array(z.object({ de: z.string(), para: z.string() }))
          .max(40)
          .optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const request = getRequest();
    const authorization = request.headers.get("authorization");

    if (!authorization?.toLowerCase().startsWith("bearer ")) {
      throw new Error("Sessão não encontrada.");
    }

    const apiUrl =
      process.env["DIGIVOZ_AI_URL"] ??
      "https://digivoz-ai.caramelo-rogerio.workers.dev";

    const internalKey = process.env["DIGIVOZ_AI_KEY"];

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: authorization,
    };

    if (internalKey) {
      headers["X-DermaVoz-Key"] = internalKey;
    }

    const textoComContexto = [
      data.texto,
      data.correccoes?.length
        ? `\n\nCorrecções que este médico costuma fazer (aplica-as quando o contexto o justificar): ${data.correccoes
            .map((c) => `"${c.de}" → "${c.para}"`)
            .join("; ")}.`
        : "",
      data.exemplos?.length
        ? `\n\nExemplos de relatórios anteriores deste médico, apenas como referência de estilo, pontuação e abreviaturas. Não copies conteúdo clínico destes exemplos:\n\n${data.exemplos.join(
            "\n\n---\n\n",
          )}`
        : "",
    ]
      .filter(Boolean)
      .join("");

    const response = await fetch(`${apiUrl}/api/otimizar`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        texto: textoComContexto,
      }),
    });

    const json = (await response.json()) as {
      text?: string;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(
        json.error ?? `Erro na otimização (${response.status}).`,
      );
    }

    return {
      text: (json.text ?? "").trim(),
    };
  });

export const splitSamples = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ texto: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];

    if (!apiKey) {
      throw new Error("O serviço de IA não está configurado.");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.7-flash",
          messages: [
            { role: "system", content: PROMPT_SEPARACAO },
            { role: "user", content: data.texto },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(await gatewayError(response));
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const bruto = json.choices?.[0]?.message?.content?.trim() ?? "";

    const limpo = bruto
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();

    try {
      const parsed = JSON.parse(limpo) as {
        amostras?: Array<{ titulo?: unknown; texto?: unknown }>;
      };

      const amostras = (parsed.amostras ?? [])
        .map((a) => ({
          titulo: typeof a.titulo === "string" ? a.titulo.trim() : "",
          texto: typeof a.texto === "string" ? a.texto.trim() : "",
        }))
        .filter((a) => a.texto);

      return { amostras };
    } catch {
      return { amostras: [] as { titulo: string; texto: string }[] };
    }
  });
