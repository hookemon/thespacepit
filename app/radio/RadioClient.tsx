"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { DiscogsRelease } from "../_lib/discogs";
import { cleanArtistName, discogsUrl, primaryFormat } from "../_lib/discogs";
import type { ReleaseListItem, VideoListItem } from "../_lib/sanity-queries";
import { urlFor } from "../_lib/sanity";

type FormatFilter = "all" | "Vinyl" | "Cassette" | "CD";
type Stream = "all" | "crate" | "catalog" | "videos";

// One unified track shape across all 3 streams. The `youtubeId` is set
// directly when known (videos / future enriched releases). When null, the
// player uses the title/artist as a search query against /api/radio-search.
type Track = {
  kind: "crate" | "catalog" | "video";
  key: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  year?: number | string;
  format?: string;
  externalUrl?: string;
  /** Pre-known YouTube id (videos only). Else we'll search. */
  youtubeId?: string | null;
};

function searchQueryFor(t: Track): string {
  if (/various/i.test(t.artist) || !t.artist) return t.title;
  return `${t.artist} ${t.title}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Random sample of N from arr (no repeats). Used for "up next" so it's a
// fresh face-roll every time, not always the next-5-in-queue.
function sample<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return [...arr];
  return shuffle(arr).slice(0, n);
}

// ── YT IFrame API typing (same as before) ──
type YTPlayer = { loadVideoById: (id: string) => void; destroy: () => void };
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
    window.onYouTubeIframeAPIReady = () => {
      if (window.YT?.Player) resolve(window.YT);
    };
  });
  return ytReadyPromise;
}

// ── Stream → Track converters ──
function crateToTrack(r: DiscogsRelease): Track {
  return {
    kind: "crate",
    key: `crate-${r.instance_id}`,
    title: r.title,
    artist: r.artists.map((a) => cleanArtistName(a.name)).join(" · "),
    coverUrl: r.cover_image || r.thumb || null,
    year: r.year || undefined,
    format: primaryFormat(r.formats),
    externalUrl: discogsUrl(r.id),
  };
}
function catalogToTrack(r: ReleaseListItem): Track {
  const cover = r.cover ? urlFor(r.cover).width(600).height(600).fit("crop").url() : null;
  return {
    kind: "catalog",
    key: `catalog-${r._id}`,
    title: r.title,
    artist: r.artists.map((a) => a.name).join(" · "),
    coverUrl: cover,
    year: r.year,
    format: r.format ?? r.label,
    externalUrl: `/releases/${r.slug}`,
  };
}
function videoToTrack(v: VideoListItem): Track {
  return {
    kind: "video",
    key: `video-${v._id}`,
    title: v.title,
    artist: "Nick Hook",
    coverUrl: v.thumbnailUrl ?? null,
    year: v.publishedAt ? new Date(v.publishedAt).getFullYear() : undefined,
    format: "music video",
    externalUrl: `https://www.youtube.com/watch?v=${v.youtubeId}`,
    youtubeId: v.youtubeId,
  };
}

