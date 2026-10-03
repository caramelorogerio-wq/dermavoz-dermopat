import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { mimeFor, VOCABULARIO, gatewayError } from "@/lib/ai-clinico";

const bodySchema = z.object({
  audioBase64: z.string().min(10),
  format: z.enum(["wav", "mp3", "webm", "m4a", "ogg", "aac", "flac"]),
});

const MAX_BASE64 = 30 * 1024 * 1024; // ~22 MB de áudio

export const Route = createFileRoute("/api/transcrever")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Autenticação: exige um token de sessão válido; a API key nunca sai do servidor.
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim()
          : "";
        if (!token) {
          return Response.json({ error: "Não autenticado." }, { status: 401 });
        }

        const supabaseUrl = process.env["SUPABASE_URL"];
        const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!supabaseUrl || !publishableKey) {
          return Response.json({ error: "Serviço indisponível." }, { status: 500 });
        }

        // New Supabase API keys (sb_publishable_/sb_secret_) are opaque strings,
        // not JWT bearer tokens — send them only as apikey, never as Bearer.
        const isNewKey =
          publishableKey.startsWith("sb_publishable_") ||
          publishableKey.startsWith("sb_secret_");

        const supabase = createClient(supabaseUrl, publishableKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              if (isNewKey && headers.get("Authorization") === `Bearer ${publishableKey}`) {
                headers.delete("Authorization");
              }
              headers.set("apikey", publishableKey);
              return fetch(input, { ...init, headers });
            },
            headers: { Authorization: `Bearer ${token}` },
          },
        });

        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
        if (claimsError || !claimsData?.claims?.sub) {
          return Response.json({ error: "Sessão inválida." }, { status: 401 });
        }

        let parsed;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return Response.json({ error: "Pedido inválido." }, { status: 400 });
        }

        if (parsed.audioBase64.length > MAX_BASE64) {
          return Response.json({ error: "Ficheiro de áudio demasiado grande." }, { status: 413 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return Response.json(
            { error: "O serviço de transcrição não está configurado." },
            { status: 500 },
          );
        }

        let bytes: Uint8Array<ArrayBuffer>;
        try {
          bytes = Uint8Array.from(atob(parsed.audioBase64), (c) => c.charCodeAt(0));
        } catch {
          return Response.json({ error: "Áudio inválido." }, { status: 400 });
        }

        const form = new FormData();
        form.append("model", "openai/gpt-4o-mini-transcribe");
        form.append(
          "file",
          new Blob([bytes], { type: mimeFor[parsed.format] ?? "audio/webm" }),
          `gravacao.${parsed.format}`,
        );
        form.append("language", "pt");
        form.append("prompt", VOCABULARIO);

        const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: form,
        });

        if (!response.ok) {
          return Response.json({ error: await gatewayError(response) }, { status: response.status });
        }

        const json = (await response.json()) as { text?: string };
        return Response.json({ text: (json.text ?? "").trim() });
      },
    },
  },
});
