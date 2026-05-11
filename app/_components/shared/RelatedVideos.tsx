"use client";

import { useState } from "react";
import type { VideoListItem } from "../../_lib/sanity-queries";

/**
 * A small "videos auto-attached to this thing" strip. Used on release detail,
 * era pages, brand/partner pages, gear pages, artist pages — anywhere a
 * video doc has linked back to this entity via the related* refs.
 *
 * Click any tile → inline modal player (no leaving the page).
 *
 * If the parent has zero linked videos, render nothing.
 */
export function RelatedVideos({
  videos,
  eyebrow,
  title = "videos",
  theme = "auto",
}: {
  videos: VideoListItem[];
  /** Mono small label above the heading. Defaults to "FROM THE CHANNEL". */
  eyebrow?: string;
  /** Big heading. Defaults to "videos". */
  title?: string;
  /** "dark" = paper text on ink bg, "light" = ink text on paper bg, "auto" = inherit page. */
  theme?: "dark" | "light" | "auto";
}) {
  const [open, setOpen] = useState<string | null>(null);

  if (videos.length === 0) return null;

  const isLight = theme === "light";
  const accent = isLight ? "text-redline" : "text-redline";
  const labelText = isLight ? "text-ink" : "text-paper";
  const subText = isLight ? "text-ink-3" : "text-paper-2";
  const borderC = isLight ? "border-ink" : "border-paper";

  return (
    <section className="mt-16">
      <div className={`font-mono text-[11px] tracking-[.14em] uppercase ${accent} mb-2`}>
        {eyebrow ?? `FROM THE CHANNEL · ${videos.length}`}
      </div>
      <h2
        className={`font-display font-bold uppercase m-0 mb-6 ${labelText}`}
        style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.01em" }}
      >
        {title}
      </h2>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {videos.map((v) => (
          <button
            key={v._id}
            onClick={() => setOpen(v.youtubeId)}
            className={`group text-left border ${borderC} flex flex-col cursor-pointer transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0_#E83A1C]`}
          >
            <div className="relative overflow-hidden bg-ink" style={{ aspectRatio: "16 / 9" }}>
              {v.thumbnailUrl && (
                <img
                  src={v.thumbnailUrl}
                  alt={v.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border border-paper rounded-full bg-ink/55 text-paper flex items-center justify-center text-[20px] group-hover:bg-redline transition-colors">▶</div>
              </div>
              {v.duration && (
                <div className="absolute bottom-1.5 right-1.5 bg-ink text-paper font-mono text-[10px] px-1.5 py-0.5 tracking-[.04em]">{v.duration}</div>
              )}
            </div>
            <div className="p-3">
              <div className={`font-display font-semibold text-[15px] uppercase leading-tight tracking-[-0.005em] line-clamp-2 ${labelText}`}>
                {v.title}
              </div>
              {(v.publishedAt || (v.viewCount !== undefined && v.viewCount > 0)) && (
                <div className={`font-mono text-[10px] tracking-[.08em] uppercase ${subText} mt-1.5 flex flex-wrap items-center gap-x-1.5`}>
                  {v.viewCount !== undefined && v.viewCount > 0 && <span>{formatViews(v.viewCount)}</span>}
                  {v.publishedAt && (
                    <>
                      {v.viewCount ? <span>·</span> : null}
                      <span>{new Date(v.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short" }).toLowerCase()}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {open && (
        <div
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 bg-ink/85 flex items-center justify-center p-4 cursor-pointer"
        >
          <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-[1100px] aspect-video bg-ink border border-paper cursor-default">
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
    </section>
  );
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m views`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k views`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k views`;
  return `${n} views`;
}
