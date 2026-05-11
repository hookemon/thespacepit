"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Track } from "../../_lib/sanity-queries";
import { VideoModal } from "../../_components/shared/VideoModal";

/**
 * Tracklist with playable Bandcamp 30s previews and clickable music videos.
 *
 * - ▶ play next to a track → plays its preview audio (single shared <audio>)
 * - clicking another row stops the first, starts the second
 * - ▶ video pill → opens the song's music video modal
 */
export function TracklistAndCover({ tracklist }: { tracklist: Track[] }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [progress, setProgress] = useState(0); // 0..1 of current track
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize a single Audio element on mount.
  // NOTE: do NOT set crossOrigin — Bandcamp's t4.bcbits.com CDN doesn't send
  // CORS headers, so requesting "anonymous" silently fails. Plain <audio>
  // playback doesn't need CORS unless you're routing through Web Audio.
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;
    const onEnd = () => { setPlayingIdx(null); setProgress(0); };
    const onErr = (e: Event) => {
      // Help future-me debug expired tokens / network blocks
      console.warn("[tracklist] audio error", (e.target as HTMLAudioElement)?.error);
      setPlayingIdx(null);
    };
    const onTime = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onErr);
    audio.addEventListener("timeupdate", onTime);
    return () => {
      audio.pause();
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onErr);
      audio.removeEventListener("timeupdate", onTime);
      audioRef.current = null;
    };
  }, []);

  const playTrack = useCallback((idx: number, url: string) => {
    const a = audioRef.current;
    if (!a) return;
    if (playingIdx === idx) {
      a.pause();
      setPlayingIdx(null);
      return;
    }
    a.pause();
    a.src = url;
    setProgress(0);
    a.play()
      .then(() => setPlayingIdx(idx))
      .catch(() => setPlayingIdx(null));
  }, [playingIdx]);

  const openVideo = (url: string, title: string) => {
    setVideoUrl(url);
    setVideoTitle(title);
  };

  return (
    <>
      <ol className="list-none p-0 m-0 border-t border-ink">
        {tracklist.map((t, i) => {
          const hasVideo = !!t.videoUrl;
          const hasPreview = !!t.audioPreviewUrl;
          const isPlaying = playingIdx === i;
          return (
            <li
              key={i}
              className={`relative flex items-baseline gap-3 sm:gap-4 py-3 border-b border-ink/30 ${isPlaying ? "bg-ink/5" : ""}`}
            >
              {/* Progress bar — sits along the bottom of the row when playing */}
              {isPlaying && (
                <span
                  className="absolute bottom-0 left-0 h-[2px] bg-collect transition-all"
                  style={{ width: `${progress * 100}%` }}
                  aria-hidden
                />
              )}

              {/* Track # or play button */}
              {hasPreview ? (
                <button
                  type="button"
                  onClick={() => playTrack(i, t.audioPreviewUrl!)}
                  className={`w-8 h-8 shrink-0 rounded-full border border-ink flex items-center justify-center text-[12px] tabular-nums font-mono transition-colors ${
                    isPlaying
                      ? "bg-collect text-paper"
                      : "bg-paper hover:bg-ink hover:text-paper"
                  }`}
                  aria-label={isPlaying ? `Pause ${t.title}` : `Play 30s preview of ${t.title}`}
                  title={isPlaying ? "Pause" : "30s preview"}
                >
                  <span aria-hidden>{isPlaying ? "❚❚" : "▶"}</span>
                </button>
              ) : (
                <span className="font-mono text-[11px] tracking-[.1em] text-ink-3 w-8 tabular-nums shrink-0 text-center">
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}

              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-[18px] sm:text-[22px] uppercase tracking-[-0.005em] leading-tight">
                  {t.title}
                  {t.feature && (
                    <span className="font-serif italic text-[15px] sm:text-[17px] text-ink-3 normal-case ml-2">
                      feat. {t.feature}
                    </span>
                  )}
                </div>
                {t.note && (
                  <div className="font-serif italic text-[14px] text-ink-3 mt-0.5">{t.note}</div>
                )}
              </div>
              {hasVideo && (
                <button
                  type="button"
                  onClick={() => openVideo(t.videoUrl!, `${t.title} — music video`)}
                  className="font-mono text-[10px] tracking-[.14em] uppercase px-2.5 py-1 border border-ink rounded-full hover:bg-ink hover:text-paper transition-colors flex items-center gap-1.5 shrink-0"
                  aria-label={`Play ${t.title} music video`}
                >
                  <span aria-hidden>▶</span>
                  <span>video</span>
                </button>
              )}
              {t.duration && (
                <span className="font-mono text-[12px] tabular-nums text-ink-3 shrink-0 w-12 text-right">
                  {t.duration}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <VideoModal
        url={videoUrl}
        title={videoTitle}
        onClose={() => setVideoUrl(null)}
      />
    </>
  );
}
