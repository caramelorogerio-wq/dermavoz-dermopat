import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Deliberately opt-in: this flag is only set in the private Vercel staging
// project to allow a visual smoke test without creating a clinician account.
const stagingDemoMode = import.meta.env.VITE_STAGING_DEMO_MODE === "true";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (stagingDemoMode) {
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session?.user) {
        return { user: existing.session.user, stagingDemo: true };
      }

      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) {
        throw new Error(
          "Não foi possível iniciar a sessão de teste. Ative as sessões anónimas no Supabase.",
        );
      }

      return { user: data.user, stagingDemo: true };
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
