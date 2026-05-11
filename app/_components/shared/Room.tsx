import type { ReactNode } from "react";

/**
 * A "Room" — big editorial section divider used on release world pages.
 * Renders a horizontal rule, the room number, room title, and an optional
 * kicker line. Children render in the room beneath.
 *
 *   <Room number="03" title="the jam" kicker="play with it">
 *     ...
 *   </Room>
 */
export function Room({
  number,
  title,
  kicker,
  accent = "collect",
  align = "left",
  full = false,
  children,
}: {
  number?: string;
  title: string;
  kicker?: ReactNode;
  /** Tailwind text color token for the room number & rule. Defaults to "collect". */
  accent?: "collect" | "lamp" | "redline" | "calllm";
  align?: "left" | "center";
  /** Set true for galleries/videos that want to span the full container. */
  full?: boolean;
  children: ReactNode;
}) {
  const accentClass =
    accent === "lamp" ? "text-lamp"
    : accent === "redline" ? "text-redline"
    : accent === "calllm" ? "text-calllm"
    : "text-collect";
  const ruleClass =
    accent === "lamp" ? "border-lamp/50"
    : accent === "redline" ? "border-redline/60"
    : accent === "calllm" ? "border-calllm/60"
    : "border-collect/50";

  return (
    <section className={`mt-24 ${full ? "" : "max-w-[1180px] mx-auto"}`}>
      <div className={`border-t-2 ${ruleClass} pt-6 mb-8 ${align === "center" ? "text-center" : ""}`}>
        <div className={`font-mono text-[10px] tracking-[.18em] uppercase ${accentClass} mb-2 flex ${align === "center" ? "justify-center" : ""} items-baseline gap-3`}>
          {number && <span className="tabular-nums">/ {number}</span>}
          <span>{title}</span>
        </div>
        {kicker && (
          <div className={`font-display font-bold uppercase leading-[0.95] ${align === "center" ? "mx-auto" : ""}`} style={{ fontSize: "clamp(36px, 6vw, 64px)", letterSpacing: "-0.02em" }}>
            {kicker}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}
