"use client";

/**
 * GLOBAL LISTENING CONTEXT — one audio element for the whole site, plus the
 * "now playing" state. Any component can dispatch a track to play; the actual
 * playback survives navigation (the audio element + state live in the root
 * layout, so route changes don't unmount it).
 *
 * The vision: click ▶ on a track on /releases/cc015-relationships, navigate
 * to /artists/junglepussy, music keeps playing. Hit the sticky bar's skip
 * button, queue advances. Like every real streaming app.
 *
 * Usage:
 *   const { play, playQueue, current, isPlaying, toggle, next, previous } = useListening();
 *   play({ id, title, artist, coverUrl, audioUrl, releaseSlug });
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import posthog from "posthog-js";

export type ListeningTrack = {
  /** Stable id — typically a release-slug + track-index combo. */
  id: string;
  title: string;
  artist?: string;
  coverUrl?: string | null;
  /** Direct mp3-128 URL (Bandcamp previews) or similar. Required for audio playback. */
  audioUrl: string;
  /** Where the user can land for the full track context — release page slug. */
  releaseSlug?: string;
  /** Track number on its source release, if known — used by the row UI. */
  releaseTrackNumber?: number;
  /** Duration label ("3:42") if known — display only. */
  duration?: string;
};

type ListeningCtx = {
  current: ListeningTrack | null;
  queue: ListeningTrack[];
  /** Index of `current` within `queue`. -1 if current is a one-shot. */
  index: number;
  isPlaying: boolean;
  progress: number;     // 0..1 of current track
  /** Replace the queue with a single track and play it. */
  play: (t: ListeningTrack) => void;
  /** Set a multi-track queue, start at `startIdx` (default 0). */
  playQueue: (tracks: ListeningTrack[], startIdx?: number) => void;
  /** Play/pause toggle for current. */
  toggle: () => void;
  /** Advance to next track in queue (no-op if no queue or at end). */
  next: () => void;
  /** Back one. */
  previous: () => void;
  /** Stop + clear everything; mini-player will hide. */
  stop: () => void;
};

const ctx = createContext<ListeningCtx | null>(null);

export function useListening(): ListeningCtx {
  const v = useContext(ctx);
  if (!v) throw new Error("useListening must be used inside <ListeningProvider>");
  return v;
}

export function ListeningProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<ListeningTrack[]>([]);
  const [index, setIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = index >= 0 && index < queue.length ? queue[index] : null;

  // Boot the singleton audio element once. NOTE: do NOT set crossOrigin —
  // Bandcamp's t4.bcbits.com CDN doesn't send CORS headers, so requesting
  // "anonymous" silently fails. Same gotcha that bit TracklistAndCover.
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;
    const onEnd  = () => { setIsPlaying(false); setProgress(0); /* advance queue if there's a next */
      setIndex((prev) => (prev >= 0 && prev + 1 < queue.length ? prev + 1 : prev)); };
    const onPlay = () => setIsPlaying(true);
    const onPause= () => setIsPlaying(false);
    const onTime = () => { if (audio.duration) setProgress(audio.currentTime / audio.duration); };
    const onErr  = (e: Event) => {
      console.warn("[listening] audio error", (e.target as HTMLAudioElement)?.error);
      setIsPlaying(false);
    };
    audio.addEventListener("ended",  onEnd);
    audio.addEventListener("play",   onPlay);
    audio.addEventListener("pause",  onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("error",  onErr);
    return () => {
      audio.pause();
      audio.removeEventListener("ended",  onEnd);
      audio.removeEventListener("play",   onPlay);
      audio.removeEventListener("pause",  onPause);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("error",  onErr);
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When `current` changes (via play() / next() / etc.), point the audio
  // element at the new URL and kick playback.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!current) { a.pause(); a.removeAttribute("src"); a.load(); return; }
    if (a.src !== current.audioUrl) {
      a.src = current.audioUrl;
      setProgress(0);
    }
    a.play().catch(() => setIsPlaying(false));
    posthog.capture?.("track_played", {
      track_id: current.id,
      track_title: current.title,
      track_artist: current.artist,
      release_slug: current.releaseSlug,
    });
  }, [current]);

  const play = useCallback((t: ListeningTrack) => {
    setQueue([t]);
    setIndex(0);
  }, []);

  const playQueue = useCallback((tracks: ListeningTrack[], startIdx = 0) => {
    if (tracks.length === 0) return;
    setQueue(tracks);
    setIndex(Math.max(0, Math.min(startIdx, tracks.length - 1)));
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, [current]);

  const next = useCallback(() => {
    setIndex((prev) => (prev >= 0 && prev + 1 < queue.length ? prev + 1 : prev));
  }, [queue.length]);

  const previous = useCallback(() => {
    setIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    setQueue([]); setIndex(-1); setIsPlaying(false); setProgress(0);
  }, []);

  const value = useMemo<ListeningCtx>(() => ({
    current, queue, index, isPlaying, progress,
    play, playQueue, toggle, next, previous, stop,
  }), [current, queue, index, isPlaying, progress, play, playQueue, toggle, next, previous, stop]);

  return <ctx.Provider value={value}>{children}</ctx.Provider>;
}
