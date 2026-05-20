"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EngineSID, SID_DEFAULTS, type SidParams, type SidVoiceParams, type SidWave, type FilterMode } from "../_lib/engineSID";
import { Knob } from "../_components/Knob";
import { RecorderBar } from "../_components/RecorderBar";

const KEY_TO_OFFSET: Record<string, number> = {
  a: 0, s: 2, d: 4, f: 5, g: 7, h: 9, j: 11, k: 12, l: 14, ";": 16, "'": 17,
  w: 1, e: 3, t: 6, y: 8, u: 10, o: 13, p: 15,
};

const WAVES: SidWave[] = ["pulse", "sawtooth", "triangle", "noise"];
const FILTER_MODES: FilterMode[] = ["lowpass", "bandpass", "highpass", "off"];
const VOICE_COLOR = ["#65C7F7", "#7AFB0D", "#FF6FB5"];

const PRESETS = [
  { id: "hubbard-lead", name: "Hubbard lead", origin: "Rob Hubbard · Monty on the Run, 1985",
    story: "C64 game music. fast attack, no sustain, arp running at 30Hz — that's what made one voice sound like a chord.",
    params: { voices: [
      { wave: "pulse", detune: 0, level: 0.7, attack: 0, decay: 0.15, sustain: 0, release: 0.1, arpOffset: 0 },
      { wave: "pulse", detune: 0, level: 0, attack: 0, decay: 0.15, sustain: 0, release: 0.1, arpOffset: 4 },
      { wave: "pulse", detune: 0, level: 0, attack: 0, decay: 0.15, sustain: 0, release: 0.1, arpOffset: 7 },
    ], arpRate: 0.5, cutoff: 0.9, resonance: 0.05, filterMode: "lowpass" as FilterMode, volume: 0.5 } },
  { id: "galway-pad", name: "Galway pad", origin: "Martin Galway · Wizball, 1987",
    story: "thick triangle stack with detune. slow attack. galway pioneered using all 3 voices as layered timbres instead of just polyphony.",
    params: { voices: [
      { wave: "triangle", detune: 0, level: 0.5, attack: 0.3, decay: 0.5, sustain: 0.7, release: 0.5, arpOffset: 0 },
      { wave: "sawtooth", detune: -12, level: 0.3, attack: 0.4, decay: 0.5, sustain: 0.7, release: 0.5, arpOffset: 0 },
      { wave: "pulse", detune: 12, level: 0.3, attack: 0.4, decay: 0.5, sustain: 0.7, release: 0.5, arpOffset: 0 },
    ], arpRate: 0, cutoff: 0.5, resonance: 0.3, filterMode: "lowpass" as FilterMode, volume: 0.5 } },
  { id: "demoscene-bass", name: "Demoscene bass", origin: "the chiptune underground",
    story: "pulse + saw, low cutoff, fat sustain. mid-tempo arp gives it that talky bass-line feel.",
    params: { voices: [
      { wave: "pulse", detune: 0, level: 0.8, attack: 0, decay: 0.4, sustain: 0.6, release: 0.3, arpOffset: 0 },
      { wave: "sawtooth", detune: -12, level: 0.5, attack: 0, decay: 0.4, sustain: 0.6, release: 0.3, arpOffset: 5 },
      { wave: "triangle", detune: 0, level: 0.2, attack: 0, decay: 0.4, sustain: 0.6, release: 0.3, arpOffset: 12 },
    ], arpRate: 0.2, cutoff: 0.45, resonance: 0.45, filterMode: "lowpass" as FilterMode, volume: 0.55 } },
  { id: "noise-perc", name: "Noise hat",
    origin: "every SID drum part ever",
    story: "the SID's noise channel was the entire drum kit. clip envelope short = hi-hat. open longer = ride. low cutoff = closed hat.",
    params: { voices: [
      { wave: "noise" as SidWave, detune: 0, level: 0.8, attack: 0, decay: 0.05, sustain: 0, release: 0.05, arpOffset: 0 },
      { wave: "pulse", detune: 0, level: 0, attack: 0, decay: 0.1, sustain: 0, release: 0.1, arpOffset: 0 },
      { wave: "pulse", detune: 0, level: 0, attack: 0, decay: 0.1, sustain: 0, release: 0.1, arpOffset: 0 },
    ], arpRate: 0, cutoff: 0.7, resonance: 0.2, filterMode: "highpass" as FilterMode, volume: 0.5 } },
  { id: "init", name: "Init", origin: "yours to build", story: "default. one pulse voice, no arp.",
    params: {} },
];

function midiToHz(midi: number) { return 440 * Math.pow(2, (midi - 69) / 12); }
function midiToName(midi: number) {
  const n = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  return `${n[((midi%12)+12)%12]}${Math.floor(midi/12)-1}`;
}

