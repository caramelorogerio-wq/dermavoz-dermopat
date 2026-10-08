import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Copy, Download, Plus, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  compararTranscricao,
  compararOtimizacao,
  type ResultadoComparacao,
  type ResultadoLado,
} from "@/lib/comparar.functions";

export const Route = createFileRoute("/_authenticated/comparar")({
  head: () => ({ meta: [{ title: "Comparar — DermOpat Macroscopia" }] }),
  component: CompararPage,
});

const FORMATOS = ["wav", "mp3", "webm", "m4a", "ogg", "aac", "flac"] as const;
type Formato = (typeof FORMATOS)[number];
const MAX_BASE64 = 30 * 1024 * 1024;

const CONTADORES = [
  { chave: "termos", rotulo: "Termos técnicos" },
  { chave: "numeros", rotulo: "Números/medidas" },
  { chave: "lateralidade", rotulo: "Lateralidade" },
  { chave: "grafia", rotulo: "Grafia brasileira" },
] as const;
type ChaveContador = (typeof CONTADORES)[number]["chave"];

type Lado = Record<ChaveContador, number> & { ms: number | null };
type Linha = { id: string; nome: string; w: Lado; g: Lado; notas: string };

const ladoVazio = (ms: number | null = null): Lado => ({
  termos: 0,
  numeros: 0,
  lateralidade: 0,
  grafia: 0,
  ms,
});

const CHAVE_STORAGE = "comparar-registo-v1";

function novoId() {
  return Math.random().toString(36).slice(2);
}

function formatoDe(nome: string): Formato | null {
  const ext = nome.split(".").pop()?.toLowerCase() ?? "";
  return (FORMATOS as readonly string[]).includes(ext) ? (ext as Formato) : null;
}

function lerBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = String(reader.result);
      resolve(r.slice(r.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o ficheiro."));
    reader.readAsDataURL(file);
  });
}

// Diff simples palavra a palavra (LCS). Devolve, para cada lado, os índices de
// palavras que não existem no outro.
function diferencas(a: string, b: string) {
  const pa = a.split(/\s+/).filter(Boolean);
  const pb = b.split(/\s+/).filter(Boolean);
  const difA = new Set<number>(pa.map((_, i) => i));
  const difB = new Set<number>(pb.map((_, i) => i));
  if (pa.length * pb.length <= 4_000_000) {
    const n = pa.length;
    const m = pb.length;
    const t: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        t[i]![j] = pa[i] === pb[j] ? t[i + 1]![j + 1]! + 1 : Math.max(t[i + 1]![j]!, t[i]![j + 1]!);
      }
    }
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (pa[i] === pb[j]) {
        difA.delete(i);
        difB.delete(j);
        i++;
        j++;
      } else if (t[i + 1]![j]! >= t[i]![j + 1]!) i++;
      else j++;
    }
  }
  return { pa, pb, difA, difB };
}

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success("Copiado.");
  } catch {
    toast.error("Não foi possível copiar.");
  }
}

function Coluna({
  titulo,
  res,
  palavras,
  dif,
}: {
  titulo: string;
  res: ResultadoLado;
  palavras: string[];
  dif: Set<number>;
}) {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-sm">{titulo}</h3>
        <span className="text-xs text-muted-foreground">{res.ms} ms</span>
      </div>
      {res.error ? (
        <p className="text-sm text-destructive">{res.error}</p>
      ) : (
        <>
          <p className="text-sm whitespace-pre-wrap">
            {palavras.length === 0 && <span className="text-muted-foreground">(vazio)</span>}
            {palavras.map((p, i) => (
              <span key={i} className={dif.has(i) ? "bg-yellow-200 dark:bg-yellow-800/60" : ""}>
                {p}{" "}
              </span>
            ))}
          </p>
          <Button size="sm" variant="outline" onClick={() => copiar(res.text ?? "")}>
            <Copy className="h-3 w-3 mr-1" /> Copiar
          </Button>
        </>
      )}
    </div>
  );
}

function ParColunas({ res }: { res: ResultadoComparacao }) {
  const d = diferencas(res.worker.text ?? "", res.gateway.text ?? "");
  const ambos = res.worker.text !== null && res.gateway.text !== null;
  const vazio = new Set<number>();
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Coluna
        titulo="Worker Cloudflare"
        res={res.worker}
        palavras={d.pa}
        dif={ambos ? d.difA : vazio}
      />
      <Coluna
        titulo="Gateway (gpt-4o-mini-transcribe)"
        res={res.gateway}
        palavras={d.pb}
        dif={ambos ? d.difB : vazio}
      />
    </div>
  );
}

function totalLado(l: Lado) {
  return CONTADORES.reduce((s, c) => s + l[c.chave], 0);
}

