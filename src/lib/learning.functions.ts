import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

import { extrairTermos, extrairCorreccoes, limitarPistas } from "./vocabulario";

export type ContextoAprendizagem = {
  activa: boolean;
  pistas: string;
  correccoes: Array<{ de: string; para: string }>;
  exemplos: string[];
};

export const getVocabularioPessoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ContextoAprendizagem> => {
    const { supabase, userId } = context;

    const [medico, relatorios, termos] = await Promise.all([
      supabase.from("medicos").select("aprendizagem_activa").eq("id", userId).maybeSingle(),
      supabase
        .from("relatorios_transcritos")
        .select("texto")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("termos_aprendidos")
        .select("termo, correcao_de")
        .eq("activo", true)
        .order("ocorrencias", { ascending: false })
        .limit(120),
    ]);

    const activa = medico.data?.aprendizagem_activa !== false;
    if (!activa) return { activa: false, pistas: "", correccoes: [], exemplos: [] };

    const textos = (relatorios.data ?? []).map((r) => r.texto).filter(Boolean);
    const aprendidos = termos.data ?? [];

    const correccoes = aprendidos
      .filter((t) => t.correcao_de)
      .map((t) => ({ de: t.correcao_de as string, para: t.termo }));

    const manuais = aprendidos.filter((t) => !t.correcao_de).map((t) => t.termo);
    const pistas = limitarPistas([
      ...manuais,
      ...correccoes.map((c) => c.para),
      ...extrairTermos(textos),
    ]);

    return {
      activa: true,
      pistas,
      correccoes: correccoes.slice(0, 40),
      exemplos: textos.slice(0, 3).map((t) => t.slice(0, 1200)),
    };
  });

export const registarCorreccoes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ antes: z.string(), depois: z.string() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.antes.trim() || data.antes === data.depois) return { registados: 0 };

    const medico = await supabase
      .from("medicos")
      .select("aprendizagem_activa")
      .eq("id", userId)
      .maybeSingle();
    if (medico.data?.aprendizagem_activa === false) return { registados: 0 };

    const pares = extrairCorreccoes(data.antes, data.depois);
    if (pares.length === 0) return { registados: 0 };

    let registados = 0;
    for (const par of pares) {
      const existente = await supabase
        .from("termos_aprendidos")
        .select("id, ocorrencias")
        .eq("medico_id", userId)
        .ilike("termo", par.para)
        .ilike("correcao_de", par.de)
        .maybeSingle();

      if (existente.data) {
        await supabase
          .from("termos_aprendidos")
          .update({ ocorrencias: existente.data.ocorrencias + 1 })
          .eq("id", existente.data.id);
      } else {
        await supabase.from("termos_aprendidos").insert({
          medico_id: userId,
          termo: par.para,
          correcao_de: par.de,
          origem: "automatico",
        });
      }
      registados += 1;
    }

    return { registados };
  });
