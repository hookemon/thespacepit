"use client";

/**
 * The mini-player. Sticky to the bottom of the viewport whenever a track is
 * loaded into the global ListeningProvider. Click cover/title to navigate to
 * the source release page; play/pause + skip work like every streaming app.
 *
 * Visually: ink-dark bar, ~64px tall, slides up from the bottom on first
 * play. Stays out of the way of footers (positioned fixed, not in flow).
 */
import Link from "next/link";
import { useListening } from "./ListeningProvider";

export function MiniPlayer() {
  const { current, queue, index, isPlaying, progress, toggle, next, previous, stop } = useListening();

  if (!current) return null;

  const hasNext = index >= 0 && index + 1 < queue.length;
  const hasPrev = index > 0;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-paper bg-ink text-paper"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      role="region"
      aria-label="listening · now playing"
    >
      {/* Progress strip along the very top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-paper/15">
        <div
          className="h-full bg-collect transition-all"
          style={{ width: `${Math.round(progress * 100)}%` }}
          aria-hidden
        />
      </div>

      <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-2.5">
        {/* Cover */}
        {current.coverUrl ? (
          current.releaseSlug ? (
            <Link
              href={`/releases/${current.releaseSlug}`}
              className="shrink-0 block w-12 h-12 sm:w-14 sm:h-14 border border-paper overflow-hidden bg-ink-2 no-underline"
              aria-label={`open ${current.title}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.coverUrl} alt="" className="w-full h-full object-cover" />
            </Link>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.coverUrl}
              alt=""
              className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 border border-paper object-cover bg-ink-2"
            />
          )
        ) : (
          <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 border border-paper bg-ink-2 flex items-center justify-center font-display font-bold text-paper-2">▶</div>
        )}

        {/* Title + artist */}
        <div className="min-w-0 flex-1">
          <div className="font-display font-semibold text-[14px] sm:text-[15px] uppercase leading-tight tracking-[-0.005em] line-clamp-1">
            {current.releaseSlug ? (
              <Link href={`/releases/${current.releaseSlug}`} className="text-paper hover:text-lamp transition-colors no-underline">
                {current.title}
              </Link>
            ) : (
              current.title
            )}
          </div>
          {current.artist && (
            <div className="font-mono text-[10px] tracking-[.12em] uppercase text-paper-2 mt-0.5 line-clamp-1">
              {current.artist}
              {queue.length > 1 && (
                <span className="ml-2 opacity-70">· {index + 1}/{queue.length}</span>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasPrev && (
            <button
              type="button"
              onClick={previous}
              className="w-8 h-8 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors flex items-center justify-center font-mono text-[11px]"
              aria-label="previous track"
              title="previous"
            >
              ↤
            </button>
          )}
          <button
            type="button"
            onClick={toggle}
            className="w-10 h-10 sm:w-11 sm:h-11 border-2 border-lamp bg-lamp text-ink rounded-full flex items-center justify-center text-[16px] hover:bg-paper hover:border-paper transition-colors"
            aria-label={isPlaying ? "pause" : "play"}
            title={isPlaying ? "pause" : "play"}
          >
            <span aria-hidden>{isPlaying ? "❚❚" : "▶"}</span>
          </button>
          {hasNext && (
            <button
              type="button"
              onClick={next}
              className="w-8 h-8 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors flex items-center justify-center font-mono text-[11px]"
              aria-label="next track"
              title="next"
            >
              ↦
            </button>
          )}
          {current.duration && (
            <span className="hidden sm:inline font-mono text-[10px] tabular-nums text-paper-2 ml-2">
              {current.duration}
            </span>
          )}
          <button
            type="button"
            onClick={stop}
            className="ml-1.5 sm:ml-2 w-7 h-7 sm:w-8 sm:h-8 text-paper-2 hover:text-redline transition-colors flex items-center justify-center font-mono text-[14px]"
            aria-label="close mini-player"
            title="stop + close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
