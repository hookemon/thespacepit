"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EngineBuchla, BUCHLA_DEFAULTS, type BuchlaParams, type PlateShape } from "../_lib/engineBuchla";
import { Knob } from "../_components/Knob";

const PLATES: { id: PlateShape; label: string; color: string; story: string }[] = [
  { id: "bonk", label: "BONK", color: "#E83A1C", story: "fast attack, fast decay — the classic LPG percussion sound." },
  { id: "pluck", label: "PLUCK", color: "#F2B705", story: "fast attack with a short tail. mallet-y." },
  { id: "swell", label: "SWELL", color: "#65C7F7", story: "slow attack, slow decay. let it open in." },
  { id: "drone", label: "DRONE", color: "#C9B9E8", story: "sustained — release with the same plate or another to stop." },
];

const PRESETS: { id: string; name: string; origin: string; story: string; params: Partial<BuchlaParams> }[] = [
  { id: "silver-apples", name: "Silver Apples", origin: "Morton Subotnick, 1967",
    story: "the classic 200-series bonk. high FM index, low cutoff, fast decay. plays itself once the random voltage starts modulating timbre.",
    params: { timbre: 0.6, shape: 0.3, cutoff: 0.1, decay: 0.4, randomAmt: 0.7 } },
  { id: "ciani-drone", name: "Ciani drone", origin: "Suzanne Ciani · Buchla Concerts",
    story: "low FM, high cutoff, long decay. complex oscillator with the SoU very slowly moving the timbre.",
    params: { timbre: 0.15, shape: 0.5, cutoff: 0.55, decay: 0.85, randomAmt: 0.4 } },
  { id: "ks-percussive", name: "Mallet bonk", origin: "Kaitlyn Aurelia Smith territory",
    story: "fast pluck, mid timbre, high shape. modern west-coast palette.",
    params: { timbre: 0.4, shape: 0.7, cutoff: 0.25, decay: 0.3, randomAmt: 0.2 } },
  { id: "init", name: "Init", origin: "yours to build", story: "neutral patch. start touching plates.", params: {} },
];

