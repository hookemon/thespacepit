"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Pad } from "../../_lib/sanity-queries";

// Keyboard layout — top row of letters, then numbers, supporting up to 16 pads.
// First 8 land on the home row; pads 9–16 on the row above.
const KEY_MAP = [
  // row 1 (bottom): asdfghjk
  "a", "s", "d", "f", "g", "h", "j", "k",
  // row 2 (top): qwertyui
  "q", "w", "e", "r", "t", "y", "u", "i",
];

const FALLBACK_COLORS = ["#F2B705", "#E83A1C", "#7BD3A8", "#C9B9E8", "#FF6FB5", "#65C7F7", "#F4EFE6", "#0E4B3A"];

type LoadedPad = {
  label: string;
  color: string;
  buffer: AudioBuffer | null;
  key: string;
};

export function PadGrid({ pads }: { pads: Pad[] }) {
  const [ready, setReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  // We use Web Audio buffers so we can re-trigger pads cleanly (no
  // re-load delay, polyphonic).
  const ctxRef = useRef<AudioContext | null>(null);
  const padsRef = useRef<LoadedPad[]>([]);
  const [, forceRender] = useState(0);
  const tick = useCallback(() => forceRender((n) => n + 1), []);

  // Initialize AudioContext lazily on the first user interaction (browser
  // autoplay policy).
  const ensureContext = useCallback(() => {
    if (!ctxRef.current && typeof window !== "undefined") {
      // SafariSafari and friends prefix webkitAudioContext.
      const Ctx = (window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
      if (Ctx) ctxRef.current = new Ctx();
    }
    if (ctxRef.current && ctxRef.current.state === "suspended") {
      void ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Load each pad's audio file into an AudioBuffer.
  useEffect(() => {
    let cancelled = false;
    const loaded: LoadedPad[] = pads.map((p, i) => ({
      label: p.label,
      color: p.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      buffer: null,
      key: KEY_MAP[i] ?? "",
    }));
    padsRef.current = loaded;

    (async () => {
      const ctx = ensureContext();
      if (!ctx) return;
      let done = 0;
      await Promise.all(
        pads.map(async (p, i) => {
          try {
            const res = await fetch(p.audioUrl);
            const arr = await res.arrayBuffer();
            const buf = await ctx.decodeAudioData(arr);
            if (cancelled) return;
            loaded[i].buffer = buf;
          } catch (err) {
            console.warn(`pad load failed: ${p.label}`, err);
          } finally {
            done += 1;
            if (!cancelled) setLoadProgress(done / pads.length);
          }
        })
      );
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [pads, ensureContext]);

  const trigger = useCallback((idx: number) => {
    const ctx = ensureContext();
    if (!ctx) return;
    const pad = padsRef.current[idx];
    if (!pad?.buffer) return;
    const src = ctx.createBufferSource();
    src.buffer = pad.buffer;
    src.connect(ctx.destination);
    src.start(0);
    setActiveIdx(idx);
    // Brief flash, then clear.
    window.setTimeout(() => {
      setActiveIdx((cur) => (cur === idx ? null : cur));
      tick();
    }, 150);
  }, [ensureContext, tick]);

  // Keyboard listener
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement | null)?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const idx = padsRef.current.findIndex((p) => p.key === e.key.toLowerCase());
      if (idx >= 0) {
        e.preventDefault();
        trigger(idx);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [trigger]);

  const cols = useMemo(() => Math.min(8, Math.max(4, pads.length <= 4 ? 4 : pads.length <= 8 ? 4 : 8)), [pads.length]);

  if (pads.length === 0) return null;

  return (
    <div className="border border-paper bg-ink-2">
      <div className="px-5 py-3 border-b border-paper flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2">
          {ready ? `${pads.length} pads · click or use the keys` : `loading pads · ${Math.round(loadProgress * 100)}%`}
        </div>
        <div className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2">
          {!ready && (
            <span className="inline-block w-16 h-1 bg-ink rounded-full overflow-hidden align-middle">
              <span className="block h-full bg-lamp transition-all" style={{ width: `${loadProgress * 100}%` }} />
            </span>
          )}
        </div>
      </div>
      <div
        className="grid gap-2 p-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {padsRef.current.map((p, i) => {
          const active = i === activeIdx;
          return (
            <button
              key={i}
              type="button"
              onPointerDown={() => trigger(i)}
              disabled={!p.buffer}
              className={`relative aspect-square border-2 transition-all duration-150 select-none ${
                active ? "border-lamp scale-[1.04] shadow-[0_0_24px_rgba(242,183,5,0.6)]" : "border-paper hover:border-lamp"
              } ${!p.buffer ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
              style={{
                background: active ? p.color : `linear-gradient(135deg, ${p.color}33 0%, ${p.color}11 100%)`,
              }}
              aria-label={`Trigger ${p.label}`}
            >
              <span
                className="absolute top-1.5 left-2 font-mono text-[10px] tracking-[.14em] uppercase opacity-70"
                style={{ color: active ? "#0B0B0B" : "#F4EFE6" }}
              >
                {p.key || (i + 1)}
              </span>
              <span
                className="absolute bottom-2 left-2 right-2 font-display text-[13px] uppercase font-semibold tracking-[-0.005em] line-clamp-2 leading-tight"
                style={{ color: active ? "#0B0B0B" : "#F4EFE6" }}
              >
                {p.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
