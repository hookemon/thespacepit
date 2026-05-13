"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Stem } from "../../_lib/sanity-queries";

// Auto-palette for unstyled stems — cycles through the spacepit color tokens.
const PALETTE = ["#F2B705", "#E83A1C", "#7BD3A8", "#C9B9E8", "#FF6FB5", "#65C7F7", "#0E4B3A"];

type LoadedStem = {
  label: string;
  color: string;
  audio: HTMLAudioElement;
  source?: MediaElementAudioSourceNode;
  analyser?: AnalyserNode;
  data?: Uint8Array<ArrayBuffer>;
  volume: number;       // 0..1
  muted: boolean;
  soloed: boolean;
};

type Props = {
  stems: Stem[];
  trackTitle?: string;
};

function fmtTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function StemPlayer({ stems, trackTitle }: Props) {
  const [ready, setReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [masterVolume, setMasterVolume] = useState(0.85);
  // Per-stem state lives in refs so re-renders don't recreate audio elements.
  const stemsRef = useRef<LoadedStem[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [, forceRender] = useState(0);
  const tick = useCallback(() => forceRender((n) => n + 1), []);

  // Load all stems on mount. One HTMLAudioElement each; we set currentTime on
  // all of them together so they stay phase-locked.
  useEffect(() => {
    if (stems.length === 0) return;
    const loaded: LoadedStem[] = [];
    let readyCount = 0;
    const onReady = () => {
      readyCount += 1;
      setLoadProgress(readyCount / stems.length);
      if (readyCount === stems.length) {
        const dur = Math.max(...loaded.map((s) => s.audio.duration || 0));
        setDuration(dur);
        setReady(true);
      }
    };

    for (let i = 0; i < stems.length; i += 1) {
      const s = stems[i];
      const audio = new Audio();
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      audio.src = s.audioUrl;
      audio.loop = false;
      audio.volume = (s.muteByDefault ? 0 : 0.85) * 0.85;
      audio.addEventListener("loadedmetadata", onReady, { once: true });
      audio.addEventListener("error", () => {
        console.warn(`stem load failed: ${s.label}`);
        onReady();
      }, { once: true });
      loaded.push({
        label: s.label,
        color: s.color ?? PALETTE[i % PALETTE.length],
        audio,
        volume: s.muteByDefault ? 0 : 0.85,
        muted: s.muteByDefault ?? false,
        soloed: false,
      });
    }
    stemsRef.current = loaded;

    return () => {
      for (const s of loaded) {
        s.audio.pause();
        s.audio.src = "";
      }
      stemsRef.current = [];
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, [stems]);

  // Lazy-create AudioContext + per-stem analyser nodes on first play. (Browsers
  // require a user gesture before AudioContext can run; the play button is it.)
  // Once each stem's audio routes through ctx → analyser → destination, we can
  // sample byte-time-domain data on every animation frame and draw the
  // waveform on the per-channel canvas.
  const ensureAudioGraph = useCallback(() => {
    if (audioCtxRef.current) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    audioCtxRef.current = ctx;
    for (const s of stemsRef.current) {
      try {
        const source = ctx.createMediaElementSource(s.audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        // Construct with an explicit ArrayBuffer so the type is
        // `Uint8Array<ArrayBuffer>` (TS 5.7+ distinguishes this from
        // `Uint8Array<ArrayBufferLike>`) — required by getByteTimeDomainData.
        const data = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
        source.connect(analyser);
        analyser.connect(ctx.destination);
        s.source = source;
        s.analyser = analyser;
        s.data = data;
      } catch (e) {
        // Element already has a source attached (HMR re-runs) — non-fatal.
        console.warn("analyser hook failed:", e);
      }
    }
  }, []);

  // RAF clock — updates the transport time + draws waveforms on each canvas.
  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    const draw = () => {
      const lead = stemsRef.current[0]?.audio;
      if (lead) setCurrentTime(lead.currentTime);
      // Draw per-stem waveforms
      stemsRef.current.forEach((s, i) => {
        const canvas = canvasRefs.current[i];
        if (!canvas || !s.analyser || !s.data) return;
        s.analyser.getByteTimeDomainData(s.data);
        const dpr = window.devicePixelRatio || 1;
        const cssW = canvas.clientWidth;
        const cssH = canvas.clientHeight;
        if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
          canvas.width = cssW * dpr;
          canvas.height = cssH * dpr;
        }
        const c = canvas.getContext("2d");
        if (!c) return;
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.clearRect(0, 0, cssW, cssH);

        // Faint center line (rest state hint).
        c.strokeStyle = "rgba(244,239,230,0.10)";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(0, cssH / 2);
        c.lineTo(cssW, cssH / 2);
        c.stroke();

        // Waveform — channel color, slight glow.
        const isAudible = (s.soloed || !s.muted) && s.volume > 0;
        c.strokeStyle = isAudible ? s.color : `${s.color}55`;
        c.lineWidth = 1.5;
        c.shadowBlur = isAudible ? 6 : 0;
        c.shadowColor = s.color;
        c.beginPath();
        for (let j = 0; j < s.data.length; j += 1) {
          const x = (j / s.data.length) * cssW;
          const y = (s.data[j] / 255) * cssH;
          if (j === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();
        c.shadowBlur = 0;
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  // Auto-stop when all stems finish.
  useEffect(() => {
    if (!ready) return;
    const lead = stemsRef.current[0]?.audio;
    if (!lead) return;
    const onEnd = () => setPlaying(false);
    lead.addEventListener("ended", onEnd);
    return () => lead.removeEventListener("ended", onEnd);
  }, [ready]);

  // Apply solo + mute + master to each stem's effective volume.
  const applyVolumes = useCallback(() => {
    const any = stemsRef.current.some((s) => s.soloed);
    for (const s of stemsRef.current) {
      const audible = any ? s.soloed : !s.muted;
      s.audio.volume = audible ? s.volume * masterVolume : 0;
    }
  }, [masterVolume]);

  useEffect(() => { applyVolumes(); }, [applyVolumes, ready]);

  const playPause = useCallback(async () => {
    if (!ready) return;
    ensureAudioGraph();
    // If suspended (background autoplay policy), resume.
    if (audioCtxRef.current?.state === "suspended") {
      await audioCtxRef.current.resume();
    }
    if (playing) {
      for (const s of stemsRef.current) s.audio.pause();
      setPlaying(false);
    } else {
      const lead = stemsRef.current[0]?.audio;
      const t = lead ? lead.currentTime : 0;
      for (const s of stemsRef.current) s.audio.currentTime = t;
      await Promise.all(stemsRef.current.map((s) => s.audio.play().catch(() => {})));
      setPlaying(true);
    }
  }, [playing, ready, ensureAudioGraph]);

  const seek = useCallback((t: number) => {
    for (const s of stemsRef.current) s.audio.currentTime = t;
    setCurrentTime(t);
  }, []);

  const toggleMute = useCallback((i: number) => {
    const s = stemsRef.current[i];
    if (!s) return;
    s.muted = !s.muted;
    if (s.muted) s.soloed = false;
    applyVolumes();
    tick();
  }, [applyVolumes, tick]);

  const toggleSolo = useCallback((i: number) => {
    const s = stemsRef.current[i];
    if (!s) return;
    s.soloed = !s.soloed;
    if (s.soloed) s.muted = false;
    applyVolumes();
    tick();
  }, [applyVolumes, tick]);

  const setStemVol = useCallback((i: number, v: number) => {
    const s = stemsRef.current[i];
    if (!s) return;
    s.volume = v;
    applyVolumes();
    tick();
  }, [applyVolumes, tick]);

  const restart = useCallback(() => {
    for (const s of stemsRef.current) s.audio.currentTime = 0;
    setCurrentTime(0);
  }, []);

  const anySoloed = useMemo(() => stemsRef.current.some((s) => s.soloed), []); // recomputed via tick

  if (stems.length === 0) return null;

  return (
    <div className="border-2 border-ink bg-ink overflow-hidden">
      {/* === TRANSPORT BAR === */}
      <div className="px-5 sm:px-6 py-5 border-b-2 border-paper/15 flex flex-wrap items-center gap-4 bg-ink-2">
        <button
          type="button"
          onClick={playPause}
          disabled={!ready}
          className="font-display font-bold uppercase border-2 border-ink bg-lamp text-ink hover:bg-paper transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          style={{
            fontSize: 22,
            letterSpacing: "-0.01em",
            padding: "10px 18px",
            boxShadow: "3px 3px 0 var(--color-paper)",
          }}
          aria-label={playing ? "pause" : "play"}
        >
          {playing ? "❚❚" : "▶"}
        </button>

        <div className="flex flex-col gap-0.5 min-w-[120px]">
          <div className="font-mono text-[9px] tracking-[.18em] uppercase text-paper-2">
            now playing
          </div>
          <div
            className="font-display font-bold uppercase text-paper leading-none"
            style={{ fontSize: 22, letterSpacing: "-0.01em" }}
          >
            {trackTitle ?? "untitled"}
          </div>
        </div>

        <div className="flex-1 flex items-center gap-3 min-w-[200px]">
          <span className="font-mono text-[11px] tabular-nums text-paper">{fmtTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={Math.max(0.1, duration)}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => seek(parseFloat(e.target.value))}
            disabled={!ready}
            className="flex-1 accent-lamp"
            aria-label="seek"
          />
          <span className="font-mono text-[11px] tabular-nums text-paper-2">{fmtTime(duration)}</span>
        </div>

        <button
          type="button"
          onClick={restart}
          disabled={!ready}
          className="font-mono text-[10px] tracking-[.14em] uppercase px-3 py-1.5 border border-paper text-paper rounded-full hover:bg-paper hover:text-ink transition-colors disabled:opacity-50 shrink-0"
          aria-label="restart"
        >
          ⤴ restart
        </button>

        <div className="flex items-center gap-2 min-w-[140px]">
          <span className="font-mono text-[9px] tracking-[.14em] uppercase text-paper-2">master</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="w-24 accent-lamp"
            aria-label="master volume"
          />
        </div>
      </div>

      {!ready && (
        <div className="px-5 py-3 border-b-2 border-paper/15">
          <div className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 mb-1">
            loading stems · {Math.round(loadProgress * 100)}%
          </div>
          <div className="h-1 bg-paper/10 rounded-full overflow-hidden">
            <div className="h-full bg-lamp transition-all" style={{ width: `${loadProgress * 100}%` }} />
          </div>
        </div>
      )}

      {/* === CHANNEL STACK === each stem is a tall card with a color stripe,
          big label, live waveform canvas, and inline controls. Bigger than the
          old horizontal row — feels closer to a hardware mixer channel strip. */}
      <div className="flex flex-col">
        {stemsRef.current.map((s, i) => (
          <StemChannel
            key={i}
            index={i + 1}
            label={s.label}
            color={s.color}
            volume={s.volume}
            muted={s.muted}
            soloed={s.soloed}
            anySoloed={anySoloed}
            playing={playing && ready}
            onMute={() => toggleMute(i)}
            onSolo={() => toggleSolo(i)}
            onVolume={(v) => setStemVol(i, v)}
            canvasRef={(el) => { canvasRefs.current[i] = el; }}
          />
        ))}
      </div>
    </div>
  );
}

function StemChannel({
  index,
  label,
  color,
  volume,
  muted,
  soloed,
  anySoloed,
  playing,
  onMute,
  onSolo,
  onVolume,
  canvasRef,
}: {
  index: number;
  label: string;
  color: string;
  volume: number;
  muted: boolean;
  soloed: boolean;
  anySoloed: boolean;
  playing: boolean;
  onMute: () => void;
  onSolo: () => void;
  onVolume: (v: number) => void;
  canvasRef: (el: HTMLCanvasElement | null) => void;
}) {
  const dimmed = (anySoloed && !soloed) || muted;
  return (
    <div
      className="relative flex flex-col gap-2 px-5 sm:px-6 py-4 border-b-2 border-paper/10 last:border-b-0 transition-opacity"
      style={{ opacity: dimmed ? 0.45 : 1 }}
    >
      {/* Left edge color stripe — thick, runs full height. */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: 6, background: color, opacity: dimmed ? 0.5 : 1 }}
        aria-hidden
      />

      {/* Top row: channel label · M / S */}
      <div className="flex items-center justify-between gap-3 pl-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[9px] tracking-[.18em] uppercase text-paper-2 tabular-nums">
            ch · {String(index).padStart(2, "0")}
          </span>
          <span
            className="font-display font-bold uppercase tracking-[-0.01em] leading-none"
            style={{ fontSize: 26, color: "var(--color-paper)" }}
          >
            {label}
          </span>
          {playing && !dimmed && (
            <span
              className="inline-block w-2 h-2 rounded-full sp-pulse"
              style={{ background: color }}
              aria-hidden
            />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onMute}
            aria-pressed={muted}
            className={`font-mono text-[11px] font-bold tracking-[.14em] uppercase w-9 h-9 border-2 border-paper transition-colors ${
              muted ? "bg-redline border-redline text-paper" : "text-paper hover:bg-paper hover:text-ink"
            }`}
          >
            M
          </button>
          <button
            type="button"
            onClick={onSolo}
            aria-pressed={soloed}
            className={`font-mono text-[11px] font-bold tracking-[.14em] uppercase w-9 h-9 border-2 border-paper transition-colors ${
              soloed ? "bg-lamp border-lamp text-ink" : "text-paper hover:bg-paper hover:text-ink"
            }`}
          >
            S
          </button>
        </div>
      </div>

      {/* Waveform canvas — live time-domain visualization. */}
      <div className="pl-3">
        <div
          className="border border-paper/15 bg-ink-2 overflow-hidden"
          style={{ height: 80 }}
        >
          <canvas
            ref={canvasRef}
            style={{ display: "block", width: "100%", height: "100%" }}
          />
        </div>
      </div>

      {/* Bottom row: volume slider + readout */}
      <div className="flex items-center gap-3 pl-3">
        <span className="font-mono text-[9px] tracking-[.18em] uppercase text-paper-2 shrink-0">
          gain
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolume(parseFloat(e.target.value))}
          className="flex-1 accent-lamp"
          aria-label={`${label} volume`}
          style={{ ["--ch-color" as string]: color }}
        />
        <span className="font-mono text-[10px] tabular-nums text-paper-2 w-10 text-right">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
}
