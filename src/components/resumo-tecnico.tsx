import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CampoResumoActivo =
  | "fragmentos"
  | "blocos"
  | "seccionado"
  | "inclusao"
  | "codigoFaturacao"
  | null;

type Props = {
  fragmentos: number;
  blocos: number;
  seccionado: boolean;
  inclusao: "total" | "reserva";
  codigoFaturacao: "31057" | "31077";
  onFragmentosChange: (value: number) => void;
  onBlocosChange: (value: number) => void;
  onSeccionadoChange: (value: boolean) => void;
  onInclusaoChange: (value: "total" | "reserva") => void;
  onCodigoFaturacaoChange: (value: "31057" | "31077") => void;
  /** Prefixo para tornar os ids únicos quando há vários resumos na página. */
  idPrefix?: string;
  /** Versão compacta, para usar dentro do cartão de uma amostra. */
  compacto?: boolean;
  /** Campo a preencher por voz (modo guiado) — recebe realce visual. */
  campoActivo?: CampoResumoActivo;
};

export function ResumoTecnico({
  fragmentos,
  blocos,
  seccionado,
  inclusao,
  codigoFaturacao,
  onFragmentosChange,
  onBlocosChange,
  onSeccionadoChange,
  onInclusaoChange,
  onCodigoFaturacaoChange,
  idPrefix = "resumo",
  compacto = false,
  campoActivo = null,
}: Props) {
  const id = (campo: string) => `${idPrefix}-${campo}`;
  const realce = (campo: NonNullable<CampoResumoActivo>) =>
    campoActivo === campo
      ? "space-y-2 rounded-md p-2 ring-2 ring-clinical"
      : "space-y-2";

  return (
    <section
      className={
        compacto
          ? "space-y-4 rounded-md border border-border bg-secondary/40 p-4"
          : "panel space-y-5 p-6"
      }
    >
      <div>
        <h2
          className={
            compacto
              ? "text-sm font-semibold text-foreground"
              : "text-lg font-semibold text-foreground"
          }
        >
          Resumo técnico
        </h2>

        {!compacto && (
          <p className="mt-1 text-sm text-muted-foreground">
            Dados técnicos e de faturação do exame.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={realce("fragmentos")}>
          <Label htmlFor={id("fragmentos")}>
            N.º de fragmentos
          </Label>

          <Input
            id={id("fragmentos")}
            type="number"
            min="0"
            value={fragmentos}
            onChange={(e) =>
              onFragmentosChange(Number(e.target.value))
            }
          />
        </div>

        <div className={realce("blocos")}>
          <Label htmlFor={id("blocos")}>N.º de blocos</Label>

          <Input
            id={id("blocos")}
            type="number"
            min="0"
            value={blocos}
            onChange={(e) =>
              onBlocosChange(Number(e.target.value))
            }
          />
        </div>
      </div>

      <div className={realce("seccionado")}>
        <Label>Fragmento</Label>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={id("seccionado")}
              checked={seccionado}
              onChange={() => onSeccionadoChange(true)}
            />
            Seccionado
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={id("seccionado")}
              checked={!seccionado}
              onChange={() => onSeccionadoChange(false)}
            />
            Não seccionado
          </label>
        </div>
      </div>

      <div className={realce("inclusao")}>
        <Label>Inclusão</Label>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={id("inclusao")}
              checked={inclusao === "total"}
              onChange={() => onInclusaoChange("total")}
            />
            Total
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={id("inclusao")}
              checked={inclusao === "reserva"}
              onChange={() => onInclusaoChange("reserva")}
            />
            Com reserva
          </label>
        </div>
      </div>

      <div className={realce("codigoFaturacao")}>
        <Label htmlFor={id("codigo-faturacao")}>
          Código de faturação
        </Label>

        <select
          id={id("codigo-faturacao")}
          value={codigoFaturacao}
          onChange={(e) =>
            onCodigoFaturacaoChange(
              e.target.value as "31057" | "31077",
            )
          }
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="31057">31057</option>

          <option value="31077">31077</option>
        </select>
      </div>
    </section>
  );
}
