"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DiscogsRelease } from "../_lib/discogs";
import { cleanArtistName, discogsUrl, primaryFormat } from "../_lib/discogs";

type FormatFilter = "all" | "Vinyl" | "Cassette" | "CD" | "File" | "Other";
type DecadeFilter = "all" | "2020s" | "2010s" | "2000s" | "1990s" | "1980s" | "1970s" | "<1970s";

const DECADES: { key: DecadeFilter; from: number; to: number }[] = [
  { key: "2020s", from: 2020, to: 2099 },
  { key: "2010s", from: 2010, to: 2019 },
  { key: "2000s", from: 2000, to: 2009 },
  { key: "1990s", from: 1990, to: 1999 },
  { key: "1980s", from: 1980, to: 1989 },
  { key: "1970s", from: 1970, to: 1979 },
  { key: "<1970s", from: 1, to: 1969 },
];

const PAGE_SIZE = 60;

export function ListeningClient({ records, total }: { records: DiscogsRelease[]; total: number }) {
  const [format, setFormat] = useState<FormatFilter>("all");
  const [decade, setDecade] = useState<DecadeFilter>("all");
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const dec = decade === "all" ? null : DECADES.find((d) => d.key === decade);
    return records.filter((r) => {
      if (format !== "all") {
        const fmt = primaryFormat(r.formats);
        if (format === "Other") {
          if (["Vinyl", "Cassette", "CD", "File"].includes(fmt)) return false;
        } else if (fmt !== format) {
          return false;
        }
      }
      if (dec && (r.year < dec.from || r.year > dec.to)) return false;
      if (query) {
        const hay = `${r.title} ${r.artists.map((a) => a.name).join(" ")}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [records, format, decade, q]);

  const formatCounts = useMemo(() => {
    const m = new Map<FormatFilter, number>([["all", records.length]]);
    for (const r of records) {
      const fmt = primaryFormat(r.formats);
      const key = (["Vinyl", "Cassette", "CD", "File"].includes(fmt) ? fmt : "Other") as FormatFilter;
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return m;
  }, [records]);

  const decadeCounts = useMemo(() => {
    const m = new Map<DecadeFilter, number>([["all", records.length]]);
    for (const r of records) {
      const dec = DECADES.find((d) => r.year >= d.from && r.year <= d.to);
      if (dec) m.set(dec.key, (m.get(dec.key) ?? 0) + 1);
    }
    return m;
  }, [records]);

  // Reset paging when filters change
  const onFormat = (f: FormatFilter) => { setFormat(f); setVisible(PAGE_SIZE); };
  const onDecade = (d: DecadeFilter) => { setDecade(d); setVisible(PAGE_SIZE); };
  const onSearch = (s: string) => { setQ(s); setVisible(PAGE_SIZE); };

  const shown = filtered.slice(0, visible);
  const canLoadMore = visible < filtered.length;

  // Infinite scroll — IntersectionObserver watches a sentinel element near the
  // bottom of the grid and bumps `visible` when it comes into view.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!canLoadMore || !sentinelRef.current) return;
    const node = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setVisible((v) => v + PAGE_SIZE);
        }
      },
      { rootMargin: "400px 0px" } // start loading 400px before reaching it
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [canLoadMore]);

  return (
    <>
      {/* Sticky filter strip */}
      <div className="px-5 sm:px-8 py-5 border-b border-paper sticky top-[60px] z-[5] bg-ink/95 backdrop-blur-md">
        <input
          type="search"
          placeholder="search artist or title…"
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full max-w-[420px] font-mono text-[13px] bg-transparent border border-paper rounded-full px-4 py-2 mb-3 text-paper placeholder:text-paper-2 focus:outline-none focus:border-lamp"
        />
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 self-center mr-2">format ·</span>
          {(["all", "Vinyl", "Cassette", "CD", "File", "Other"] as FormatFilter[]).map((f) => {
            const n = formatCounts.get(f) ?? 0;
            if (n === 0 && f !== "all") return null;
            return <Chip key={f} active={format === f} onClick={() => onFormat(f)} label={f.toLowerCase()} />;
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 self-center mr-2">decade ·</span>
          <Chip active={decade === "all"} onClick={() => onDecade("all")} label="all" />
          {DECADES.map((d) => {
            const n = decadeCounts.get(d.key) ?? 0;
            if (n === 0) return null;
            return <Chip key={d.key} active={decade === d.key} onClick={() => onDecade(d.key)} label={d.key} />;
          })}
        </div>
      </div>

      <div className="px-5 sm:px-8 py-10">
        <div className="font-mono text-[11px] tracking-[.14em] uppercase text-paper-2 mb-6">
          {q || format !== "all" || decade !== "all"
            ? "matching"
            : "sorted newest-added"}
        </div>

        {filtered.length === 0 ? (
          <p className="font-serif italic text-[20px] text-paper-2">no match. try another search.</p>
        ) : (
          <>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
              {shown.map((r) => {
                const artist = r.artists.map((a) => cleanArtistName(a.name)).join(" · ");
                const fmt = primaryFormat(r.formats);
                const ytSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${r.title}`)}`;
                return (
                  <div key={r.instance_id} className="group">
                    <a
                      href={ytSearch}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Listen to ${artist} — ${r.title} on YouTube`}
                      className="block no-underline text-paper transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0_#F2B705]"
                    >
                      <div className="aspect-square border border-paper/40 overflow-hidden bg-ink-2 relative">
                        {r.thumb || r.cover_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.cover_image || r.thumb}
                            alt={`${artist} — ${r.title}`}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center p-2 text-center font-display text-[13px] uppercase text-paper-2 leading-tight">
                            {r.title}
                          </div>
                        )}
                        {/* Hover play overlay */}
                        <div
                          aria-hidden
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-ink/55"
                        >
                          <span
                            className="font-display font-bold text-paper rounded-full w-12 h-12 flex items-center justify-center"
                            style={{ background: "rgba(242,183,5,0.95)", color: "#0B0B0B" }}
                          >
                            ▶
                          </span>
                        </div>
                      </div>
                      <div className="mt-1.5 font-mono text-[10px] tracking-[.08em] uppercase text-paper-2 line-clamp-1">
                        {r.year || ""} · {fmt.toLowerCase()}
                      </div>
                      <div className="font-display font-semibold text-[14px] uppercase tracking-[-0.005em] leading-tight line-clamp-2 mt-0.5">
                        {artist}
                      </div>
                      <div className="font-serif italic text-[13px] text-paper-2 leading-snug line-clamp-2">{r.title}</div>
                    </a>
                    <a
                      href={discogsUrl(r.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 font-mono text-[9px] tracking-[.12em] uppercase text-paper-2 hover:text-lamp transition-colors no-underline"
                    >
                      discogs ↗
                    </a>
                  </div>
                );
              })}
            </div>

            {/* Sentinel for infinite scroll. */}
            {canLoadMore && (
              <div ref={sentinelRef} className="h-12 mt-8 flex items-center justify-center">
                <span className="font-mono text-[10px] tracking-[.16em] uppercase text-paper-2 sp-pulse">
                  loading more · {filtered.length - visible} to go
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono text-[10px] tracking-[.12em] uppercase px-2.5 py-1 border rounded-full transition-colors ${
        active ? "border-lamp bg-lamp text-ink" : "border-paper text-paper hover:bg-paper hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
