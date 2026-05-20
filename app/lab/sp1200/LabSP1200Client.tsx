"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EngineSP1200,
  PAD_ORDER,
  PAD_DEFAULTS,
  decodeIntoEngine,
  type PadId,
  type PadParams,
} from "../_lib/engineSP1200";
import { SequencerSP, type StepRowSP } from "../_lib/sequencerSP";
import { seedSP1200WithDrums } from "../_lib/sp1200-seed";
import { Knob } from "../_components/Knob";

// keyboard: 1..8 → pad
const KEY_TO_PAD: Record<string, PadId> = {
  "1": "P1", "2": "P2", "3": "P3", "4": "P4",
  "5": "P5", "6": "P6", "7": "P7", "8": "P8",
};

// fallback color per pad slot — bright, hip-hop-flyer energy
const PAD_COLOR: Record<PadId, string> = {
  P1: "#7AFB0D",  // slime
  P2: "#F2B705",
  P3: "#E83A1C",
  P4: "#65C7F7",
  P5: "#C9B9E8",
  P6: "#FF6FB5",
  P7: "#F4EFE6",
  P8: "#7BD3A8",
};

function emptyRows(): StepRowSP[] {
  return PAD_ORDER.map((p) => ({ pad: p, steps: new Array(16).fill(false) }));
}

