"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type PressCard = {
  _id: string;
  kind: string;
  headline?: string;
  quote: string;
  excerpt?: string;
  outletDisplay?: string;
  outlet?: string;
  url?: string;
  year?: number;
  date?: string;
  imageUrl: string | null;
  /** Where the imageUrl came from. "article" = scraped og:image, "cover" =
   *  fallback to the linked release's album art, null = no image at all so
   *  the tile renders a colored title-block in place of a photo. */
  imageKind?: "article" | "cover" | null;
  /** Hex color from the linked release (used as backdrop for cover-fallback
   *  tiles + as the title-block bg when there's no image). */
  coverColor?: string;
  eraSlug?: string;
  eraName?: string;
  releaseSlug?: string;
  releaseTitle?: string;
  /** "Pin to top" toggle from Sanity. When any items have this set true,
   *  the featured rail uses ONLY those (manual curation). Falls back to
   *  the heuristic when nothing is marked. */
  featured?: boolean;
};

const KIND_COLORS: Record<string, string> = {
  review:         "#F2B705",     // lamp amber
  interview:      "#E83A1C",     // redline
  feature:        "#2F6FB3",     // chakra-throat blue
  profile:        "#4B2E83",     // chakra-third purple
  mention:        "#E8E2D4",     // paper-2 (neutral)
  "list-inclusion": "#3E8E5A",   // chakra-heart green
  premiere:       "#FFB347",     // peach
};

