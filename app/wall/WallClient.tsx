"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * The wall — every flyer rendered as a tile on a literal graffiti wall.
 *
 * Layout: full-bleed grid, each tile slightly rotated within ±4° based on a
 * stable hash of its ID (so the same flyer always sits the same way and
 * the wall is consistent across reloads, not chaotic). Tiles use a brick-
 * masonry-ish flow — CSS columns instead of grid, so they pack natural
 * heights and the wall feels less mechanical than a strict square grid.
 *
 * Click a tile → fullscreen lightbox with caption + tag chips + esc-to-close.
 *
 * The vibe Nick described: "when you're playing stems, the wall is the room
 * you're in." This component is built to also embed as the background of
 * /jam — a smaller version with paused-by-default lightbox, behind the
 * stem player. That use is a future task; for now the dedicated /wall
 * page is the home.
 */

type Tile = {
  id: string;
  title: string;
  kind: string;
  date: string | null;
  year: number | null;
  city: string | null;
  venue: string | null;
  tags: string[];
  src: string;
  hiRes: string;
};

// Stable per-tile rotation — same ID → same rotation, no shuffle on reload.
function rotationFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 70) - 35) / 10; // -3.5°..+3.5°
}

const KIND_LABEL: Record<string, string> = {
  show: "show",
  "tour-poster": "tour",
  "release-party": "release party",
  sticker: "sticker",
  mixtape: "mixtape",
  festival: "festival",
  workshop: "workshop",
  other: "flyer",
};

export function WallClient({ tiles }: { tiles: Tile[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  // Tag/kind chip strip — derived live from the tile set so we only show
  // chips for filters that actually have content.
  const kinds = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tiles) map.set(t.kind, (map.get(t.kind) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [tiles]);

  const visible = useMemo(() => {
    if (filter === "all") return tiles;
    return tiles.filter((t) => t.kind === filter || (t.tags ?? []).includes(filter));
  }, [tiles, filter]);

  const open = openId ? tiles.find((t) => t.id === openId) ?? null : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Filter chip strip — sticky under the hero so visitors can re-cut
          the wall by show vs release-party vs tour-poster vs sticker. */}
      <div className="sticky top-0 z-10 bg-ink/95 backdrop-blur border-b border-paper/30 px-5 sm:px-8 py-3 flex flex-wrap gap-2">
        <Chip active={filter === "all"} onClick={() => setFilter("all")} label={`all · ${tiles.length}`} />
        {kinds.map(([k, n]) => (
          <Chip key={k} active={filter === k} onClick={() => setFilter(k)} label={`${KIND_LABEL[k] ?? k} · ${n}`} />
        ))}
      </div>

      {/* The wall itself — CSS columns for masonry-ish vertical flow.
          Each tile sits inside a "tape" container with subtle shadow + a
          rotation so the wall reads as taped-up artifacts, not a UI grid. */}
      <section className="px-3 sm:px-5 py-6">
        <div
          className="mx-auto"
          style={{
            columnCount: 5,
            columnGap: "10px",
            maxWidth: 1600,
          }}
        >
          <style>{`
            @media (max-width: 1280px) { section [data-wall] { column-count: 4; } }
            @media (max-width: 960px)  { section [data-wall] { column-count: 3; } }
            @media (max-width: 640px)  { section [data-wall] { column-count: 2; } }
          `}</style>
          <div data-wall style={{ columnCount: "inherit", columnGap: "inherit" }}>
            {visible.map((t) => {
              const rot = rotationFor(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOpenId(t.id)}
                  className="block w-full mb-2.5 group relative"
                  style={{
                    breakInside: "avoid",
                    transform: `rotate(${rot}deg)`,
                    transition: "transform 200ms ease",
                    cursor: "zoom-in",
                    background: "transparent",
                    border: 0,
                    padding: 0,
                  }}
                >
                  <div
                    className="overflow-hidden border border-paper/20 group-hover:border-paper transition-colors"
                    style={{
                      boxShadow: "0 6px 18px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.src}
                      alt={t.title}
                      loading="lazy"
                      className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  {/* Hover-only caption strip across the bottom edge */}
                  <div
                    className="absolute left-0 right-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1.5 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, rgba(11,11,11,0) 0%, rgba(11,11,11,0.92) 100%)",
                    }}
                  >
                    <div className="font-mono text-[9px] tracking-[.14em] uppercase text-paper truncate">
                      {[t.date ?? t.year, t.city ?? t.venue].filter(Boolean).join(" · ") || (KIND_LABEL[t.kind] ?? t.kind)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lightbox — full-bleed dark backdrop, the flyer at high res, caption
          + tags + close (or Esc). */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-8 bg-ink/95"
          onClick={() => setOpenId(null)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpenId(null); }}
            className="absolute top-4 right-4 font-mono text-[11px] tracking-[.14em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors cursor-pointer"
          >
            close · esc
          </button>
          <div
            className="relative max-w-[1200px] max-h-[calc(100vh-160px)] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={open.hiRes}
              alt={open.title}
              className="block max-w-full max-h-[calc(100vh-200px)] object-contain"
              style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}
            />
          </div>
          <div className="mt-5 text-center max-w-[820px]">
            <div className="font-display font-semibold text-paper uppercase" style={{ fontSize: "clamp(18px, 2vw, 24px)", letterSpacing: "-0.005em" }}>
              {open.title || "(untitled flyer)"}
            </div>
            <div className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 mt-1">
              {[KIND_LABEL[open.kind] ?? open.kind, open.date ?? open.year, [open.venue, open.city].filter(Boolean).join(", ")]
                .filter(Boolean)
                .join("  ·  ")}
            </div>
            {open.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                {open.tags.map((tg) => (
                  <span key={tg} className="font-mono text-[9px] tracking-[.14em] uppercase px-2 py-0.5 border border-paper/40 rounded-full text-paper-2">
                    {tg}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono text-[10px] tracking-[.14em] uppercase px-3 py-1 border rounded-full transition-colors cursor-pointer ${
        active
          ? "border-paper bg-paper text-ink"
          : "border-paper/50 text-paper hover:border-paper hover:bg-paper hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
