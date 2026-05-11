"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { DiscogsRelease } from "../_lib/discogs";
import { cleanArtistName, discogsUrl, primaryFormat } from "../_lib/discogs";

type Filter = "all" | "Vinyl" | "Cassette" | "CD";

// Build a useful search string. Compilations show "Various" as artist which
// produces garbage results — fall back to the title alone.
function searchQuery(r: DiscogsRelease): string {
  const artist = r.artists.map((a) => cleanArtistName(a.name)).filter(Boolean).join(" ");
  if (/various/i.test(artist) || !artist) return r.title;
  return `${artist} ${r.title}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Minimal typing for the YT IFrame API surface we use.
type YTPlayer = {
  loadVideoById: (id: string) => void;
  destroy: () => void;
};
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

export function RadioClient({ records }: { records: DiscogsRelease[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [seed, setSeed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);

  const pool = useMemo(() => {
    if (filter === "all") return records;
    return records.filter((r) => primaryFormat(r.formats) === filter);
  }, [records, filter]);

  const queueRef = useRef<DiscogsRelease[]>([]);
  useMemo(() => {
    queueRef.current = shuffle(pool);
    return null;
  }, [pool, seed]);

  const currentRecord = queueRef.current[index] ?? null;
  const upNext = useMemo(
    () => queueRef.current.slice(index + 1, index + 6),
    [index, queueRef.current.length] // eslint-disable-line react-hooks/exhaustive-deps
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

  // Look up the videoId for a record via our /api/radio-search proxy.
  const fetchVideoId = useCallback(async (r: DiscogsRelease): Promise<string | null> => {
    try {
      const q = encodeURIComponent(searchQuery(r));
      const res = await fetch(`/api/radio-search?q=${q}`, { cache: "force-cache" });
      if (!res.ok) return null;
      const data = (await res.json()) as { videoId?: string | null };
      return data.videoId ?? null;
    } catch {
      return null;
    }
  }, []);

  // Whenever the current record or playing changes, look up + play.
  useEffect(() => {
    if (!playing || !currentRecord) return;
    let cancelled = false;

    (async () => {
      setLookupError(null);
      setLookupBusy(true);
      const videoId = await fetchVideoId(currentRecord);
      setLookupBusy(false);
      if (cancelled) return;
      if (!videoId) {
        // No YouTube match — skip after a brief delay.
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
              // 0 = ended. Auto-advance.
              if (e.data === 0) advance();
            },
          },
        });
      } else if (playerRef.current) {
        playerRef.current.loadVideoById(videoId);
      }
    })();

    return () => { cancelled = true; };
  }, [playing, currentRecord, fetchVideoId, advance]);

  // Tear down the player when the component unmounts.
  useEffect(() => {
    return () => {
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
    };
  }, []);

  // Reset when filter changes
  useEffect(() => { setIndex(0); setSeed((s) => s + 1); setPlaying(false); }, [filter]);

  if (!currentRecord) {
    return (
      <div className="px-8 py-12">
        <p className="font-serif italic text-[20px] text-paper-2">no records match that filter.</p>
      </div>
    );
  }

  const artist = currentRecord.artists.map((a) => cleanArtistName(a.name)).join(" · ");
  const fmt = primaryFormat(currentRecord.formats);

  return (
    <div className="px-6 sm:px-8 py-8">
      {/* Filter strip */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Chip active={filter === "all"} onClick={() => setFilter("all")} label="all formats" count={records.length} />
        <Chip active={filter === "Vinyl"} onClick={() => setFilter("Vinyl")} label="vinyl only" count={records.filter((r) => primaryFormat(r.formats) === "Vinyl").length} />
        <Chip active={filter === "Cassette"} onClick={() => setFilter("Cassette")} label="cassette only" count={records.filter((r) => primaryFormat(r.formats) === "Cassette").length} />
        <Chip active={filter === "CD"} onClick={() => setFilter("CD")} label="cd only" count={records.filter((r) => primaryFormat(r.formats) === "CD").length} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(280px,420px)_1fr]">
        {/* Now-playing card */}
        <div>
          <div className="aspect-square border border-paper bg-ink-2 overflow-hidden relative">
            {currentRecord.cover_image || currentRecord.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentRecord.cover_image || currentRecord.thumb} alt={`${artist} — ${currentRecord.title}`} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-4 text-center font-display text-[24px] uppercase text-paper-2">
                {currentRecord.title}
              </div>
            )}
          </div>
          <div className="mt-4">
            <div className="font-mono text-[10px] tracking-[.14em] uppercase text-lamp flex items-center gap-2">
              <span>now playing · {currentRecord.year || "—"} · {fmt.toLowerCase()}</span>
              {lookupBusy && <span className="opacity-60">· searching yt…</span>}
            </div>
            <div className="font-display font-bold uppercase mt-1 leading-[0.95]" style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.02em" }}>
              {artist}
            </div>
            <div className="font-serif italic text-[18px] text-paper-2 mt-1">{currentRecord.title}</div>
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
              <Link
                href={discogsUrl(currentRecord.id)}
                target="_blank"
                className="font-mono text-[10px] tracking-[.14em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline text-paper self-center"
              >
                discogs ↗
              </Link>
            </div>
            {lookupError && (
              <div className="font-mono text-[10px] tracking-[.14em] uppercase text-redline mt-3">
                {lookupError}
              </div>
            )}
          </div>
        </div>

        {/* Player */}
        <div className="flex flex-col">
          <div className="aspect-video border border-paper overflow-hidden bg-ink-2 relative">
            {playing ? (
              <div ref={playerHostRef} className="absolute inset-0" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                <div>
                  <div className="font-display font-bold uppercase text-[24px] text-paper mb-2">
                    {records.length.toLocaleString()} records in the crate
                  </div>
                  <p className="font-serif italic text-[16px] text-paper-2">
                    press play to start the station. each record's top youtube match plays back-to-back. tracks auto-advance when they finish.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 mb-2">up next</div>
            <ul className="space-y-1.5">
              {upNext.map((r, i) => {
                const aa = r.artists.map((a) => cleanArtistName(a.name)).join(" · ");
                return (
                  <li key={`${r.instance_id}-${i}`} className="flex items-baseline gap-3 border-b border-paper/30 py-1.5">
                    <span className="font-mono text-[10px] tracking-[.1em] text-paper-2 tabular-nums w-6 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display font-semibold text-[14px] uppercase tracking-[-0.005em] line-clamp-1 flex-1">
                      {aa}
                    </span>
                    <span className="font-serif italic text-[12px] text-paper-2 line-clamp-1 max-w-[40%]">{r.title}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setSeed((s) => s + 1)}
                className="font-mono text-[10px] tracking-[.14em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors"
              >
                ⤴ reshuffle the crate
              </button>
            </div>
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
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono text-[10px] tracking-[.12em] uppercase px-2.5 py-1 border rounded-full transition-colors ${
        active ? "border-lamp bg-lamp text-ink" : "border-paper text-paper hover:bg-paper hover:text-ink"
      }`}
    >
      {label} <span className={`tabular-nums ml-1 ${active ? "text-ink/60" : "text-paper-2"}`}>{count}</span>
    </button>
  );
}
