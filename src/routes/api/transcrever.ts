import { createFileRoute } from "@tanstack/react-router";

// The former endpoint sent audio to Lovable AI Gateway. Keep the URL reserved
// during migration, but fail closed so clinical content is never forwarded there.
export const Route = createFileRoute("/api/transcrever")({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          { error: "Endpoint desativado. Use a transcrição pelo Worker." },
          { status: 410 },
        ),
    },
  },
});
