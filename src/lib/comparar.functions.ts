import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { mimeFor, VOCABULARIO, PROMPT_OTIMIZACAO, gatewayError } from "@/lib/ai-clinico";

const MAX_BASE64 = 30 * 1024 * 1024; // ~22 MB de áudio

export type ResultadoLado = {
  text: string | null;
  error: string | null;
  ms: number;
};

export type ResultadoComparacao = {
  worker: ResultadoLado;
  gateway: ResultadoLado;
};

const WORKER_URL_POR_DEFEITO = "https://digivoz-ai.caramelo-rogerio.workers.dev";

async function cronometrar(fn: () => Promise<string>): Promise<ResultadoLado> {
  const inicio = performance.now();
  try {
    const text = await fn();
    return { text, error: null, ms: Math.round(performance.now() - inicio) };
  } catch (e) {
    return {
      text: null,
      error: e instanceof Error ? e.message : "Erro desconhecido.",
      ms: Math.round(performance.now() - inicio),
    };
  }
}

async function chamarWorker(caminho: string, body: unknown): Promise<string> {
  const authorization = getRequest().headers.get("authorization");
  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    throw new Error("Sessão não encontrada.");
  }
  const apiUrl = process.env["DIGIVOZ_AI_URL"] ?? WORKER_URL_POR_DEFEITO;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: authorization,
  };
  const internalKey = process.env["DIGIVOZ_AI_KEY"];
  if (internalKey) headers["X-DermaVoz-Key"] = internalKey;

  const response = await fetch(`${apiUrl}${caminho}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => ({}))) as {
    text?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(json.error ?? `Erro no Worker (${response.status}).`);
  }
  return (json.text ?? "").trim();
}

function chaveGateway(): string {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("O gateway não está configurado.");
  return apiKey;
}

export const compararTranscricao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        audioBase64: z.string().min(10),
        format: z.enum(["wav", "mp3", "webm", "m4a", "ogg", "aac", "flac"]),
        pistas: z.string().max(1200).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<ResultadoComparacao> => {
    if (data.audioBase64.length > MAX_BASE64) {
      throw new Error("Ficheiro de áudio demasiado grande (máximo ~22 MB).");
    }

    const worker = cronometrar(() =>
      chamarWorker("/api/transcrever", {
        audioBase64: data.audioBase64,
        format: data.format,
        ...(data.pistas ? { pistas: data.pistas } : {}),
      }),
    );

    const gateway = cronometrar(async () => {
      const apiKey = chaveGateway();
      const bytes = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
      const form = new FormData();
      form.append("model", "openai/gpt-4o-mini-transcribe");
      form.append(
        "file",
        new Blob([bytes], { type: mimeFor[data.format] ?? "audio/webm" }),
        `gravacao.${data.format}`,
      );
      form.append("language", "pt");
      form.append(
        "prompt",
        data.pistas
          ? `${VOCABULARIO}\n\nVocabulário pessoal do médico (pistas de grafia; não acrescentar ao ditado): ${data.pistas}`
          : VOCABULARIO,
      );
      const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      if (!response.ok) throw new Error(await gatewayError(response));
      const json = (await response.json()) as { text?: string };
      return (json.text ?? "").trim();
    });

    const [w, g] = await Promise.all([worker, gateway]);
    return { worker: w, gateway: g };
  });

export const compararOtimizacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ texto: z.string().min(1).max(200_000) }).parse(data),
  )
  .handler(async ({ data }): Promise<ResultadoComparacao> => {
    const worker = cronometrar(() => chamarWorker("/api/otimizar", { texto: data.texto }));

    const gateway = cronometrar(async () => {
      const apiKey = chaveGateway();
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: PROMPT_OTIMIZACAO },
            { role: "user", content: data.texto },
          ],
        }),
      });
      if (!response.ok) throw new Error(await gatewayError(response));
      const json = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return (json.choices?.[0]?.message?.content ?? "").trim();
    });

    const [w, g] = await Promise.all([worker, gateway]);
    return { worker: w, gateway: g };
  });
