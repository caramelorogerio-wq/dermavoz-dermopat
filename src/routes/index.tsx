import { createFileRoute, Link } from "@tanstack/react-router";
import { Mic, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DermaVoz — Ditado clínico e transcrição em pt-PT" },
      {
        name: "description",
        content:
          "Grave a voz, obtenha a transcrição em português europeu com terminologia dermatopatológica e otimize o relatório com IA. Cada médico vê apenas os seus dados.",
      },
      { property: "og:title", content: "DermaVoz — Ditado clínico em português europeu" },
      {
        property: "og:description",
        content:
          "Transcrição de voz para texto com vocabulário de dermatopatologia, revisão automática por IA e arquivo privado por médico.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-primary">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <span className="flex size-10 items-center justify-center rounded-md bg-clinical text-clinical-foreground">
            <Mic className="size-5" />
          </span>
          <h1 className="text-xl font-semibold text-primary-foreground">DermaVoz</h1>
          <Link to="/auth" className="ml-auto">
            <Button variant="secondary" size="sm">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <h2 className="max-w-2xl text-3xl font-semibold text-foreground sm:text-4xl">
          Da voz ao texto clínico, em português europeu.
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Dite o exame, obtenha a transcrição com terminologia dermatopatológica correcta e exporte
          o texto. Os relatórios ficam guardados em privado na conta de cada médico.
        </p>

        <div className="mt-8">
          <Link to="/auth">
            <Button size="lg" className="gap-2">
              <Mic className="size-5" />
              Começar a ditar
            </Button>
          </Link>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          <article className="panel p-5">
            <Mic className="size-5 text-primary" />
            <h3 className="mt-3 font-semibold text-foreground">Ditado fiel</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Reconhecimento de voz orientado por vocabulário de dermatopatologia.
            </p>
          </article>
          <article className="panel p-5">
            <Sparkles className="size-5 text-primary" />
            <h3 className="mt-3 font-semibold text-foreground">Otimização com IA</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Corrige pontuação e jargão para o português padrão de Portugal.
            </p>
          </article>
          <article className="panel p-5">
            <ShieldCheck className="size-5 text-primary" />
            <h3 className="mt-3 font-semibold text-foreground">Dados privados</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Cada conta acede apenas aos seus doentes e relatórios.
            </p>
          </article>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Reveja sempre a transcrição antes de validar clinicamente.
      </footer>
    </div>
  );
}