export function LabSP1200Client() {
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(92);
  const [swing, setSwing] = useState(0.18);
  const [currentStep, setCurrentStep] = useState(-1);
  const [rows, setRows] = useState<StepRowSP[]>(() => {
    // ship a starter pattern: kick on 1/5/9/13, snare on 5/13, hat on every 8th
    const r = emptyRows();
    r.find((x) => x.pad === "P1")!.steps = [true,false,false,false, true,false,false,false, true,false,false,false, true,false,false,false];
    r.find((x) => x.pad === "P2")!.steps = [false,false,false,false, true,false,false,false, false,false,false,false, true,false,false,false];
    r.find((x) => x.pad === "P3")!.steps = [true,false,true,false, true,false,true,false, true,false,true,false, true,false,true,false];
    return r;
  });
  const [pads, setPads] = useState<Record<PadId, PadParams>>(() =>
    Object.fromEntries(PAD_ORDER.map((p) => [p, { ...PAD_DEFAULTS }])) as Record<PadId, PadParams>
  );
  const [activePad, setActivePad] = useState<PadId>("P1");
  const [flash, setFlash] = useState<PadId | null>(null);
  const flashTimer = useRef<number | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [dragOverPad, setDragOverPad] = useState<PadId | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<EngineSP1200 | null>(null);
  const seqRef = useRef<SequencerSP | null>(null);

  const ensureAudio = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const Ctx = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const engine = new EngineSP1200(ctx);
    const seq = new SequencerSP(engine);
    seq.setRows(rows);
    seq.setBpm(bpm);
    seq.setSwing(swing);
    seq.onStepChange((s) => setCurrentStep(s));
    ctxRef.current = ctx;
    engineRef.current = engine;
    seqRef.current = seq;
    void ctx.resume();
    setArmed(true);
    // seed with starter samples (rendered from 909 voices offline) so the
    // first hit makes a sound even before the user drops their own samples
    void seedSP1200WithDrums(engine).then(() => {
      setPads((p) => ({
        ...p,
        P1: { ...p.P1, loaded: true, sampleName: "909 kick" },
        P2: { ...p.P2, loaded: true, sampleName: "909 snare" },
        P3: { ...p.P3, loaded: true, sampleName: "909 closed hat" },
        P4: { ...p.P4, loaded: true, sampleName: "909 open hat" },
      }));
      setSeeded(true);
    });
    return ctx;
  }, [bpm, rows, swing]);

  // ---- transport ----
  const togglePlay = useCallback(() => {
    const ctx = ensureAudio();
    if (!ctx) return;
    const seq = seqRef.current;
    if (!seq) return;
    if (playing) {
      seq.stop();
      setPlaying(false);
      setCurrentStep(-1);
    } else {
      seq.setRows(rows);
      seq.setBpm(bpm);
      seq.setSwing(swing);
      seq.start();
      setPlaying(true);
    }
  }, [bpm, ensureAudio, playing, rows, swing]);

  useEffect(() => { seqRef.current?.setBpm(bpm); }, [bpm]);
  useEffect(() => { seqRef.current?.setSwing(swing); }, [swing]);
  useEffect(() => { seqRef.current?.setRows(rows); }, [rows]);

  // ---- pad trigger ----
  const flashFor = useCallback((p: PadId) => {
    setFlash(p);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 120);
  }, []);

  const trigger = useCallback((pad: PadId) => {
    const ctx = ensureAudio();
    if (!ctx) return;
    engineRef.current?.trigger(pad, ctx.currentTime, 1);
    flashFor(pad);
  }, [ensureAudio, flashFor]);

  // ---- step edit ----
  const toggleStep = useCallback((pad: PadId, step: number) => {
    setRows((rs) => rs.map((r) => {
      if (r.pad !== pad) return r;
      const next = r.steps.slice();
      next[step] = !next[step];
      return { ...r, steps: next };
    }));
  }, []);

  const clearAll = useCallback(() => {
    setRows(emptyRows());
  }, []);

  // ---- knob changes ----
  const setPadParam = useCallback(<K extends keyof PadParams>(pad: PadId, key: K, val: PadParams[K]) => {
    setPads((p) => ({ ...p, [pad]: { ...p[pad], [key]: val } }));
    engineRef.current?.setParam(pad, key, val);
  }, []);

  // ---- sample loading via drag-drop or file picker ----
  const loadFileIntoPad = useCallback(async (pad: PadId, file: File) => {
    const ctx = ensureAudio();
    if (!ctx) return;
    try {
      const arr = await file.arrayBuffer();
      await decodeIntoEngine(engineRef.current!, pad, arr, file.name);
      setPads((p) => ({ ...p, [pad]: { ...p[pad], loaded: true, sampleName: file.name } }));
      setActivePad(pad);
    } catch (e) {
      console.warn("sample load failed", e);
    }
  }, [ensureAudio]);

  const onPadDrop = useCallback((e: React.DragEvent, pad: PadId) => {
    e.preventDefault();
    setDragOverPad(null);
    const file = e.dataTransfer?.files?.[0];
    if (file && /audio|wav|mp3|aif|ogg/.test(file.type) || file?.name.match(/\.(wav|mp3|aif|aiff|ogg|m4a)$/i)) {
      void loadFileIntoPad(pad, file);
    }
  }, [loadFileIntoPad]);

  // ---- keyboard ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); return; }
      const p = KEY_TO_PAD[e.key];
      if (p) { e.preventDefault(); trigger(p); setActivePad(p); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, trigger]);

  useEffect(() => {
    return () => {
      seqRef.current?.stop();
      try { void ctxRef.current?.close(); } catch {}
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const activeParams = pads[activePad];

  return (
    <div className="relative">
      {!armed && (
        <button
          onClick={() => { ensureAudio(); }}
          className="absolute inset-0 z-30 flex items-center justify-center bg-ink/85 backdrop-blur-sm cursor-pointer"
          aria-label="Tap to start audio"
        >
          <div className="border-2 border-lamp px-8 py-6 bg-ink hover:bg-ink-2 transition-colors">
            <div className="font-mono text-[11px] tracking-[.16em] uppercase text-lamp mb-1">READY</div>
            <div className="font-display font-bold uppercase text-[28px] tracking-[-0.01em]">tap to power on</div>
            <div className="font-serif italic text-[14px] text-paper-2 mt-1">
              browsers require a click before we can make any noise.
            </div>
          </div>
        </button>
      )}

      <div className="border-2 border-paper bg-ink-2 overflow-hidden">
        {/* TOP STRIP */}
        <div className="flex items-stretch border-b-2 border-paper">
          <div
            className="px-4 py-3 border-r-2 border-paper"
            style={{ background: "#0E4B3A", color: "#F4EFE6" }}
          >
            <div className="font-mono text-[9px] tracking-[.18em] uppercase opacity-80">E-mu</div>
            <div className="font-display font-bold text-[20px] uppercase leading-none tracking-[-0.02em]">SP-1200</div>
            <div className="font-mono text-[8px] tracking-[.18em] uppercase opacity-80 mt-1">
              SAMPLING PERCUSSION SYSTEM
            </div>
          </div>

          <div className="flex-1 flex items-center gap-4 px-4 py-2 flex-wrap">
            <button
              onClick={togglePlay}
              className={`font-display font-bold uppercase text-[14px] tracking-[.04em] px-4 py-2 border-2 transition-colors ${
                playing
                  ? "bg-redline border-redline text-paper"
                  : "bg-lamp border-lamp text-ink hover:bg-paper hover:border-paper"
              }`}
            >
              {playing ? "■ stop" : "▶ play"}
            </button>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">BPM</span>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Math.max(60, Math.min(200, Number(e.target.value) || 92)))}
                className="bg-ink border border-paper px-2 py-1 font-mono text-[14px] text-paper w-[64px] focus:outline-none focus:border-lamp"
              />
              <input type="range" min={60} max={180} step={1}
                value={bpm} onChange={(e) => setBpm(Number(e.target.value))}
                className="w-[100px] accent-lamp" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">SWING</span>
              <input type="range" min={0} max={0.5} step={0.01}
                value={swing} onChange={(e) => setSwing(Number(e.target.value))}
                className="w-[100px] accent-lamp" />
              <span className="font-mono text-[10px] text-paper-2 w-[36px]">{Math.round(swing * 100)}%</span>
            </div>
            <button
              onClick={clearAll}
              className="font-mono text-[10px] tracking-[.14em] uppercase border border-paper/50 text-paper-2 hover:border-paper hover:text-paper px-3 py-1.5 transition-colors"
            >
              clear grid
            </button>
            <div className="font-mono text-[9px] tracking-[.14em] uppercase text-collect">
              {seeded ? "● 4 starter samples loaded · drop wav onto any pad to replace" : "○ booting starter kit…"}
            </div>
          </div>
        </div>

        {/* STEP GRID */}
        <div className="px-4 py-4 border-b-2 border-paper bg-ink overflow-x-auto">
          <div className="min-w-[820px]">
            <div className="grid items-center" style={{ gridTemplateColumns: "104px repeat(16, minmax(0, 1fr))", gap: 4 }}>
              <div />
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className={`font-mono text-[9px] tracking-[.14em] uppercase text-center pb-1 ${
                  currentStep === i ? "text-lamp" : i % 4 === 0 ? "text-paper" : "text-on-dark"
                }`}>
                  {i + 1}
                </div>
              ))}
            </div>
            {rows.map((row) => {
              const color = PAD_COLOR[row.pad];
              const isActive = activePad === row.pad;
              const padState = pads[row.pad];
              return (
                <div key={row.pad} className="grid items-center mb-1"
                  style={{ gridTemplateColumns: "104px repeat(16, minmax(0, 1fr))", gap: 4 }}>
                  <button
                    onClick={() => { setActivePad(row.pad); trigger(row.pad); }}
                    className={`text-left font-mono text-[10px] tracking-[.14em] uppercase px-2 py-2 border-2 transition-all ${
                      isActive ? "border-lamp text-lamp bg-ink-2" : "border-paper/30 text-paper-2 hover:border-paper hover:text-paper"
                    } ${!padState.loaded ? "opacity-50" : ""}`}
                  >
                    <span className="block font-display text-[13px] font-bold leading-none" style={{ color: isActive ? "#F2B705" : color }}>{row.pad}</span>
                    <span className="block text-[8px] leading-none mt-1 truncate" style={{ maxWidth: 80 }}>{padState.sampleName ?? "(empty)"}</span>
                  </button>
                  {row.steps.map((on, stepIdx) => {
                    const isPlayhead = currentStep === stepIdx;
                    const isDownbeat = stepIdx % 4 === 0;
                    return (
                      <button
                        key={stepIdx}
                        onClick={() => toggleStep(row.pad, stepIdx)}
                        className={`aspect-square border transition-all ${
                          on ? "border-paper"
                            : isDownbeat ? "border-paper/40 bg-ink-2 hover:bg-ink-3"
                            : "border-paper/15 bg-ink hover:bg-ink-2"
                        }`}
                        style={{
                          background: on ? (isPlayhead ? "#F2B705" : color) : undefined,
                          boxShadow: isPlayhead && on ? `0 0 12px ${color}` : undefined,
                          transform: isPlayhead ? "scale(1.06)" : undefined,
                        }}
                        aria-label={`${row.pad} step ${stepIdx + 1}`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* PAD STRIP + EDITOR */}
        <div className="grid md:grid-cols-[1fr_auto] gap-0">
          <div className="p-4 border-r-2 border-paper">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-on-dark mb-2">
              PAD STRIP · click to trigger, drag a WAV onto a pad to load
            </div>
            <div className="grid grid-cols-4 gap-3">
              {PAD_ORDER.map((p) => {
                const isActive = activePad === p;
                const isFlash = flash === p;
                const isDragOver = dragOverPad === p;
                const padState = pads[p];
                const color = PAD_COLOR[p];
                return (
                  <button
                    key={p}
                    onClick={() => { setActivePad(p); trigger(p); }}
                    onDragOver={(e) => { e.preventDefault(); setDragOverPad(p); }}
                    onDragLeave={() => setDragOverPad((d) => (d === p ? null : d))}
                    onDrop={(e) => onPadDrop(e, p)}
                    className={`relative aspect-[3/2] border-2 transition-all flex flex-col items-stretch justify-end pb-2 pt-1 px-2 ${
                      isDragOver ? "border-lamp bg-lamp/20"
                        : isActive ? "border-lamp" : "border-paper/40 hover:border-paper"
                    }`}
                    style={{
                      background: isFlash ? color : `linear-gradient(180deg, ${color}26 0%, ${color}11 100%)`,
                      boxShadow: isFlash ? `0 0 24px ${color}` : undefined,
                      opacity: padState.loaded ? 1 : 0.55,
                    }}
                  >
                    <span className="absolute top-1.5 left-2 font-mono text-[10px] tracking-[.14em] opacity-60"
                      style={{ color: isFlash ? "#0B0B0B" : "#F4EFE6" }}>
                      {p.replace("P", "")}
                    </span>
                    <span className="font-display font-bold text-[24px] leading-none tracking-[-0.01em] text-center"
                      style={{ color: isFlash ? "#0B0B0B" : color }}>
                      {p}
                    </span>
                    <span className="font-mono text-[9px] tracking-[.06em] text-center mt-1 truncate"
                      style={{ color: isFlash ? "#0B0B0B" : "#C8C2B4" }}>
                      {padState.sampleName ?? "drop a WAV"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 min-w-[300px]">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-on-dark">
              EDIT · {activePad} {activeParams.sampleName ? `· ${activeParams.sampleName}` : ""}
            </div>
            <div className="font-serif italic text-[12px] text-paper-2 leading-snug mt-1 mb-3">
              pitch is the SP trick — push it up to fit a long sample into 10 seconds of memory.
              the higher you go, the dustier it gets.
            </div>
            <div className="flex flex-wrap gap-3">
              <Knob
                label="LEVEL"
                value={activeParams.level}
                onChange={(v) => setPadParam(activePad, "level", v)}
                color={PAD_COLOR[activePad]}
                defaultValue={0.85}
                format={(v) => `${Math.round(v * 100)}`}
              />
              <Knob
                label="PITCH"
                value={(activeParams.pitch + 24) / 48}
                onChange={(v) => setPadParam(activePad, "pitch", Math.round(v * 48 - 24))}
                color={PAD_COLOR[activePad]}
                defaultValue={0.5}
                format={(v) => {
                  const n = Math.round(v * 48 - 24);
                  return `${n >= 0 ? "+" : ""}${n}st`;
                }}
              />
              <Knob
                label="DECAY"
                value={activeParams.decay}
                onChange={(v) => setPadParam(activePad, "decay", v)}
                color={PAD_COLOR[activePad]}
                defaultValue={0}
                format={(v) => v < 0.01 ? "off" : `${Math.round(v * 100)}`}
              />
            </div>
            <label className="block mt-3 font-mono text-[10px] tracking-[.12em] uppercase text-paper-2 cursor-pointer hover:text-paper transition-colors">
              <input
                type="file"
                accept="audio/*,.wav,.mp3,.aif,.aiff,.ogg,.m4a"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void loadFileIntoPad(activePad, f);
                  e.target.value = ""; // reset so re-pick of same file fires onChange
                }}
              />
              ↑ load sample…
            </label>
          </div>
        </div>
      </div>

      <div className="mt-3 font-mono text-[10px] tracking-[.14em] uppercase text-on-dark text-center">
        space = play/stop · 1–8 = trigger pad · drag wav onto a pad to swap
      </div>
    </div>
  );
}
