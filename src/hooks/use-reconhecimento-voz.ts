import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Escuta contínua com a API de reconhecimento de voz do navegador
 * (Edge/Chrome). Reinicia automaticamente quando o navegador corta a sessão.
 */

type Resultado = {
  transcript: string;
  isFinal: boolean;
};

type ReconhecimentoLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

const obterConstrutor = (): (new () => ReconhecimentoLike) | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"] ?? null) as
    | (new () => ReconhecimentoLike)
    | null;
};

export function useReconhecimentoVoz(opts: {
  activo: boolean;
  /** Pausa temporária (ex.: enquanto o gravador usa o microfone). */
  suspenso?: boolean;
  onFrase: (r: Resultado) => void;
  onErro?: (mensagem: string) => void;
}) {
  const { activo, suspenso = false, onFrase, onErro } = opts;
  const ligado = activo && !suspenso;

  const [suportado, setSuportado] = useState(false);
  const [aEscutar, setAEscutar] = useState(false);
  const [ultima, setUltima] = useState("");

  const refInstancia = useRef<ReconhecimentoLike | null>(null);
  const refActivo = useRef(ligado);
  const refFrase = useRef(onFrase);
  const refErro = useRef(onErro);

  refActivo.current = ligado;
  refFrase.current = onFrase;
  refErro.current = onErro;

  useEffect(() => {
    setSuportado(obterConstrutor() !== null);
  }, []);

  const parar = useCallback(() => {
    refActivo.current = false;
    refInstancia.current?.abort();
    refInstancia.current = null;
    setAEscutar(false);
  }, []);

  useEffect(() => {
    if (!ligado) {
      refInstancia.current?.abort();
      refInstancia.current = null;
      setAEscutar(false);
      return;
    }

    const Ctor = obterConstrutor();
    if (!Ctor) return;


    let cancelado = false;
    const instancia = new Ctor();
    refInstancia.current = instancia;

    instancia.lang = "pt-PT";
    instancia.continuous = true;
    instancia.interimResults = true;

    instancia.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const transcript = String(r[0]?.transcript ?? "").trim();
        if (!transcript) continue;
        setUltima(transcript);
        refFrase.current({ transcript, isFinal: Boolean(r.isFinal) });
      }
    };

    instancia.onerror = (e: any) => {
      const err = String(e?.error ?? "");
      if (err === "not-allowed" || err === "service-not-allowed") {
        refErro.current?.(
          "O navegador bloqueou o microfone para comandos de voz. Permita o microfone para este site.",
        );
        cancelado = true;
        setAEscutar(false);
      }
    };

    // Retentativas com recuo: o motor pode recusar arrancar enquanto o
    // MediaRecorder detém o microfone.
    const ATRASOS = [100, 300, 800, 1500];
    const tentarArrancar = (tentativa: number) => {
      if (cancelado || !refActivo.current) return;
      const atraso = ATRASOS[Math.min(tentativa, ATRASOS.length - 1)]!;
      window.setTimeout(() => {
        if (cancelado || !refActivo.current) return;
        try {
          instancia.start();
          setAEscutar(true);
        } catch {
          if (tentativa + 1 < ATRASOS.length) tentarArrancar(tentativa + 1);
        }
      }, atraso);
    };

    instancia.onend = () => {
      setAEscutar(false);
      if (cancelado || !refActivo.current) return;
      // O navegador corta a sessão periodicamente: retomar a escuta rapidamente.
      // Nota: o tempo de silêncio antes do navegador considerar a frase terminada
      // é controlado pelo motor de reconhecimento do navegador (Web Speech API);
      // usamos continuous=true para manter a sessão activa o máximo possível.
      tentarArrancar(0);
    };

    try {
      instancia.start();
      setAEscutar(true);
    } catch {
      tentarArrancar(1);
    }

    return () => {
      cancelado = true;
      instancia.onend = null;
      instancia.onresult = null;
      instancia.onerror = null;
      try {
        instancia.abort();
      } catch {
        // ignorado
      }
      if (refInstancia.current === instancia) refInstancia.current = null;
      setAEscutar(false);
    };
  }, [ligado]);

  return { suportado, aEscutar, ultima, parar };
}
