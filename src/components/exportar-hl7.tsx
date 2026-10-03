import { useMemo, useState } from "react";
import { Network, Download, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Amostra } from "@/lib/amostras";
import { gerarBundleFhir, gerarORU, nomeFicheiroHL7 } from "@/lib/hl7";
import { enviarHL7 } from "@/lib/hl7.functions";

type Props = {
  numeroAnalise: string;
  amostras: Amostra[];
  instituicao?: string;
  servico?: string;
  medico?: string;
};

const descarregar = (conteudo: string, nome: string, tipo: string) => {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
};

/** Pré-visualização e envio das mensagens HL7 v2 (ORU^R01) e FHIR R4. */
export function ExportarHL7({
  numeroAnalise,
  amostras,
  instituicao,
  servico,
  medico,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [aEnviar, setAEnviar] = useState<"hl7v2" | "fhir" | null>(null);
  const enviar = useServerFn(enviarHL7);

  const usaveis = useMemo(
    () => amostras.filter((a) => a.texto.trim()),
    [amostras],
  );

  const { oru, fhir } = useMemo(() => {
    if (!aberto || usaveis.length === 0) return { oru: "", fhir: "" };

    const dados = {
      numeroAnalise,
      amostras: usaveis,
      ...(instituicao ? { instituicao } : {}),
      ...(servico ? { servico } : {}),
      ...(medico ? { medico } : {}),
    };

    return {
      oru: gerarORU(dados),
      fhir: JSON.stringify(gerarBundleFhir(dados), null, 2),
    };
  }, [aberto, numeroAnalise, usaveis, instituicao, servico, medico]);

  const enviarPara = async (formato: "hl7v2" | "fhir") => {
    setAEnviar(formato);
    try {
      const r = await enviar({
        data: {
          formato,
          conteudo: formato === "fhir" ? fhir : oru,
          numeroAnalise: numeroAnalise.trim(),
        },
      });

      if (r.ok) {
        toast.success("Mensagem entregue ao sistema hospitalar.");
      } else {
        toast.error(r.detalhe || `Falha no envio (${r.estado}).`);
      }
    } catch {
      toast.error("Não foi possível contactar o sistema hospitalar.");
    } finally {
      setAEnviar(null);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2"
          disabled={usaveis.length === 0}
        >
          <Network className="size-4" />
          Interface HL7
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Interligação HL7</DialogTitle>
          <DialogDescription>
            Mensagem de saída do relatório {numeroAnalise.trim() || "atual"} nos
            formatos HL7 v2.5 (ORU^R01) e FHIR R4.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="hl7v2">
          <TabsList>
            <TabsTrigger value="hl7v2">HL7 v2.5 (ORU)</TabsTrigger>
            <TabsTrigger value="fhir">FHIR R4</TabsTrigger>
          </TabsList>

          <TabsContent value="hl7v2" className="space-y-3">
            <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
              {oru.replace(/\r/g, "\n")}
            </pre>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() =>
                  descarregar(
                    oru,
                    nomeFicheiroHL7(numeroAnalise, "hl7"),
                    "application/hl7-v2",
                  )
                }
              >
                <Download className="size-4" />
                Descarregar .hl7
              </Button>

              <Button
                className="gap-2"
                disabled={aEnviar !== null}
                onClick={() => void enviarPara("hl7v2")}
              >
                {aEnviar === "hl7v2" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Enviar ao hospital
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="fhir" className="space-y-3">
            <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
              {fhir}
            </pre>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() =>
                  descarregar(
                    fhir,
                    nomeFicheiroHL7(numeroAnalise, "json"),
                    "application/fhir+json",
                  )
                }
              >
                <Download className="size-4" />
                Descarregar .json
              </Button>

              <Button
                className="gap-2"
                disabled={aEnviar !== null}
                onClick={() => void enviarPara("fhir")}
              >
                {aEnviar === "fhir" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Enviar ao hospital
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground">
          O envio só funciona depois de configurados o endereço e as credenciais
          do sistema hospitalar.
        </p>
      </DialogContent>
    </Dialog>
  );
}