export function LabSIDClient() {
  const [armed, setArmed] = useState(false);
  const [params, setParams] = useState<SidParams>({ ...SID_DEFAULTS });
  const [presetId, setPresetId] = useState("hubbard-lead");
  const [octaveBase, setOctaveBase] = useState(48);
  const [activeMidi, setActiveMidi] = useState<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<EngineSID | null>(null);
  const heldRef = useRef<Set<string>>(new Set());

  const ensureAudio = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const Ctx = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const engine = new EngineSID(ctx);
    // apply params
    engine.setParam("cutoff", params.cutoff);
    engine.setParam("resonance", params.resonance);
    engine.setParam("filterMode", params.filterMode);
    engine.setParam("arpRate", params.arpRate);
    engine.setParam("volume", params.volume);
    // voice params get applied on note-on by reading engine.params directly
    ctxRef.current = ctx;
    engineRef.current = engine;
    void ctx.resume();
    setArmed(true);
    return ctx;
  }, [params]);

  const setVoiceParam = useCallback(<K extends keyof SidVoiceParams>(idx: 0|1|2, key: K, val: SidVoiceParams[K]) => {
    setParams((p) => {
      const vs = p.voices.slice() as SidParams["voices"];
      vs[idx] = { ...vs[idx], [key]: val };
      return { ...p, voices: vs };
    });
    if (engineRef.current) (engineRef.current.params.voices[idx] as Record<string, unknown>)[key as string] = val as unknown;
  }, []);

  const setTopParam = useCallback(<K extends keyof SidParams>(key: K, val: SidParams[K]) => {
    setParams((p) => ({ ...p, [key]: val }));
    engineRef.current?.setParam(key, val);
  }, []);

  const loadPreset = useCallback((id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(id);
    const merged = { ...SID_DEFAULTS, ...(p.params as Partial<SidParams>) } as SidParams;
    if (p.params.voices) merged.voices = p.params.voices as SidParams["voices"];
    setParams(merged);
    if (engineRef.current) {
      engineRef.current.setParam("cutoff", merged.cutoff);
      engineRef.current.setParam("resonance", merged.resonance);
      engineRef.current.setParam("filterMode", merged.filterMode);
      engineRef.current.setParam("arpRate", merged.arpRate);
      engineRef.current.setParam("volume", merged.volume);
      merged.voices.forEach((v, i) => {
        (Object.keys(v) as (keyof SidVoiceParams)[]).forEach((k) => {
          (engineRef.current!.params.voices[i as 0|1|2] as Record<string, unknown>)[k as string] = v[k] as unknown;
        });
      });
    }
  }, []);

  const noteOn = useCallback((midi: number) => {
    ensureAudio();
    setActiveMidi(midi);
    engineRef.current?.noteOn(midi);
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

  const activePreset = useMemo(() => PRESETS.find((p) => p.id === presetId)!, [presetId]);

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

      <div className="border-2 border-paper overflow-hidden" style={{ background: "linear-gradient(180deg, #0a1a2a 0%, #04081a 100%)" }}>
        <div className="flex items-stretch border-b-2 border-paper">
          <div className="px-4 py-3 border-r-2 border-paper" style={{ background: "#1a3a6a", color: "#F4EFE6" }}>
            <div className="font-mono text-[9px] tracking-[.18em] uppercase opacity-80">MOS</div>
            <div className="font-display font-bold text-[20px] uppercase leading-none tracking-[-0.02em]">SID 6581</div>
            <div className="font-mono text-[8px] tracking-[.18em] uppercase opacity-70 mt-1">3-VOICE + FILTER</div>
          </div>
          <div className="flex-1 flex items-center gap-4 px-4 py-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">PATCH</span>
              <select value={presetId} onChange={(e) => loadPreset(e.target.value)} className="bg-ink border border-paper px-2 py-1 font-mono text-[12px] text-paper">
                {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">OCT</span>
              <button onClick={() => setOctaveBase((o) => Math.max(24, o-12))} className="font-mono text-[12px] text-paper border border-paper/60 px-2">−</button>
              <span className="font-mono text-[11px] text-paper">{midiToName(octaveBase)}</span>
              <button onClick={() => setOctaveBase((o) => Math.min(96, o+12))} className="font-mono text-[12px] text-paper border border-paper/60 px-2">+</button>
            </div>
            <div className="ml-auto">
              <RecorderBar
                getEngine={() => engineRef.current && ctxRef.current ? { ctx: ctxRef.current, master: engineRef.current.master } : null}
                roomSlug="sid"
                filenameSuffix={presetId}
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-paper/40" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="font-mono text-[9px] tracking-[.16em] uppercase" style={{ color: VOICE_COLOR[0] }}>{activePreset.name.toUpperCase()} · {activePreset.origin.toUpperCase()}</div>
          <div className="font-serif italic text-[13px] text-paper-2 leading-snug mt-0.5 max-w-[760px]">{activePreset.story}</div>
        </div>

        {/* FILTER + ARP top row */}
        <div className="grid md:grid-cols-2 gap-0 border-b border-paper/40">
          <div className="p-3 border-r border-paper/40">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp mb-2">FILTER · shared by all 3</div>
            <div className="flex flex-wrap gap-3 items-center">
              <Knob label="CUTOFF" value={params.cutoff} onChange={(v) => setTopParam("cutoff", v)} size={48} defaultValue={0.7} format={(v) => `${Math.round(30 * Math.pow(18000/30, v))}Hz`} />
              <Knob label="RESO" value={params.resonance} onChange={(v) => setTopParam("resonance", v)} size={48} defaultValue={0.2} format={(v) => `${Math.round(v*100)}`} />
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] tracking-[.14em] uppercase text-on-dark">MODE</span>
                <div className="flex border border-paper/50">
                  {FILTER_MODES.map((m) => (
                    <button key={m} onClick={() => setTopParam("filterMode", m)}
                      className={`font-mono text-[9px] uppercase px-2 py-1 border-r border-paper/30 last:border-r-0 ${params.filterMode === m ? "bg-lamp text-ink" : "text-paper-2 hover:bg-ink"}`}>{m.slice(0,2)}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="p-3">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp mb-2">ARP · chip-tune chord trick</div>
            <Knob label="RATE" value={params.arpRate} onChange={(v) => setTopParam("arpRate", v)} size={48} defaultValue={0} format={(v) => v < 0.01 ? "off" : `${Math.round(v*50)}Hz`} />
            <div className="font-mono text-[9px] text-on-dark mt-2 max-w-[300px] leading-snug">when rate &gt; 0, voice 1 cycles through itself + voice 2&apos;s detune interval + voice 3&apos;s — too fast to hear individual notes, sounds like a chord</div>
          </div>
        </div>

        {/* 3 voices */}
        <div className="grid md:grid-cols-3 gap-0 border-b-2 border-paper">
          {[0,1,2].map((idx) => {
            const v = params.voices[idx];
            const i = idx as 0|1|2;
            return (
              <div key={idx} className={`p-3 ${idx < 2 ? "border-r border-paper/40" : ""}`}>
                <div className="font-mono text-[9px] tracking-[.16em] uppercase mb-2" style={{ color: VOICE_COLOR[idx] }}>VOICE {idx+1}</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {WAVES.map((w) => (
                    <button key={w} onClick={() => setVoiceParam(i, "wave", w)}
                      className={`font-mono text-[9px] uppercase px-1.5 py-0.5 border transition-colors ${
                        v.wave === w ? "border-lamp text-lamp bg-ink" : "border-paper/40 text-paper-2 hover:border-paper"
                      }`}>{w.slice(0,3)}</button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Knob label="LEVEL" value={v.level} onChange={(x) => setVoiceParam(i, "level", x)} size={36} defaultValue={0.5} />
                  <Knob label="DETUNE" value={(v.detune + 24) / 48} onChange={(x) => setVoiceParam(i, "detune", Math.round(x*48-24))} size={36} defaultValue={0.5} format={(x) => `${Math.round(x*48-24)}st`} />
                  <Knob label="ARP" value={(v.arpOffset) / 24} onChange={(x) => setVoiceParam(i, "arpOffset", Math.round(x*24))} size={36} defaultValue={0} format={(x) => `+${Math.round(x*24)}st`} />
                  <Knob label="A" value={v.attack} onChange={(x) => setVoiceParam(i, "attack", x)} size={30} />
                  <Knob label="D" value={v.decay} onChange={(x) => setVoiceParam(i, "decay", x)} size={30} />
                  <Knob label="S" value={v.sustain} onChange={(x) => setVoiceParam(i, "sustain", x)} size={30} />
                  <Knob label="R" value={v.release} onChange={(x) => setVoiceParam(i, "release", x)} size={30} />
                </div>
              </div>
            );
          })}
        </div>

        <KbdStrip lowMidi={octaveBase} highMidi={octaveBase+24} activeMidi={activeMidi} onNoteOn={noteOn} onNoteOff={noteOff} />
      </div>

      <div className="mt-3 font-mono text-[10px] tracking-[.14em] uppercase text-on-dark text-center">
        a s d f g h j k l = white · w e t y u o p = black · z/x = octave
      </div>
    </div>
  );
}

// Reuse the keyboard pattern
const WHITE_PCS = [0,2,4,5,7,9,11];
const BLACK_PCS = [1,3,6,8,10];
function KbdStrip({ lowMidi, highMidi, activeMidi, onNoteOn, onNoteOff }: {
  lowMidi: number; highMidi: number; activeMidi: number | null;
  onNoteOn: (m: number) => void; onNoteOff: () => void;
}) {
  const whites: number[] = [];
  for (let m = lowMidi; m < highMidi; m++) if (WHITE_PCS.includes(((m%12)+12)%12)) whites.push(m);
  const blacks: { midi: number; whiteIdx: number }[] = [];
  for (let m = lowMidi; m < highMidi; m++) if (BLACK_PCS.includes(((m%12)+12)%12)) {
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
