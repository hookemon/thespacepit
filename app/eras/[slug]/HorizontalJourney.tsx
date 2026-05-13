"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ProjectDetail, SanityImage, ReleaseListItem } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";
import { PortableText } from "../../_components/shared/PortableText";

/**
 * Horizontal-journey era page. Used for Cubic Zirconia (set via project.layoutVariant).
 *
 * Layout: full-viewport snap-scroll PANELS reading LEFT TO RIGHT instead of
 * top-to-bottom. The era's life unfolds like a reel of film — hero → story →
 * members → photos → releases → press → outro — each panel locked to a
 * fresh full-screen frame.
 *
 * Why this exists: most era pages are a vertical scroll wall. CZ deserves
 * the cinematic horizontal treatment because its visual identity is so
 * specific (steel-navy, B&W contact-sheet portraits, Lockhart Dynasty + Fool's
 * Gold orbit). The film-reel pacing matches the album-cover energy.
 *
 * Mobile fallback: horizontal swipe on phones is awkward for long-form, so
 * on small screens we collapse to vertical scroll using the same panels —
 * still snap, just stacked. The CSS handles this via @media query.
 *
 * Keyboard / accessibility: arrow keys advance panels, Esc no-op. The active
 * panel index is shown as a small dot strip at top-right. Tabindex stays
 * normal so screen readers traverse content in source order regardless of
 * direction.
 */

type EraPhoto = { _id: string; image: SanityImage; caption?: string };
type Member = { name: string; slug: string };
type PressQuote = { _id: string; quote: string; source?: string; year?: number; url?: string };

