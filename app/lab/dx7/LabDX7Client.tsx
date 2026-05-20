"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EngineDX7,
  DX7_DEFAULTS,
  type Algorithm,
  type DX7Params,
  type OpParams,
} from "../_lib/engineDX7";
import { DX7_PRESETS } from "../_lib/presetsDX7";
import { Knob } from "../_components/Knob";
import { bindInput, isMidiSupported, listInputs, onMidiStateChange, type MidiDevice } from "../_lib/midi";

const KEY_TO_OFFSET: Record<string, number> = {
  a: 0, s: 2, d: 4, f: 5, g: 7, h: 9, j: 11, k: 12, l: 14, ";": 16, "'": 17,
  w: 1, e: 3, t: 6, y: 8, u: 10, o: 13, p: 15,
};

const ALGS: { id: Algorithm; label: string; ascii: string }[] = [
  { id: "cascade", label: "cascade", ascii: "4→3→2→1" },
  { id: "parallel", label: "parallel", ascii: "4→3 · 2→1" },
  { id: "fan", label: "fan", ascii: "4 →→→ 1·2·3" },
];

function midiToHz(midi: number) { return 440 * Math.pow(2, (midi - 69) / 12); }
function midiToName(midi: number) {
  const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  return `${names[((midi%12)+12)%12]}${Math.floor(midi/12)-1}`;
}

