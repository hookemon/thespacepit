"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EngineModular, MOD_DEFAULTS, type ModularParams, type PatchProgram } from "../_lib/engineModular";
import { Knob } from "../_components/Knob";
import { RecorderBar } from "../_components/RecorderBar";
import { bindInput, isMidiSupported, listInputs, onMidiStateChange, type MidiDevice } from "../_lib/midi";

const KEY_TO_OFFSET: Record<string, number> = {
  a: 0, s: 2, d: 4, f: 5, g: 7, h: 9, j: 11, k: 12, l: 14, ";": 16, "'": 17,
  w: 1, e: 3, t: 6, y: 8, u: 10, o: 13, p: 15,
};

const WAVES: OscillatorType[] = ["sawtooth", "square", "triangle", "sine"];

const PROGRAMS: { id: PatchProgram; label: string; flow: string; story: string }[] = [
  { id: "basic", label: "BASIC", flow: "VCO → VCF → VCA",
    story: "the textbook patch. moog from room 02 is built like this. play it to feel the shape of a normal synth voice." },
  { id: "fm-lead", label: "FM LEAD", flow: "VCO2 → VCO1.freq → VCF → VCA",
    story: "VCO2 modulates VCO1's frequency. crank VCO2 level + ratio for FM bell tones — DX7 in 6 modules instead of 4 operators." },
  { id: "pulse-pad", label: "PULSE PAD", flow: "VCO → VCF · LFO → VCF.cutoff",
    story: "LFO sweeps the filter cutoff for a slow rhythmic pulse. long envelope. that's a pad." },
];

function midiToHz(midi: number) { return 440 * Math.pow(2, (midi - 69) / 12); }
function midiToName(midi: number) {
  const n = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  return `${n[((midi%12)+12)%12]}${Math.floor(midi/12)-1}`;
}