export function RadioClient({
  records,
  catalogTracks,
  musicVideos,
}: {
  records: DiscogsRelease[];
  catalogTracks: ReleaseListItem[];
  musicVideos: VideoListItem[];
}) {
  const [stream, setStream] = useState<Stream>("all");
  const [format, setFormat] = useState<FormatFilter>("all");
  const [seed, setSeed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);

  // Build the unified pool from selected stream(s)
  const pool = useMemo<Track[]>(() => {
    let crate = records.map(crateToTrack);
    if (format !== "all") crate = crate.filter((t) => t.format === format);
    const cat = catalogTracks.map(catalogToTrack);
    const vids = musicVideos.map(videoToTrack);
    if (stream === "crate") return crate;
    if (stream === "catalog") return cat;
    if (stream === "videos") return vids;
    // all = mix all three
    return [...crate, ...cat, ...vids];
  }, [records, catalogTracks, musicVideos, stream, format]);

  // Shuffled queue. Re-shuffles whenever pool or seed changes.
  const queueRef = useRef<Track[]>([]);
  useMemo(() => {
    queueRef.current = shuffle(pool);
    return null;
  }, [pool, seed]);

  const currentTrack = queueRef.current[index] ?? null;

  // "Up next" = FRESH random sample of 5 from the remaining queue (not the
  // sequential next-5). Re-rolls on each advance so it visibly flexes.
  const upNext = useMemo(
    () => sample(queueRef.current.slice(index + 1), 5),
    [index, seed, queueRef.current.length] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const playerRef = useRef<YTPlayer | null>(null);
  const playerHostRef = useRef<HTMLDivElement | null>(null);

  const advance = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= queueRef.current.length) {
        setSeed((s) => s + 1);
        return 0;
      }
      return i + 1;
    });
  }, []);

  // Resolve a YouTube id for the current track (if not already known).
  const fetchVideoId = useCallback(async (t: Track): Promise<string | null> => {
    if (t.youtubeId) return t.youtubeId;
    try {
      const q = encodeURIComponent(searchQueryFor(t));
      const res = await fetch(`/api/radio-search?q=${q}`, { cache: "force-cache" });
      if (!res.ok) return null;
      const data = (await res.json()) as { videoId?: string | null };
      return data.videoId ?? null;
    } catch {
      return null;
    }
  }, []);

  // Whenever the current track or playing changes, look up + play.
  useEffect(() => {
    if (!playing || !currentTrack) return;
    let cancelled = false;
    (async () => {
      setLookupError(null);
      setLookupBusy(true);
      const videoId = await fetchVideoId(currentTrack);
      setLookupBusy(false);
      if (cancelled) return;
      if (!videoId) {
        setLookupError("no youtube match · skipping");
        setTimeout(() => { if (!cancelled) advance(); }, 1200);
        return;
      }
      const YT = await loadYouTubeAPI();
      if (cancelled) return;
      if (!playerRef.current && playerHostRef.current) {
        playerRef.current = new YT.Player(playerHostRef.current, {
          height: "100%",
          width: "100%",
          videoId,
          playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onStateChange: (e) => {
              if (e.data === 0) advance(); // ended
            },
          },
        });
      } else if (playerRef.current) {
        playerRef.current.loadVideoById(videoId);
      }
    })();
    return () => { cancelled = true; };
  }, [playing, currentTrack, fetchVideoId, advance]);

  // Tear down on unmount.
  useEffect(() => {
    return () => {
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
    };
  }, []);

  // Reset position when stream/format changes.
  useEffect(() => { setIndex(0); setSeed((s) => s + 1); setPlaying(false); }, [stream, format]);

  if (!currentTrack) {
    return (
      <div className="px-5 sm:px-8 py-12">
        <p className="font-serif italic text-[20px] text-paper-2">no tracks match that filter.</p>
      </div>
    );
  }

  const STREAM_BADGE: Record<Track["kind"], { label: string; color: string }> = {
    crate:   { label: "crate",   color: "#F2B705" },
    catalog: { label: "yours",   color: "#E83A1C" },
    video:   { label: "video",   color: "#7BD3A8" },
  };
  const badge = STREAM_BADGE[currentTrack.kind];

  return (
    <div className="px-6 sm:px-8 py-8">
      {/* STREAM SELECTOR */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Chip active={stream === "all"}     onClick={() => setStream("all")}     label={`all · ${records.length + catalogTracks.length + musicVideos.length}`} />
        <Chip active={stream === "crate"}   onClick={() => setStream("crate")}   label={`crate · ${records.length}`} />
        <Chip active={stream === "catalog"} onClick={() => setStream("catalog")} label={`yours · ${catalogTracks.length}`} />
        <Chip active={stream === "videos"}  onClick={() => setStream("videos")}  label={`videos · ${musicVideos.length}`} />
      </div>

      {/* FORMAT (only relevant when crate is in scope) */}
      {(stream === "all" || stream === "crate") && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Chip active={format === "all"}      onClick={() => setFormat("all")}      label="all formats" small />
          <Chip active={format === "Vinyl"}    onClick={() => setFormat("Vinyl")}    label="vinyl only" small />
          <Chip active={format === "Cassette"} onClick={() => setFormat("Cassette")} label="cassette only" small />
          <Chip active={format === "CD"}       onClick={() => setFormat("CD")}       label="cd only" small />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(280px,420px)_1fr]">
        {/* NOW PLAYING CARD */}
        <div>
          <div className="aspect-square border border-paper bg-ink-2 overflow-hidden relative">
            {currentTrack.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentTrack.coverUrl} alt={`${currentTrack.artist} — ${currentTrack.title}`} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-4 text-center font-display text-[24px] uppercase text-paper-2">
                {currentTrack.title}
              </div>
            )}
            <div
              className="absolute top-2 left-2 font-mono text-[10px] tracking-[.16em] uppercase px-2 py-0.5 border border-paper bg-ink/85 rounded-full"
              style={{ color: badge.color }}
            >
              {badge.label}
            </div>
          </div>
          <div className="mt-4">
            <div className="font-mono text-[10px] tracking-[.14em] uppercase text-lamp flex items-center gap-2 flex-wrap">
              <span>now playing</span>
              {currentTrack.year && <><span>·</span><span>{currentTrack.year}</span></>}
              {currentTrack.format && <><span>·</span><span>{String(currentTrack.format).toLowerCase()}</span></>}
              {lookupBusy && <span className="opacity-60">· searching yt…</span>}
            </div>
            <div className="font-display font-bold uppercase mt-1 leading-[0.95]" style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.02em" }}>
              {currentTrack.artist}
            </div>
            <div className="font-serif italic text-[18px] text-paper-2 mt-1">{currentTrack.title}</div>
            <div className="flex flex-wrap gap-2 mt-4">
              {!playing && (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  className="font-display font-semibold text-[14px] tracking-[.04em] uppercase px-4 py-2 border border-paper bg-lamp text-ink cursor-pointer hover:bg-paper transition-colors no-underline"
                >
                  ▶ press play
                </button>
              )}
              <button
                type="button"
                onClick={advance}
                className="font-display font-semibold text-[14px] tracking-[.04em] uppercase px-4 py-2 border border-paper text-paper cursor-pointer hover:bg-paper hover:text-ink transition-colors no-underline"
              >
                next →
              </button>
              {currentTrack.externalUrl && (
                <Link
                  href={currentTrack.externalUrl}
                  target={currentTrack.externalUrl.startsWith("http") ? "_blank" : undefined}
                  className="font-mono text-[10px] tracking-[.14em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline text-paper self-center"
                >
                  {currentTrack.kind === "crate" ? "discogs ↗" : currentTrack.kind === "catalog" ? "release →" : "youtube ↗"}
                </Link>
              )}
            </div>
            {lookupError && (
              <div className="font-mono text-[10px] tracking-[.14em] uppercase text-redline mt-3">
                {lookupError}
              </div>
            )}
          </div>
        </div>

        {/* PLAYER */}
        <div className="flex flex-col">
          <div className="aspect-video border border-paper overflow-hidden bg-ink-2 relative">
            {playing ? (
              <div ref={playerHostRef} className="absolute inset-0" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                <div>
                  <div className="font-display font-bold uppercase text-[24px] text-paper mb-2">
                    {pool.length.toLocaleString()} tracks in this stream
                  </div>
                  <p className="font-serif italic text-[16px] text-paper-2">
                    press play. each track's top youtube match plays back-to-back. tracks auto-advance when they finish.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="flex items-baseline justify-between mb-2">
              <div className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2">up next · random pull</div>
              <button
                type="button"
                onClick={() => setSeed((s) => s + 1)}
                className="font-mono text-[10px] tracking-[.14em] uppercase px-3 py-1 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors"
              >
                ⤴ reshuffle
              </button>
            </div>
            <ul className="space-y-1.5">
              {upNext.map((t, i) => {
                const b = STREAM_BADGE[t.kind];
                return (
                  <li key={`${t.key}-${i}`} className="flex items-baseline gap-3 border-b border-paper/30 py-1.5">
                    <span
                      className="font-mono text-[9px] tracking-[.14em] uppercase px-1.5 py-0.5 border rounded-full shrink-0"
                      style={{ color: b.color, borderColor: b.color }}
                    >
                      {b.label}
                    </span>
                    <span className="font-display font-semibold text-[14px] uppercase tracking-[-0.005em] line-clamp-1 flex-1">
                      {t.artist}
                    </span>
                    <span className="font-serif italic text-[12px] text-paper-2 line-clamp-1 max-w-[40%]">{t.title}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  small = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono ${small ? "text-[9px]" : "text-[10px]"} tracking-[.14em] uppercase px-3 py-1.5 border border-paper rounded-full transition-colors ${
        active ? "bg-paper text-ink" : "text-paper hover:bg-paper hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
