import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/limpar-relatorios")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["CRON_SECRET"];
        const provided = request.headers.get("authorization")?.replace("Bearer ", "").trim();

        if (!expected || !provided || provided !== expected) {
          return new Response("Não autorizado", { status: 401 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const { error } = await supabaseAdmin.rpc(
          "apagar_relatorios_expirados" as never,
        );

        if (error) {
          console.error("[limpar-relatorios]", error);
          return new Response(
            JSON.stringify({ ok: false, error: error.message }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