export function LabDX7Client() {
  const [armed, setArmed] = useState(false);
  const [params, setParams] = useState<DX7Params>({ ...DX7_DEFAULTS });
  const [presetId, setPresetId] = useState("bell");
  const [octaveBase, setOctaveBase] = useState(48);
  const [activeMidi, setActiveMidi] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [midiInputs, setMidiInputs] = useState<MidiDevice[]>([]);
  const [midiInId, setMidiInId] = useState<string>("");

  const ctxRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<EngineDX7 | null>(null);
  const heldRef = useRef<Set<string>>(new Set());
  const midiHeldRef = useRef<Set<number>>(new Set());

  const ensureAudio = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const Ctx = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const engine = new EngineDX7(ctx);
    // sync initial params
    engine.setParam("algorithm", params.algorithm);
    engine.setParam("volume", params.volume);
    params.ops.forEach((op, i) =>
      (Object.keys(op) as (keyof OpParams)[]).forEach((k) => engine.setOp(i as 0|1|2|3, k, op[k]))
    );
    ctxRef.current = ctx;
    engineRef.current = engine;
    void ctx.resume();
    setArmed(true);
    return ctx;
  }, [params]);

  const setAlgorithm = useCallback((alg: Algorithm) => {
    setParams((p) => ({ ...p, algorithm: alg }));
    engineRef.current?.setParam("algorithm", alg);
  }, []);

  const setVolume = useCallback((v: number) => {
    setParams((p) => ({ ...p, volume: v }));
    engineRef.current?.setParam("volume", v);
  }, []);

  const setOp = useCallback((idx: 0|1|2|3, key: keyof OpParams, val: number) => {
    setParams((p) => {
      const ops = p.ops.slice() as DX7Params["ops"];
      ops[idx] = { ...ops[idx], [key]: val };
      return { ...p, ops };
    });
    engineRef.current?.setOp(idx, key, val);
  }, []);

  const loadPreset = useCallback((id: string) => {
    const p = DX7_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(id);
    const merged: DX7Params = { ...DX7_DEFAULTS, ...p.params, ops: (p.params.ops as DX7Params["ops"]) ?? DX7_DEFAULTS.ops };
    setParams(merged);
    if (engineRef.current) {
      engineRef.current.setParam("algorithm", merged.algorithm);
      engineRef.current.setParam("volume", merged.volume);
      merged.ops.forEach((op, i) =>
        (Object.keys(op) as (keyof OpParams)[]).forEach((k) => engineRef.current!.setOp(i as 0|1|2|3, k, op[k]))
      );
    }
  }, []);

  const noteOn = useCallback((midi: number) => {
    ensureAudio();
    setActiveMidi(midi);
    engineRef.current?.noteOn(midiToHz(midi));
  }, [ensureAudio]);
  const noteOff = useCallback(() => {
    setActiveMidi(null);
    engineRef.current?.noteOff();
  }, []);

  // computer keyboard
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "z") { setOctaveBase((o) => Math.max(24, o-12)); return; }
      if (k === "x") { setOctaveBase((o) => Math.min(96, o+12)); return; }
      if (e.repeat) return;
      const off = KEY_TO_OFFSET[k];
      if (off === undefined) return;
      e.preventDefault();
      heldRef.current.add(k);
      noteOn(octaveBase + off);
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!heldRef.current.has(k)) return;
      heldRef.current.delete(k);
      if (heldRef.current.size === 0) noteOff();
      else {
        const last = Array.from(heldRef.current).pop()!;
        const off = KEY_TO_OFFSET[last];
        if (off !== undefined) noteOn(octaveBase + off);
      }
    };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, [octaveBase, noteOn, noteOff]);

  // MIDI in
  useEffect(() => {
    if (!isMidiSupported()) return;
    let cancelled = false;
    let unsub: (() => void) | null = null;
    const refresh = async () => { const ins = await listInputs(); if (!cancelled) setMidiInputs(ins); };
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
      } else if (msg.type === "noteoff") {
        midiHeldRef.current.delete(msg.note);
        if (midiHeldRef.current.size === 0) noteOff();
        else { const last = Array.from(midiHeldRef.current).pop()!; noteOn(last); }
      }
    }).then((u) => { if (cancelled) u(); else unbind = u; });
    return () => { cancelled = true; unbind?.(); };
  }, [midiInId, noteOn, noteOff]);

  useEffect(() => () => { try { void ctxRef.current?.close(); } catch {} }, []);

  const activePreset = useMemo(() => DX7_PRESETS.find((p) => p.id === presetId)!, [presetId]);

  return (
    <div className="relative">
      {!armed && (
        <button
          onClick={() => ensureAudio()}
          className="absolute inset-0 z-30 flex items-center justify-center bg-ink/85 backdrop-blur-sm cursor-pointer"
          aria-label="Tap to start audio"
        >
          <div className="border-2 border-lamp px-8 py-6 bg-ink">
            <div className="font-mono text-[11px] tracking-[.16em] uppercase text-lamp mb-1">READY</div>
            <div className="font-display font-bold uppercase text-[28px] tracking-[-0.01em]">tap to power on</div>
          </div>
        </button>
      )}

      <div className="border-2 border-paper overflow-hidden" style={{ background: "linear-gradient(180deg, #1a1a26 0%, #0e0e18 100%)" }}>
        {/* TOP BAR */}
        <div className="flex items-stretch border-b-2 border-paper">
          <div className="px-4 py-3 border-r-2 border-paper" style={{ background: "#3a3a4f", color: "#F4EFE6" }}>
            <div className="font-mono text-[9px] tracking-[.18em] uppercase opacity-80">YAMAHA</div>
            <div className="font-display font-bold text-[20px] uppercase leading-none tracking-[-0.02em]">DX-7</div>
            <div className="font-mono text-[8px] tracking-[.18em] uppercase opacity-70 mt-1">4-OP FM</div>
          </div>
          <div className="flex-1 flex items-center gap-4 px-4 py-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">PATCH</span>
              <select value={presetId} onChange={(e) => loadPreset(e.target.value)}
                className="bg-ink border border-paper px-2 py-1 font-mono text-[12px] text-paper focus:outline-none focus:border-lamp">
                {DX7_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">ALG</span>
              <div className="flex border border-paper/50">
                {ALGS.map((a) => (
                  <button key={a.id} onClick={() => setAlgorithm(a.id)}
                    className={`font-mono text-[10px] uppercase px-2 py-1 transition-colors border-r border-paper/30 last:border-r-0 ${
                      params.algorithm === a.id ? "bg-lamp text-ink" : "text-paper-2 hover:bg-ink"
                    }`}
                    title={a.ascii}>{a.label}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">OCT</span>
              <button onClick={() => setOctaveBase((o) => Math.max(24, o-12))} className="font-mono text-[12px] text-paper border border-paper/60 px-2">−</button>
              <span className="font-mono text-[11px] text-paper">{midiToName(octaveBase)}</span>
              <button onClick={() => setOctaveBase((o) => Math.min(96, o+12))} className="font-mono text-[12px] text-paper border border-paper/60 px-2">+</button>
            </div>
            {mounted && isMidiSupported() && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">MIDI IN</span>
                <select value={midiInId} onChange={(e) => setMidiInId(e.target.value)}
                  className="bg-ink border border-paper px-2 py-1 font-mono text-[11px] text-paper max-w-[140px]">
                  <option value="">none</option>
                  {midiInputs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-2 border-b border-paper/40" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp">{activePreset.name.toUpperCase()} · {activePreset.origin.toUpperCase()}</div>
          <div className="font-serif italic text-[13px] text-paper-2 leading-snug mt-0.5 max-w-[760px]">{activePreset.story}</div>
        </div>

        {/* 4 OPERATORS */}
        <div className="grid md:grid-cols-4 gap-0 border-b-2 border-paper">
          {[0,1,2,3].map((idx) => {
            const op = params.ops[idx];
            const i = idx as 0|1|2|3;
            return (
              <div key={idx} className={`p-3 ${idx < 3 ? "border-r border-paper/40" : ""}`}>
                <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp mb-2">OP{idx+1}</div>
                <div className="flex flex-wrap gap-2">
                  <Knob label="RATIO" value={Math.min(1, op.ratio / 16)} onChange={(v) => setOp(i, "ratio", Math.max(0.25, Math.round(v * 16 * 4) / 4))}
                    size={42} defaultValue={1/16} format={(v) => `${(v * 16).toFixed(2)}`} />
                  <Knob label="LEVEL" value={op.level} onChange={(v) => setOp(i, "level", v)} size={42} defaultValue={0.6} format={(v) => `${Math.round(v*100)}`} />
                  <Knob label="A" value={op.attack} onChange={(v) => setOp(i, "attack", v)} size={36} defaultValue={0.01} />
                  <Knob label="D" value={op.decay} onChange={(v) => setOp(i, "decay", v)} size={36} defaultValue={0.4} />
                  <Knob label="S" value={op.sustain} onChange={(v) => setOp(i, "sustain", v)} size={36} defaultValue={0.4} />
                  <Knob label="R" value={op.release} onChange={(v) => setOp(i, "release", v)} size={36} defaultValue={0.3} />
                </div>
              </div>
            );
          })}
        </div>

        {/* MASTER + KEYBOARD */}
        <div className="grid md:grid-cols-[auto_1fr] gap-0">
          <div className="p-4 border-r-2 border-paper/40">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-on-dark mb-2">MASTER</div>
            <Knob label="VOLUME" value={params.volume} onChange={setVolume} defaultValue={0.5} format={(v) => `${Math.round(v*100)}`} />
          </div>
          <KbdStrip lowMidi={octaveBase} highMidi={octaveBase+24} activeMidi={activeMidi} onNoteOn={noteOn} onNoteOff={noteOff} />
        </div>
      </div>

      <div className="mt-3 font-mono text-[10px] tracking-[.14em] uppercase text-on-dark text-center">
        a s d f g h j k l = white keys · w e t y u o p = black · z/x = octave
      </div>
    </div>
  );
}

const WHITE = [0,2,4,5,7,9,11];
const BLACK = [1,3,6,8,10];
function KbdStrip({ lowMidi, highMidi, activeMidi, onNoteOn, onNoteOff }: {
  lowMidi: number; highMidi: number; activeMidi: number | null;
  onNoteOn: (m: number) => void; onNoteOff: () => void;
}) {
  const whites: number[] = [];
  for (let m = lowMidi; m < highMidi; m++) {
    const pc = ((m%12)+12)%12;
    if (WHITE.includes(pc)) whites.push(m);
  }
  const blacks: { midi: number; whiteIdx: number }[] = [];
  for (let m = lowMidi; m < highMidi; m++) {
    const pc = ((m%12)+12)%12;
    if (BLACK.includes(pc)) {
      const leftWhite = whites.findIndex((w) => w === m-1);
      if (leftWhite >= 0) blacks.push({ midi: m, whiteIdx: leftWhite });
    }
  }
  return (
    <div className="px-3 py-4">
      <div className="relative mx-auto" style={{ maxWidth: 720 }}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${whites.length}, 1fr)`, gap: 2 }}>
          {whites.map((m) => {
            const active = m === activeMidi;
            return (
              <button key={m}
                onPointerDown={() => onNoteOn(m)} onPointerUp={onNoteOff} onPointerLeave={onNoteOff}
                className={`relative h-28 border-2 transition-colors flex items-end justify-center pb-1 ${
                  active ? "bg-lamp text-ink border-lamp" : "bg-paper text-ink border-paper hover:bg-paper-2"
                }`}
                style={{ touchAction: "none" }} aria-label={`note ${midiToName(m)}`}>
                <span className="font-mono text-[9px] tracking-[.1em] opacity-50">{midiToName(m)}</span>
              </button>
            );
          })}
        </div>
        <div className="absolute inset-0 pointer-events-none">
          {blacks.map(({ midi, whiteIdx }) => {
            const active = midi === activeMidi;
            const widthPct = 100 / whites.length;
            const leftPct = widthPct * (whiteIdx + 1) - widthPct * 0.3;
            return (
              <button key={midi}
                onPointerDown={(e) => { e.stopPropagation(); onNoteOn(midi); }} onPointerUp={onNoteOff} onPointerLeave={onNoteOff}
                className={`absolute pointer-events-auto border-2 transition-colors ${active ? "bg-lamp border-lamp" : "bg-ink border-ink hover:bg-ink-2"}`}
                style={{ left: `${leftPct}%`, width: `${widthPct * 0.6}%`, top: 0, height: "60%", touchAction: "none" }}
                aria-label={`note ${midiToName(midi)}`} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
