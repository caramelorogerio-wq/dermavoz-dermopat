import { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ResumoTecnico,
  type CampoResumoActivo,
} from "@/components/resumo-tecnico";
import type { Amostra, ResumoAmostra } from "@/lib/amostras";
import { contarPalavras } from "@/lib/amostras";

type Props = {
  amostras: Amostra[];
  activaId: string | null;
  onActivar: (id: string) => void;
  onTituloChange: (id: string, titulo: string) => void;
  onTextoChange: (id: string, texto: string) => void;
  onResumoChange: (id: string, resumo: ResumoAmostra) => void;
  onAdicionar: () => void;
  onRemover: (id: string) => void;
  onMover: (id: string, direccao: -1 | 1) => void;
  campoResumoActivo?: CampoResumoActivo;
  numeroAnalise?: string;
  onNumeroAnaliseChange?: (valor: string) => void;
};

export function ListaAmostras({
  amostras,
  activaId,
  onActivar,
  onTituloChange,
  numeroAnalise,
  onNumeroAnaliseChange,
  onTextoChange,
  onResumoChange,
  onAdicionar,
  onRemover,
  onMover,
  campoResumoActivo = null,
}: Props) {
  const seccoes = useRef(new Map<string, HTMLElement>());
  const activa = amostras.find((a) => a.id === activaId);
  const textoActivo = activa?.texto.length ?? 0;

  // Mantém no monitor a amostra em trabalho (ao mudar de amostra ou ao
  // receber texto ditado), sem roubar o foco ao campo que está a ser editado.
  useEffect(() => {
    if (!activaId) return;
    const el = seccoes.current.get(activaId);
    if (!el) return;
    const ta = el.querySelector("textarea");
    if (ta && document.activeElement !== ta) ta.scrollTop = ta.scrollHeight;
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.6) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activaId, textoActivo]);

  // Resumo técnico guiado: mostra o campo a ser preenchido.
  useEffect(() => {
    if (!campoResumoActivo || !activaId) return;
    const el = seccoes.current.get(activaId);
    el?.querySelector("[data-resumo]")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [campoResumoActivo, activaId]);

  return (
    <div className="space-y-4">
      {amostras.map((amostra, indice) => {
        const activa = amostra.id === activaId;

        return (
          <section
            key={amostra.id}
            ref={(el) => {
              if (el) seccoes.current.set(amostra.id, el);
              else seccoes.current.delete(amostra.id);
            }}
            onFocus={() => onActivar(amostra.id)}
            className={`panel space-y-4 p-6 transition-colors ${
              activa
                ? "scroll-mt-6 ring-2 ring-primary"
                : "opacity-95"
            }`}
          >
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1 space-y-2">
                <label
                  htmlFor={`titulo-${amostra.id}`}
                  className="text-sm font-medium text-foreground"
                >
                  {indice === 0 && onNumeroAnaliseChange
                    ? "Número da análise"
                    : `Título da amostra ${indice + 1}`}
                </label>

                {indice === 0 && onNumeroAnaliseChange ? (
                  <Input
                    id={`titulo-${amostra.id}`}
                    value={numeroAnalise ?? ""}
                    onChange={(e) => onNumeroAnaliseChange(e.target.value)}
                    placeholder="Ex.: DMP 3457"
                  />
                ) : (
                  <Input
                    id={`titulo-${amostra.id}`}
                    value={amostra.titulo}
                    onChange={(e) =>
                      onTituloChange(amostra.id, e.target.value)
                    }
                    placeholder={`Amostra ${indice + 1}`}
                  />
                )}
              </div>

              <div className="flex items-center gap-1">
                <span className="mr-2 text-xs text-muted-foreground">
                  {contarPalavras(amostra.texto)} palavras
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Mover para cima"
                  disabled={indice === 0}
                  onClick={() => onMover(amostra.id, -1)}
                >
                  <ChevronUp className="size-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Mover para baixo"
                  disabled={indice === amostras.length - 1}
                  onClick={() => onMover(amostra.id, 1)}
                >
                  <ChevronDown className="size-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover amostra"
                  disabled={amostras.length === 1}
                  onClick={() => onRemover(amostra.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <Textarea
              value={amostra.texto}
              onChange={(e) =>
                onTextoChange(amostra.id, e.target.value)
              }
              onFocus={() => onActivar(amostra.id)}
              placeholder="O texto transcrito desta amostra aparecerá aqui."
              className="min-h-[220px] resize-none text-sm leading-relaxed"
            />

            <div data-resumo>
            <ResumoTecnico
              idPrefix={amostra.id}
              compacto
              campoActivo={activa ? campoResumoActivo : null}
              fragmentos={amostra.resumo.fragmentos}
              blocos={amostra.resumo.blocos}
              seccionado={amostra.resumo.seccionado}
              inclusao={amostra.resumo.inclusao}
              codigoFaturacao={amostra.resumo.codigoFaturacao}
              onFragmentosChange={(v) =>
                onResumoChange(amostra.id, { ...amostra.resumo, fragmentos: v })
              }
              onBlocosChange={(v) =>
                onResumoChange(amostra.id, { ...amostra.resumo, blocos: v })
              }
              onSeccionadoChange={(v) =>
                onResumoChange(amostra.id, { ...amostra.resumo, seccionado: v })
              }
              onInclusaoChange={(v) =>
                onResumoChange(amostra.id, { ...amostra.resumo, inclusao: v })
              }
              onCodigoFaturacaoChange={(v) =>
                onResumoChange(amostra.id, {
                  ...amostra.resumo,
                  codigoFaturacao: v,
                })
              }
            />
            </div>
          </section>
        );
      })}

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={onAdicionar}
      >
        <Plus className="size-4" />
        Adicionar amostra
      </Button>
    </div>
  );
}
