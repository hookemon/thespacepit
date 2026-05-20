"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Engine909, type Voice, type VoiceParams } from "../_lib/engine909";
import { Sequencer, type StepRow } from "../_lib/sequencer";
import { PRESETS, presetToRows, type Preset } from "../_lib/patterns909";
import {
  renderPatternToBuffer,
  bufferToWavBlob,
  downloadBlob,
  buildStemsZip,
  buildKitZip,
  downloadKit,
  downloadStems,
} from "../_lib/export";
import { LESSONS_909, type Lesson909State } from "../_lib/lessons909";
import { LinkClient, LinkStepDriver, type LinkStatus, type LinkState } from "../_lib/linkClient";
import {
  bindInput,
  isMidiSupported,
  listInputs,
  listOutputs,
  onMidiStateChange,
  sendNoteOn,
  sendNoteOff,
  sendClockTickSync,
  sendStartSync,
  sendStopSync,
  warmOutput,
  MIDI_NOTE_TO_VOICE,
  VOICE_TO_MIDI_NOTE,
  type MidiDevice,
} from "../_lib/midi";
import { Knob } from "../_components/Knob";
import { LessonPanel } from "../_components/LessonPanel";
import { LessonSpotlightProvider, useSpotlight } from "../_components/LessonSpotlight";

// 909-strip color language — matches the original panel
const VOICE_COLOR: Record<Voice, string> = {
  BD: "#E83A1C", // red
  SD: "#FF6F1C", // orange
  LT: "#F2B705",
  MT: "#F2B705",
  HT: "#F2B705",
  RS: "#F4EFE6", // white
  CP: "#F4EFE6",
  CH: "#FFC85C",
  OH: "#FFC85C",
};

const VOICE_LABEL: Record<Voice, string> = {
  BD: "kick",
  SD: "snare",
  LT: "low tom",
  MT: "mid tom",
  HT: "hi tom",
  RS: "rim",
  CP: "clap",
  CH: "closed hat",
  OH: "open hat",
};

const VOICE_ORDER: Voice[] = ["BD", "SD", "LT", "MT", "HT", "RS", "CP", "CH", "OH"];

// keyboard mapping: 1..9 → voice
const KEY_TO_VOICE: Record<string, Voice> = {
  "1": "BD", "2": "SD", "3": "LT", "4": "MT", "5": "HT",
  "6": "RS", "7": "CP", "8": "CH", "9": "OH",
};

// Wrapper provides the spotlight context to all children (LessonPanel,
// Knobs, step buttons). The actual room render is Lab909Inner.
export function Lab909Client() {
  return (
    <LessonSpotlightProvider>
      <Lab909Inner />
    </LessonSpotlightProvider>
  );
}

