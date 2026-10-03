import { Headphones, HelpCircle, Radio } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { LISTA_COMANDOS, type SugestaoComando } from "@/lib/comandos-voz";

type Props = {
  activo: boolean;
  suportado: boolean;
  aEscutar: boolean;
  ultima: string;
  pendente: string | null;
  onAlternar: (activo: boolean) => void;
  ajudaAberta: boolean;
  onAjudaChange: (aberta: boolean) => void;
  /** Gravação de ditado em curso. */
  aGravar?: boolean;
  /** Escuta de comandos suspensa (parar só pelo botão). */
  vozSuspensa?: boolean;
  /** Pergunta actual do modo guiado do resumo técnico. */
  perguntaResumo?: string | null;
  /** Sugestões quando um comando não é reconhecido. */
  sugestoes?: SugestaoComando[];
  /** Chamado quando o utilizador escolhe uma sugestão. */
  onSugestao?: (comando: SugestaoComando["comando"]) => void;
};


export function BarraComandosVoz({
  activo,
  suportado,
  aEscutar,
  ultima,
  pendente,
  onAlternar,
  ajudaAberta,
  onAjudaChange,
  aGravar = false,
  vozSuspensa = false,
  perguntaResumo = null,
  sugestoes = [],
  onSugestao,
}: Props) {

  const [expandida] = useState(true);

  return (
    <section className="panel space-y-4 p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-clinical/20 text-clinical">
          <Headphones className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-foreground">
            Modo mãos livres
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Diga <strong>&quot;App&quot;</strong> seguido do comando — por
            exemplo, &quot;App, iniciar gravação&quot;. (&quot;DermaVoz&quot;
            também continua a funcionar.)
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant={activo ? "destructive" : "default"}
          className="shrink-0 gap-2"
          disabled={!suportado}
          onClick={() => onAlternar(!activo)}
        >
          <Radio className="size-4" />
          {activo ? "Desligar" : "Ligar"}
        </Button>
      </div>

      {!suportado && (
        <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
          Este navegador não suporta comandos por voz. Use o Microsoft Edge ou o
          Google Chrome — a app continua a funcionar normalmente com o rato.
        </p>
      )}

      {suportado && expandida && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span
              className={`inline-block size-2 rounded-full ${
                aGravar
                  ? "animate-pulse bg-destructive"
                  : aEscutar
                    ? "animate-pulse bg-clinical"
                    : "bg-border"
              }`}
            />
            {aGravar
              ? vozSuspensa || !aEscutar
                ? "A gravar — escuta indisponível: use o botão Parar Gravação ou a tecla Esc"
                : 'A gravar — diga "parar" (ou "App, parar", ou Esc)'
              : activo
                ? aEscutar
                  ? "À escuta de comandos"
                  : "A retomar a escuta…"
                : "Comandos desligados"}
          </div>

          {perguntaResumo && (
            <p className="rounded-md border border-clinical/40 bg-clinical/10 px-3 py-2 text-sm text-foreground">
              Resumo técnico — {perguntaResumo} Diga{" "}
              <strong>&quot;saltar&quot;</strong>,{" "}
              <strong>&quot;voltar&quot;</strong> ou{" "}
              <strong>&quot;sair&quot;</strong>.
            </p>
          )}

          {activo && !aGravar && !perguntaResumo && ultima && (
            <p className="truncate rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
              Ouvido: {ultima}
            </p>
          )}

          {sugestoes.length > 0 && (
            <div className="rounded-md border border-clinical/40 bg-clinical/10 p-3 space-y-2">
              <p className="text-sm text-foreground">
                Não percebi bem. Queria dizer…
              </p>
              <div className="flex flex-wrap gap-2">
                {sugestoes.map((s, i) => (
                  <Button
                    key={`${s.frase}-${i}`}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onSugestao?.(s.comando)}
                  >
                    {s.frase}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Diga <strong>&quot;App, repetir&quot;</strong> para tentar de novo,
                ou <strong>&quot;App, ajuda&quot;</strong> para ver todos os comandos.
              </p>
            </div>
          )}

          {pendente && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground">
              {pendente} — diga <strong>&quot;App, confirmar&quot;</strong> ou{" "}
              <strong>&quot;App, cancelar&quot;</strong>.
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onAjudaChange(!ajudaAberta)}
          >
            <HelpCircle className="size-4" />
            {ajudaAberta ? "Ocultar comandos" : "Ver comandos"}
          </Button>

          {ajudaAberta && (
            <ul className="space-y-1 rounded-md border border-border bg-secondary/40 p-3 text-xs">
              {LISTA_COMANDOS.map((c) => (
                <li key={c.dizer} className="flex flex-col">
                  <span className="font-medium text-foreground">{c.dizer}</span>
                  <span className="text-muted-foreground">{c.faz}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
