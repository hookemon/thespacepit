"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CatalogItem } from "../_lib/sanity-queries";
import { urlFor } from "../_lib/sanity";

type Filter = "all" | "label" | "production" | "mix" | "remix" | "appearance" | "djmix";
type View = "side-by-side" | "single";

const ROLE_COLORS: Record<CatalogItem["roleSet"], string> = {
  label:      "#0E4B3A",
  production: "#E83A1C",
  mix:        "#F2B705",
  remix:      "#C9B9E8",
  appearance: "#F4EFE6",
  djmix:      "#65C7F7",
};

const FILTER_LABELS: { key: Filter; label: string }[] = [
  { key: "all",        label: "all" },
  { key: "label",      label: "label" },
  { key: "production", label: "produced" },
  { key: "mix",        label: "mixed" },
  { key: "remix",      label: "remixed" },
  { key: "appearance", label: "appeared on" },
  { key: "djmix",      label: "dj mixes" },
];

const ROLE_TO_FILTER: Record<CatalogItem["roleSet"], Filter> = {
  label: "label",
  production: "production",
  mix: "mix",
  remix: "remix",
  appearance: "appearance",
  djmix: "djmix",
};

function formatDate(d?: string, fallbackYear?: number): string {
  if (d) {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return fallbackYear ? "" : "";
}

export function CatalogClient({ items }: { items: CatalogItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("side-by-side");

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((r) => r.roleSet === filter)),
    [items, filter]
  );

  const counts = useMemo(() => {
    const m = new Map<Filter, number>();
    m.set("all", items.length);
    for (const r of items) m.set(r.roleSet, (m.get(r.roleSet) ?? 0) + 1);
    return m;
  }, [items]);

  // Years sorted desc. Empty years are skipped entirely (no "nothing here" placeholders).
  const grouped = useMemo(() => {
    const buckets = new Map<number, CatalogItem[]>();
    for (const r of visible) {
      const y = r.year ?? 0;
      const list = buckets.get(y) ?? [];
      list.push(r);
      buckets.set(y, list);
    }
    return [...buckets.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, list]) => ({
        year,
        label: list.filter((r) => r.roleSet === "label").sort(byReleaseDateDesc),
        other: list.filter((r) => r.roleSet !== "label").sort(byReleaseDateDesc),
        all: list.sort(byReleaseDateDesc),
      }));
  }, [visible]);

  const inSideBySide = view === "side-by-side" && filter === "all";

  return (
    <>
      <div className="px-5 sm:px-8 py-5 border-b border-ink sticky top-[60px] z-[5] bg-paper/95 backdrop-blur-md">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex flex-wrap gap-2">
            {FILTER_LABELS.map((f) => {
              const n = counts.get(f.key) ?? 0;
              if (n === 0 && f.key !== "all") return null;
              const color = f.key !== "all" ? ROLE_COLORS[f.key as CatalogItem["roleSet"]] : undefined;
              return (
                <Chip
                  key={f.key}
                  active={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  label={f.label}
                  color={color}
                />
              );
            })}
          </div>
          <span className="w-px self-stretch bg-ink/30 mx-2" aria-hidden />
          <div className="flex items-center gap-1 font-mono text-[9px] tracking-[.14em] uppercase text-ink-3">
            <span>view ·</span>
            <button
              type="button"
              onClick={() => setView("side-by-side")}
              className={`px-2 py-1 border rounded-full transition-colors ${
                view === "side-by-side" ? "border-ink bg-ink text-paper" : "border-ink hover:bg-ink hover:text-paper"
              }`}
            >
              side × side
            </button>
            <button
              type="button"
              onClick={() => setView("single")}
              className={`px-2 py-1 border rounded-full transition-colors ${
                view === "single" ? "border-ink bg-ink text-paper" : "border-ink hover:bg-ink hover:text-paper"
              }`}
            >
              single column
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-8">
        {visible.length === 0 ? (
          <p className="font-serif italic text-[20px] text-ink-3">no entries match that filter.</p>
        ) : inSideBySide ? (
          // SIDE-BY-SIDE: two lanes per year, tight columns of cards
          <div className="space-y-8">
            {grouped.map(({ year, label, other }) => (
              <section key={year}>
                <div className="flex items-baseline gap-3 mb-3 border-b-2 border-ink pb-1">
                  <h2
                    className="font-display font-bold uppercase m-0 tabular-nums"
                    style={{ fontSize: "clamp(26px, 3vw, 40px)", lineHeight: 1, letterSpacing: "-0.02em" }}
                  >
                    {year > 0 ? year : "—"}
                  </h2>
                </div>
                <div className="grid gap-x-6 md:grid-cols-2">
                  {label.length > 0 && (
                    <Lane items={label} laneLabel="my label" accentColor={ROLE_COLORS.label} onRoleClick={(rs) => setFilter(ROLE_TO_FILTER[rs])} />
                  )}
                  {other.length > 0 && (
                    <Lane items={other} laneLabel="other work" accentColor={ROLE_COLORS.production} onRoleClick={(rs) => setFilter(ROLE_TO_FILTER[rs])} />
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          // SINGLE-COLUMN — tight 4-up grid per year
          grouped.map(({ year, all }) => (
            <section key={year} className="mb-8">
              <div className="flex items-baseline gap-3 mb-3 border-b-2 border-ink pb-1">
                <h2
                  className="font-display font-bold uppercase m-0 tabular-nums"
                  style={{ fontSize: "clamp(26px, 3vw, 40px)", lineHeight: 1, letterSpacing: "-0.02em" }}
                >
                  {year > 0 ? year : "—"}
                </h2>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
                {all.map((r) => <ReleaseCard key={r._id} r={r} onRoleClick={(rs) => setFilter(ROLE_TO_FILTER[rs])} />)}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}

function Lane({
  items,
  laneLabel,
  accentColor,
  onRoleClick,
}: {
  items: CatalogItem[];
  laneLabel: string;
  accentColor: string;
  onRoleClick: (rs: CatalogItem["roleSet"]) => void;
}) {
  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[.18em] uppercase mb-2 flex items-center gap-2"
        style={{ color: accentColor }}
      >
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: accentColor }} />
        {laneLabel}
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        {items.map((r) => <ReleaseCard key={r._id} r={r} compact onRoleClick={onRoleClick} />)}
      </div>
    </div>
  );
}

function ReleaseCard({
  r,
  compact = false,
  onRoleClick,
}: {
  r: CatalogItem;
  compact?: boolean;
  onRoleClick: (rs: CatalogItem["roleSet"]) => void;
}) {
  const cover = r.cover ? urlFor(r.cover).width(compact ? 260 : 360).height(compact ? 260 : 360).fit("crop").url() : null;
  const color = ROLE_COLORS[r.roleSet];
  const artists = r.artists.map((a) => a.name).join(" · ");
  const dateLabel = formatDate(r.releaseDate, r.year);
  return (
    <div className="group">
      <Link
        href={`/releases/${r.slug}`}
        className="block border border-ink p-2 transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0_#E83A1C] no-underline text-ink"
      >
        <div
          className="aspect-square border border-ink mb-1.5 flex items-center justify-center relative overflow-hidden"
          style={{ background: r.coverColor ?? "#1C1A17" }}
        >
          {cover ? (
            <img src={cover} alt={r.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          ) : (
            <span
              className="font-display font-bold uppercase text-center px-2 text-paper"
              style={{ fontSize: compact ? 13 : 16, transform: "rotate(-4deg)", letterSpacing: "-0.02em", color: r.coverColor ? "#0B0B0B" : "#F4EFE6" }}
            >
              {r.title}
            </span>
          )}
        </div>
        <div className={`font-display font-semibold uppercase tracking-[-0.005em] leading-tight line-clamp-2 ${compact ? "text-[13px]" : "text-[15px]"}`}>
          {r.title}
        </div>
        <div className="font-mono text-[9px] tracking-[.08em] uppercase text-ink-3 mt-0.5 line-clamp-1">
          {artists}
        </div>
      </Link>
      {/* Clickable role chip + date underneath, separate from card link so the
          chip is its own action target. */}
      <div className="mt-1 flex items-baseline gap-2">
        <button
          type="button"
          onClick={() => onRoleClick(r.roleSet)}
          className="font-mono text-[9px] tracking-[.14em] uppercase hover:underline cursor-pointer truncate text-left max-w-[140px]"
          style={{ color }}
          title={`Filter to ${r.roleSet}`}
        >
          {r.roleLabel}
        </button>
        {dateLabel && <span className="font-mono text-[9px] text-ink-3 ml-auto shrink-0 tabular-nums">{dateLabel}</span>}
      </div>
    </div>
  );
}

function byReleaseDateDesc(a: CatalogItem, b: CatalogItem): number {
  const ad = a.releaseDate ?? "";
  const bd = b.releaseDate ?? "";
  if (ad && bd) return bd.localeCompare(ad);
  if (ad) return -1;
  if (bd) return 1;
  return (b.catalogNumber ?? "").localeCompare(a.catalogNumber ?? "");
}

function Chip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono text-[11px] tracking-[.12em] uppercase px-3 py-1.5 border rounded-full transition-colors flex items-center gap-1.5 ${
        active ? "border-ink bg-ink text-paper" : "border-ink text-ink hover:bg-ink hover:text-paper"
      }`}
    >
      {color && (
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: color }}
        />
      )}
      {label}
    </button>
  );
}