export function LabModularClient() {
  const [armed, setArmed] = useState(false);
  const [params, setParams] = useState<ModularParams>({ ...MOD_DEFAULTS });
  const [octaveBase, setOctaveBase] = useState(48);
  const [activeMidi, setActiveMidi] = useState<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<EngineModular | null>(null);
  const heldRef = useRef<Set<string>>(new Set());
  const midiHeldRef = useRef<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [midiInputs, setMidiInputs] = useState<MidiDevice[]>([]);
  const [midiInId, setMidiInId] = useState<string>("");

  const ensureAudio = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const Ctx = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const engine = new EngineModular(ctx);
    (Object.keys(params) as (keyof ModularParams)[]).forEach((k) => engine.setParam(k, params[k]));
    ctxRef.current = ctx;
    engineRef.current = engine;
    void ctx.resume();
    setArmed(true);
    return ctx;
  }, [params]);

  const setParam = useCallback(<K extends keyof ModularParams>(key: K, val: ModularParams[K]) => {
    setParams((p) => ({ ...p, [key]: val }));
    engineRef.current?.setParam(key, val);
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
      else { const last = Array.from(heldRef.current).pop()!; const off = KEY_TO_OFFSET[last]; if (off !== undefined) noteOn(octaveBase + off); }
    };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, [octaveBase, noteOn, noteOff]);

  useEffect(() => () => { try { void ctxRef.current?.close(); } catch {} }, []);

  // MIDI input
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

  const activeProgram = useMemo(() => PROGRAMS.find((p) => p.id === params.program)!, [params.program]);

  return (
    <div className="relative">
      {!armed && (
        <button onClick={() => ensureAudio()} className="absolute inset-0 z-30 flex items-center justify-center bg-ink/85 backdrop-blur-sm cursor-pointer" aria-label="Tap to start audio">
          <div className="border-2 border-lamp px-8 py-6 bg-ink">
            <div className="font-mono text-[11px] tracking-[.16em] uppercase text-lamp mb-1">READY</div>
            <div className="font-display font-bold uppercase text-[28px] tracking-[-0.01em]">tap to power on</div>
          </div>
        </button>
      )}

      <div className="border-2 border-paper overflow-hidden" style={{ background: "linear-gradient(180deg, #1a1812 0%, #0c0a06 100%)" }}>
        <div className="flex items-stretch border-b-2 border-paper">
          <div className="px-4 py-3 border-r-2 border-paper" style={{ background: "#3a3024", color: "#F4EFE6" }}>
            <div className="font-mono text-[9px] tracking-[.18em] uppercase opacity-80">EURORACK</div>
            <div className="font-display font-bold text-[20px] uppercase leading-none tracking-[-0.02em]">MODULAR</div>
            <div className="font-mono text-[8px] tracking-[.18em] uppercase opacity-70 mt-1">6 MODULES · 3 PATCHES</div>
          </div>
          <div className="flex-1 flex items-center gap-4 px-4 py-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">PATCH</span>
              <div className="flex border border-paper/50">
                {PROGRAMS.map((p) => (
                  <button key={p.id} onClick={() => setParam("program", p.id)}
                    className={`font-mono text-[10px] uppercase px-2 py-1 transition-colors border-r border-paper/30 last:border-r-0 ${
                      params.program === p.id ? "bg-lamp text-ink" : "text-paper-2 hover:bg-ink"
                    }`} title={p.flow}>{p.label}</button>
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
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">MIDI IN</span>
                <select value={midiInId} onChange={(e) => setMidiInId(e.target.value)}
                  className="bg-ink border border-paper px-2 py-1 font-mono text-[11px] text-paper max-w-[140px]">
                  <option value="">none</option>
                  {midiInputs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
            <div className="ml-auto">
              <RecorderBar
                getEngine={() => engineRef.current && ctxRef.current ? { ctx: ctxRef.current, master: engineRef.current.master } : null}
                roomSlug="modular"
                filenameSuffix={params.program}
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-paper/40" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp">{activeProgram.label} · {activeProgram.flow}</div>
          <div className="font-serif italic text-[13px] text-paper-2 leading-snug mt-0.5 max-w-[760px]">{activeProgram.story}</div>
        </div>

        {/* 6 modules in a rack */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border-b-2 border-paper">
          {/* VCO1 */}
          <div className="p-3 border-r border-paper/40 border-b border-paper/40 md:border-b-0">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp mb-2">VCO 1</div>
            <div className="flex flex-wrap gap-1 mb-2">
              {WAVES.map((w) => (
                <button key={w} onClick={() => setParam("vco1Wave", w)}
                  className={`font-mono text-[9px] uppercase px-1.5 py-0.5 border ${params.vco1Wave === w ? "border-lamp text-lamp" : "border-paper/40 text-paper-2"}`}>{w.slice(0,3)}</button>
              ))}
            </div>
            <Knob label="TUNE" value={(params.vco1Tune + 12) / 24} onChange={(v) => setParam("vco1Tune", Math.round(v*24-12))}
              size={42} defaultValue={0.5} format={(v) => `${Math.round(v*24-12)}st`} />
          </div>
          {/* VCO2 */}
          <div className="p-3 border-r border-paper/40 border-b border-paper/40 md:border-b-0">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp mb-2">VCO 2 · MOD/SUB</div>
            <div className="flex flex-wrap gap-1 mb-2">
              {WAVES.map((w) => (
                <button key={w} onClick={() => setParam("vco2Wave", w)}
                  className={`font-mono text-[9px] uppercase px-1.5 py-0.5 border ${params.vco2Wave === w ? "border-lamp text-lamp" : "border-paper/40 text-paper-2"}`}>{w.slice(0,3)}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <Knob label="RATIO" value={Math.log2(params.vco2Ratio + 0.5) / 4} onChange={(v) => setParam("vco2Ratio", Math.max(0.25, Math.round(Math.pow(2, v*4 - 0.5) * 4) / 4))} size={42} defaultValue={0.5} format={(v) => `${Math.pow(2, v*4-0.5).toFixed(2)}x`} />
              <Knob label="LEVEL" value={params.vco2Level} onChange={(v) => setParam("vco2Level", v)} size={42} defaultValue={0} format={(v) => `${Math.round(v*100)}`} />
            </div>
          </div>
          {/* LFO */}
          <div className="p-3 border-b border-paper/40 md:border-b-0">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp mb-2">LFO</div>
            <div className="font-mono text-[9px] text-on-dark mb-2 leading-snug">active on PULSE PAD only</div>
            <div className="flex gap-2">
              <Knob label="RATE" value={params.lfoRate} onChange={(v) => setParam("lfoRate", v)} size={42} defaultValue={0.2} format={(v) => `${(v*20).toFixed(2)}Hz`} />
              <Knob label="AMT" value={params.lfoAmount} onChange={(v) => setParam("lfoAmount", v)} size={42} defaultValue={0} format={(v) => `${Math.round(v*100)}`} />
            </div>
          </div>
          {/* VCF */}
          <div className="p-3 border-r border-paper/40 border-t border-paper/40 md:border-t-0">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp mb-2">VCF</div>
            <div className="flex flex-wrap gap-2">
              <Knob label="CUTOFF" value={params.vcfCutoff} onChange={(v) => setParam("vcfCutoff", v)} size={42} defaultValue={0.5} format={(v) => `${Math.round(30 * Math.pow(18000/30, v))}Hz`} />
              <Knob label="RESO" value={params.vcfResonance} onChange={(v) => setParam("vcfResonance", v)} size={42} defaultValue={0.3} />
              <Knob label="ENV" value={params.vcfEnv} onChange={(v) => setParam("vcfEnv", v)} size={42} defaultValue={0.5} />
            </div>
          </div>
          {/* ENV */}
          <div className="p-3 border-r border-paper/40 border-t border-paper/40 md:border-t-0">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp mb-2">ENV · A · D · S · R</div>
            <div className="flex flex-wrap gap-2">
              <Knob label="A" value={params.envA} onChange={(v) => setParam("envA", v)} size={36} />
              <Knob label="D" value={params.envD} onChange={(v) => setParam("envD", v)} size={36} />
              <Knob label="S" value={params.envS} onChange={(v) => setParam("envS", v)} size={36} />
              <Knob label="R" value={params.envR} onChange={(v) => setParam("envR", v)} size={36} />
            </div>
          </div>
          {/* VCA / MASTER */}
          <div className="p-3 border-t border-paper/40 md:border-t-0">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp mb-2">VCA / MIX</div>
            <Knob label="VOLUME" value={params.volume} onChange={(v) => setParam("volume", v)} defaultValue={0.6} format={(v) => `${Math.round(v*100)}`} />
          </div>
        </div>

        <KbdStrip lowMidi={octaveBase} highMidi={octaveBase+24} activeMidi={activeMidi} onNoteOn={noteOn} onNoteOff={noteOff} />
      </div>

      <div className="mt-3 font-mono text-[10px] tracking-[.14em] uppercase text-on-dark text-center">
        a s d f g h j k l = white · w e t y u o p = black · z/x = octave · switch PATCH to rewire
      </div>
    </div>
  );
}

const WP = [0,2,4,5,7,9,11];
const BP = [1,3,6,8,10];
function KbdStrip({ lowMidi, highMidi, activeMidi, onNoteOn, onNoteOff }: {
  lowMidi: number; highMidi: number; activeMidi: number | null;
  onNoteOn: (m: number) => void; onNoteOff: () => void;
}) {
  const whites: number[] = [];
  for (let m = lowMidi; m < highMidi; m++) if (WP.includes(((m%12)+12)%12)) whites.push(m);
  const blacks: { midi: number; whiteIdx: number }[] = [];
  for (let m = lowMidi; m < highMidi; m++) if (BP.includes(((m%12)+12)%12)) {
    const w = whites.findIndex((x) => x === m-1);
    if (w >= 0) blacks.push({ midi: m, whiteIdx: w });
  }
  return (
    <div className="px-3 py-4">
      <div className="relative mx-auto" style={{ maxWidth: 720 }}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${whites.length}, 1fr)`, gap: 2 }}>
          {whites.map((m) => (
            <button key={m} onPointerDown={() => onNoteOn(m)} onPointerUp={onNoteOff} onPointerLeave={onNoteOff}
              className={`relative h-24 border-2 transition-colors flex items-end justify-center pb-1 ${m === activeMidi ? "bg-lamp text-ink border-lamp" : "bg-paper text-ink border-paper hover:bg-paper-2"}`}
              style={{ touchAction: "none" }}>
              <span className="font-mono text-[9px] opacity-50">{midiToName(m)}</span>
            </button>
          ))}
        </div>
        <div className="absolute inset-0 pointer-events-none">
          {blacks.map(({ midi, whiteIdx }) => {
            const widthPct = 100 / whites.length;
            const leftPct = widthPct * (whiteIdx + 1) - widthPct * 0.3;
            return (
              <button key={midi}
                onPointerDown={(e) => { e.stopPropagation(); onNoteOn(midi); }} onPointerUp={onNoteOff} onPointerLeave={onNoteOff}
                className={`absolute pointer-events-auto border-2 ${midi === activeMidi ? "bg-lamp border-lamp" : "bg-ink border-ink hover:bg-ink-2"}`}
                style={{ left: `${leftPct}%`, width: `${widthPct * 0.6}%`, top: 0, height: "60%", touchAction: "none" }} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
