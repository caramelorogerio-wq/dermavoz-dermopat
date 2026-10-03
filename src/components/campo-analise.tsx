import { useEffect, useRef } from "react";
import { ScanLine, Barcode } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  valor: string;
  onChange: (valor: string) => void;
};

const limpar = (valor: string) =>
  valor.replace(/[\u0000-\u001f]/g, "").trim();

export function CampoAnalise({ valor, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <section className="panel space-y-3 p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-clinical/20 text-clinical">
          <Barcode className="size-5" />
        </span>

        <div>
          <h2 className="text-lg font-semibold text-foreground">Análise</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Leia o código de barras ou QR code com o leitor, ou escreva o
            número.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="numero-analise">N.º da análise</Label>

        <Input
          id="numero-analise"
          ref={ref}
          autoFocus
          autoComplete="off"
          inputMode="text"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();

              const limpo = limpar(e.currentTarget.value);
              onChange(limpo);

              if (limpo) {
                toast.success(`Análise ${limpo} registada.`);
              }
            }
          }}
          onPaste={(e) => {
            const colado = e.clipboardData.getData("text");

            if (/[\r\n]/.test(colado)) {
              e.preventDefault();
              onChange(limpar(colado));
            }
          }}
          placeholder="Aponte o leitor e dispare"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={() => ref.current?.focus()}
      >
        <ScanLine className="size-4" />
        Preparar leitura
      </Button>
    </section>
  );
}