function csvCelula(v: string | number | null) {
  const s = v === null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function CompararPage() {
  const transcrever = useServerFn(compararTranscricao);
  const otimizar = useServerFn(compararOtimizacao);

  const [ficheiro, setFicheiro] = useState<File | null>(null);
  const [pistas, setPistas] = useState("");
  const [aTranscrever, setATranscrever] = useState(false);
  const [resTrans, setResTrans] = useState<ResultadoComparacao | null>(null);

  const [texto, setTexto] = useState("");
  const [aOtimizar, setAOtimizar] = useState(false);
  const [resOtim, setResOtim] = useState<ResultadoComparacao | null>(null);
  const [nota, setNota] = useState("");

  const [linhas, setLinhas] = useState<Linha[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.sessionStorage.getItem(CHAVE_STORAGE);
      return raw ? (JSON.parse(raw) as Linha[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(CHAVE_STORAGE, JSON.stringify(linhas));
    } catch {
      /* ignorar */
    }
  }, [linhas]);

  const adicionarLinha = (nome: string, wMs: number | null = null, gMs: number | null = null) =>
    setLinhas((ls) => [
      ...ls,
      {
        id: novoId(),
        nome: nome || `Texto ${ls.length + 1}`,
        w: ladoVazio(wMs),
        g: ladoVazio(gMs),
        notas: "",
      },
    ]);

  const atualizar = (id: string, fn: (l: Linha) => Linha) =>
    setLinhas((ls) => ls.map((l) => (l.id === id ? fn(l) : l)));

  async function compararAudio() {
    if (!ficheiro) return;
    const format = formatoDe(ficheiro.name);
    if (!format) {
      toast.error("Formato não suportado. Use wav, mp3, webm, m4a, ogg, aac ou flac.");
      return;
    }
    setATranscrever(true);
    setResTrans(null);
    try {
      const audioBase64 = await lerBase64(ficheiro);
      if (audioBase64.length > MAX_BASE64) {
        toast.error("Ficheiro de áudio demasiado grande (máximo ~22 MB).");
        return;
      }
      const r = await transcrever({
        data: { audioBase64, format, ...(pistas.trim() ? { pistas: pistas.trim() } : {}) },
      });
      setResTrans(r);
      adicionarLinha(ficheiro.name, r.worker.ms, r.gateway.ms);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha na comparação.");
    } finally {
      setATranscrever(false);
    }
  }

  async function compararTexto() {
    if (!texto.trim()) return;
    setAOtimizar(true);
    setResOtim(null);
    try {
      const r = await otimizar({ data: { texto } });
      setResOtim(r);
      adicionarLinha("", r.worker.ms, r.gateway.ms);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha na comparação.");
    } finally {
      setAOtimizar(false);
    }
  }

  const totais = useMemo(() => {
    const soma = (lado: "w" | "g") =>
      CONTADORES.reduce(
        (acc, c) => ({ ...acc, [c.chave]: linhas.reduce((s, l) => s + l[lado][c.chave], 0) }),
        {} as Record<ChaveContador, number>,
      );
    const w = soma("w");
    const g = soma("g");
    const tw = Object.values(w).reduce((a, b) => a + b, 0);
    const tg = Object.values(g).reduce((a, b) => a + b, 0);
    return { w, g, tw, tg };
  }, [linhas]);

  function gerarCsv() {
    const cab = [
      "Ditado",
      ...["Worker", "Gateway"].flatMap((lado) => [
        ...CONTADORES.map((c) => `${c.rotulo} (${lado})`),
        `Total erros (${lado})`,
        `Tempo ms (${lado})`,
      ]),
      "Notas",
    ];
    const corpo = linhas.map((l) => [
      l.nome,
      ...[l.w, l.g].flatMap((x) => [...CONTADORES.map((c) => x[c.chave]), totalLado(x), x.ms]),
      l.notas,
    ]);
    const tot = [
      "Totais",
      ...[totais.w, totais.g].flatMap((x, i) => [
        ...CONTADORES.map((c) => x[c.chave]),
        i === 0 ? totais.tw : totais.tg,
        "",
      ]),
      "",
    ];
    return [cab, ...corpo, tot].map((r) => r.map(csvCelula).join(",")).join("\r\n");
  }

  function descarregarCsv() {
    const blob = new Blob(["﻿" + gerarCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "comparacao-workers-ai.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const menor = totais.tw === totais.tg ? null : totais.tw < totais.tg ? "w" : "g";
  const destaque = "bg-green-100 dark:bg-green-900/40";

  const numInput = (valor: number, onChange: (n: number) => void) => (
    <Input
      type="number"
      min={0}
      className="h-8 w-16 px-1"
      value={valor}
      onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
    />
  );

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Comparar Worker Cloudflare e Gateway</h1>
        <p className="flex items-center gap-2 rounded-md border border-yellow-400 bg-yellow-50 p-2 text-sm text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          Use só áudios/textos anonimizados. Nada é guardado: os resultados vivem apenas nesta
          página.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Transcrição</h2>
        <div className="space-y-2">
          <Label htmlFor="audio">Ficheiro de áudio ({FORMATOS.join(", ")})</Label>
          <Input
            id="audio"
            type="file"
            accept={FORMATOS.map((f) => `.${f}`).join(",")}
            onChange={(e) => setFicheiro(e.target.files?.[0] ?? null)}
          />
          {ficheiro && (
            <p className="text-xs text-muted-foreground">
              Tamanho do áudio: {(ficheiro.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
          <Label htmlFor="pistas">Pistas (opcional)</Label>
          <Input
            id="pistas"
            maxLength={1200}
            value={pistas}
            onChange={(e) => setPistas(e.target.value)}
          />
          <Button onClick={compararAudio} disabled={!ficheiro || aTranscrever}>
            {aTranscrever && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Comparar
          </Button>
        </div>
        {resTrans && <ParColunas res={resTrans} />}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Otimização</h2>
        <Textarea
          rows={6}
          placeholder="Cole aqui o ditado (anonimizado)…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <Button onClick={compararTexto} disabled={!texto.trim() || aOtimizar}>
          {aOtimizar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Comparar
        </Button>
        {resOtim && <ParColunas res={resOtim} />}
      </section>

      <section className="space-y-2">
        <Label htmlFor="nota">Nota livre</Label>
        <div className="flex gap-2">
          <Input id="nota" value={nota} onChange={(e) => setNota(e.target.value)} />
          <Button variant="outline" onClick={() => copiar(nota)} disabled={!nota}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Registo de erros</h2>
        <p className="text-xs text-muted-foreground">
          As linhas (nome, contadores, tempos e notas) ficam guardadas no separador do browser
          (sessionStorage) para não se perderem ao recarregar. Não são guardados áudio nem textos.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => adicionarLinha("")}>
            <Plus className="mr-1 h-3 w-3" /> Adicionar linha
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!linhas.length}
            onClick={() => copiar(gerarCsv())}
          >
            <Copy className="mr-1 h-3 w-3" /> Copiar como CSV
          </Button>
          <Button size="sm" variant="outline" disabled={!linhas.length} onClick={descarregarCsv}>
            <Download className="mr-1 h-3 w-3" /> Descarregar CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!linhas.length}
            onClick={() => setLinhas([])}
          >
            <Trash2 className="mr-1 h-3 w-3" /> Limpar tabela
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b">
                <th rowSpan={2} className="p-1 text-left">
                  Ditado
                </th>
                <th colSpan={6} className={`p-1 ${menor === "w" ? destaque : ""}`}>
                  Worker Cloudflare
                </th>
                <th colSpan={6} className={`p-1 ${menor === "g" ? destaque : ""}`}>
                  Gateway
                </th>
                <th rowSpan={2} className="p-1 text-left">
                  Notas
                </th>
                <th rowSpan={2} />
              </tr>
              <tr className="border-b">
                {[0, 1].map((k) => (
                  <Fragment key={k}>
                    {CONTADORES.map((c) => (
                      <th key={`${k}${c.chave}`} className="p-1 font-normal">
                        {c.rotulo}
                      </th>
                    ))}
                    <th key={`${k}t`} className="p-1">
                      Total
                    </th>
                    <th key={`${k}ms`} className="p-1 font-normal">
                      Tempo (ms)
                    </th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="p-1">
                    <Input
                      className="h-8 min-w-32"
                      value={l.nome}
                      onChange={(e) => atualizar(l.id, (x) => ({ ...x, nome: e.target.value }))}
                    />
                  </td>
                  {(["w", "g"] as const).map((lado) => (
                    <Fragment key={lado}>
                      {CONTADORES.map((c) => (
                        <td key={`${lado}${c.chave}`} className="p-1">
                          {numInput(l[lado][c.chave], (n) =>
                            atualizar(l.id, (x) => ({
                              ...x,
                              [lado]: { ...x[lado], [c.chave]: n },
                            })),
                          )}
                        </td>
                      ))}
                      <td key={`${lado}t`} className="p-1 text-center font-medium">
                        {totalLado(l[lado])}
                      </td>
                      <td key={`${lado}ms`} className="p-1 text-center">
                        {l[lado].ms ?? "—"}
                      </td>
                    </Fragment>
                  ))}
                  <td className="p-1">
                    <Input
                      className="h-8 min-w-32"
                      value={l.notas}
                      onChange={(e) => atualizar(l.id, (x) => ({ ...x, notas: e.target.value }))}
                    />
                  </td>
                  <td className="p-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Remover linha"
                      onClick={() => setLinhas((ls) => ls.filter((x) => x.id !== l.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            {linhas.length > 0 && (
              <tfoot>
                <tr className="font-medium">
                  <td className="p-1">Totais</td>
                  {(["w", "g"] as const).map((lado) => (
                    <Fragment key={lado}>
                      {CONTADORES.map((c) => (
                        <td
                          key={`${lado}${c.chave}`}
                          className={`p-1 text-center ${menor === lado ? destaque : ""}`}
                        >
                          {totais[lado][c.chave]}
                        </td>
                      ))}
                      <td
                        key={`${lado}t`}
                        className={`p-1 text-center ${menor === lado ? destaque : ""}`}
                      >
                        {lado === "w" ? totais.tw : totais.tg}
                      </td>
                      <td key={`${lado}ms`} />
                    </Fragment>
                  ))}
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </main>
  );
}
