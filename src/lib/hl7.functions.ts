import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const esquema = z.object({
  formato: z.enum(["hl7v2", "fhir"]),
  conteudo: z.string().min(1).max(500_000),
  numeroAnalise: z.string().max(120).default(""),
});

/**
 * Envia a mensagem HL7 já gerada para o sistema hospitalar por HTTPS.
 * O destino e as credenciais vivem em segredos do servidor:
 * HL7_ENDPOINT_URL (v2), FHIR_ENDPOINT_URL (FHIR) e HL7_AUTH_TOKEN.
 */
export const enviarHL7 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => esquema.parse(d))
  .handler(async ({ data }) => {
    const destino =
      data.formato === "fhir"
        ? process.env["FHIR_ENDPOINT_URL"]
        : process.env["HL7_ENDPOINT_URL"];

    if (!destino) {
      return {
        ok: false as const,
        estado: 0,
        detalhe:
          "Ainda não há endpoint hospitalar configurado para este formato.",
      };
    }

    const token = process.env["HL7_AUTH_TOKEN"];

    const resposta = await fetch(destino, {
      method: "POST",
      headers: {
        "Content-Type":
          data.formato === "fhir"
            ? "application/fhir+json"
            : "application/hl7-v2",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data.numeroAnalise
          ? { "X-Numero-Analise": data.numeroAnalise }
          : {}),
      },
      body: data.conteudo,
    });

    const detalhe = (await resposta.text()).slice(0, 2000);

    if (!resposta.ok) {
      console.error(
        `Envio HL7 falhou [${resposta.status}]: ${detalhe}`,
      );
    }

    return { ok: resposta.ok, estado: resposta.status, detalhe };
  });
