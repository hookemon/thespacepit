"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Track } from "../../_lib/sanity-queries";
import { VideoModal } from "../../_components/shared/VideoModal";

/**
 * Tracklist where EVERY track is clickable, with a smart play fallback chain:
 *   1. If track has audioPreviewUrl → play 30s Bandcamp preview
 *   2. Else if track has videoUrl → open music video modal
 *   3. Else → search YouTube on-demand for "$artist $title", open in modal
 *
 * If you don't click any track, the release-page top embed (or the
 * fallbackYouTubeUrl modal trigger) carries the album.
 */
export function TracklistAndCover({
  tracklist,
  releaseArtistText,
  releaseTitle,
  fallbackYouTubeUrl,
}: {
  tracklist: Track[];
  releaseArtistText?: string;
  releaseTitle?: string;
  fallbackYouTubeUrl?: string;
}) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [searchingIdx, setSearchingIdx] = useState<number | null>(null);
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

  // Smart play: try preview audio → try song's videoUrl → fall back to a
  // YouTube search for "$artist $title" → open in modal.
  const smartPlay = useCallback(async (idx: number, t: Track) => {
    if (t.audioPreviewUrl) { playTrack(idx, t.audioPreviewUrl); return; }
    if (t.videoUrl) { openVideo(t.videoUrl, `${t.title} — music video`); return; }
    setSearchingIdx(idx);
    try {
      const q = encodeURIComponent(
        releaseArtistText
          ? `${releaseArtistText} ${t.title}`
          : t.title
      );
      const res = await fetch(`/api/radio-search?q=${q}`, { cache: "force-cache" });
      const data = (await res.json().catch(() => ({}))) as { videoId?: string | null };
      if (data?.videoId) {
        openVideo(`https://www.youtube.com/watch?v=${data.videoId}`, `${t.title}${releaseArtistText ? ` — ${releaseArtistText}` : ""}`);
      } else if (fallbackYouTubeUrl) {
        // Couldn't find the specific track — fall back to the release-level URL.
        openVideo(fallbackYouTubeUrl, `${releaseTitle ?? t.title} — full album`);
      }
    } finally {
      setSearchingIdx(null);
    }
  }, [playTrack, releaseArtistText, releaseTitle, fallbackYouTubeUrl]);

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

              {/* EVERY track is now clickable. Track number doubles as the
                  play button — hover and it morphs into ▶. Click triggers the
                  smartPlay chain: preview → video → YouTube search. */}
              {(() => {
                const isSearching = searchingIdx === i;
                const label = isSearching ? "…" : isPlaying ? "❚❚" : "▶";
                const num = String(i + 1).padStart(2, "0");
                const title = hasPreview
                  ? (isPlaying ? "Pause" : "30s preview")
                  : hasVideo
                  ? "Play music video"
                  : "Find on YouTube";
                return (
                  <button
                    type="button"
                    onClick={() => smartPlay(i, t)}
                    disabled={isSearching}
                    className={`group/play w-8 h-8 shrink-0 rounded-full border border-ink flex items-center justify-center text-[12px] tabular-nums font-mono transition-colors ${
                      isPlaying
                        ? "bg-collect text-paper"
                        : "bg-paper hover:bg-ink hover:text-paper"
                    } ${isSearching ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
                    aria-label={`${title}: ${t.title}`}
                    title={title}
                  >
                    <span className="group-hover/play:hidden" aria-hidden>{isPlaying || isSearching ? label : num}</span>
                    <span className="hidden group-hover/play:inline" aria-hidden>{label}</span>
                  </button>
                );
              })()}

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
