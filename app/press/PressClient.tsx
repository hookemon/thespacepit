"use client";

import { useMemo, useState } from "react";
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
  eraSlug?: string;
  eraName?: string;
  releaseSlug?: string;
  releaseTitle?: string;
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
    return [...buckets.entries()].sort((a, b) => b[0] - a[0]);
  }, [visible]);

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

      {/* Year-grouped chronological list */}
      <div className="px-5 sm:px-8 py-10">
        {visible.length === 0 ? (
          <p className="font-serif italic text-[20px] text-paper-2 text-center py-20">
            no press matches that filter.
          </p>
        ) : (
          grouped.map(([year, list]) => (
            <section key={year} className="mb-12">
              <div className="flex items-baseline gap-3 border-b-2 border-paper pb-1.5 mb-5">
                <h2
                  className="font-display font-bold uppercase m-0 tabular-nums"
                  style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1, letterSpacing: "-0.02em" }}
                >
                  {year > 0 ? year : "—"}
                </h2>
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

function PressTile({ p }: { p: PressCard }) {
  const color = KIND_COLORS[p.kind] ?? "#F4EFE6";
  const content = (
    <div className="relative border border-paper bg-ink-2 flex flex-col h-full overflow-hidden">
      {/* Accent stripe top */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} aria-hidden />
      {/* Image (if available) */}
      {p.imageUrl && (
        <div className="relative aspect-[16/10] overflow-hidden border-b border-paper bg-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.imageUrl}
            alt={p.headline ?? p.outletDisplay ?? "press"}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1 gap-3">
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
            className="font-display font-semibold uppercase m-0 leading-[1.05]"
            style={{ fontSize: "clamp(18px, 1.8vw, 22px)", letterSpacing: "-0.005em" }}
          >
            {p.headline}
          </h3>
        ) : null}
        <div className="font-serif italic text-[15px] sm:text-[16px] leading-snug text-paper line-clamp-4">
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
                className="px-2 py-0.5 border border-collect text-collect hover:bg-collect hover:text-paper transition-colors rounded-full no-underline"
              >
                {p.releaseTitle}
              </Link>
            )}
            {p.eraSlug && (
              <Link
                href={`/eras/${p.eraSlug}`}
                className="px-2 py-0.5 border border-redline text-redline hover:bg-redline hover:text-paper transition-colors rounded-full no-underline"
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
  return p.url ? (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block no-underline text-paper transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px]"
      style={{ ["--hover" as string]: color }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `4px 4px 0 ${color}`; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
    >
      {content}
    </a>
  ) : (
    <div>{content}</div>
  );
}