export function LabBuchlaClient() {
  const [armed, setArmed] = useState(false);
  const [params, setParams] = useState<BuchlaParams>({ ...BUCHLA_DEFAULTS });
  const [presetId, setPresetId] = useState("silver-apples");
  const [activePlate, setActivePlate] = useState<PlateShape | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<EngineBuchla | null>(null);

  const ensureAudio = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const Ctx = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const engine = new EngineBuchla(ctx);
    (Object.keys(params) as (keyof BuchlaParams)[]).forEach((k) => engine.setParam(k, params[k]));
    ctxRef.current = ctx;
    engineRef.current = engine;
    void ctx.resume();
    setArmed(true);
    return ctx;
  }, [params]);

  const setParam = useCallback(<K extends keyof BuchlaParams>(key: K, val: BuchlaParams[K]) => {
    setParams((p) => ({ ...p, [key]: val }));
    engineRef.current?.setParam(key, val);
  }, []);

  const loadPreset = useCallback((id: string) => {
    const pr = PRESETS.find((x) => x.id === id);
    if (!pr) return;
    setPresetId(id);
    const merged = { ...BUCHLA_DEFAULTS, ...pr.params };
    setParams(merged);
    if (engineRef.current) {
      (Object.keys(merged) as (keyof BuchlaParams)[]).forEach((k) => engineRef.current!.setParam(k, merged[k]));
    }
  }, []);

  const tap = useCallback((plate: PlateShape) => {
    ensureAudio();
    setActivePlate(plate);
    engineRef.current?.trigger(plate);
    if (plate !== "drone") {
      setTimeout(() => setActivePlate((p) => (p === plate ? null : p)), 200);
    }
  }, [ensureAudio]);

  const releaseDrone = useCallback(() => {
    engineRef.current?.release();
    setActivePlate(null);
  }, []);

  useEffect(() => () => {
    engineRef.current?.dispose();
    try { void ctxRef.current?.close(); } catch {}
  }, []);

  // keyboard: 1/2/3/4 → plates, space = release
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "Space") { e.preventDefault(); releaseDrone(); return; }
      const i = ["1","2","3","4"].indexOf(e.key);
      if (i < 0) return;
      e.preventDefault();
      tap(PLATES[i].id);
    };
    window.addEventListener("keydown", dn);
    return () => window.removeEventListener("keydown", dn);
  }, [tap, releaseDrone]);

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

      <div className="border-2 border-paper overflow-hidden" style={{ background: "linear-gradient(180deg, #2a1f3a 0%, #14081e 100%)" }}>
        <div className="flex items-stretch border-b-2 border-paper">
          <div className="px-4 py-3 border-r-2 border-paper" style={{ background: "#4a2e6a", color: "#F4EFE6" }}>
            <div className="font-mono text-[9px] tracking-[.18em] uppercase opacity-80">BUCHLA</div>
            <div className="font-display font-bold text-[20px] uppercase leading-none tracking-[-0.02em]">200</div>
            <div className="font-mono text-[8px] tracking-[.18em] uppercase opacity-70 mt-1">WEST COAST</div>
          </div>
          <div className="flex-1 flex items-center gap-4 px-4 py-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">PATCH</span>
              <select value={presetId} onChange={(e) => loadPreset(e.target.value)} className="bg-ink border border-paper px-2 py-1 font-mono text-[12px] text-paper">
                {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-paper/40" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp">{activePreset.name.toUpperCase()} · {activePreset.origin.toUpperCase()}</div>
          <div className="font-serif italic text-[13px] text-paper-2 leading-snug mt-0.5 max-w-[760px]">{activePreset.story}</div>
        </div>

        {/* COMPLEX OSC + LPG + SOU */}
        <div className="grid md:grid-cols-3 gap-0 border-b-2 border-paper">
          <div className="p-4 border-r border-paper/40">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp mb-2">COMPLEX OSC</div>
            <div className="font-mono text-[9px] text-on-dark leading-snug max-w-[260px] mb-3">two coupled oscillators. TIMBRE controls how much one modulates the other. SHAPE distorts the output.</div>
            <div className="flex flex-wrap gap-3">
              <Knob label="TIMBRE" value={params.timbre} onChange={(v) => setParam("timbre", v)} color="#C9B9E8" defaultValue={0.35} format={(v) => `${Math.round(v*100)}`} />
              <Knob label="SHAPE" value={params.shape} onChange={(v) => setParam("shape", v)} color="#C9B9E8" defaultValue={0.4} format={(v) => `${Math.round(v*100)}`} />
            </div>
          </div>
          <div className="p-4 border-r border-paper/40">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp mb-2">LOWPASS GATE</div>
            <div className="font-mono text-[9px] text-on-dark leading-snug max-w-[260px] mb-3">filter + amp share one envelope. loud = open = bright. closed = dark + quiet. the bonk lives here.</div>
            <div className="flex flex-wrap gap-3">
              <Knob label="CUTOFF" value={params.cutoff} onChange={(v) => setParam("cutoff", v)} color="#F2B705" defaultValue={0.15} format={(v) => `${Math.round(80 + v*5000)}Hz`} />
              <Knob label="DECAY" value={params.decay} onChange={(v) => setParam("decay", v)} color="#F2B705" defaultValue={0.6} format={(v) => `${(0.1 + v*2).toFixed(2)}s`} />
            </div>
          </div>
          <div className="p-4">
            <div className="font-mono text-[9px] tracking-[.16em] uppercase text-lamp mb-2">SOURCE OF UNCERTAINTY</div>
            <div className="font-mono text-[9px] text-on-dark leading-snug max-w-[260px] mb-3">slow random voltage. patches itself into TIMBRE — turn this up to hear the patch evolve while you hold a drone.</div>
            <div className="flex flex-wrap gap-3">
              <Knob label="RANDOM" value={params.randomAmt} onChange={(v) => setParam("randomAmt", v)} color="#7AFB0D" defaultValue={0.3} format={(v) => `${Math.round(v*100)}`} />
              <Knob label="VOLUME" value={params.volume} onChange={(v) => setParam("volume", v)} defaultValue={0.6} format={(v) => `${Math.round(v*100)}`} />
            </div>
          </div>
        </div>

        {/* TOUCH PLATES */}
        <div className="p-4">
          <div className="font-mono text-[9px] tracking-[.16em] uppercase text-on-dark mb-3">
            TOUCH PLATES · tap or press 1–4 · space releases the drone
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PLATES.map((p) => {
              const active = activePlate === p.id;
              return (
                <button
                  key={p.id}
                  onPointerDown={() => tap(p.id)}
                  onPointerUp={() => { if (p.id === "drone") return; /* otherwise auto-release in engine */ }}
                  className={`relative aspect-[3/2] border-2 transition-all flex flex-col items-stretch justify-center p-3 ${
                    active ? "border-lamp" : "border-paper/40 hover:border-paper"
                  }`}
                  style={{
                    background: active ? p.color : `linear-gradient(180deg, ${p.color}26 0%, ${p.color}11 100%)`,
                    boxShadow: active ? `0 0 30px ${p.color}` : undefined,
                  }}
                >
                  <span className="font-display font-bold text-[24px] tracking-[-0.01em] text-center" style={{ color: active ? "#0B0B0B" : p.color }}>{p.label}</span>
                  <span className="font-serif italic text-[11px] mt-1 text-center" style={{ color: active ? "#0B0B0B" : "#C8C2B4" }}>{p.story}</span>
                </button>
              );
            })}
          </div>
          {activePlate === "drone" && (
            <button onClick={releaseDrone} className="mt-3 font-mono text-[10px] tracking-[.14em] uppercase border border-redline text-redline px-3 py-1.5 hover:bg-redline hover:text-paper transition-colors">
              release drone
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 font-mono text-[10px] tracking-[.14em] uppercase text-on-dark text-center">
        1 2 3 4 = plates · space releases the drone · turn RANDOM up to hear it evolve
      </div>
    </div>
  );
}
