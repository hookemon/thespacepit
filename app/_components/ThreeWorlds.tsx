/**
 * Three-worlds triptych — the front-door clarifier.
 *
 * Friends landing at thespacepit.com couldn't tell the site is actually
 * three worlds in one (Nick Hook the artist, thespacepit the studio,
 * Calm + Collect the label). The top-nav has the 3-toggle but it's tiny
 * — visitors miss it.
 *
 * This component sits AT THE TOP of the homepage, above the hero, as
 * three large clickable tiles in each world's accent color. First thing
 * a visitor sees on /, period.
 *
 * Visual:
 *   ┌───────────┐ ┌───────────┐ ┌───────────┐
 *   │ NICK HOOK │ │thespacepit│ │CALM +     │
 *   │           │ │           │ │COLLECT    │
 *   │ the       │ │ the studio│ │ the label │
 *   │ artist    │ │ + youtube │ │ since 2013│
 *   │           │ │ + discord │ │           │
 *   │ enter →   │ │ enter →   │ │ enter →   │
 *   └───────────┘ └───────────┘ └───────────┘
 *
 * Each tile uses the world's brand accent (redline / lamp / collect) and
 * deep-links to that world's home page.
 */
import Link from "next/link";

type World = {
  href: string;
  /** Display name — preserves brand casing (thespacepit lowercase). */
  name: string;
  /** Tiny label above the name. */
  kicker: string;
  /** One-line "what's inside" blurb. */
  blurb: string;
  /** Accent hex (the world's brand color). */
  bg: string;
  /** Foreground/text color that reads on the bg. */
  fg: string;
  /** Small heptagon variant — the world's icon. */
  heptagon: string;
};

const WORLDS: World[] = [
  {
    href: "/nick-hook",
    name: "Nick Hook",
    kicker: "the artist",
    blurb: "20 years of records · RTJ engineer · Brooklyn producer · the rig + the rolodex.",
    bg: "var(--color-redline)",
    fg: "#F4EFE6",
    heptagon: "/heptagon-paper.png",
  },
  {
    href: "/",
    name: "thespacepit",
    kicker: "the studio",
    blurb: "the YouTube channel · the Discord · gear demos · after-midnight sessions · Brooklyn → Medellín.",
    bg: "var(--color-lamp)",
    fg: "#0B0B0B",
    heptagon: "/heptagon-fill-black.png",
  },
  {
    href: "/calm-collect",
    name: "Calm + Collect",
    kicker: "the label",
    blurb: "since 2013 · Brooklyn → Medellín · 28+ records · the catalog, the artists, the upcoming slate.",
    bg: "var(--color-collect)",
    fg: "#F4EFE6",
    heptagon: "/heptagon-paper.png",
  },
];

export function ThreeWorlds() {
  return (
    <section
      className="px-5 sm:px-8 pt-8 pb-12 sm:pt-10 sm:pb-14 border-b border-ink"
      aria-label="The three worlds"
    >
      {/* Framing line — tells friends what they're looking at without
          dominating the visual hierarchy. */}
      <div className="font-mono text-[11px] sm:text-[12px] tracking-[.18em] uppercase text-ink-3 mb-5">
        ONE NICK HOOK · THREE WORLDS · ONE SITE
      </div>

      {/* The 3 doors. Equal width on desktop, stacked on mobile. */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {WORLDS.map((w) => (
          <Link
            key={w.href}
            href={w.href}
            className="group relative block border-2 border-ink no-underline overflow-hidden transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px]"
            style={{
              background: w.bg,
              color: w.fg,
              minHeight: 220,
              boxShadow: "0 0 0 transparent",
            }}
          >
            <div
              className="absolute inset-0 transition-shadow duration-150 group-hover:shadow-[5px_5px_0_var(--color-ink)]"
              aria-hidden
            />
            <div className="relative p-6 sm:p-7 flex flex-col h-full justify-between" style={{ minHeight: 220 }}>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={w.heptagon}
                    alt=""
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    aria-hidden
                  />
                  <div
                    className="font-mono text-[10px] tracking-[.18em] uppercase"
                    style={{ opacity: 0.7 }}
                  >
                    {w.kicker}
                  </div>
                </div>
                <div
                  className="font-display font-bold uppercase leading-[0.95]"
                  style={{
                    fontSize: "clamp(34px, 4.4vw, 56px)",
                    letterSpacing: "-0.02em",
                    // The thespacepit wordmark is intentionally lowercase
                    // (brand rule) — we re-set textTransform to none on
                    // that tile so the CSS uppercase doesn't override.
                    textTransform: w.name === "thespacepit" ? "none" : "uppercase",
                  }}
                >
                  {w.name}
                </div>
              </div>

              <div className="mt-4">
                <p
                  className="font-serif italic leading-snug"
                  style={{ fontSize: "clamp(14px, 1vw, 16px)", opacity: 0.95 }}
                >
                  {w.blurb}
                </p>
                <div
                  className="mt-4 font-mono text-[10px] tracking-[.18em] uppercase inline-flex items-center gap-1.5 group-hover:underline underline-offset-4"
                  style={{ opacity: 0.9 }}
                >
                  enter →
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
