import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEMPLATES, type TemplateDocx } from "@/lib/relatorio-docx";

type Props = {
  template: TemplateDocx;
  instituicao: string;
  servico: string;
  onTemplateChange: (v: TemplateDocx) => void;
  onInstituicaoChange: (v: string) => void;
  onServicoChange: (v: string) => void;
};

export function ModeloDocumento({
  template,
  instituicao,
  servico,
  onTemplateChange,
  onInstituicaoChange,
  onServicoChange,
}: Props) {
  const activo = TEMPLATES.find((t) => t.valor === template);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Modelo do documento Word</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="modelo-docx">Modelo</Label>

          <Select
            value={template}
            onValueChange={(v) => onTemplateChange(v as TemplateDocx)}
          >
            <SelectTrigger id="modelo-docx">
              <SelectValue placeholder="Escolher modelo" />
            </SelectTrigger>

            <SelectContent>
              {TEMPLATES.map((t) => (
                <SelectItem key={t.valor} value={t.valor}>
                  {t.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activo ? (
            <p className="text-xs text-muted-foreground">{activo.descricao}</p>
          ) : null}
        </div>

        {template !== "simples" ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="instituicao">Instituição</Label>
              <Input
                id="instituicao"
                value={instituicao}
                onChange={(e) => onInstituicaoChange(e.target.value)}
                placeholder="Nome da clínica ou hospital"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico">Serviço</Label>
              <Input
                id="servico"
                value={servico}
                onChange={(e) => onServicoChange(e.target.value)}
                placeholder="Serviço de Dermatopatologia"
              />
            </div>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          O n.º da análise é usado como título do documento.
        </p>
      </CardContent>
    </Card>
  );
}
