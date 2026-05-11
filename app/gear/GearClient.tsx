"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { urlFor } from "../_lib/sanity";
import type { GearItem } from "../_lib/sanity-queries";
import type { GearCategory } from "../_lib/gear-data";
import { CATEGORIES } from "../_lib/gear-data";

type Filter = GearCategory | "all";

const CATEGORY_KEYS = new Set<string>(CATEGORIES.map((c) => c.key));

function readCatFromUrl(): Filter {
  if (typeof window === "undefined") return "all";
  const cat = new URLSearchParams(window.location.search).get("cat");
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

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((g) => g.category === filter)),
    [filter, items]
  );

  const counts = useMemo(() => {
    const map = new Map<Filter, number>();
    map.set("all", items.length);
    for (const cat of CATEGORIES) {
      map.set(cat.key, items.filter((g) => g.category === cat.key).length);
    }
    return map;
  }, [items]);

  const grouped = useMemo(() => {
    const order: GearCategory[] = CATEGORIES.map((c) => c.key);
    const buckets = new Map<GearCategory, GearItem[]>();
    for (const item of visible) {
      const cat = item.category as GearCategory;
      const arr = buckets.get(cat) ?? [];
      arr.push(item);
      buckets.set(cat, arr);
    }
    return order
      .filter((cat) => buckets.has(cat))
      .map((cat) => ({ cat, items: buckets.get(cat)! }));
  }, [visible]);

  return (
    <>
      <div className="px-8 py-6 border-b border-paper sticky top-[60px] z-[5] bg-ink/95 backdrop-blur-md">
        <div className="flex flex-wrap gap-2">
          <Chip active={filter === "all"} onClick={() => setFilter("all")} label="all" count={counts.get("all") ?? 0} />
          {CATEGORIES.map((c) => {
            const n = counts.get(c.key) ?? 0;
            if (n === 0) return null;
            return (
              <Chip
                key={c.key}
                active={filter === c.key}
                onClick={() => setFilter(c.key)}
                label={c.label}
                count={n}
              />
            );
          })}
        </div>
      </div>

      <div className="px-8 py-12">
        {grouped.length === 0 && (
          <p className="font-serif italic text-[20px] text-paper-2">nothing in this rack yet.</p>
        )}
        {grouped.map(({ cat, items: catItems }) => {
          const meta = CATEGORIES.find((c) => c.key === cat);
          return (
            <section key={cat} className="mb-14">
              <div className="flex items-end justify-between border-b border-paper pb-2.5 mb-5">
                <div>
                  <div className="font-mono text-[10px] tracking-[.14em] uppercase text-lamp">
                    {catItems.length} unit{catItems.length === 1 ? "" : "s"}
                  </div>
                  <h2
                    className="font-display font-bold uppercase m-0"
                    style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
                  >
                    {meta?.label ?? cat}
                  </h2>
                </div>
                {meta?.blurb && (
                  <div className="font-serif italic text-[15px] text-paper-2 hidden sm:block">{meta.blurb}</div>
                )}
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {catItems.map((g) => {
                  const photo = g.photo ? urlFor(g.photo).width(720).height(540).fit("crop").url() : null;
                  return (
                    <Link
                      key={g._id}
                      href={`/gear/${g.slug}`}
                      className="group block border border-paper bg-ink-2 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0_#F2B705] transition-transform duration-150 overflow-hidden no-underline text-paper"
                    >
                      {photo && (
                        <div className="aspect-[4/3] overflow-hidden border-b border-paper bg-ink-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo} alt={g.name} loading="lazy" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            {g.manufacturer && (
                              <div className="font-mono text-[9px] tracking-[.14em] uppercase text-paper-2 line-clamp-1">
                                {g.manufacturer}
                              </div>
                            )}
                            <div className="font-display text-[20px] uppercase font-semibold tracking-[-0.005em] leading-tight">
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
                          <span>{g.status}</span>
                          {g.yearAcquired && <span>· since {g.yearAcquired}</span>}
                          <span className="ml-auto opacity-0 group-hover:opacity-100 text-lamp transition-opacity">enter →</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono text-[11px] tracking-[.12em] uppercase px-3 py-1.5 border rounded-full transition-colors ${
        active
          ? "border-lamp bg-lamp text-ink"
          : "border-paper text-paper hover:bg-paper hover:text-ink"
      }`}
    >
      {label} <span className={`tabular-nums ml-1 ${active ? "text-ink/60" : "text-paper-2"}`}>{count}</span>
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
