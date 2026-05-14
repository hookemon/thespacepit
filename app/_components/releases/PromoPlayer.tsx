"use client";

import { useEffect, useRef, useState } from "react";

/**
 * PromoPlayer — clean in-house audio player for the release page.
 *
 * Why this exists: Bandcamp's iframe embed shows their cover art + chrome,
 * which double-covers the page when the hero already shows the album. This
 * player strips all that — just a play button + scrubber + time. The MP3
 * lives on Sanity's CDN (uploaded via `release.promoAudio`) or any external
 * URL (`release.promoAudioUrl`); both flow into the same resolved string.
 *
 * Single track. Designed for "biz / press / DSP listen now" flow — visitor
 * hits the page, hits play, hears the music in 1 second, no click-outs.
 *
 * Lives RIGHT under the hero cover so the listening surface is the first
 * interactive thing after the art. Mobile-first: big tap target on the play
 * button (44px+), scrubber stays touchable.
 */
export interface PromoTrack {
  src: string;
  label: string;
}

export function PromoPlayer({
  src,
  title,
  artist,
  isPrivate = false,
  accent = "#F2B705",
  compact = false,
  altSrc,
  altLabel = "instrumental",
}: {
  src: string;
  title: string;
  artist?: string;
  isPrivate?: boolean;
  accent?: string;
  /** Compact mode for under-cover placement — tighter padding, smaller play
   *  button, no artist line (cover already shows it). Use when the player
   *  lives inside a narrow column. */
  compact?: boolean;
  /** Optional alternate track. When set, renders a toggle between MAIN and
   *  ALT (typically the instrumental). Swapping pauses + resets the
   *  current playback. */
  altSrc?: string;
  altLabel?: string;
}) {
  // Which track is currently loaded — index into [main, alt].
  const [trackIdx, setTrackIdx] = useState<0 | 1>(0);
  const tracks: PromoTrack[] = altSrc
    ? [{ src, label: "main" }, { src: altSrc, label: altLabel }]
    : [{ src, label: "main" }];
  const currentSrc = tracks[trackIdx].src;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferProgress, setBufferProgress] = useState(0);

  // Switching tracks pauses + resets — keeps the UX honest (you don't want
  // the play position to mysteriously carry over between versions).
  const switchTrack = (idx: 0 | 1) => {
    if (idx === trackIdx) return;
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setTrackIdx(idx);
    setProgress(0);
    setCurrentTime(0);
    setPlaying(false);
  };

  // Wire <audio> events → state. Cleanup on unmount.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(a.currentTime);
      if (a.duration && isFinite(a.duration)) {
        setProgress(a.currentTime / a.duration);
      }
    };
    const onLoadedMetadata = () => {
      if (isFinite(a.duration)) setDuration(a.duration);
    };
    const onProgress = () => {
      // Buffer head — for the secondary progress bar shading
      try {
        if (a.buffered.length > 0 && a.duration) {
          setBufferProgress(a.buffered.end(a.buffered.length - 1) / a.duration);
        }
      } catch { /* ignore — some browsers throw before metadata */ }
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      a.currentTime = 0;
    };
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("timeupdate", onTimeUpdate);
    a.addEventListener("loadedmetadata", onLoadedMetadata);
    a.addEventListener("progress", onProgress);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("timeupdate", onTimeUpdate);
      a.removeEventListener("loadedmetadata", onLoadedMetadata);
      a.removeEventListener("progress", onProgress);
      a.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => { /* user gesture missing or blocked */ });
    else a.pause();
  };

  /** Click anywhere on the scrubber → seek there. */
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
    setProgress(ratio);
  };

  return (
    <div className={`border-2 border-ink bg-paper ${compact ? "p-3" : "p-4 sm:p-5 max-w-[760px]"}`}>
      <audio ref={audioRef} src={currentSrc} preload="metadata" />
      {/* Track toggle — only renders when a second track is provided.
          Sits above the main player row so the binary choice is clear
          before they hit play. */}
      {tracks.length > 1 && (
        <div className="flex items-center gap-1 mb-3">
          {tracks.map((t, i) => {
            const active = i === trackIdx;
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => switchTrack(i as 0 | 1)}
                className="font-mono text-[9px] tracking-[.18em] uppercase px-2.5 py-1 border-2 border-ink transition-colors"
                style={{
                  background: active ? "#0B0B0B" : "transparent",
                  color: active ? accent : "#0B0B0B",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}
      <div className={`flex items-center ${compact ? "gap-3" : "gap-4 sm:gap-5"}`}>
      {/* Play / pause button — big tap target, brand-color background when paused, ink when playing */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className={`shrink-0 rounded-full border-2 border-ink flex items-center justify-center transition-colors ${
          compact ? "w-11 h-11" : "w-14 h-14 sm:w-16 sm:h-16"
        }`}
        style={{
          background: playing ? "#0B0B0B" : accent,
          color: playing ? accent : "#0B0B0B",
        }}
      >
        {/* SVG icons so they scale crisp at any size */}
        {playing ? (
          // pause: two bars
          <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor" aria-hidden>
            <rect x="4" y="3" width="5" height="16" rx="0.5" />
            <rect x="13" y="3" width="5" height="16" rx="0.5" />
          </svg>
        ) : (
          // play: triangle. Shifted right ~1px to feel optically centered
          <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor" aria-hidden>
            <polygon points="5,3 19,11 5,19" />
          </svg>
        )}
      </button>

      {/* Right side — title row + scrubber row */}
      <div className="flex-1 min-w-0">
        {/* Top row: title · artist · time. In compact mode (under cover) we
            skip the title/artist since the cover above already supplies it,
            and just show the elapsed time. */}
        {!compact && (
          <div className="flex items-baseline gap-3 mb-2">
            <div className="font-display font-semibold text-[15px] sm:text-[17px] uppercase tracking-[-0.005em] truncate">
              {title}
            </div>
            {artist && (
              <div className="font-mono text-[10px] tracking-[.12em] uppercase text-ink-3 truncate hidden sm:block">
                {artist}
              </div>
            )}
            <div className="ml-auto font-mono text-[11px] tabular-nums text-ink-3 shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        )}
        {compact && (
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="font-mono text-[10px] tracking-[.14em] uppercase text-lamp-deep">
              {isPrivate ? "private listen" : "listen"}
            </div>
            <div className="font-mono text-[11px] tabular-nums text-ink-3">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        )}

        {/* Scrubber: buffered range behind, played range filled in accent */}
        <div
          className="relative h-2 bg-ink/10 cursor-pointer rounded-full overflow-hidden"
          onClick={seek}
          role="slider"
          aria-label="Scrub"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
        >
          {/* Buffered (secondary track) */}
          <div
            className="absolute inset-y-0 left-0 bg-ink/20"
            style={{ width: `${bufferProgress * 100}%` }}
          />
          {/* Played (primary) */}
          <div
            className="absolute inset-y-0 left-0 transition-[width] duration-100"
            style={{ width: `${progress * 100}%`, background: accent }}
          />
        </div>

        {/* Eyebrow under the scrubber — only shows when this is a private link */}
        {isPrivate && (
          <div className="font-mono text-[9px] tracking-[.18em] uppercase text-ink-3 mt-2.5">
            ↑ private listening · do not redistribute
          </div>
        )}
      </div>
      </div>{/* end inner player row */}
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