function Lab909Inner() {
  const { isActive } = useSpotlight();
  const [armed, setArmed] = useState(false); // audio unlocked?
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(124);
  const [swing, setSwing] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);
  const [activeVoice, setActiveVoice] = useState<Voice>("BD");
  const [presetId, setPresetId] = useState<string>("chicago-4x4");
  const [rows, setRows] = useState<StepRow[]>(() => presetToRows(PRESETS[0]));
  // Track param-state separately so React re-renders when knobs move.
  const [params, setParams] = useState<Record<Voice, VoiceParams>>(() => ({
    BD: { level: 1.0, tune: 0, decay: 0.45 },
    SD: { level: 0.85, tune: 0, decay: 0.35, tone: 0.5, snappy: 0.5 },
    LT: { level: 0.8, tune: -0.3, decay: 0.55 },
    MT: { level: 0.8, tune: 0, decay: 0.5 },
    HT: { level: 0.8, tune: 0.3, decay: 0.45 },
    RS: { level: 0.7, tune: 0, decay: 0.1 },
    CP: { level: 0.85, tune: 0, decay: 0.4, tone: 0.3 },
    CH: { level: 0.7, tune: 0, decay: 0.08 },
    OH: { level: 0.7, tune: 0, decay: 0.4 },
  }));
  const [flash, setFlash] = useState<Voice | null>(null);
  const flashTimer = useRef<number | null>(null);
  const [bars, setBars] = useState(2);

  // ---- lesson state ----
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(-1); // -1 = intro

  // ---- MIDI state ----
  // `mounted` defers any client-only branches (Web MIDI availability check)
  // until after hydration so SSR + first client render match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [midiOutputs, setMidiOutputs] = useState<MidiDevice[]>([]);
  const [midiOutId, setMidiOutId] = useState<string>("");
  const [midiInputs, setMidiInputs] = useState<MidiDevice[]>([]);
  const [midiInId, setMidiInId] = useState<string>("");
  // sync mode: int = browser is master, ext = MIDI clock drives us, link = Ableton Link bridge drives us
  const [syncMode, setSyncMode] = useState<"int" | "ext" | "link">("int");
  const [detectedBpm, setDetectedBpm] = useState<number | null>(null);
  // Link state
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("disconnected");
  const [linkState, setLinkState] = useState<LinkState | null>(null);
  const linkClientRef = useRef<LinkClient | null>(null);
  const linkDriverRef = useRef<LinkStepDriver | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<Engine909 | null>(null);
  const seqRef = useRef<Sequencer | null>(null);
  const midiOutIdRef = useRef<string>("");
  const clockOutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- audio init ----
  const ensureAudio = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const Ctx = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const engine = new Engine909(ctx);
    // sync initial params
    (Object.keys(params) as Voice[]).forEach((v) => {
      (Object.keys(params[v]) as (keyof VoiceParams)[]).forEach((k) => {
        const val = params[v][k];
        if (val !== undefined) engine.setParam(v, k, val);
      });
    });
    const seq = new Sequencer(engine);
    seq.setRows(rows);
    seq.setBpm(bpm);
    seq.setSwing(swing);
    seq.onStepChange((s) => setCurrentStep(s));
    seq.onBpmDetectedFromClock((b) => {
      setDetectedBpm(b);
      setBpm(b);
    });
    // When the sequencer fires a voice, also pump it to MIDI out if a
    // device is selected. Read from the ref so we don't have to rebuild
    // the engine when the selection changes.
    seq.onTriggerOut((voice, vel) => {
      const out = midiOutIdRef.current;
      if (!out) return;
      const note = VOICE_TO_MIDI_NOTE[voice];
      if (!note) return;
      const v = Math.round(60 + vel * 60);
      void sendNoteOn(out, note, v, 9);
      window.setTimeout(() => { void sendNoteOff(out, note, 9); }, 50);
    });
    ctxRef.current = ctx;
    engineRef.current = engine;
    seqRef.current = seq;
    void ctx.resume();
    setArmed(true);
    return ctx;
  }, [bpm, params, rows, swing]);

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

  // BPM / swing live-update
  useEffect(() => { seqRef.current?.setBpm(bpm); }, [bpm]);
  useEffect(() => { seqRef.current?.setSwing(swing); }, [swing]);
  // Pass row changes to the live sequencer
  useEffect(() => { seqRef.current?.setRows(rows); }, [rows]);

  // ---- pad trigger ----
  const flashFor = useCallback((v: Voice) => {
    setFlash(v);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 120);
  }, []);

  const trigger = useCallback((voice: Voice) => {
    const ctx = ensureAudio();
    if (!ctx) return;
    engineRef.current?.trigger(voice, ctx.currentTime, 1);
    flashFor(voice);
  }, [ensureAudio, flashFor]);

  // ---- step edit ----
  const toggleStep = useCallback((voice: Voice, step: number) => {
    setRows((rs) =>
      rs.map((r) => {
        if (r.voice !== voice) return r;
        const next = r.steps.slice();
        next[step] = !next[step];
        return { ...r, steps: next };
      })
    );
  }, []);

  const clearAll = useCallback(() => {
    setRows((rs) => rs.map((r) => ({ ...r, steps: new Array(16).fill(false) })));
  }, []);

  // What's currently rendering — tracks which export button is busy.
  const [exportingKind, setExportingKind] = useState<null | "wav" | "stems" | "kit">(null);

  const exportWav = useCallback(async () => {
    if (exportingKind) return;
    setExportingKind("wav");
    try {
      const buf = await renderPatternToBuffer({ rows, params, bpm, swing, bars });
      const blob = bufferToWavBlob(buf);
      const preset = PRESETS.find((p) => p.id === presetId);
      const stamp = new Date().toISOString().slice(0, 10);
      const name = `lab-909-${preset?.id ?? "pattern"}-${bpm}bpm-${stamp}.wav`;
      downloadBlob(blob, name);
    } catch (err) {
      console.error("export failed", err);
    } finally {
      setExportingKind(null);
    }
  }, [bars, bpm, exportingKind, params, presetId, rows, swing]);

  const exportStems = useCallback(async () => {
    if (exportingKind) return;
    setExportingKind("stems");
    try {
      const meta = { presetId, bpm, swing, bars };
      const blob = await buildStemsZip({ rows, params, bpm, swing, bars }, meta);
      downloadStems(blob, meta);
    } catch (err) {
      console.error("stems export failed", err);
    } finally {
      setExportingKind(null);
    }
  }, [bars, bpm, exportingKind, params, presetId, rows, swing]);

  const exportKit = useCallback(async () => {
    if (exportingKind) return;
    setExportingKind("kit");
    try {
      const meta = { presetId, bpm, swing, bars };
      const blob = await buildKitZip({ rows, params, bpm, swing, bars }, meta);
      downloadKit(blob, meta);
    } catch (err) {
      console.error("kit export failed", err);
    } finally {
      setExportingKind(null);
    }
  }, [bars, bpm, exportingKind, params, presetId, rows, swing]);

  // ---- knob changes ----
  const setVoiceParam = useCallback(<K extends keyof VoiceParams>(voice: Voice, key: K, val: VoiceParams[K]) => {
    setParams((p) => ({ ...p, [voice]: { ...p[voice], [key]: val } }));
    engineRef.current?.setParam(voice, key, val);
  }, []);

  // ---- preset load ----
  const loadPreset = useCallback((id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(id);
    setRows(presetToRows(p));
    setBpm(p.bpm);
    setSwing(p.swing);
  }, []);

  // ---- MIDI outputs (Web MIDI) ----
  useEffect(() => {
    if (!isMidiSupported()) return;
    let cancelled = false;
    let unsub: (() => void) | null = null;
    const refresh = async () => {
      const outs = await listOutputs();
      const ins = await listInputs();
      if (!cancelled) {
        setMidiOutputs(outs);
        setMidiInputs(ins);
      }
    };
    void refresh();
    void onMidiStateChange(refresh).then((u) => { if (cancelled) u(); else unsub = u; });
    return () => { cancelled = true; unsub?.(); };
  }, []);
  useEffect(() => { midiOutIdRef.current = midiOutId; }, [midiOutId]);

  // ---- MIDI input: route incoming drum notes → trigger engine,
  //                  and route clock/transport → sequencer when EXT mode ----
  useEffect(() => {
    if (!midiInId) return;
    let cancelled = false;
    let unbind: (() => void) | null = null;
    void bindInput(midiInId, (msg) => {
      if (cancelled) return;
      const seq = seqRef.current;
      switch (msg.type) {
        case "noteon": {
          const voice = MIDI_NOTE_TO_VOICE[msg.note];
          if (!voice) return;
          const ctx = ensureAudio();
          if (!ctx) return;
          engineRef.current?.trigger(voice as Voice, ctx.currentTime, msg.velocity || 0.9);
          flashFor(voice as Voice);
          return;
        }
        case "clock":
          seq?.externalTick();
          return;
        case "start":
          if (seq?.isExternal()) { seq.externalStart(); setPlaying(true); }
          return;
        case "continue":
          if (seq?.isExternal()) { seq.externalContinue(); setPlaying(true); }
          return;
        case "stop":
          if (seq?.isExternal()) { seq.externalStop(); setPlaying(false); setCurrentStep(-1); }
          return;
      }
    }).then((u) => { if (cancelled) u(); else unbind = u; });
    return () => { cancelled = true; unbind?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [midiInId]);

  // Toggle external-sync on the sequencer when the dropdown changes
  useEffect(() => {
    // EXT and LINK both drive the sequencer externally — same machinery
    seqRef.current?.setExternalSync(syncMode === "ext" || syncMode === "link");
    if (syncMode === "int") setDetectedBpm(null);
  }, [syncMode]);

  // ---- Ableton Link client (only active when LINK mode is selected) ----
  useEffect(() => {
    if (syncMode !== "link") {
      linkClientRef.current?.close();
      linkClientRef.current = null;
      linkDriverRef.current = null;
      setLinkStatus("disconnected");
      return;
    }
    // Build a step driver that aligns its zero-point to the next downbeat
    // and pushes 16th-note step indices into the sequencer.
    const driver = new LinkStepDriver((step) => {
      seqRef.current?.setStepFromExternal(step);
    });
    linkDriverRef.current = driver;
    const client = new LinkClient({
      onStatus: (s) => setLinkStatus(s),
      onState: (state) => {
        setLinkState(state);
        // Adopt Link's tempo for display + WAV export render-time math
        if (state.bpm && Math.abs(state.bpm - bpm) > 0.05) {
          setBpm(Math.round(state.bpm));
        }
        // If we haven't aligned yet, align so we start clean on the next beat
        if (driver["startOffset"] === 0) driver.reset(state.beat);
        // When Link says "playing", make sure the sequencer reflects it
        const seq = seqRef.current;
        if (seq) {
          if (state.playing && !seq.state.playing) {
            seq.externalStart();
            setPlaying(true);
          } else if (!state.playing && seq.state.playing) {
            seq.externalStop();
            setPlaying(false);
            setCurrentStep(-1);
          }
        }
        // tick the driver — fires a step callback whenever the 16th slot rolls
        driver.update(state.beat, state.quantum);
      },
    });
    linkClientRef.current = client;
    client.connect();
    return () => {
      client.close();
      linkClientRef.current = null;
      linkDriverRef.current = null;
    };
    // We only want to (re)build the client when sync mode changes — bpm
    // updates flow back from Link itself, not from React state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncMode]);

  // Warm the MIDI output cache + clean up clock-out timer on output change
  useEffect(() => {
    if (midiOutId) void warmOutput(midiOutId);
    return () => {
      if (clockOutTimerRef.current) {
        clearInterval(clockOutTimerRef.current);
        clockOutTimerRef.current = null;
      }
    };
  }, [midiOutId]);

  // Drive MIDI clock OUT when playing in INT mode with a selected output
  useEffect(() => {
    if (clockOutTimerRef.current) {
      clearInterval(clockOutTimerRef.current);
      clockOutTimerRef.current = null;
    }
    if (syncMode !== "int" || !midiOutId || !playing) return;
    sendStartSync(midiOutId);
    const tickMs = 60000 / bpm / 24;
    clockOutTimerRef.current = setInterval(() => {
      sendClockTickSync(midiOutId);
    }, tickMs);
    return () => {
      if (clockOutTimerRef.current) {
        clearInterval(clockOutTimerRef.current);
        clockOutTimerRef.current = null;
      }
      sendStopSync(midiOutId);
    };
  }, [playing, bpm, midiOutId, syncMode]);

  // ---- lesson handling ----
  const lesson = useMemo(() => LESSONS_909.find((l) => l.id === lessonId) ?? null, [lessonId]);
  const lessonState: Lesson909State = useMemo(
    () => ({ rows, bpm, swing, playing }),
    [rows, bpm, swing, playing]
  );
  // When entering lesson mode, start by clearing the grid so the user actually
  // builds it. Stash this in a ref so we only do it once per lesson start.
  const lastLessonRef = useRef<string | null>(null);
  useEffect(() => {
    if (lessonId && lessonId !== lastLessonRef.current) {
      lastLessonRef.current = lessonId;
      // clear the grid + reset transport so the lesson starts from zero
      setRows((rs) => rs.map((r) => ({ ...r, steps: new Array(16).fill(false) })));
      setPresetId("blank");
      setBpm(124);
      setSwing(0);
      setStepIdx(-1);
    }
    if (!lessonId) {
      lastLessonRef.current = null;
    }
  }, [lessonId]);

  const advanceLesson = useCallback(() => {
    if (!lesson) return;
    setStepIdx((i) => Math.min(i + 1, lesson.steps.length));
  }, [lesson]);

  const exitLesson = useCallback(() => {
    setLessonId(null);
    setStepIdx(-1);
  }, []);

  // auto-advance when current step's check passes
  const onStepComplete = useCallback((completedIdx: number) => {
    // brief celebrate delay so the user sees their action register
    setStepIdx((cur) => (cur === completedIdx ? cur + 1 : cur));
  }, []);

  // ---- keyboard ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement | null)?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
        return;
      }
      const v = KEY_TO_VOICE[e.key];
      if (v) {
        e.preventDefault();
        trigger(v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, trigger]);

  // ---- cleanup ----
  useEffect(() => {
    return () => {
      seqRef.current?.stop();
      try { void ctxRef.current?.close(); } catch {}
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const activeParams = params[activeVoice];
  const activePreset = useMemo(() => PRESETS.find((p) => p.id === presetId)!, [presetId]);

  return (
    <div className="relative">
      {!armed && (
        <button
          onClick={() => { ensureAudio(); }}
          className="absolute inset-0 z-30 flex items-center justify-center bg-ink/85 backdrop-blur-sm cursor-pointer"
          aria-label="Tap to start audio"
        >
          <div className="border-2 border-lamp px-8 py-6 bg-ink hover:bg-ink-2 transition-colors">
            <div className="font-mono text-[11px] tracking-[.16em] uppercase text-lamp mb-1">
              READY
            </div>
            <div className="font-display font-bold uppercase text-[28px] tracking-[-0.01em]">
              tap to power on
            </div>
            <div className="font-serif italic text-[14px] text-paper-2 mt-1">
              browsers require a click before we can make any noise.
            </div>
          </div>
        </button>
      )}

      {/* LESSON PANEL — renders when a lesson is active */}
      {lesson && (
        <LessonPanel
          lesson={lesson}
          state={lessonState}
          stepIdx={stepIdx}
          onAdvance={advanceLesson}
          onExit={exitLesson}
          onStepComplete={onStepComplete}
        />
      )}

      {/* MACHINE PANEL */}
      <div className="border-2 border-paper bg-ink-2 overflow-hidden">
        {/* TOP STRIP — brand + transport */}
        <div className="flex items-stretch border-b-2 border-paper">
          <div className="bg-redline text-paper px-4 py-3 border-r-2 border-paper">
            <div className="font-mono text-[9px] tracking-[.18em] uppercase opacity-80">ROLAND</div>
            <div className="font-display font-bold text-[20px] uppercase leading-none tracking-[-0.02em]">TR-909</div>
            <div className="font-mono text-[8px] tracking-[.18em] uppercase opacity-80 mt-1">
              RHYTHM COMPOSER · BROWSER MODEL
            </div>
          </div>

          {/* transport */}
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
                onChange={(e) => setBpm(Math.max(60, Math.min(200, Number(e.target.value) || 124)))}
                className="bg-ink border border-paper px-2 py-1 font-mono text-[14px] text-paper w-[64px] focus:outline-none focus:border-lamp"
              />
              <input
                type="range" min={60} max={200} step={1}
                value={bpm} onChange={(e) => setBpm(Number(e.target.value))}
                className="w-[100px] accent-lamp"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">SWING</span>
              <input
                type="range" min={0} max={0.5} step={0.01}
                value={swing} onChange={(e) => setSwing(Number(e.target.value))}
                className="w-[100px] accent-lamp"
              />
              <span className="font-mono text-[10px] text-paper-2 w-[36px]">{Math.round(swing * 100)}%</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">PRESET</span>
              <select
                value={presetId}
                onChange={(e) => loadPreset(e.target.value)}
                className="bg-ink border border-paper px-2 py-1 font-mono text-[12px] text-paper focus:outline-none focus:border-lamp"
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={clearAll}
              className="font-mono text-[10px] tracking-[.14em] uppercase border border-paper/50 text-paper-2 hover:border-paper hover:text-paper px-3 py-1.5 transition-colors"
            >
              clear grid
            </button>

            {/* lesson selector — short row with one button per lesson */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">LESSON</span>
              {LESSONS_909.map((l) => {
                const active = lessonId === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => setLessonId(active ? null : l.id)}
                    className={`font-mono text-[10px] tracking-[.06em] uppercase px-2 py-1.5 border transition-colors ${
                      active
                        ? "border-lamp bg-lamp text-ink"
                        : "border-paper/50 text-paper-2 hover:border-paper hover:text-paper"
                    }`}
                  >
                    {active ? "✓ " : ""}{l.title.toLowerCase()}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {mounted && isMidiSupported() && (
                <>
                  <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">SYNC</span>
                  <div className="flex border border-paper/50">
                    <button
                      onClick={() => setSyncMode("int")}
                      className={`font-mono text-[10px] tracking-[.08em] uppercase px-2 py-1 transition-colors ${
                        syncMode === "int" ? "bg-lamp text-ink" : "text-paper-2 hover:bg-ink"
                      }`}
                      title="Browser is master — sends clock to OUT"
                    >
                      int
                    </button>
                    <button
                      onClick={() => setSyncMode("ext")}
                      className={`font-mono text-[10px] tracking-[.08em] uppercase px-2 py-1 transition-colors border-l border-paper/50 ${
                        syncMode === "ext" ? "bg-lamp text-ink" : "text-paper-2 hover:bg-ink"
                      }`}
                      title="External MIDI clock (Move USB / DAW) drives transport"
                    >
                      ext
                    </button>
                    <button
                      onClick={() => setSyncMode("link")}
                      className={`font-mono text-[10px] tracking-[.08em] uppercase px-2 py-1 transition-colors border-l border-paper/50 ${
                        syncMode === "link" ? "bg-lamp text-ink" : "text-paper-2 hover:bg-ink"
                      }`}
                      title="Ableton Link over WiFi — needs the local bridge running (npm run link-bridge)"
                    >
                      link
                    </button>
                  </div>
                  {syncMode === "ext" && detectedBpm && (
                    <span className="font-mono text-[10px] text-lamp">{detectedBpm}</span>
                  )}
                  {syncMode === "link" && (
                    <span
                      className={`font-mono text-[10px] ${
                        linkStatus === "connected" ? "text-lamp" : "text-redline"
                      }`}
                      title={linkStatus === "connected"
                        ? `Connected · ${linkState?.backend ?? ""}`
                        : "Run: npm run link-bridge"}
                    >
                      {linkStatus === "connected"
                        ? `● ${linkState?.peers ?? 0}p · ${Math.round(linkState?.bpm ?? 0)}`
                        : linkStatus === "connecting" ? "○ connecting…" : "○ bridge off"}
                    </span>
                  )}
                  <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">MIDI IN</span>
                  <select
                    value={midiInId}
                    onChange={(e) => setMidiInId(e.target.value)}
                    className="bg-ink border border-paper px-2 py-1 font-mono text-[11px] text-paper focus:outline-none focus:border-lamp max-w-[140px]"
                    title="Receive notes (GM drum map) + clock from external sequencer"
                  >
                    <option value="">none</option>
                    {midiInputs.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">OUT</span>
                  <select
                    value={midiOutId}
                    onChange={(e) => setMidiOutId(e.target.value)}
                    className="bg-ink border border-paper px-2 py-1 font-mono text-[11px] text-paper focus:outline-none focus:border-lamp max-w-[140px]"
                    title="Send sequencer notes + clock to external drum module / DAW"
                  >
                    <option value="">none</option>
                    {midiOutputs.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </>
              )}
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">BARS</span>
              <select
                value={bars}
                onChange={(e) => setBars(Number(e.target.value))}
                className="bg-ink border border-paper px-2 py-1 font-mono text-[12px] text-paper focus:outline-none focus:border-lamp"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={8}>8</option>
              </select>
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">EXPORT</span>
              <button
                onClick={exportWav}
                disabled={!!exportingKind}
                title="Single mixed WAV of the full pattern"
                className={`font-display font-semibold text-[11px] tracking-[.04em] uppercase px-2 py-1.5 border transition-colors ${
                  exportingKind === "wav"
                    ? "border-on-dark text-on-dark cursor-wait"
                    : exportingKind
                      ? "border-paper/30 text-paper-2 cursor-not-allowed"
                      : "border-lamp text-lamp hover:bg-lamp hover:text-ink"
                }`}
              >
                {exportingKind === "wav" ? "…" : "↓ wav"}
              </button>
              <button
                onClick={exportStems}
                disabled={!!exportingKind}
                title="Per-voice WAV stems (DAW workflow) — zipped"
                className={`font-display font-semibold text-[11px] tracking-[.04em] uppercase px-2 py-1.5 border transition-colors ${
                  exportingKind === "stems"
                    ? "border-on-dark text-on-dark cursor-wait"
                    : exportingKind
                      ? "border-paper/30 text-paper-2 cursor-not-allowed"
                      : "border-lamp text-lamp hover:bg-lamp hover:text-ink"
                }`}
              >
                {exportingKind === "stems" ? "…" : "↓ stems"}
              </button>
              <button
                onClick={exportKit}
                disabled={!!exportingKind}
                title="Move + KO II / EP-133 kit: one-shots per voice + loop + manifest"
                className={`font-display font-semibold text-[11px] tracking-[.04em] uppercase px-2 py-1.5 border transition-colors ${
                  exportingKind === "kit"
                    ? "border-on-dark text-on-dark cursor-wait"
                    : exportingKind
                      ? "border-paper/30 text-paper-2 cursor-not-allowed"
                      : "border-redline text-redline hover:bg-redline hover:text-paper"
                }`}
              >
                {exportingKind === "kit" ? "…" : "↓ kit"}
              </button>
            </div>
          </div>
        </div>

        {/* preset story */}
        <div className="px-4 py-2 border-b border-paper/30 bg-ink">
          <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp">
            {activePreset.name.toUpperCase()} · {activePreset.origin.toUpperCase()}
          </div>
          <div className="font-serif italic text-[13px] text-paper-2 leading-snug mt-0.5 max-w-[760px]">
            {activePreset.story}
          </div>
        </div>

        {/* STEP GRID */}
        <div className="px-4 py-4 border-b-2 border-paper bg-ink overflow-x-auto">
          <div className="min-w-[820px]">
            {/* step header */}
            <div className="grid items-center" style={{ gridTemplateColumns: "84px repeat(16, minmax(0, 1fr))", gap: 4 }}>
              <div />
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className={`font-mono text-[9px] tracking-[.14em] uppercase text-center pb-1 ${
                    currentStep === i ? "text-lamp" : i % 4 === 0 ? "text-paper" : "text-on-dark"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            {rows.map((row) => {
              const color = VOICE_COLOR[row.voice];
              const isActiveVoice = activeVoice === row.voice;
              return (
                <div
                  key={row.voice}
                  className="grid items-center mb-1"
                  style={{ gridTemplateColumns: "84px repeat(16, minmax(0, 1fr))", gap: 4 }}
                >
                  <button
                    onClick={() => { setActiveVoice(row.voice); trigger(row.voice); }}
                    className={`text-left font-mono text-[10px] tracking-[.14em] uppercase px-2 py-2 border-2 transition-all ${
                      isActiveVoice
                        ? "border-lamp text-lamp bg-ink-2"
                        : "border-paper/30 text-paper-2 hover:border-paper hover:text-paper"
                    }`}
                  >
                    <span className="block font-display text-[13px] font-bold leading-none" style={{ color: isActiveVoice ? "#F2B705" : color }}>
                      {row.voice}
                    </span>
                    <span className="block text-[9px] leading-none mt-1">{VOICE_LABEL[row.voice]}</span>
                  </button>
                  {row.steps.map((on, stepIdx) => {
                    const isPlayhead = currentStep === stepIdx;
                    const isDownbeat = stepIdx % 4 === 0;
                    const spot = isActive(`909:step:${row.voice}:${stepIdx}`);
                    return (
                      <button
                        key={stepIdx}
                        onClick={() => toggleStep(row.voice, stepIdx)}
                        className={`aspect-square border transition-all ${
                          on
                            ? "border-paper"
                            : isDownbeat
                              ? "border-paper/40 bg-ink-2 hover:bg-ink-3"
                              : "border-paper/15 bg-ink hover:bg-ink-2"
                        } ${spot ? "spotlight-on" : ""}`}
                        style={{
                          background: on
                            ? isPlayhead ? "#F2B705" : color
                            : undefined,
                          boxShadow: isPlayhead && on ? `0 0 12px ${color}` : undefined,
                          transform: isPlayhead ? "scale(1.06)" : undefined,
                        }}
                        aria-label={`${row.voice} step ${stepIdx + 1}`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* DRUM STRIP — big pads + tuning */}
        <div className="grid md:grid-cols-[1fr_auto] gap-0">
          {/* pads */}
          <div className="p-4 border-r-2 border-paper">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-on-dark mb-2">
              VOICE STRIP · click or use number keys 1–9
            </div>
            <div className="grid grid-cols-9 gap-2">
              {VOICE_ORDER.map((v) => {
                const isActive = activeVoice === v;
                const isFlash = flash === v;
                return (
                  <button
                    key={v}
                    onClick={() => { setActiveVoice(v); trigger(v); }}
                    className={`relative aspect-[3/4] border-2 transition-all flex flex-col items-stretch justify-end pb-2 pt-1 ${
                      isActive ? "border-lamp" : "border-paper/40 hover:border-paper"
                    }`}
                    style={{
                      background: isFlash
                        ? VOICE_COLOR[v]
                        : `linear-gradient(180deg, ${VOICE_COLOR[v]}26 0%, ${VOICE_COLOR[v]}11 100%)`,
                      boxShadow: isFlash ? `0 0 20px ${VOICE_COLOR[v]}` : undefined,
                    }}
                  >
                    <span
                      className="absolute top-1.5 left-1.5 font-mono text-[8px] tracking-[.14em] opacity-60"
                      style={{ color: isFlash ? "#0B0B0B" : "#F4EFE6" }}
                    >
                      {Object.keys(KEY_TO_VOICE).find((k) => KEY_TO_VOICE[k] === v)}
                    </span>
                    <span
                      className="font-display font-bold text-[16px] leading-none tracking-[-0.01em] text-center"
                      style={{ color: isFlash ? "#0B0B0B" : VOICE_COLOR[v] }}
                    >
                      {v}
                    </span>
                    <span
                      className="font-mono text-[8px] tracking-[.1em] uppercase text-center mt-0.5"
                      style={{ color: isFlash ? "#0B0B0B" : "#C8C2B4" }}
                    >
                      {VOICE_LABEL[v]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* tuning panel */}
          <div className="p-4 min-w-[280px]">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-on-dark">
              TUNING · {activeVoice} {VOICE_LABEL[activeVoice]}
            </div>
            <div className="font-serif italic text-[12px] text-paper-2 leading-snug mt-1 mb-3">
              {tuningHint(activeVoice)}
            </div>
            <div className="flex flex-wrap gap-3">
              <Knob
                label="LEVEL"
                value={activeParams.level}
                onChange={(v) => setVoiceParam(activeVoice, "level", v)}
                color={VOICE_COLOR[activeVoice]}
                defaultValue={0.85}
                format={(v) => `${Math.round(v * 100)}`}
              />
              <Knob
                label="TUNE"
                value={(activeParams.tune + 1) / 2}
                onChange={(v) => setVoiceParam(activeVoice, "tune", v * 2 - 1)}
                color={VOICE_COLOR[activeVoice]}
                defaultValue={0.5}
                format={(v) => {
                  const n = v * 2 - 1;
                  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;
                }}
              />
              <Knob
                label="DECAY"
                value={activeParams.decay}
                onChange={(v) => setVoiceParam(activeVoice, "decay", v)}
                color={VOICE_COLOR[activeVoice]}
                defaultValue={0.4}
                format={(v) => `${Math.round(v * 100)}`}
              />
              {activeParams.tone !== undefined && (
                <Knob
                  label="TONE"
                  value={activeParams.tone}
                  onChange={(v) => setVoiceParam(activeVoice, "tone", v)}
                  color={VOICE_COLOR[activeVoice]}
                  defaultValue={0.5}
                  format={(v) => `${Math.round(v * 100)}`}
                />
              )}
              {activeParams.snappy !== undefined && (
                <Knob
                  label="SNAPPY"
                  value={activeParams.snappy}
                  onChange={(v) => setVoiceParam(activeVoice, "snappy", v)}
                  color={VOICE_COLOR[activeVoice]}
                  defaultValue={0.5}
                  format={(v) => `${Math.round(v * 100)}`}
                />
              )}
            </div>
            <div className="font-mono text-[9px] tracking-[.12em] uppercase text-on-dark mt-3">
              drag · scroll · double-click resets
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 font-mono text-[10px] tracking-[.14em] uppercase text-on-dark text-center">
        space = play/stop · 1–9 = trigger voice · click steps to edit
      </div>
    </div>
  );
}

function tuningHint(v: Voice): string {
  switch (v) {
    case "BD": return "the 909 kick is a fast pitch sweep on a sine. tune up = harder thud, decay long = sub bass.";
    case "SD": return "tone is the two pitched oscillators. snappy is the noise on top. balance both for the 909 character.";
    case "LT":
    case "MT":
    case "HT": return "triangle osc with a pitch envelope. tune up to walk between lt/mt/ht.";
    case "RS": return "tight square + filtered noise. the 808 had the more famous rim; the 909 is sharper.";
    case "CP": return "three quick noise bursts + a tail. tone shifts the room.";
    case "CH": return "fast filtered noise. decay tiny — that's what makes it 'closed'.";
    case "OH": return "same noise filter, longer envelope. the 909's open hat is the heartbeat of house.";
  }
}
