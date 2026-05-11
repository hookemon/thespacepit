"use client";
import { useState } from "react";
import type { YouTubeVideo } from "../_lib/youtube";

export function VideoGridClient({ videos }: { videos: YouTubeVideo[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (videos.length === 0) {
    return (
      <p className="font-mono text-[11px] tracking-[.14em] uppercase text-mute">
        no videos yet — add a YouTube playlist in app/_lib/youtube-playlists.ts.
      </p>
    );
  }

  return (
    <>
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {videos.map((v) => (
          <button
            key={v.id}
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
            </div>
            <div className="p-3.5">
              <div className="font-display font-semibold text-[20px] uppercase leading-tight tracking-[-0.005em] line-clamp-2">{v.title}</div>
              <div className="font-mono text-[10px] tracking-[.1em] uppercase text-ink-3 mt-2">{v.viewCount} views · {v.ago} ago</div>
            </div>
          </button>
        ))}
      </div>

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