export function PressClient({ items }: { items: PressCard[] }) {
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [eraFilter, setEraFilter]   = useState<string>("all");
  const [search, setSearch] = useState("");

  // Build unique filter options from the data
  const kinds = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) m.set(i.kind, (m.get(i.kind) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const eras = useMemo(() => {
    const m = new Map<string, { slug: string; name: string; count: number }>();
    for (const i of items) {
      if (!i.eraSlug || !i.eraName) continue;
      const prev = m.get(i.eraSlug);
      m.set(i.eraSlug, { slug: i.eraSlug, name: i.eraName, count: (prev?.count ?? 0) + 1 });
    }
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [items]);

  // Deep-link sync: era pages link here as `/press?era=cubic-zirconia` so
  // landing on the room is already filtered to that world. We only set the
  // filter if the slug actually matches an era we have data for (else the
  // chip strip wouldn't reflect the state and visitors would be confused).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromQuery = new URLSearchParams(window.location.search).get("era");
    if (fromQuery && (fromQuery === "all" || eras.some((e) => e.slug === fromQuery))) {
      setEraFilter(fromQuery);
    }
    // eras list is derived from items which is stable across the lifetime of
    // this page, so this effectively runs once on mount.
  }, [eras]);

  // Mirror filter state back to the URL so refresh / share / back-button all
  // restore the same view. History.replace keeps the back button clean.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (eraFilter === "all") url.searchParams.delete("era");
    else url.searchParams.set("era", eraFilter);
    window.history.replaceState({}, "", url.toString());
  }, [eraFilter]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (kindFilter !== "all" && i.kind !== kindFilter) return false;
      if (eraFilter !== "all" && i.eraSlug !== eraFilter) return false;
      if (q) {
        const hay = [i.headline, i.quote, i.excerpt, i.outletDisplay, i.outlet, i.releaseTitle]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, kindFilter, eraFilter, search]);

  // Group visible items by year for the chronological scroll.
  const grouped = useMemo(() => {
    const buckets = new Map<number, PressCard[]>();
    for (const i of visible) {
      const y = i.year ?? 0;
      const arr = buckets.get(y) ?? [];
      arr.push(i);
      buckets.set(y, arr);
    }
    // Sort each year's items: items with article images first (more visual),
    // then ones with release-cover fallback, then text-only. Stable inside
    // each tier so the original chronological order holds.
    for (const arr of buckets.values()) {
      arr.sort((a, b) => {
        const rank = (c: PressCard) =>
          c.imageKind === "article" ? 0 : c.imageKind === "cover" ? 1 : 2;
        const diff = rank(a) - rank(b);
        if (diff !== 0) return diff;
        // Then by date desc inside year (newest first)
        return (b.date ?? "").localeCompare(a.date ?? "");
      });
    }
    return [...buckets.entries()].sort((a, b) => b[0] - a[0]);
  }, [visible]);

  // Featured rail — MANUALLY curated. We honor the `featured: true` flag on
  // the press doc first; the heuristic (article image + real headline) only
  // serves as a fallback for when no items are explicitly marked yet. Cap at
  // 15 so it can be a real scrollable rail of marquee work, not just 6 tiles.
  // To set: in Sanity Studio, open a press item and toggle "Pin to top".
  const featured = useMemo(() => {
    if (kindFilter !== "all" || eraFilter !== "all" || search.trim()) return [];
    const manuallyMarked = visible.filter((i) => i.featured === true);
    if (manuallyMarked.length > 0) {
      // Sort marked items by date desc, cap at 15.
      return manuallyMarked
        .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
        .slice(0, 15);
    }
    // Fallback heuristic — only kicks in if Nick hasn't marked anyone featured
    // yet. Keeps the rail populated either way.
    return visible
      .filter((i) => i.imageKind === "article" && i.headline && i.headline.length > 8)
      .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
      .slice(0, 15);
  }, [visible, kindFilter, eraFilter, search]);

  return (
    <>
      {/* Sticky filter strip */}
      <div className="px-5 sm:px-8 py-5 border-b border-paper/30 sticky top-[60px] z-[5] bg-ink/92 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="search"
            placeholder="search headline · outlet · quote…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border border-paper text-paper px-3 py-1.5 font-mono text-[12px] tracking-[.05em] placeholder:text-on-dark/60 focus:outline-none focus:border-redline min-w-[260px]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="font-mono text-[10px] tracking-[.18em] uppercase text-paper-2 mr-1">kind ·</span>
          <button
            onClick={() => setKindFilter("all")}
            className={`font-mono text-[10px] tracking-[.12em] uppercase px-2.5 py-1 border rounded-full ${kindFilter === "all" ? "border-paper bg-paper text-ink" : "border-paper hover:bg-paper hover:text-ink"} transition-colors`}
          >
            all
          </button>
          {kinds.map(([k]) => {
            const color = KIND_COLORS[k] ?? "#F4EFE6";
            return (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={`font-mono text-[10px] tracking-[.12em] uppercase px-2.5 py-1 border rounded-full flex items-center gap-1.5 transition-colors ${kindFilter === k ? "border-paper bg-paper text-ink" : "border-paper hover:bg-paper hover:text-ink"}`}
              >
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
                {k}
              </button>
            );
          })}
        </div>
        {eras.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="font-mono text-[10px] tracking-[.18em] uppercase text-paper-2 mr-1">era ·</span>
            <button
              onClick={() => setEraFilter("all")}
              className={`font-mono text-[10px] tracking-[.12em] uppercase px-2.5 py-1 border rounded-full ${eraFilter === "all" ? "border-paper bg-paper text-ink" : "border-paper hover:bg-paper hover:text-ink"} transition-colors`}
            >
              all eras
            </button>
            {eras.map((e) => (
              <button
                key={e.slug}
                onClick={() => setEraFilter(e.slug)}
                className={`font-mono text-[10px] tracking-[.12em] uppercase px-2.5 py-1 border rounded-full ${eraFilter === e.slug ? "border-paper bg-paper text-ink" : "border-paper hover:bg-paper hover:text-ink"} transition-colors`}
              >
                {e.name.toLowerCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Featured rail — only when no filter is active, gives the page a
          visual anchor before the year-by-year scroll. Two-up at desktop. */}
      {featured.length > 0 && (
        <section className="px-5 sm:px-8 pt-10 pb-2">
          <div className="flex items-baseline gap-3 mb-5">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase text-redline">
              FEATURED · THE BIG HITS
            </div>
            <span className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2/60">
              {featured.length} of {items.length}
            </span>
          </div>
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))" }}
          >
            {featured.map((p) => <PressTile key={`f-${p._id}`} p={p} large />)}
          </div>
        </section>
      )}

      {/* Year-grouped chronological list */}
      <div className="px-5 sm:px-8 py-10">
        {visible.length === 0 ? (
          <p className="font-serif italic text-[20px] text-paper-2 text-center py-20">
            no press matches that filter.
          </p>
        ) : (
          grouped.map(([year, list]) => (
            <section key={year} className="mb-14">
              <div className="flex items-baseline gap-3 border-b-2 border-paper pb-2 mb-6 sticky top-[200px] sm:top-[180px] z-[3] bg-ink/90 backdrop-blur-sm -mx-5 sm:-mx-8 px-5 sm:px-8">
                <h2
                  className="font-display font-bold uppercase m-0 tabular-nums"
                  style={{ fontSize: "clamp(36px, 5.5vw, 64px)", lineHeight: 1, letterSpacing: "-0.025em" }}
                >
                  {year > 0 ? year : "—"}
                </h2>
                <span className="font-mono text-[11px] tracking-[.14em] uppercase text-paper-2 ml-auto">
                  {list.length} {list.length === 1 ? "piece" : "pieces"}
                </span>
              </div>
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}
              >
                {list.map((p) => <PressTile key={p._id} p={p} />)}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}

function PressTile({ p, large = false }: { p: PressCard; large?: boolean }) {
  const color = KIND_COLORS[p.kind] ?? "#F4EFE6";
  // Image-block aspect ratio: article images are typically 16:10 hero crops;
  // album covers are square — render as 1:1 so they don't crop awkwardly.
  // For pieces with NO image at all, fall back to a tall (4:3) colored block
  // stamped with the outlet name so the tile still feels visual.
  // `large` is for the featured rail — bumps everything up a notch.
  const aspect = p.imageKind === "cover" ? "aspect-square" : large ? "aspect-[16/9]" : "aspect-[16/10]";
  const showBadge = p.imageKind === "cover";
  const content = (
    <div className="relative border border-paper bg-ink-2 flex flex-col h-full overflow-hidden">
      {/* Stretched-link pattern: the article URL covers the whole card via
          an absolutely-positioned anchor at z-[1]. Any internal links (the
          release/era chips below) sit at z-[2] so they capture their own
          clicks. This avoids nesting <a> inside <a> — React's hydration
          checker rightfully hates that, and browsers render it unreliably. */}
      {p.url && (
        <a
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={p.headline ?? p.outletDisplay ?? "open press piece"}
          className="absolute inset-0 z-[1]"
        />
      )}
      {/* Accent stripe top */}
      <div className="absolute top-0 left-0 right-0 h-[3px] z-[1]" style={{ background: color }} aria-hidden />
      {/* Image (article og:image, falling back to album cover) */}
      {p.imageUrl ? (
        <div className={`relative ${aspect} overflow-hidden border-b border-paper`} style={{ background: p.coverColor ?? "#1C1A17" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.imageUrl}
            alt={p.headline ?? p.outletDisplay ?? "press"}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {showBadge && (
            <div className="absolute bottom-2 left-2 font-mono text-[9px] tracking-[.16em] uppercase px-2 py-0.5 bg-ink/85 text-paper border border-paper rounded-full">
              from the cover ↗
            </div>
          )}
        </div>
      ) : (
        // No image at all — render a colored placeholder block stamped with
        // the outlet so the tile still feels designed, not broken.
        <div
          className="relative aspect-[4/3] flex items-center justify-center p-5 text-center border-b border-paper"
          style={{ background: p.coverColor ?? "#1C1A17" }}
        >
          <div className="font-display font-black uppercase text-paper leading-[0.95]" style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.015em" }}>
            {p.outlet ?? p.outletDisplay ?? "press"}
          </div>
        </div>
      )}
      <div className={`${large ? "p-6 gap-4" : "p-4 gap-3"} flex flex-col flex-1`}>
        <div className="font-mono text-[9px] tracking-[.18em] uppercase flex items-center gap-2" style={{ color }}>
          <span>{p.kind}</span>
          {p.outlet && <span className="text-paper-2/80">· {p.outlet}</span>}
          {p.date && (
            <span className="ml-auto text-paper-2/80 tabular-nums">
              {new Date(p.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toLowerCase()}
            </span>
          )}
        </div>
        {p.headline ? (
          <h3
            className="font-display font-semibold uppercase m-0 leading-[1.02]"
            style={{ fontSize: large ? "clamp(24px, 2.6vw, 32px)" : "clamp(18px, 1.8vw, 22px)", letterSpacing: "-0.005em" }}
          >
            {p.headline}
          </h3>
        ) : null}
        <div className={`font-serif italic ${large ? "text-[17px] sm:text-[19px] line-clamp-3" : "text-[15px] sm:text-[16px] line-clamp-4"} leading-snug text-paper`}>
          &ldquo;{p.quote}&rdquo;
        </div>
        {p.outletDisplay && p.outletDisplay !== p.outlet && (
          <div className="font-mono text-[10px] tracking-[.1em] text-paper-2">— {p.outletDisplay}</div>
        )}
        {(p.releaseTitle || p.eraName) && (
          <div className="flex flex-wrap items-center gap-2 mt-auto pt-2 font-mono text-[9px] tracking-[.14em] uppercase">
            {p.releaseSlug && (
              <Link
                href={`/releases/${p.releaseSlug}`}
                className="relative z-[2] px-2 py-0.5 border border-collect text-collect hover:bg-collect hover:text-paper transition-colors rounded-full no-underline"
              >
                {p.releaseTitle}
              </Link>
            )}
            {p.eraSlug && (
              <Link
                href={`/eras/${p.eraSlug}`}
                className="relative z-[2] px-2 py-0.5 border border-redline text-redline hover:bg-redline hover:text-paper transition-colors rounded-full no-underline"
              >
                {p.eraName?.toLowerCase()}
              </Link>
            )}
          </div>
        )}
        {p.url && (
          <div className="font-mono text-[9px] tracking-[.14em] uppercase text-paper-2 mt-1">
            read on {(() => { try { return new URL(p.url).host.replace(/^www\./, ""); } catch { return "source"; } })()} ↗
          </div>
        )}
      </div>
    </div>
  );
  // Outer wrapper is ALWAYS a <div> (never an anchor) — the article URL is
  // now the stretched <a> inside `content`. The div carries hover transform
  // + offset-shadow; the inner chip Links sit above the stretched anchor at
  // z-[2] so each link captures its own click.
  return (
    <div
      className="group block text-paper transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px]"
      style={{ ["--hover" as string]: color }}
      onMouseEnter={(e) => {
        if (p.url) e.currentTarget.style.boxShadow = `4px 4px 0 ${color}`;
      }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
    >
      {content}
    </div>
  );
}
