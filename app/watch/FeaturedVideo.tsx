"use client";

/**
 * Featured-video block for /watch. Renders the pinned video as a large
 * 16:9 hero — click expands an inline YouTube iframe in place instead of
 * loading the YT JS on every page visit (saves the perf cost when most
 * visitors don't actually click play).
 */
import { useState } from "react";
import type { VideoListItem } from "../_lib/sanity-queries";

export function FeaturedVideo({ video }: { video: VideoListItem }) {
  const [playing, setPlaying] = useState(false);
  const thumb =
    video.thumbnailUrl ||
    `https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg`;

  return (
    <section
      className="px-5 sm:px-8 pt-10 pb-6 border-b border-ink/30"
      aria-label="featured video"
    >
      <div className="font-mono text-[11px] tracking-[.18em] uppercase text-redline mb-3 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-redline" aria-hidden />
        FEATURED · NOW PLAYING
      </div>

      <div className="relative w-full aspect-video border-2 border-ink overflow-hidden bg-ink">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${video.title}`}
            className="absolute inset-0 w-full h-full group cursor-pointer p-0 border-0 m-0"
          >
            <img
              src={thumb}
              alt={video.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              loading="eager"
            />
            {/* Soft darken so the play button reads on any thumbnail */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(11,11,11,0.0) 40%, rgba(11,11,11,0.55) 100%)" }}
            />
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="flex items-center justify-center bg-paper text-ink rounded-full transition-transform duration-200 group-hover:scale-110"
                style={{ width: 88, height: 88, fontSize: 32 }}
                aria-hidden
              >
                ▶
              </span>
            </div>
            {/* Title slab — bottom left */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 text-left">
              <div
                className="font-display font-bold uppercase text-paper m-0 line-clamp-2"
                style={{
                  fontSize: "clamp(22px, 3vw, 38px)",
                  letterSpacing: "-0.015em",
                  lineHeight: 1.05,
                  textShadow: "0 2px 12px rgba(0,0,0,0.7)",
                }}
              >
                {video.title}
              </div>
            </div>
          </button>
        )}
      </div>
    </section>
  );
}
