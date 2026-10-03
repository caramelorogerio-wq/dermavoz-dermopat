import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ResumoTecnico } from "@/components/resumo-tecnico";
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
  /** Campo do resumo a preencher por voz, na amostra activa. */
  campoResumoActivo?: import("@/components/resumo-tecnico").CampoResumoActivo;
};

export function ListaAmostras({
  amostras,
  activaId,
  onActivar,
  onTituloChange,
  onTextoChange,
  onResumoChange,
  onAdicionar,
  onRemover,
  onMover,
  campoResumoActivo = null,
}: Props) {
  return (
    <div className="space-y-4">
      {amostras.map((amostra, indice) => {
        const activa = amostra.id === activaId;

        return (
          <section
            key={amostra.id}
            onFocus={() => onActivar(amostra.id)}
            className={`panel space-y-4 p-6 transition-colors ${
              activa
                ? "ring-2 ring-primary/40"
                : "opacity-95"
            }`}
          >
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1 space-y-2">
                <label
                  htmlFor={`titulo-${amostra.id}`}
                  className="text-sm font-medium text-foreground"
                >
                  Título da amostra {indice + 1}
                </label>

                <Input
                  id={`titulo-${amostra.id}`}
                  value={amostra.titulo}
                  onChange={(e) =>
                    onTituloChange(amostra.id, e.target.value)
                  }
                  placeholder={`Amostra ${indice + 1}`}
                />
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
                onResumoChange(amostra.id, {
                  ...amostra.resumo,
                  fragmentos: v,
                })
              }
              onBlocosChange={(v) =>
                onResumoChange(amostra.id, {
                  ...amostra.resumo,
                  blocos: v,
                })
              }
              onSeccionadoChange={(v) =>
                onResumoChange(amostra.id, {
                  ...amostra.resumo,
                  seccionado: v,
                })
              }
              onInclusaoChange={(v) =>
                onResumoChange(amostra.id, {
                  ...amostra.resumo,
                  inclusao: v,
                })
              }
              onCodigoFaturacaoChange={(v) =>
                onResumoChange(amostra.id, {
                  ...amostra.resumo,
                  codigoFaturacao: v,
                })
              }
            />
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
