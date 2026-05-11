"use client";

import { useEffect, useMemo, useState } from "react";
import type { VideoListItem } from "../_lib/sanity-queries";

type TagChip = { value: string; label: string; count: number };

export function WatchClient({ videos, tags }: { videos: VideoListItem[]; tags: TagChip[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // /watch is the unified video page across all 3 worlds (nick · spacepit ·
  // calm + collect). The TopNav for nick + cc deep-links here with
  // ?filter=music-video so visitors land on world-relevant content. Pick that
  // up on mount and apply if it matches a known tag. Also keep the URL in
  // sync when the user clicks a different chip so shared links work.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromQuery = new URLSearchParams(window.location.search).get("filter");
    if (fromQuery && (fromQuery === "all" || tags.some((t) => t.value === fromQuery))) {
      setFilter(fromQuery);
    }
    // We only check the URL on initial mount. Tag clicks update both state
    // and URL via the chip handlers below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (filter === "all") url.searchParams.delete("filter");
    else url.searchParams.set("filter", filter);
    window.history.replaceState(null, "", url.toString());
  }, [filter]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return videos.filter((v) => {
      if (filter !== "all" && !(v.tags ?? []).includes(filter)) return false;
      if (q && !v.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [videos, filter, search]);

  const totalCount = videos.length;

  return (
    <>
      {/* STICKY TAG NAV + SEARCH */}
      <div className="px-5 sm:px-8 py-5 border-b border-ink/30 sticky top-[60px] z-[5] bg-paper/92 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="search"
            placeholder="search title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border border-ink text-ink px-3 py-1.5 font-mono text-[12px] tracking-[.05em] placeholder:text-mute focus:outline-none focus:border-lamp-deep min-w-[200px]"
          />
          <button
            onClick={() => setFilter("all")}
            className={`font-mono text-[10px] tracking-[.12em] uppercase px-3 py-1.5 border border-ink rounded-full transition-colors whitespace-nowrap ${filter === "all" ? "bg-ink text-paper" : "hover:bg-ink hover:text-paper"}`}
          >
            all · {totalCount}
          </button>
          {tags.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={`font-mono text-[10px] tracking-[.12em] uppercase px-3 py-1.5 border border-ink rounded-full transition-colors whitespace-nowrap ${filter === t.value ? "bg-ink text-paper" : "hover:bg-ink hover:text-paper"}`}
            >
              {t.label} · {t.count}
            </button>
          ))}
        </div>
        {filter !== "all" && (
          <div className="font-mono text-[10px] tracking-[.12em] uppercase text-ink-3 mt-2.5">
            showing {visible.length} of {totalCount}
          </div>
        )}
      </div>

      {/* VIDEO GRID */}
      <section className="px-5 sm:px-8 py-10">
        {visible.length === 0 ? (
          <p className="font-mono text-[12px] tracking-[.08em] uppercase text-mute text-center py-20">
            no videos match{search ? ` "${search}"` : ""}{filter !== "all" ? ` in ${filter}` : ""}.
          </p>
        ) : (
          <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {visible.map((v) => (
              <button
                key={v._id}
                onClick={() => setOpen(v.youtubeId)}
                className="group text-left border border-ink bg-paper flex flex-col cursor-pointer transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#0B0B0B]"
              >
                <div className="relative border-b border-ink overflow-hidden bg-ink" style={{ aspectRatio: "16 / 9" }}>
                  {v.thumbnailUrl && (
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 border border-paper rounded-full bg-ink/60 text-paper flex items-center justify-center text-[22px] group-hover:bg-redline transition-colors">▶</div>
                  </div>
                  {v.duration && (
                    <div className="absolute bottom-2 right-2 bg-ink text-paper font-mono text-[11px] px-1.5 py-0.5 tracking-[.05em]">{v.duration}</div>
                  )}
                  {v.tags && v.tags.length > 0 && (
                    <div className="absolute top-2 left-2 bg-paper/90 text-ink font-mono text-[9px] px-1.5 py-0.5 tracking-[.12em] uppercase">{v.tags[0]}</div>
                  )}
                </div>
                <div className="p-3.5">
                  <div className="font-display font-semibold text-[18px] uppercase leading-tight tracking-[-0.005em] line-clamp-2">{v.title}</div>
                  <div className="font-mono text-[10px] tracking-[.1em] uppercase text-ink-3 mt-2 flex flex-wrap items-center gap-x-2">
                    {v.viewCount !== undefined && v.viewCount > 0 && <span>{formatViews(v.viewCount)}</span>}
                    {v.publishedAt && (
                      <>
                        {v.viewCount ? <span>·</span> : null}
                        <span>{new Date(v.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short" }).toLowerCase()}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* INLINE PLAYER MODAL */}
      {open && (
        <div
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 bg-ink/85 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[1100px] aspect-video bg-ink border border-paper cursor-default"
          >
            <button
              onClick={() => setOpen(null)}
              className="absolute -top-10 right-0 font-mono text-[11px] tracking-[.14em] uppercase text-paper hover:opacity-70 transition-opacity"
              aria-label="close"
            >
              close ✕
            </button>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${open}?autoplay=1&rel=0`}
              title="YouTube player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </>
  );
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m views`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k views`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k views`;
  return `${n} views`;
}
