"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Stem } from "../../_lib/sanity-queries";

// Auto-palette for unstyled stems — cycles through the spacepit color tokens.
const PALETTE = ["#F2B705", "#E83A1C", "#7BD3A8", "#C9B9E8", "#FF6FB5", "#65C7F7", "#0E4B3A"];

type LoadedStem = {
  label: string;
  color: string;
  audio: HTMLAudioElement;
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
  const [, forceRender] = useState(0);
  const tick = useCallback(() => forceRender((n) => n + 1), []);

  // Load all stems on mount. Each stem is one HTMLAudioElement; they share a
  // virtual playhead because we set currentTime on all of them together.
  useEffect(() => {
    if (stems.length === 0) return;
    const loaded: LoadedStem[] = [];
    let readyCount = 0;
    const onReady = () => {
      readyCount += 1;
      setLoadProgress(readyCount / stems.length);
      if (readyCount === stems.length) {
        // Use the longest stem as the master duration.
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
        onReady(); // count the failure so we don't hang forever
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
    };
  }, [stems]);

  // RAF clock for the transport bar.
  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    const tickLoop = () => {
      const lead = stemsRef.current[0]?.audio;
      if (lead) setCurrentTime(lead.currentTime);
      raf = requestAnimationFrame(tickLoop);
    };
    raf = requestAnimationFrame(tickLoop);
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
    if (playing) {
      for (const s of stemsRef.current) s.audio.pause();
      setPlaying(false);
    } else {
      // Re-sync everyone to the current position before starting.
      const lead = stemsRef.current[0]?.audio;
      const t = lead ? lead.currentTime : 0;
      for (const s of stemsRef.current) s.audio.currentTime = t;
      await Promise.all(stemsRef.current.map((s) => s.audio.play().catch(() => {})));
      setPlaying(true);
    }
  }, [playing, ready]);

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
    <div className="border border-paper bg-ink-2 overflow-hidden">
      {/* Header / transport */}
      <div className="px-5 py-4 border-b border-paper flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={playPause}
          disabled={!ready}
          className="font-display font-bold text-[18px] uppercase px-4 py-2 border border-paper bg-lamp text-ink hover:bg-paper transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {playing ? "❚❚ pause" : "▶ play"}
        </button>
        <button
          type="button"
          onClick={restart}
          disabled={!ready}
          className="font-mono text-[10px] tracking-[.14em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors disabled:opacity-50"
        >
          ⤴ restart
        </button>
        <div className="flex-1 flex items-center gap-3 min-w-[180px]">
          <span className="font-mono text-[10px] tabular-nums text-paper-2">{fmtTime(currentTime)}</span>
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
          <span className="font-mono text-[10px] tabular-nums text-paper-2">{fmtTime(duration)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] tracking-[.14em] uppercase text-paper-2">master</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="w-20 accent-lamp"
            aria-label="master volume"
          />
        </div>
      </div>

      {!ready && (
        <div className="px-5 py-3 border-b border-paper">
          <div className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 mb-1">
            loading stems · {Math.round(loadProgress * 100)}%
          </div>
          <div className="h-1 bg-ink rounded-full overflow-hidden">
            <div className="h-full bg-lamp transition-all" style={{ width: `${loadProgress * 100}%` }} />
          </div>
        </div>
      )}

      {/* Per-stem channels */}
      <div className="divide-y divide-paper/30">
        {stemsRef.current.map((s, i) => (
          <StemChannel
            key={i}
            label={s.label}
            color={s.color}
            volume={s.volume}
            muted={s.muted}
            soloed={s.soloed}
            anySoloed={anySoloed}
            onMute={() => toggleMute(i)}
            onSolo={() => toggleSolo(i)}
            onVolume={(v) => setStemVol(i, v)}
          />
        ))}
      </div>

      {trackTitle && (
        <div className="px-5 py-3 border-t border-paper font-mono text-[10px] tracking-[.14em] uppercase text-paper-2">
          ↑ stems from <span className="text-paper">{trackTitle}</span>
        </div>
      )}
    </div>
  );
}

function StemChannel({
  label,
  color,
  volume,
  muted,
  soloed,
  anySoloed,
  onMute,
  onSolo,
  onVolume,
}: {
  label: string;
  color: string;
  volume: number;
  muted: boolean;
  soloed: boolean;
  anySoloed: boolean;
  onMute: () => void;
  onSolo: () => void;
  onVolume: (v: number) => void;
}) {
  const dimmed = (anySoloed && !soloed) || muted;
  return (
    <div className="px-5 py-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2.5 min-w-[140px]">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ background: color, opacity: dimmed ? 0.3 : 1 }}
          aria-hidden
        />
        <span className={`font-display font-semibold text-[16px] uppercase tracking-[-0.005em] ${dimmed ? "opacity-50" : ""}`}>
          {label}
        </span>
      </div>
      <button
        type="button"
        onClick={onMute}
        aria-pressed={muted}
        className={`font-mono text-[10px] tracking-[.14em] uppercase px-2 py-0.5 border rounded-full transition-colors ${
          muted ? "border-redline bg-redline text-paper" : "border-paper text-paper hover:bg-paper hover:text-ink"
        }`}
      >
        M
      </button>
      <button
        type="button"
        onClick={onSolo}
        aria-pressed={soloed}
        className={`font-mono text-[10px] tracking-[.14em] uppercase px-2 py-0.5 border rounded-full transition-colors ${
          soloed ? "border-lamp bg-lamp text-ink" : "border-paper text-paper hover:bg-paper hover:text-ink"
        }`}
      >
        S
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => onVolume(parseFloat(e.target.value))}
        className="flex-1 accent-lamp min-w-[120px]"
        aria-label={`${label} volume`}
      />
      <span className="font-mono text-[10px] tabular-nums text-paper-2 w-9 text-right">
        {Math.round(volume * 100)}
      </span>
    </div>
  );
}
