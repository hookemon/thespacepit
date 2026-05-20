"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSpotlight } from "./LessonSpotlight";

type Props = {
  label: string;
  value: number;          // 0..1
  onChange: (v: number) => void;
  color?: string;
  // sensitivity in px per unit of value (default: 200 px = 0→1)
  sensitivity?: number;
  // display: how to format the rendered value
  format?: (v: number) => string;
  size?: number;
  defaultValue?: number;  // for double-click reset
  // Optional lesson-spotlight identifier. When the current lesson step
  // targets this id, the knob pulses with the lamp-color glow ring.
  spotlightId?: string;
};

// Vertical-drag knob. Drag up = increase, drag down = decrease.
// Double-click resets to defaultValue. Outputs 0..1.
export function Knob({
  label,
  value,
  onChange,
  color = "#F2B705",
  sensitivity = 200,
  format,
  size = 56,
  defaultValue = 0.5,
  spotlightId,
}: Props) {
  const { isActive } = useSpotlight();
  const spotlight = isActive(spotlightId);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<{ y: number; v: number } | null>(null);
  const v = Math.max(0, Math.min(1, value));

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      startRef.current = { y: e.clientY, v };
      setDragging(true);
    },
    [v]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const dy = startRef.current.y - e.clientY;
      let next = startRef.current.v + dy / sensitivity;
      if (e.shiftKey) next = startRef.current.v + dy / (sensitivity * 4); // fine
      next = Math.max(0, Math.min(1, next));
      onChange(next);
    },
    [onChange, sensitivity]
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    startRef.current = null;
    setDragging(false);
  }, []);

  const onDoubleClick = useCallback(() => onChange(defaultValue), [onChange, defaultValue]);

  // Wheel adjustment (scroll over knob to nudge)
  const knobRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = knobRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY / (e.shiftKey ? 2000 : 500);
      const next = Math.max(0, Math.min(1, v + delta));
      onChange(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [v, onChange]);

  // Indicator angle: -135deg (min) → +135deg (max)
  const angle = -135 + v * 270;
  const formatted = format ? format(v) : v.toFixed(2);

  return (
    <div className="flex flex-col items-center select-none" style={{ width: size + 16 }}>
      <div
        ref={knobRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        className={`relative rounded-full border-2 cursor-ns-resize bg-ink-2 transition-shadow ${
          dragging ? "shadow-[0_0_20px_rgba(242,183,5,0.45)]" : ""
        } ${spotlight ? "spotlight-on" : ""}`}
        style={{
          width: size,
          height: size,
          borderColor: color,
          touchAction: "none",
        }}
        aria-label={label}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={v}
      >
        {/* inner ring */}
        <div
          className="absolute inset-[6px] rounded-full"
          style={{ background: `radial-gradient(circle at 30% 30%, #2a2520 0%, #0B0B0B 70%)` }}
        />
        {/* indicator line */}
        <div
          className="absolute left-1/2 top-1/2 origin-bottom"
          style={{
            width: 2,
            height: size / 2 - 6,
            transform: `translate(-50%, -100%) rotate(${angle}deg)`,
            background: color,
            borderRadius: 2,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      </div>
      <div className="font-mono text-[9px] tracking-[.14em] uppercase text-on-dark mt-1.5">
        {label}
      </div>
      <div className="font-mono text-[10px] text-paper-2 leading-none mt-0.5">{formatted}</div>
    </div>
  );
}
