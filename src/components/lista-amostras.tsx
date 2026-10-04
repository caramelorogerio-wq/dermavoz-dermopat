import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Amostra } from "@/lib/amostras";
import { contarPalavras } from "@/lib/amostras";

type Props = {
  amostras: Amostra[];
  activaId: string | null;
  onActivar: (id: string) => void;
  onTituloChange: (id: string, titulo: string) => void;
  onTextoChange: (id: string, texto: string) => void;
  onAdicionar: () => void;
  onRemover: (id: string) => void;
  onMover: (id: string, direccao: -1 | 1) => void;
};

export function ListaAmostras({
  amostras,
  activaId,
  onActivar,
  onTituloChange,
  onTextoChange,
  onAdicionar,
  onRemover,
  onMover,
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
