import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

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
