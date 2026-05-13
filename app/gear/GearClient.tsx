"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { urlFor } from "../_lib/sanity";
import type { GearItem } from "../_lib/sanity-queries";
import type { GearCategory, CategoryMeta } from "../_lib/gear-data";
import { CATEGORIES } from "../_lib/gear-data";

type Filter = GearCategory | "all" | "with-videos";

const CATEGORY_KEYS = new Set<string>(CATEGORIES.map((c) => c.key));
const CAT_BY_KEY: Record<string, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
);

function readCatFromUrl(): Filter {
  if (typeof window === "undefined") return "all";
  const cat = new URLSearchParams(window.location.search).get("cat");
  if (cat === "with-videos") return "with-videos";
  if (cat && CATEGORY_KEYS.has(cat)) return cat as GearCategory;
  return "all";
}

export function GearClient({ items }: { items: GearItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const initial = readCatFromUrl();
    if (initial !== "all") setFilter(initial);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (filter === "all") url.searchParams.delete("cat");
    else url.searchParams.set("cat", filter);
    window.history.replaceState(null, "", url.toString());
  }, [filter]);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "with-videos") return items.filter((g) => (g.videoCount ?? 0) > 0);
    return items.filter((g) => g.category === filter);
  }, [filter, items]);

  // Total gear pieces with at least one video. Used to label the filter chip
  // so visitors see how much there is before clicking in.
  const withVideosCount = useMemo(
    () => items.filter((g) => (g.videoCount ?? 0) > 0).length,
    [items]
  );

  // Track which categories have anything so we hide empty chips.
  const populated = useMemo(() => {
    const has = new Set<GearCategory>();
    for (const g of items) has.add(g.category as GearCategory);
    return has;
  }, [items]);

  // Pinned items — shown FIRST in a featured row, always (regardless of filter).
  // These are the ones Nick wants front-and-center: the rack right now.
  const pinned = useMemo(
    () => items.filter((g) => g.pinned),
    [items]
  );

  // Group visible items by category, in CATEGORIES display order. Within each
  // bucket, gear that has videos floats to the front — heavy video coverage
  // first, then the rest. This makes "the gear we've actually documented" the
  // first thing you see on every shelf.
  const grouped = useMemo(() => {
    const order: GearCategory[] = CATEGORIES.map((c) => c.key);
    const buckets = new Map<GearCategory, GearItem[]>();
    for (const item of visible) {
      const cat = item.category as GearCategory;
      const arr = buckets.get(cat) ?? [];
      arr.push(item);
      buckets.set(cat, arr);
    }
    for (const arr of buckets.values()) {
      arr.sort((a, b) => {
        const av = a.videoCount ?? 0;
        const bv = b.videoCount ?? 0;
        if (av !== bv) return bv - av;
        return a.name.localeCompare(b.name);
      });
    }
    return order
      .filter((cat) => buckets.has(cat))
      .map((cat) => ({ cat, items: buckets.get(cat)! }));
  }, [visible]);

  return (
    <>
      {/* Sticky filter strip */}
      <div className="px-5 sm:px-8 py-6 border-b border-paper sticky top-[60px] z-[5] bg-ink/95 backdrop-blur-md">
        <div className="flex flex-wrap gap-2">
          <Chip active={filter === "all"} onClick={() => setFilter("all")} label="all" />
          {/* "with videos" chip — shortcut to the slice of the rack that has
              documented demos / livestreams attached. Counter shows how
              many pieces qualify. */}
          {withVideosCount > 0 && (
            <Chip
              active={filter === "with-videos"}
              onClick={() => setFilter("with-videos")}
              label={`▶ with videos (${withVideosCount})`}
              accent="#F2B705"
            />
          )}
          {CATEGORIES.map((c) => {
            if (!populated.has(c.key)) return null;
            return (
              <Chip
                key={c.key}
                active={filter === c.key}
                onClick={() => setFilter(c.key)}
                label={c.label}
                accent={c.accent}
              />
            );
          })}
        </div>
      </div>

      {/* PINNED — "patched in right now" featured row. Always visible at the
          top, even when a category filter is active, so the desk is the
          anchor. */}
      {filter === "all" && pinned.length > 0 && (
        <section className="px-5 sm:px-8 pt-12 pb-2">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-lamp animate-pulse" />
            patched in · on the desk right now
          </div>
          <h2
            className="font-display font-bold uppercase m-0 mb-6"
            style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
          >
            the desk
          </h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {pinned.map((g) => (
              <GearCard key={g._id} g={g} featured />
            ))}
          </div>
        </section>
      )}

      {/* MAIN GRID — grouped by category */}
      <div className="px-5 sm:px-8 py-12">
        {grouped.length === 0 && (
          <p className="font-serif italic text-[20px] text-paper-2">nothing in this rack yet.</p>
        )}
        {grouped.map(({ cat, items: catItems }) => {
          const meta = CAT_BY_KEY[cat];
          return (
            <section key={cat} className="mb-16">
              {/* Category header — accent dot + label + blurb */}
              <div className="flex items-end justify-between border-b-2 pb-2.5 mb-6 flex-wrap gap-3" style={{ borderColor: meta?.accent ?? "#F4EFE6" }}>
                <div>
                  <div className="font-mono text-[10px] tracking-[.18em] uppercase mb-1 flex items-center gap-2" style={{ color: meta?.accent }}>
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: meta?.accent }} />
                    on the shelf
                  </div>
                  <h2
                    className="font-display font-bold uppercase m-0"
                    style={{ fontSize: "clamp(32px, 4.5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
                  >
                    {meta?.label ?? cat}
                  </h2>
                </div>
                {meta?.blurb && (
                  <div className="font-serif italic text-[16px] text-paper-2 sm:text-right">{meta.blurb}</div>
                )}
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {catItems.map((g) => <GearCard key={g._id} g={g} />)}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

/* ============================================================================
 * Gear card — handles photo case AND photoless case. Empty cards get a
 * category-tinted panel with the manufacturer + name typeset large so they
 * still look intentional, not unfinished. Status dot, year, and accent
 * top-stripe communicate identity at a glance.
 * ========================================================================*/
function GearCard({ g, featured = false }: { g: GearItem; featured?: boolean }) {
  const meta = CAT_BY_KEY[g.category];
  const accent = meta?.accent ?? "#F4EFE6";
  const tint = meta?.tint ?? "rgba(244,239,230,0.08)";
  const photo = g.photo ? urlFor(g.photo).width(featured ? 960 : 720).height(featured ? 720 : 540).fit("crop").url() : null;
  const isRetired = g.status === "retired";

  return (
    <Link
      href={`/gear/${g.slug}`}
      className={`group block border border-paper bg-ink-2 transition-all duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] overflow-hidden no-underline text-paper relative ${isRetired ? "opacity-60" : ""}`}
      style={{
        // Hover shadow uses the category accent — wired via inline style so
        // each card pops in its own color.
        boxShadow: "none",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `4px 4px 0 ${accent}`; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Accent stripe — top edge, category color */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: accent }} aria-hidden />

      {/* Image / placeholder area */}
      <div
        className={`relative ${featured ? "aspect-[5/4]" : "aspect-[4/3]"} overflow-hidden border-b border-paper`}
        style={{ background: photo ? "#0B0B0B" : tint }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={g.name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          // No photo yet — big stamped placeholder w/ category accent
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
            <div
              className="font-mono text-[9px] tracking-[.24em] uppercase mb-2"
              style={{ color: accent, opacity: 0.85 }}
            >
              {meta?.label ?? g.category}
            </div>
            <div
              className="font-display font-bold uppercase leading-[0.92] tracking-[-0.015em]"
              style={{
                fontSize: `clamp(${featured ? 28 : 22}px, ${featured ? 3.5 : 2.8}vw, ${featured ? 44 : 32}px)`,
                color: "#F4EFE6",
              }}
            >
              {g.name}
            </div>
            {g.manufacturer && (
              <div className="font-mono text-[9px] tracking-[.14em] uppercase text-paper-2/60 mt-3">
                {g.manufacturer}
              </div>
            )}
            <div className="font-mono text-[8px] tracking-[.2em] uppercase text-paper-2/40 mt-6">
              awaiting photo
            </div>
          </div>
        )}

        {/* Pinned badge — top-right */}
        {g.pinned && (
          <div
            className="absolute top-2 right-2 font-mono text-[8px] tracking-[.18em] uppercase px-1.5 py-0.5 rounded-full"
            style={{ background: accent, color: "#0B0B0B" }}
          >
            patched in
          </div>
        )}
        {/* Video-count badge — top-left. Highlights gear that has linked
            demos / livestreams so visitors spot "click here for videos"
            at a glance on the rack grid. */}
        {g.videoCount && g.videoCount > 0 && (
          <div
            className="absolute top-2 left-2 font-mono text-[8px] tracking-[.18em] uppercase px-1.5 py-0.5 rounded-full flex items-center gap-1 bg-ink/85 backdrop-blur-sm"
            style={{ color: accent, border: `1px solid ${accent}` }}
          >
            <span>▶</span>
            <span>{g.videoCount}</span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="min-w-0 flex-1">
            {g.manufacturer && (
              <div className="font-mono text-[9px] tracking-[.14em] uppercase text-paper-2 line-clamp-1">
                {g.manufacturer}
              </div>
            )}
            <div className="font-display text-[20px] uppercase font-semibold tracking-[-0.005em] leading-tight line-clamp-2">
              {g.name}
            </div>
          </div>
          <StatusDot status={g.status} />
        </div>
        {g.note && (
          <p className="font-mono text-[11px] tracking-[.02em] text-on-dark leading-snug mt-2 line-clamp-3">
            {g.note}
          </p>
        )}
        <div className="font-mono text-[9px] tracking-[.14em] uppercase text-paper-2 mt-3 flex items-center gap-2">
          <span>{statusLabel(g.status)}</span>
          {g.yearAcquired && <span>· since {g.yearAcquired}</span>}
          {/* Inline video count — bigger and louder than the corner badge.
              When there are videos, this becomes the loudest thing in the
              card footer so visitors know "click here for tape." */}
          {g.videoCount && g.videoCount > 0 && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full"
              style={{ background: accent, color: "#0B0B0B" }}
            >
              <span>▶</span>
              <span className="tabular-nums">{g.videoCount}</span>
              <span>{g.videoCount === 1 ? "video" : "videos"}</span>
            </span>
          )}
          <span
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: accent }}
          >
            enter →
          </span>
        </div>
      </div>
    </Link>
  );
}

function statusLabel(s: GearItem["status"]) {
  switch (s) {
    case "active":   return "patched";
    case "shelf":    return "shelf";
    case "travel":   return "travel";
    case "wishlist": return "wishlist";
    case "retired":  return "retired";
    default:         return s;
  }
}

function Chip({
  active,
  onClick,
  label,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono text-[11px] tracking-[.12em] uppercase px-3 py-1.5 border rounded-full transition-colors flex items-center gap-1.5 ${
        active
          ? "border-lamp bg-lamp text-ink"
          : "border-paper text-paper hover:bg-paper hover:text-ink"
      }`}
    >
      {accent && (
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: accent }} />
      )}
      {label}
    </button>
  );
}

function StatusDot({ status }: { status: GearItem["status"] }) {
  const color =
    status === "active" ? "bg-lamp" :
    status === "travel" ? "bg-chakra-heart" :
    status === "wishlist" ? "bg-redline" :
    status === "retired" ? "bg-paper-2 opacity-40" :
    "bg-paper-2";
  return <span className={`inline-block w-2 h-2 rounded-full mt-2 shrink-0 ${color}`} title={status} />;
}
