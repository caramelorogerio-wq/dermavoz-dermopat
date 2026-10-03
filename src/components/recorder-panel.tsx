import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Mic, Square, Loader2, Upload, FileAudio, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  disabled: boolean;
  onAudio: (file: Blob, format: string) => void;
  /** Notifica o estado da gravação (usado pelos comandos de voz). */
  onEstadoChange?: (aGravar: boolean) => void;
};

/** Controlo imperativo usado pelos comandos de voz. */
export type RecorderHandle = {
  /** Devolve true quando a gravação arrancou mesmo. */
  iniciar: () => Promise<boolean>;
  parar: () => boolean;
  aGravar: () => boolean;
  /** Última mensagem de erro do gravador, se existir. */
  erro: () => string | null;
};




const formatFromMime = (mime: string) => {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4") || mime.includes("m4a") || mime.includes("aac")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "mp3";
};

const pad = (n: number) => String(n).padStart(2, "0");

// Edge/Chromium e Safari suportam contentores diferentes; escolhemos o primeiro
// que o navegador declare suportar em vez de confiar no predefinido.
const escolherMimeType = () => {
  const candidatos = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
  ];
  if (typeof MediaRecorder === "undefined") return undefined;
  return candidatos.find((t) => MediaRecorder.isTypeSupported?.(t));
};

export const RecorderPanel = forwardRef<RecorderHandle, Props>(
  function RecorderPanel({ disabled, onAudio, onEstadoChange }, ref) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [ficheiro, setFicheiro] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const gravandoRef = useRef(false);
  const erroRef = useRef<string | null>(null);
  erroRef.current = erro;


  useEffect(() => {
    onEstadoChange?.(recording);
  }, [recording, onEstadoChange]);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);


  const iniciar = async (): Promise<boolean> => {
    setErro(null);

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setErro("A gravação exige uma ligação segura (https).");
      return false;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setErro("Este navegador não suporta gravação de áudio. Use o Edge, Chrome ou Safari actualizado.");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = escolherMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onerror = () => {
        stream.getTracks().forEach((t) => t.stop());
        gravandoRef.current = false;
        setRecording(false);
        setErro("A gravação foi interrompida pelo navegador. Tente novamente.");
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        stream.getTracks().forEach((t) => t.stop());
        if (blob.size > 0) onAudio(blob, formatFromMime(type));
        else setErro("Não foi captado áudio. Verifique se o microfone correcto está selecionado.");
      };
      // Fatias periódicas: no Edge o buffer só é entregue no fim sem timeslice.
      recorder.start(1000);
      recorderRef.current = recorder;
      setSeconds(0);
      gravandoRef.current = true;
      setRecording(true);
      return true;
    } catch (e) {
      const nome = (e as DOMException | undefined)?.name;
      if (nome === "NotAllowedError" || nome === "SecurityError") {
        setErro(
          "O acesso ao microfone foi bloqueado. No Edge, clique no ícone de microfone/cadeado na barra de endereço e permita o microfone para este site (ou abra a app em https://digivoz.lovable.app).",
        );
      } else if (nome === "NotFoundError" || nome === "OverconstrainedError") {
        setErro("Nenhum microfone detectado. Ligue um microfone e tente novamente.");
      } else if (nome === "NotReadableError") {
        setErro("O microfone está a ser usado por outra aplicação. Feche-a e tente novamente.");
      } else {
        setErro("Não foi possível aceder ao microfone. Verifique as permissões do navegador.");
      }
      gravandoRef.current = false;
      setRecording(false);
      return false;
    }
  };

  const parar = (): boolean => {
    if (!recorderRef.current) {
      gravandoRef.current = false;
      setRecording(false);
      return false;
    }
    recorderRef.current.stop();
    recorderRef.current = null;
    gravandoRef.current = false;
    setRecording(false);
    return true;
  };

  useImperativeHandle(ref, () => ({
    iniciar: async () => {
      if (gravandoRef.current) return true;
      return iniciar();
    },
    parar: () => (gravandoRef.current ? parar() : false),
    aGravar: () => gravandoRef.current,
    erro: () => erroRef.current,
  }));




  const escolherFicheiro = (file: File | undefined) => {
    if (!file) return;
    setErro(null);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const format = ["mp3", "wav", "m4a", "ogg", "flac", "aac", "webm"].includes(ext)
      ? ext
      : formatFromMime(file.type);
    setFicheiro(file.name);
    onAudio(file, format);
  };

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <h2 className="text-lg font-semibold text-foreground">Gravação de voz</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fale directamente para o microfone. A transcrição inicia ao parar a gravação.
        </p>

        <div className="mt-6 flex flex-col items-center gap-4">
          <Button
            type="button"
            size="lg"
            variant={recording ? "destructive" : "default"}
            disabled={disabled && !recording}
            onClick={recording ? parar : iniciar}
            className="h-28 w-full flex-col gap-2 text-base font-semibold"
          >
            {recording ? (
              <>
                <Square className="size-7" />
                Parar Gravação
              </>
            ) : (
              <>
                <Mic className="size-7" />
                Iniciar Gravação de Voz
              </>
            )}
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span
              className={`inline-block size-2 rounded-full ${
                recording ? "animate-pulse bg-destructive" : "bg-border"
              }`}
            />
            {recording
              ? `A gravar — ${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`
              : "Microfone em espera"}
          </div>
        </div>
      </section>

      <section className="panel p-6">
        <h2 className="text-lg font-semibold text-foreground">Ficheiros de áudio</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Carregue um áudio já gravado em MP3, WAV, M4A ou OGG para transcrever.
        </p>

        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="mt-5 flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/60 px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-ring hover:bg-accent disabled:opacity-60"
        >
          <Upload className="size-6 text-primary" />
          <span className="font-medium text-foreground">Seleccionar ficheiro de áudio</span>
          <span>MP3, WAV, M4A, OGG · até 20 MB</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.ogg"
          className="hidden"
          onChange={(e) => {
            escolherFicheiro(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {ficheiro && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-secondary/70 px-3 py-2 text-sm">
            <FileAudio className="size-4 text-primary" />
            <span className="truncate text-foreground">{ficheiro}</span>
            <button
              type="button"
              className="ml-auto text-muted-foreground hover:text-foreground"
              onClick={() => setFicheiro(null)}
              aria-label="Remover ficheiro"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
      </section>

      {disabled && (
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />A transcrever áudio…
        </p>
      )}
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </div>
  );
});

