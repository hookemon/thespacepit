"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EngineMoog,
  MOOG_DEFAULTS,
  midiToHz,
  midiToName,
  type MoogParams,
  type Waveform,
} from "../_lib/engineMoog";
import { MOOG_PRESETS } from "../_lib/presetsMoog";
import { LESSONS_MOOG, type LessonMoogState } from "../_lib/lessonsMoog";
import {
  bindInput,
  isMidiSupported,
  listInputs,
  onMidiStateChange,
  type MidiDevice,
} from "../_lib/midi";
import { Knob } from "../_components/Knob";
import { LessonPanel } from "../_components/LessonPanel";
import { LessonSpotlightProvider, useSpotlight } from "../_components/LessonSpotlight";
import { RecorderBar } from "../_components/RecorderBar";

// computer-keyboard → midi offset (relative to base octave * 12 + 60)
// row asdfghjk = white keys, wetyu = black keys, ; and ' extend.
const KEY_TO_OFFSET: Record<string, number> = {
  a: 0, s: 2, d: 4, f: 5, g: 7, h: 9, j: 11, k: 12, l: 14, ";": 16, "'": 17,
  w: 1, e: 3, t: 6, y: 8, u: 10, o: 13, p: 15,
};

const WAVEFORMS: Waveform[] = ["sawtooth", "square", "triangle", "sine"];

const WAVE_GLYPH: Record<Waveform, string> = {
  sawtooth: "/\\",
  square: "▆▁",
  triangle: "△▽",
  sine: "∿",
};

// 2-octave keyboard layout (C4 to C6 by default, shiftable)
const WHITE_KEYS_PER_OCTAVE = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
const BLACK_KEYS_PER_OCTAVE = [1, 3, 6, 8, 10];       // C#, D#, F#, G#, A#

// Wrapper provides the spotlight context to children.
export function LabMoogClient() {
  return (
    <LessonSpotlightProvider>
      <LabMoogInner />
    </LessonSpotlightProvider>
  );
}

