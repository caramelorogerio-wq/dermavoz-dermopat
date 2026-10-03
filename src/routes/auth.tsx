import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Stethoscope, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — DermaVoz" },
      {
        name: "description",
        content:
          "Inicie sessão na DermaVoz para ditar, guardar e consultar os seus relatórios clínicos em segurança.",
      },
      { property: "og:title", content: "Entrar — DermaVoz" },
      {
        property: "og:description",
        content: "Acesso reservado a médicos: cada conta vê apenas os seus próprios relatórios.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [modo, setModo] = useState<"entrar" | "registar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [aCarregar, setACarregar] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setACarregar(true);
    try {
      if (modo === "registar") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { nome },
          },
        });
        if (error) throw error;
        toast.success("Conta criada. Já pode entrar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await router.invalidate();
        navigate({ to: "/app" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível autenticar.");
    } finally {
      setACarregar(false);
    }
  };

  const entrarGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Falha ao entrar com Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/app" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Stethoscope className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-foreground">DermaVoz</h1>
            <p className="text-sm text-muted-foreground">Área reservada a médicos</p>
          </div>
        </div>

        <form onSubmit={submeter} className="panel space-y-4 p-6">
          <h2 className="text-lg font-semibold text-foreground">
            {modo === "entrar" ? "Iniciar sessão" : "Criar conta"}
          </h2>

          {modo === "registar" && (
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Dr.(a) …"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Palavra-passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <Button type="submit" className="w-full gap-2" disabled={aCarregar}>
            {aCarregar && <Loader2 className="size-4 animate-spin" />}
            {modo === "entrar" ? "Entrar" : "Registar"}
          </Button>

          <div className="relative py-1 text-center text-xs text-muted-foreground">ou</div>

          <Button type="button" variant="outline" className="w-full" onClick={entrarGoogle}>
            Continuar com Google
          </Button>

          <button
            type="button"
            className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setModo(modo === "entrar" ? "registar" : "entrar")}
          >
            {modo === "entrar" ? "Não tem conta? Registe-se" : "Já tem conta? Iniciar sessão"}
          </button>
        </form>
      </div>
    </div>
  );
}
