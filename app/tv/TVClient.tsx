"use client";

/**
 * The TV — multi-channel autoplay video player. Each channel is a tag-driven
 * queue of YouTube videos. Press play, watch one, next one rolls automatically.
 * Flip channels at any time, like flipping the dial.
 *
 * Powered by the YT IFrame API (same pattern as RadioClient): we listen for
 * onStateChange === 0 (ended) and advance the queue.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VideoListItem } from "../_lib/sanity-queries";

export type Channel = {
  id: string;
  number: string;
  name: string;
  description: string;
  tags: string[];
  accent: string;
};

type StockedChannel = Channel & { queue: VideoListItem[] };

// ── YT IFrame API (same shape as RadioClient) ──
type YTPlayer = { loadVideoById: (id: string) => void; destroy: () => void; playVideo?: () => void; pauseVideo?: () => void };
type YTApi = {
  Player: new (el: HTMLElement, opts: {
    height?: string; width?: string; videoId?: string;
    playerVars?: Record<string, string | number>;
    events?: {
      onReady?: (e: { target: YTPlayer }) => void;
      onStateChange?: (e: { data: number }) => void;
    };
  }) => YTPlayer;
};
declare global {
  interface Window {
    YT?: YTApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}
let ytReadyPromise: Promise<YTApi> | null = null;
function loadYouTubeAPI(): Promise<YTApi> {
  if (typeof window === "undefined") return Promise.reject(new Error("server"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytReadyPromise) return ytReadyPromise;
  ytReadyPromise = new Promise<YTApi>((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => { if (window.YT?.Player) resolve(window.YT); };
  });
  return ytReadyPromise;
}

// Shuffle a copy of an array — fresh order per channel hop.
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TVClient({ channels }: { channels: StockedChannel[] }) {
  const [activeId, setActiveId] = useState(channels[0]!.id);
  // Each channel gets its own shuffled queue + cursor. The cursor advances
  // when a video ends, wraps around when the queue is exhausted.
  const [queues, setQueues] = useState<Record<string, VideoListItem[]>>(() =>
    Object.fromEntries(channels.map((ch) => [ch.id, shuffle(ch.queue)]))
  );
  const [cursors, setCursors] = useState<Record<string, number>>(() =>
    Object.fromEntries(channels.map((ch) => [ch.id, 0]))
  );
  const [playing, setPlaying] = useState(true);
  const [tuningStatic, setTuningStatic] = useState(false);

  const active = channels.find((c) => c.id === activeId)!;
  const currentQueue = queues[activeId] ?? [];
  const cursor = cursors[activeId] ?? 0;
  const current = currentQueue[cursor];
  const upNext = useMemo(() => {
    const out: VideoListItem[] = [];
    for (let i = 1; i <= 4; i++) {
      const idx = (cursor + i) % Math.max(currentQueue.length, 1);
      const v = currentQueue[idx];
      if (v && v._id !== current?._id) out.push(v);
    }
    return out;
  }, [currentQueue, cursor, current]);

  const playerRef = useRef<YTPlayer | null>(null);
  const playerHostRef = useRef<HTMLDivElement | null>(null);

  // Advance to the next video in this channel's queue
  const next = useCallback(() => {
    setCursors((prev) => ({
      ...prev,
      [activeId]: ((prev[activeId] ?? 0) + 1) % Math.max(currentQueue.length, 1),
    }));
  }, [activeId, currentQueue.length]);

  // Re-shuffle the active channel — like hitting "random play" on a station.
  const reshuffle = useCallback(() => {
    setQueues((prev) => ({ ...prev, [activeId]: shuffle(channels.find((c) => c.id === activeId)!.queue) }));
    setCursors((prev) => ({ ...prev, [activeId]: 0 }));
  }, [activeId, channels]);

  // Boot / update the iframe player when current video changes
  useEffect(() => {
    if (!current?.youtubeId) return;
    const videoId = current.youtubeId;
    loadYouTubeAPI().then((YT) => {
      if (!playerRef.current && playerHostRef.current) {
        playerRef.current = new YT.Player(playerHostRef.current, {
          height: "100%",
          width: "100%",
          videoId,
          playerVars: { autoplay: playing ? 1 : 0, rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onStateChange: (e) => {
              // YT state codes: 0 = ended, 1 = playing, 2 = paused
              if (e.data === 0) next();
              if (e.data === 1) setPlaying(true);
              if (e.data === 2) setPlaying(false);
            },
          },
        });
      } else if (playerRef.current) {
        playerRef.current.loadVideoById(videoId);
      }
    });
  }, [current?.youtubeId, next, playing]);

  // Destroy player on unmount
  useEffect(() => () => {
    try { playerRef.current?.destroy(); } catch {}
    playerRef.current = null;
  }, []);

  // Channel hop with a brief static flash for the cable-TV vibe
  const switchChannel = useCallback((id: string) => {
    if (id === activeId) return;
    setTuningStatic(true);
    setTimeout(() => {
      setActiveId(id);
      setTuningStatic(false);
    }, 360);
  }, [activeId]);

  return (
    <div className="px-5 sm:px-8 py-8">
      {/* Channel switcher row — big chips with channel number + name */}
      <div className="flex flex-wrap gap-2.5 mb-6">
        {channels.map((ch) => {
          const isActive = ch.id === activeId;
          return (
            <button
              key={ch.id}
              onClick={() => switchChannel(ch.id)}
              className="group flex items-center gap-2.5 px-3 py-2 border-2 transition-all rounded-sm"
              style={{
                borderColor: isActive ? ch.accent : "rgba(244,239,230,0.3)",
                background: isActive ? ch.accent : "transparent",
                color: isActive ? "#0B0B0B" : "var(--color-paper)",
              }}
              aria-label={`Switch to channel ${ch.number} ${ch.name}`}
            >
              <span
                className="font-mono text-[10px] tracking-[.18em] tabular-nums px-1.5 py-0.5 rounded-sm"
                style={{
                  background: isActive ? "rgba(0,0,0,0.2)" : "rgba(244,239,230,0.08)",
                  color: isActive ? "#0B0B0B" : ch.accent,
                }}
              >
                CH {ch.number}
              </span>
              <span className="font-display font-bold text-[14px] uppercase tracking-tight">{ch.name}</span>
              <span className="font-mono text-[9px] tracking-[.14em] uppercase opacity-60 hidden sm:inline">
                · {ch.queue.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* The screen */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] gap-6">
        {/* Player */}
        <div>
          <div className="relative border-2 border-paper bg-ink overflow-hidden" style={{ aspectRatio: "16/9" }}>
            {/* Static-out flash when changing channels */}
            {tuningStatic && (
              <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                  background:
                    "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, rgba(0,0,0,0.6) 1px, rgba(0,0,0,0.6) 2px), repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0, rgba(0,0,0,0.5) 1px, transparent 2px, transparent 3px)",
                  animation: "tv-static 0.1s steps(2) infinite",
                }}
                aria-hidden
              />
            )}
            {/* Channel station-ID overlay (top-left, like a real broadcast) */}
            <div
              className="absolute top-3 left-3 z-10 font-mono text-[10px] tracking-[.18em] uppercase px-2 py-1 rounded-sm flex items-center gap-2 pointer-events-none"
              style={{
                background: "rgba(11,11,11,0.7)",
                color: active.accent,
                backdropFilter: "blur(4px)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: active.accent }} />
              <span>LIVE · CH {active.number} · {active.name}</span>
            </div>
            {/* The actual iframe target. YT.Player replaces this <div>. */}
            <div ref={playerHostRef} className="absolute inset-0 w-full h-full" />
          </div>

          {/* Below-the-screen now-playing strip */}
          <div className="mt-4 flex items-baseline justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] tracking-[.14em] uppercase mb-1" style={{ color: active.accent }}>
                ▶ NOW PLAYING · CHANNEL {active.number} · {active.name}
              </div>
              <div className="font-display font-semibold text-[20px] sm:text-[24px] uppercase leading-tight tracking-[-0.005em] line-clamp-2">
                {current?.title ?? "—"}
              </div>
              <div className="font-mono text-[10px] tracking-[.12em] uppercase text-paper-2 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                {current?.publishedAt && (
                  <span>{new Date(current.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short" }).toLowerCase()}</span>
                )}
                {current?.duration && <span>· {current.duration}</span>}
                {current?.tags && current.tags.length > 0 && (
                  <span className="truncate">· {current.tags.slice(0, 4).join(" · ")}</span>
                )}
              </div>
              <p className="font-serif italic text-[14px] text-paper-2 mt-2 max-w-[640px]">{active.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={next}
                className="font-mono text-[10px] tracking-[.14em] uppercase px-3 py-2 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors"
                aria-label="skip to next video"
              >
                skip ↦
              </button>
              <button
                type="button"
                onClick={reshuffle}
                className="font-mono text-[10px] tracking-[.14em] uppercase px-3 py-2 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors"
                aria-label="reshuffle this channel"
              >
                ↻ reshuffle
              </button>
            </div>
          </div>
        </div>

        {/* UP NEXT — like the station's "coming up" sidebar */}
        <aside className="border border-paper p-4 bg-ink-2">
          <div className="font-mono text-[10px] tracking-[.18em] uppercase mb-3" style={{ color: active.accent }}>
            UP NEXT ON CH {active.number}
          </div>
          <div className="grid gap-3">
            {upNext.map((v, i) => (
              <button
                key={v._id}
                type="button"
                onClick={() => {
                  // Jump straight to this preview tile
                  const newCursor = currentQueue.findIndex((x) => x._id === v._id);
                  if (newCursor >= 0) setCursors((prev) => ({ ...prev, [activeId]: newCursor }));
                }}
                className="text-left group flex gap-3 items-start cursor-pointer hover:opacity-90"
              >
                <div className="font-mono text-[10px] tracking-[.12em] tabular-nums text-paper-2 mt-1 shrink-0 w-[14px] text-right">
                  {i + 1}
                </div>
                <div className="relative aspect-video w-[110px] shrink-0 border border-paper overflow-hidden bg-ink">
                  {v.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnailUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform"
                      loading="lazy"
                    />
                  )}
                  {v.duration && (
                    <span className="absolute bottom-1 right-1 bg-ink/85 text-paper font-mono text-[8px] px-1 rounded-sm tabular-nums">
                      {v.duration}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-semibold text-[13px] uppercase leading-tight tracking-[-0.005em] line-clamp-3">
                    {v.title}
                  </div>
                </div>
              </button>
            ))}
            {upNext.length === 0 && (
              <p className="font-serif italic text-[14px] text-paper-2">queue's empty — hit reshuffle.</p>
            )}
          </div>
        </aside>
      </div>

      {/* Tiny keyframes for the static effect — scoped via <style> */}
      <style>{`
        @keyframes tv-static {
          0%   { transform: translate3d(0, 0, 0); }
          25%  { transform: translate3d(-1px, 1px, 0); }
          50%  { transform: translate3d(1px, -1px, 0); }
          75%  { transform: translate3d(-1px, -1px, 0); }
          100% { transform: translate3d(1px, 1px, 0); }
        }
      `}</style>
    </div>
  );
}