function LabMoogInner() {
  const { isActive } = useSpotlight();
  const [armed, setArmed] = useState(false);
  const [params, setParams] = useState<MoogParams>({ ...MOOG_DEFAULTS });
  const [octaveBase, setOctaveBase] = useState(48); // C3 → midi 48
  const [activeMidi, setActiveMidi] = useState<number | null>(null);
  const [presetId, setPresetId] = useState<string>("flash-light");
  const [lastNoteMidi, setLastNoteMidi] = useState<number | null>(null);
  const [lastNotePlayedAt, setLastNotePlayedAt] = useState<number>(0);

  // ---- lesson state ----
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(-1);

  // ---- MIDI inputs ----
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [midiInputs, setMidiInputs] = useState<MidiDevice[]>([]);
  const [midiInId, setMidiInId] = useState<string>("");

  const ctxRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<EngineMoog | null>(null);
  const heldKeys = useRef<Set<string>>(new Set());
  const midiHeldRef = useRef<Set<number>>(new Set());

  // ---- audio init ----
  const ensureAudio = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const Ctx = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const engine = new EngineMoog(ctx);
    (Object.keys(params) as (keyof MoogParams)[]).forEach((k) => {
      const v = params[k];
      if (v !== undefined) engine.setParam(k, v as never);
    });
    ctxRef.current = ctx;
    engineRef.current = engine;
    void ctx.resume();
    setArmed(true);
    return ctx;
  }, [params]);

  const setParam = useCallback(<K extends keyof MoogParams>(key: K, val: MoogParams[K]) => {
    setParams((p) => ({ ...p, [key]: val }));
    engineRef.current?.setParam(key, val);
  }, []);

  const loadPreset = useCallback((id: string) => {
    const p = MOOG_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(id);
    const merged = { ...MOOG_DEFAULTS, ...p.params };
    setParams(merged);
    (Object.keys(merged) as (keyof MoogParams)[]).forEach((k) => {
      engineRef.current?.setParam(k, merged[k] as never);
    });
  }, []);

  // ---- note triggering ----
  const noteOn = useCallback((midi: number) => {
    ensureAudio();
    setActiveMidi(midi);
    setLastNoteMidi(midi);
    setLastNotePlayedAt(performance.now());
    engineRef.current?.noteOn(midiToHz(midi));
  }, [ensureAudio]);

  const noteOff = useCallback(() => {
    setActiveMidi(null);
    engineRef.current?.noteOff();
  }, []);

  // ---- computer keyboard input ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement | null)?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "z") { setOctaveBase((o) => Math.max(24, o - 12)); return; }
      if (k === "x") { setOctaveBase((o) => Math.min(96, o + 12)); return; }
      if (e.repeat) return;
      const offset = KEY_TO_OFFSET[k];
      if (offset === undefined) return;
      e.preventDefault();
      heldKeys.current.add(k);
      noteOn(octaveBase + offset);
    };
    const onUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!heldKeys.current.has(k)) return;
      heldKeys.current.delete(k);
      e.preventDefault();
      if (heldKeys.current.size === 0) {
        noteOff();
      } else {
        // re-trigger the most recently held key (legato fallback)
        const remaining = Array.from(heldKeys.current);
        const last = remaining[remaining.length - 1];
        const offset = KEY_TO_OFFSET[last];
        if (offset !== undefined) noteOn(octaveBase + offset);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onUp);
    };
  }, [noteOn, noteOff, octaveBase]);

  useEffect(() => {
    return () => {
      try { void ctxRef.current?.close(); } catch {}
    };
  }, []);

  // ---- MIDI input wiring ----
  useEffect(() => {
    if (!isMidiSupported()) return;
    let cancelled = false;
    let unsub: (() => void) | null = null;
    const refresh = async () => {
      const ins = await listInputs();
      if (!cancelled) setMidiInputs(ins);
    };
    void refresh();
    void onMidiStateChange(refresh).then((u) => { if (cancelled) u(); else unsub = u; });
    return () => { cancelled = true; unsub?.(); };
  }, []);

  useEffect(() => {
    if (!midiInId) return;
    let cancelled = false;
    let unbind: (() => void) | null = null;
    void bindInput(midiInId, (msg) => {
      if (cancelled) return;
      if (msg.type === "noteon") {
        midiHeldRef.current.add(msg.note);
        noteOn(msg.note);
      } else {
        midiHeldRef.current.delete(msg.note);
        if (midiHeldRef.current.size === 0) {
          noteOff();
        } else {
          // legato: retrigger the most recent remaining note
          const remaining = Array.from(midiHeldRef.current);
          noteOn(remaining[remaining.length - 1]);
        }
      }
    }).then((u) => { if (cancelled) u(); else unbind = u; });
    return () => { cancelled = true; unbind?.(); };
  }, [midiInId, noteOn, noteOff]);

  // ---- lesson handling ----
  const lesson = useMemo(() => LESSONS_MOOG.find((l) => l.id === lessonId) ?? null, [lessonId]);
  const lessonState: LessonMoogState = useMemo(
    () => ({ params, octaveBase, lastNoteMidi, lastNotePlayedAt }),
    [params, octaveBase, lastNoteMidi, lastNotePlayedAt]
  );
  const lastLessonRef = useRef<string | null>(null);
  useEffect(() => {
    if (lessonId && lessonId !== lastLessonRef.current) {
      lastLessonRef.current = lessonId;
      // load init patch so the user can dial in from neutral
      const init = MOOG_PRESETS.find((p) => p.id === "init");
      if (init) {
        const merged = { ...MOOG_DEFAULTS, ...init.params };
        setParams(merged);
        (Object.keys(merged) as (keyof MoogParams)[]).forEach((k) => {
          engineRef.current?.setParam(k, merged[k] as never);
        });
        setPresetId("init");
      }
      setStepIdx(-1);
    }
    if (!lessonId) lastLessonRef.current = null;
  }, [lessonId]);

  const advanceLesson = useCallback(() => {
    if (!lesson) return;
    setStepIdx((i) => Math.min(i + 1, lesson.steps.length));
  }, [lesson]);
  const exitLesson = useCallback(() => {
    setLessonId(null);
    setStepIdx(-1);
  }, []);
  const onStepComplete = useCallback((completedIdx: number) => {
    setStepIdx((cur) => (cur === completedIdx ? cur + 1 : cur));
  }, []);

  const activePreset = useMemo(() => MOOG_PRESETS.find((p) => p.id === presetId)!, [presetId]);

  // build keyboard cells across 2 octaves
  const lowMidi = octaveBase;
  const highMidi = octaveBase + 24;

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

      {/* LESSON PANEL */}
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

      <div
        className="border-2 border-paper overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #2a1f12 0%, #1c1408 60%, #120c04 100%)",
        }}
      >
        {/* TOP BAR — brand + preset */}
        <div className="flex items-stretch border-b-2 border-paper">
          <div
            className="px-4 py-3 border-r-2 border-paper"
            style={{ background: "#3a2a18", color: "#F4EFE6" }}
          >
            <div className="font-mono text-[9px] tracking-[.18em] uppercase opacity-80">MOOG</div>
            <div className="font-display font-bold text-[20px] uppercase leading-none tracking-[-0.02em]">
              MINIBROWSER
            </div>
            <div className="font-mono text-[8px] tracking-[.18em] uppercase opacity-70 mt-1">
              MONOPHONIC SYNTHESIZER
            </div>
          </div>

          <div className="flex-1 flex items-center gap-4 px-4 py-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">PATCH</span>
              <select
                value={presetId}
                onChange={(e) => loadPreset(e.target.value)}
                className="bg-ink border border-paper px-2 py-1 font-mono text-[12px] text-paper focus:outline-none focus:border-lamp"
              >
                {MOOG_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">OCT</span>
              <button
                onClick={() => setOctaveBase((o) => Math.max(24, o - 12))}
                className="font-mono text-[12px] text-paper border border-paper/60 hover:border-lamp px-2 py-0.5"
              >−</button>
              <span className="font-mono text-[11px] text-paper">{midiToName(octaveBase)}</span>
              <button
                onClick={() => setOctaveBase((o) => Math.min(96, o + 12))}
                className="font-mono text-[12px] text-paper border border-paper/60 hover:border-lamp px-2 py-0.5"
              >+</button>
            </div>

            {/* lesson selector */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">LESSON</span>
              {LESSONS_MOOG.map((l) => {
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

            <div className="ml-auto">
              <RecorderBar
                getEngine={() => engineRef.current && ctxRef.current ? { ctx: ctxRef.current, master: engineRef.current.master } : null}
                roomSlug="moog"
                filenameSuffix={presetId}
              />
            </div>
            {mounted && isMidiSupported() && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">MIDI IN</span>
                <select
                  value={midiInId}
                  onChange={(e) => setMidiInId(e.target.value)}
                  className="bg-ink border border-paper px-2 py-1 font-mono text-[11px] text-paper focus:outline-none focus:border-lamp max-w-[140px]"
                >
                  <option value="">none</option>
                  {midiInputs.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* preset story */}
        <div
          className="px-4 py-2 border-b border-paper/40"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp">
            {activePreset.name.toUpperCase()} · {activePreset.origin.toUpperCase()}
          </div>
          <div className="font-serif italic text-[13px] text-paper-2 leading-snug mt-0.5 max-w-[760px]">
            {activePreset.story}
          </div>
        </div>

        {/* PANELS — oscillator, filter, envelopes */}
        <div className="grid md:grid-cols-3 gap-0 border-b-2 border-paper">
          {/* OSC */}
          <div className="p-4 border-r-2 border-paper/60">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp mb-2">OSCILLATOR</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {WAVEFORMS.map((w) => {
                const spot = isActive(`moog:wave:${w}`);
                return (
                  <button
                    key={w}
                    onClick={() => setParam("waveform", w)}
                    className={`font-mono text-[11px] uppercase tracking-[.08em] px-2 py-1 border transition-colors ${
                      params.waveform === w
                        ? "border-lamp text-lamp bg-ink"
                        : "border-paper/40 text-paper-2 hover:border-paper hover:text-paper"
                    } ${spot ? "spotlight-on" : ""}`}
                  >
                    <span className="mr-1.5 opacity-70">{WAVE_GLYPH[w]}</span>{w}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              <Knob
                label="DETUNE"
                spotlightId="moog:knob:DETUNE"
                value={(params.detune + 50) / 100}
                onChange={(v) => setParam("detune", v * 100 - 50)}
                defaultValue={0.5}
                format={(v) => `${Math.round(v * 100 - 50)}c`}
              />
              <Knob
                label="SUB"
                spotlightId="moog:knob:SUB"
                value={params.subLevel}
                onChange={(v) => setParam("subLevel", v)}
                defaultValue={0.4}
                format={(v) => `${Math.round(v * 100)}`}
              />
              <Knob
                label="GLIDE"
                spotlightId="moog:knob:GLIDE"
                value={params.glide}
                onChange={(v) => setParam("glide", v)}
                defaultValue={0}
                format={(v) => `${Math.round(v * 500)}ms`}
              />
              <Knob
                label="VOLUME"
                spotlightId="moog:knob:VOLUME"
                value={params.volume}
                onChange={(v) => setParam("volume", v)}
                defaultValue={0.7}
                format={(v) => `${Math.round(v * 100)}`}
              />
            </div>
          </div>

          {/* FILTER */}
          <div className="p-4 border-r-2 border-paper/60">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp mb-2">
              FILTER · 4-POLE LP
            </div>
            <div className="flex flex-wrap gap-3">
              <Knob
                label="CUTOFF"
                spotlightId="moog:knob:CUTOFF"
                value={params.cutoff}
                onChange={(v) => setParam("cutoff", v)}
                color="#F2B705"
                defaultValue={0.5}
                format={(v) => {
                  const hz = 30 * Math.pow(18000 / 30, v);
                  return hz > 1000 ? `${(hz / 1000).toFixed(1)}k` : `${Math.round(hz)}`;
                }}
              />
              <Knob
                label="RESO"
                spotlightId="moog:knob:RESO"
                value={params.resonance}
                onChange={(v) => setParam("resonance", v)}
                color="#F2B705"
                defaultValue={0.3}
                format={(v) => `${Math.round(v * 100)}`}
              />
              <Knob
                label="ENV AMT"
                spotlightId="moog:knob:ENVAMT"
                value={params.envAmount}
                onChange={(v) => setParam("envAmount", v)}
                color="#F2B705"
                defaultValue={0.6}
                format={(v) => `${Math.round(v * 100)}`}
              />
            </div>
            <div className="font-mono text-[9px] tracking-[.12em] uppercase text-on-dark mt-3 max-w-[260px] leading-snug">
              cutoff is where the filter starts cutting. resonance emphasizes that frequency — push it past ~70 and the filter starts singing.
            </div>
          </div>

          {/* ENVELOPES */}
          <div className="p-4">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp mb-2">FILTER ENV</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {([["fAttack","A"],["fDecay","D"],["fSustain","S"],["fRelease","R"]] as const).map(([k, l]) => (
                <Knob
                  key={k}
                  label={l}
                  spotlightId={`moog:knob:FILTER${l}`}
                  value={params[k]}
                  onChange={(v) => setParam(k, v)}
                  size={44}
                  defaultValue={0.3}
                  format={(v) => `${Math.round(v * 100)}`}
                />
              ))}
            </div>
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp mb-2">AMP ENV</div>
            <div className="flex flex-wrap gap-2">
              {([["aAttack","A"],["aDecay","D"],["aSustain","S"],["aRelease","R"]] as const).map(([k, l]) => (
                <Knob
                  key={k}
                  label={l}
                  spotlightId={`moog:knob:AMP${l}`}
                  value={params[k]}
                  onChange={(v) => setParam(k, v)}
                  size={44}
                  defaultValue={0.3}
                  format={(v) => `${Math.round(v * 100)}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* KEYBOARD */}
        <Keyboard
          lowMidi={lowMidi}
          highMidi={highMidi}
          activeMidi={activeMidi}
          onNoteOn={noteOn}
          onNoteOff={noteOff}
        />
      </div>

      <div className="mt-3 font-mono text-[10px] tracking-[.14em] uppercase text-on-dark text-center">
        a s d f g h j k l = white keys · w e t y u o p = black keys · z/x = octave down/up
      </div>
    </div>
  );
}

function Keyboard({
  lowMidi,
  highMidi,
  activeMidi,
  onNoteOn,
  onNoteOff,
}: {
  lowMidi: number;
  highMidi: number;
  activeMidi: number | null;
  onNoteOn: (m: number) => void;
  onNoteOff: () => void;
}) {
  const whiteMidis: number[] = [];
  for (let m = lowMidi; m < highMidi; m++) {
    const pc = ((m % 12) + 12) % 12;
    if (WHITE_KEYS_PER_OCTAVE.includes(pc)) whiteMidis.push(m);
  }
  const totalWhites = whiteMidis.length;

  // map each black key to its position between two white keys
  const blackKeys: { midi: number; whiteIndex: number }[] = [];
  for (let m = lowMidi; m < highMidi; m++) {
    const pc = ((m % 12) + 12) % 12;
    if (BLACK_KEYS_PER_OCTAVE.includes(pc)) {
      // find the white key to its left
      const leftWhite = whiteMidis.findIndex((w) => w === m - 1);
      if (leftWhite >= 0) blackKeys.push({ midi: m, whiteIndex: leftWhite });
    }
  }

  return (
    <div
      className="px-3 py-4"
      style={{ background: "linear-gradient(180deg, #120c04 0%, #0B0B0B 100%)" }}
    >
      <div className="font-mono text-[9px] tracking-[.16em] uppercase text-on-dark mb-2 text-center">
        KEYBOARD
      </div>
      <div className="relative mx-auto" style={{ maxWidth: 720 }}>
        {/* white keys */}
        <div className="grid" style={{ gridTemplateColumns: `repeat(${totalWhites}, 1fr)`, gap: 2 }}>
          {whiteMidis.map((m) => {
            const active = m === activeMidi;
            return (
              <button
                key={m}
                onPointerDown={() => onNoteOn(m)}
                onPointerUp={onNoteOff}
                onPointerLeave={onNoteOff}
                className={`relative h-32 border-2 transition-colors flex items-end justify-center pb-1 ${
                  active ? "bg-lamp text-ink border-lamp" : "bg-paper text-ink border-paper hover:bg-paper-2"
                }`}
                style={{ touchAction: "none" }}
                aria-label={`note ${midiToName(m)}`}
              >
                <span className="font-mono text-[9px] tracking-[.1em] uppercase opacity-50">
                  {midiToName(m)}
                </span>
              </button>
            );
          })}
        </div>
        {/* black keys overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {blackKeys.map(({ midi, whiteIndex }) => {
            const active = midi === activeMidi;
            // position centered between whiteIndex and whiteIndex+1
            const widthPct = 100 / totalWhites;
            const leftPct = widthPct * (whiteIndex + 1) - widthPct * 0.3;
            return (
              <button
                key={midi}
                onPointerDown={(e) => { e.stopPropagation(); onNoteOn(midi); }}
                onPointerUp={onNoteOff}
                onPointerLeave={onNoteOff}
                className={`absolute pointer-events-auto border-2 transition-colors ${
                  active ? "bg-lamp border-lamp" : "bg-ink border-ink hover:bg-ink-2"
                }`}
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct * 0.6}%`,
                  top: 0,
                  height: "60%",
                  touchAction: "none",
                }}
                aria-label={`note ${midiToName(midi)}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
