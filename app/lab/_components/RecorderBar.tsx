"use client";

// Reusable RECORD button + status indicator. Drop into any room's transport.
// Wraps a Recorder instance, taps the engine's master GainNode, captures via
// MediaRecorder, decodes + re-encodes to WAV, and triggers a browser download.

import { useCallback, useEffect, useRef, useState } from "react";
import { Recorder, type RecorderState } from "../_lib/recorder";
import { downloadBlob } from "../_lib/export";

type Props = {
  // Called at the moment of pressing record — returns the live engine
  // (or null if the room isn't armed). We accept this lazy form so the
  // recorder doesn't need to be constructed until the user actually wants
  // to record.
  getEngine: () => { ctx: AudioContext; master: AudioNode } | null;
  roomSlug: string;            // used in filename (e.g. "moog", "dx7", ...)
  filenameSuffix?: string;     // e.g. "124bpm" — optional extra tag
};

export function RecorderBar({ getEngine, roomSlug, filenameSuffix }: Props) {
  const recRef = useRef<Recorder | null>(null);
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number>(0);
  const tickHandleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ensureRecorder = useCallback(() => {
    if (recRef.current) return recRef.current;
    const eng = getEngine();
    if (!eng) return null;
    recRef.current = new Recorder(eng.ctx, eng.master);
    return recRef.current;
  }, [getEngine]);

  const onStart = useCallback(() => {
    const r = ensureRecorder();
    if (!r) return;
    r.start();
    setState("recording");
    startedAtRef.current = performance.now();
    setElapsedMs(0);
    tickHandleRef.current = setInterval(() => {
      setElapsedMs(performance.now() - startedAtRef.current);
    }, 100);
  }, [ensureRecorder]);

  const onStop = useCallback(async () => {
    const r = recRef.current;
    if (!r) return;
    if (tickHandleRef.current) { clearInterval(tickHandleRef.current); tickHandleRef.current = null; }
    setState("decoding");
    try {
      const wav = await r.stopAndExportWav();
      const stamp = new Date().toISOString().slice(0, 10);
      const tag = filenameSuffix ? `-${filenameSuffix}` : "";
      downloadBlob(wav, `lab-${roomSlug}${tag}-${stamp}.wav`);
    } catch (e) {
      console.error("record/export failed", e);
    }
    setState("idle");
    setElapsedMs(0);
  }, [filenameSuffix, roomSlug]);

  useEffect(() => () => {
    if (tickHandleRef.current) clearInterval(tickHandleRef.current);
    recRef.current?.cancel();
  }, []);

  const isRec = state === "recording";
  const isDec = state === "decoding";

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">REC</span>
      <button
        onClick={isRec ? onStop : onStart}
        disabled={isDec}
        className={`font-display font-semibold text-[11px] tracking-[.04em] uppercase px-2 py-1.5 border-2 transition-colors ${
          isRec
            ? "bg-redline border-redline text-paper"
            : isDec
              ? "border-on-dark text-on-dark cursor-wait"
              : "border-redline text-redline hover:bg-redline hover:text-paper"
        }`}
        title="Record audio from this room → WAV download"
      >
        {isRec ? "■ stop · " + formatElapsed(elapsedMs) : isDec ? "rendering…" : "● rec → wav"}
      </button>
    </div>
  );
}

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}