export function HorizontalJourney({
  era,
  eraPhotos = [],
  ariaLabel,
}: {
  era: Pick<ProjectDetail, "name" | "color" | "tagline" | "yearStart" | "yearEnd" | "story" | "members" | "releases" | "pressQuotes" | "tourHighlights"> & { slug: string };
  eraPhotos?: EraPhoto[];
  ariaLabel: string;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activePanel, setActivePanel] = useState(0);
  const releases = era.releases ?? [];
  const press = (era.pressQuotes ?? []).slice(0, 6);
  const members = era.members ?? [];

  // Build the panel set conditionally — only include panels that have data.
  // Each entry: { key, render: () => JSX }. Order matters — this is the journey.
  type Panel = { key: string; render: () => React.ReactNode };
  const panels: Panel[] = [];
  panels.push({ key: "hero", render: () => <PanelHero era={era} eraPhotos={eraPhotos} /> });
  if (era.story && Array.isArray(era.story) && era.story.length > 0) {
    panels.push({ key: "story", render: () => <PanelStory story={era.story!} color={era.color ?? "#0E1B2C"} /> });
  }
  // BOO-SPECIFIC: vault + fresh videos placeholder panels. These only
  // render for the Gangsta Boo era — placeholder rooms for the unreleased
  // BOO VAULT material + the unreleased FAKE FRESH music video edits we
  // know live in the Drive but haven't ingested yet. They become real once
  // the audio + video assets are uploaded to Sanity.
  if (era.slug === "gangsta-boo-live-studio") {
    panels.push({ key: "vault", render: () => <PanelBooVault color={era.color ?? "#1C1A17"} /> });
    panels.push({ key: "fresh", render: () => <PanelBooFresh color={era.color ?? "#1C1A17"} /> });
  }
  if (members.length > 0) {
    panels.push({ key: "members", render: () => <PanelMembers members={members} color={era.color ?? "#0E1B2C"} /> });
  }
  if (eraPhotos.length >= 4) {
    panels.push({ key: "photos", render: () => <PanelPhotos photos={eraPhotos} color={era.color ?? "#0E1B2C"} /> });
  }
  if (releases.length > 0) {
    panels.push({ key: "releases", render: () => <PanelReleases releases={releases} color={era.color ?? "#0E1B2C"} /> });
  }
  if (press.length > 0) {
    panels.push({ key: "press", render: () => <PanelPress press={press} color={era.color ?? "#0E1B2C"} /> });
  }
  panels.push({ key: "outro", render: () => <PanelOutro era={era} /> });

  // Track which panel is centered as user swipes/scrolls horizontally
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActivePanel(Math.max(0, Math.min(panels.length - 1, idx)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [panels.length]);

  // Keyboard arrow key nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = scrollerRef.current;
      if (!el) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        el.scrollBy({ left: -el.clientWidth, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <style>{`
        .hj-scroller {
          scroll-snap-type: x mandatory;
          overflow-x: auto;
          overflow-y: hidden;
          height: 100vh;
          display: flex;
          scrollbar-width: thin;
        }
        .hj-panel {
          flex: 0 0 100vw;
          height: 100vh;
          scroll-snap-align: start;
          position: relative;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .hj-scroller {
            overflow-x: hidden;
            overflow-y: auto;
            height: auto;
            display: block;
          }
          .hj-panel {
            flex: none;
            min-height: 100vh;
            scroll-snap-align: none;
          }
        }
      `}</style>

      <div
        ref={scrollerRef}
        className="hj-scroller"
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
      >
        {panels.map((p) => (
          <section key={p.key} className="hj-panel">
            {p.render()}
          </section>
        ))}
      </div>

      {/* Panel indicator dots — top-right, fixed. Hidden on mobile (where
          the scroll is vertical and dots would be confusing). */}
      <div
        className="fixed top-6 right-6 z-30 flex gap-2 hidden md:flex"
        aria-hidden
      >
        {panels.map((_, i) => (
          <span
            key={i}
            className="block w-2 h-2 rounded-full border border-paper transition-colors"
            style={{
              background: i === activePanel ? "var(--paper, #F4EFE6)" : "transparent",
            }}
          />
        ))}
      </div>

      {/* Subtle nav hint — bottom-right, fades on later panels */}
      <div
        className="fixed bottom-6 right-6 z-30 font-mono text-[10px] tracking-[.2em] uppercase text-paper-2 hidden md:block transition-opacity"
        style={{ opacity: activePanel < panels.length - 1 ? 0.5 : 0 }}
        aria-hidden
      >
        scroll right →
      </div>
    </>
  );
}

// ── Panels ─────────────────────────────────────────────────────────

function PanelHero({
  era,
  eraPhotos,
}: {
  era: { name: string; color?: string; tagline?: string; yearStart?: number; yearEnd?: number };
  eraPhotos: EraPhoto[];
}) {
  const years = era.yearStart ? (era.yearEnd ? `${era.yearStart}–${era.yearEnd}` : `${era.yearStart} → today`) : "";
  // When the era has 4+ photos, render the hero as a TILE MOSAIC (the
  // scrapbook / contact-sheet wall energy — same vibe as the flyer wall).
  // Falls back to single-image hero for sparser eras.
  const tiles = eraPhotos.slice(0, 16);
  const useMosaic = tiles.length >= 4;
  return (
    <div className="absolute inset-0" style={{ background: era.color ?? "#0E1B2C" }}>
      {useMosaic ? (
        <div
          aria-hidden
          className="absolute inset-0 grid gap-1"
          style={{
            gridTemplateColumns: "repeat(4, 1fr)",
            gridAutoRows: "1fr",
            opacity: 0.9,
          }}
        >
          {tiles.map((p, i) => {
            const src = urlFor(p.image).width(800).fit("max").url();
            const span2 = i === 0 || i === 7;
            const rot = ((i * 41) % 9 - 4) * 0.4;
            return (
              <div
                key={p._id}
                className="overflow-hidden"
                style={{
                  gridColumn: span2 ? "span 2" : undefined,
                  gridRow: span2 ? "span 2" : undefined,
                  transform: `rotate(${rot}deg)`,
                }}
              >
                <img
                  src={src}
                  alt=""
                  loading="eager"
                  className="w-full h-full object-cover"
                  style={{ filter: "grayscale(70%) contrast(1.1) brightness(0.75)" }}
                />
              </div>
            );
          })}
        </div>
      ) : eraPhotos[0] ? (
        <img
          src={urlFor(eraPhotos[0].image).width(2400).fit("max").url()}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "grayscale(100%) contrast(1.15) brightness(0.6)" }}
        />
      ) : null}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${era.color ?? "#0E1B2C"}55 0%, ${era.color ?? "#0E1B2C"}dd 100%)`,
          mixBlendMode: "multiply",
        }}
      />
      <div className="relative h-full flex flex-col justify-end p-10 sm:p-16 max-w-[1180px] mx-auto">
        <div className="font-mono text-[11px] tracking-[.2em] uppercase text-paper-2 mb-3">
          {years}
        </div>
        <h1
          className="font-display font-bold uppercase m-0 text-paper"
          style={{ fontSize: "clamp(56px, 12vw, 200px)", lineHeight: 0.86, letterSpacing: "-0.025em" }}
        >
          {era.name}
        </h1>
        {era.tagline && (
          <p className="font-serif italic text-[20px] sm:text-[26px] mt-6 max-w-[820px] text-paper-2 leading-snug">
            {era.tagline}
          </p>
        )}
      </div>
    </div>
  );
}

function PanelStory({ story, color }: { story: unknown[]; color: string }) {
  return (
    <div className="absolute inset-0" style={{ background: color }}>
      <div className="relative h-full flex flex-col justify-center p-10 sm:p-16 max-w-[820px] mx-auto text-paper">
        <div className="font-mono text-[11px] tracking-[.2em] uppercase text-paper-2 mb-4">THE STORY</div>
        <div className="prose prose-invert max-w-none font-serif text-[18px] sm:text-[20px] leading-relaxed">
          <PortableText value={story} />
        </div>
      </div>
    </div>
  );
}

function PanelMembers({ members, color }: { members: Member[]; color: string }) {
  return (
    <div className="absolute inset-0" style={{ background: color }}>
      <div className="relative h-full flex flex-col justify-center p-10 sm:p-16 max-w-[1180px] mx-auto text-paper">
        <div className="font-mono text-[11px] tracking-[.2em] uppercase text-paper-2 mb-6">THE BAND</div>
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: `repeat(${Math.min(members.length, 4)}, minmax(0, 1fr))` }}
        >
          {members.map((m) => {
            const initials = m.name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
            return (
              <Link
                key={m.slug}
                href={`/artists/${m.slug}`}
                className="group flex flex-col items-center text-center no-underline text-paper"
              >
                <div className="aspect-square w-full max-w-[260px] border border-paper bg-paper/5 flex items-center justify-center mb-4 transition-colors group-hover:bg-paper/15">
                  <span
                    className="font-display font-black uppercase select-none leading-none"
                    style={{
                      fontSize: "clamp(60px, 9vw, 140px)",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {initials || "·"}
                  </span>
                </div>
                <div
                  className="font-display font-bold uppercase tracking-tight"
                  style={{ fontSize: "clamp(20px, 2.4vw, 32px)" }}
                >
                  {m.name}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PanelPhotos({ photos, color }: { photos: EraPhoto[]; color: string }) {
  // Mosaic of up to 12 photos, mid-tier B&W with the era color tint.
  const tiles = photos.slice(0, 12);
  return (
    <div className="absolute inset-0 flex" style={{ background: color }}>
      <div
        className="flex-1 grid gap-1 p-4"
        style={{ gridTemplateColumns: "repeat(4, 1fr)", gridAutoRows: "1fr" }}
      >
        {tiles.map((p) => {
          const src = urlFor(p.image).width(700).fit("max").url();
          return (
            <div key={p._id} className="overflow-hidden">
              <img
                src={src}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
                style={{ filter: "grayscale(100%) contrast(1.1) brightness(0.85)" }}
              />
            </div>
          );
        })}
      </div>
      <div className="absolute bottom-6 left-6 font-mono text-[11px] tracking-[.2em] uppercase text-paper-2">
        FROM THE ROOM · {photos.length} PHOTOS
      </div>
    </div>
  );
}

function PanelReleases({ releases, color }: { releases: ReleaseListItem[]; color: string }) {
  return (
    <div className="absolute inset-0" style={{ background: color }}>
      <div className="relative h-full flex flex-col justify-center p-10 sm:p-16 max-w-[1180px] mx-auto text-paper">
        <div className="font-mono text-[11px] tracking-[.2em] uppercase text-paper-2 mb-6">THE RECORDS</div>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {releases.map((r) => {
            const cv = r.cover ? urlFor(r.cover).width(440).height(440).fit("crop").url() : null;
            return (
              <Link
                key={r._id}
                href={`/releases/${r.slug}`}
                className="group block no-underline text-paper transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px]"
              >
                <div
                  className="aspect-square border border-paper mb-2 overflow-hidden"
                  style={{ background: r.coverColor ?? "#1C1A17" }}
                >
                  {cv && <img src={cv} alt={r.title} className="w-full h-full object-cover" />}
                </div>
                <div className="font-display font-bold text-[16px] uppercase leading-tight">{r.title}</div>
                {r.year && (
                  <div className="font-mono text-[10px] tracking-[.1em] uppercase text-paper-2 mt-1">{r.year}</div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PanelPress({ press, color }: { press: PressQuote[]; color: string }) {
  return (
    <div className="absolute inset-0" style={{ background: color }}>
      <div className="relative h-full flex flex-col justify-center p-10 sm:p-16 max-w-[1180px] mx-auto text-paper">
        <div className="font-mono text-[11px] tracking-[.2em] uppercase text-paper-2 mb-6">PRESS</div>
        <div className="grid gap-6 md:grid-cols-2">
          {press.map((q) => {
            const inner = (
              <>
                <div
                  className="font-serif italic leading-snug"
                  style={{ fontSize: "clamp(18px, 2vw, 26px)", letterSpacing: "-0.005em" }}
                >
                  &ldquo;{q.quote}&rdquo;
                </div>
                <div className="font-mono text-[10px] tracking-[.18em] uppercase text-paper-2 mt-3">
                  — {q.source}{q.year ? ` · ${q.year}` : ""}
                </div>
              </>
            );
            return q.url ? (
              <a key={q._id} href={q.url} target="_blank" rel="noopener noreferrer" className="block border border-paper p-5 no-underline text-paper hover:bg-paper/5 transition-colors">
                {inner}
              </a>
            ) : (
              <div key={q._id} className="border border-paper p-5">{inner}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// BOO-SPECIFIC PANELS ─────────────────────────────────────────────
// These render only when the era slug is gangsta-boo-live-studio.
// They're placeholder rooms for the unreleased BOO VAULT material + the
// unreleased FAKE FRESH music video edits sitting in the Drive. When we
// ingest the audio + video, these panels become real.

function PanelBooVault({ color }: { color: string }) {
  const cuts = [
    "Suicide (v1.3)",
    "Suicide (v1.4)",
    "BOO 10",
    "Hook Boo 2018",
    "Hook Boo Isaac",
    "Boo Pawmps Vocal",
    "Boo 8 (with Donald)",
    "Champion Waller session",
  ];
  return (
    <div className="absolute inset-0" style={{ background: color }}>
      <div className="relative h-full flex flex-col justify-center p-10 sm:p-16 max-w-[820px] mx-auto text-paper">
        <div className="font-mono text-[11px] tracking-[.2em] uppercase text-collect mb-2">THE BOO VAULT · COMING</div>
        <h2
          className="font-display font-bold uppercase m-0"
          style={{ fontSize: "clamp(36px, 6vw, 80px)", lineHeight: 0.95, letterSpacing: "-0.02em" }}
        >
          unreleased cuts
        </h2>
        <p className="font-serif italic text-[16px] sm:text-[18px] mt-4 mb-6 text-paper-2 leading-snug">
          sequenced as a posthumous mixtape — plays in order once the audio is uploaded.
        </p>
        <ul className="grid gap-1.5 font-mono text-[11px] tracking-[.06em] uppercase text-paper-2">
          {cuts.map((c, i) => (
            <li key={c} className="flex items-baseline gap-3 border-b border-paper/15 py-2">
              <span className="opacity-50 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span>{c}</span>
              <span className="ml-auto text-paper-2/50 text-[9px]">vault — pending</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PanelBooFresh({ color }: { color: string }) {
  const edits = [
    { title: "FRESH INDIA PREMIER",   note: "Premiere Pro project · multi-cam edit" },
    { title: "CHRIS FRESH",            note: "alt edit" },
    { title: "TSP FRESH REAP",         note: "thespacepit cut" },
    { title: "I'M FRESH",              note: "official video (CC catalog)" },
    { title: "BOO PROJECT.mp4",        note: "long-form session footage" },
  ];
  return (
    <div className="absolute inset-0" style={{ background: color }}>
      <div className="relative h-full flex flex-col justify-center p-10 sm:p-16 max-w-[1180px] mx-auto text-paper">
        <div className="font-mono text-[11px] tracking-[.2em] uppercase text-collect mb-2">THE FAKE FRESH EDITS · COMING</div>
        <h2
          className="font-display font-bold uppercase m-0 mb-6"
          style={{ fontSize: "clamp(36px, 6vw, 80px)", lineHeight: 0.95, letterSpacing: "-0.02em" }}
        >
          the fresh videos
        </h2>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {edits.map((v) => (
            <div key={v.title} className="border border-paper/40 p-4 aspect-video flex flex-col justify-end">
              <div className="font-display font-bold text-[14px] uppercase leading-tight">{v.title}</div>
              <div className="font-mono text-[9px] tracking-[.14em] uppercase text-paper-2 mt-1">{v.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PanelOutro({
  era,
}: {
  era: { name: string; yearEnd?: number; slug: string };
}) {
  const ended = era.yearEnd ? `dissolved ${era.yearEnd}` : "still going";
  return (
    <div className="absolute inset-0" style={{ background: "var(--ink, #0B0B0B)" }}>
      <div className="relative h-full flex flex-col justify-center items-center p-10 sm:p-16 max-w-[820px] mx-auto text-paper text-center">
        <div className="font-mono text-[11px] tracking-[.2em] uppercase text-paper-2 mb-4">END OF THE REEL</div>
        <h2
          className="font-display font-bold uppercase m-0 mb-6"
          style={{ fontSize: "clamp(40px, 7vw, 96px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
        >
          {era.name}
          <br />
          <span className="text-paper-2">{ended}.</span>
        </h2>
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          <Link
            href="/eras"
            className="font-mono text-[11px] tracking-[.14em] uppercase px-4 py-2 border border-paper text-paper hover:bg-paper hover:text-ink transition-colors no-underline"
          >
            ← back to all eras
          </Link>
          <Link
            href={`/catalog?era=${era.slug}`}
            className="font-mono text-[11px] tracking-[.14em] uppercase px-4 py-2 border border-paper text-paper hover:bg-paper hover:text-ink transition-colors no-underline"
          >
            full catalog →
          </Link>
        </div>
      </div>
    </div>
  );
}
