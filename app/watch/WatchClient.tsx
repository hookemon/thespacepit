"use client";

import { useMemo, useState } from "react";
import type { YouTubeVideo } from "../_lib/youtube";

type PlaylistBucket = {
  slug: string;
  title: string;
  description: string;
  videos: YouTubeVideo[];
};

export function WatchClient({ buckets }: { buckets: PlaylistBucket[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return buckets.flatMap((b) => {
      if (filter !== "all" && b.slug !== filter) return [];
      return b.videos.map((v) => ({ ...v, _bucket: b }));
    }).filter((v) => !q || v.title.toLowerCase().includes(q));
  }, [buckets, filter, search]);

  const totalCount = buckets.reduce((sum, b) => sum + b.videos.length, 0);

  return (
    <>
      <div className="px-8 py-6 border-b border-ink/30 sticky top-0 z-[5] bg-paper/90 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="search title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border border-ink text-ink px-3 py-2 font-mono text-[12px] tracking-[.05em] placeholder:text-mute focus:outline-none focus:border-lamp-deep min-w-[220px]"
          />
          <button
            onClick={() => setFilter("all")}
            className={`font-mono text-[10px] tracking-[.12em] uppercase px-3 py-1.5 border border-ink rounded-full transition-colors ${filter === "all" ? "bg-ink text-paper" : "hover:bg-ink hover:text-paper"}`}
          >
            all · {totalCount}
          </button>
          {buckets.map((b) => (
            <button
              key={b.slug}
              onClick={() => setFilter(b.slug)}
              className={`font-mono text-[10px] tracking-[.12em] uppercase px-3 py-1.5 border border-ink rounded-full transition-colors ${filter === b.slug ? "bg-ink text-paper" : "hover:bg-ink hover:text-paper"}`}
            >
              {b.title.toLowerCase()} · {b.videos.length}
            </button>
          ))}
        </div>
      </div>

      <section className="px-8 py-8">
        {visible.length === 0 ? (
          <p className="font-mono text-[12px] tracking-[.08em] uppercase text-mute">no videos match.</p>
        ) : (
          <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {visible.map((v) => (
              <button
                key={`${v._bucket.slug}-${v.id}`}
                onClick={() => setOpen(v.id)}
                className="group text-left border border-ink bg-paper flex flex-col cursor-pointer transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#0B0B0B]"
              >
                <div className="relative border-b border-ink overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 border border-paper rounded-full bg-ink/60 text-paper flex items-center justify-center text-[22px] group-hover:bg-ink transition-colors">▶</div>
                  </div>
                  {v.duration && (
                    <div className="absolute bottom-2 right-2 bg-ink text-paper font-mono text-[11px] px-1.5 py-0.5 tracking-[.05em]">{v.duration}</div>
                  )}
                  <div className="absolute top-2 left-2 bg-paper/90 text-ink font-mono text-[9px] px-1.5 py-0.5 tracking-[.12em] uppercase">{v._bucket.title}</div>
                </div>
                <div className="p-3.5">
                  <div className="font-display font-semibold text-[20px] uppercase leading-tight tracking-[-0.005em] line-clamp-2">{v.title}</div>
                  <div className="font-mono text-[10px] tracking-[.1em] uppercase text-ink-3 mt-2">{v.viewCount} views · {v.ago} ago</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

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
