"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { DiscogsRelease } from "../_lib/discogs";
import { cleanArtistName, discogsUrl, primaryFormat } from "../_lib/discogs";
import type { CatalogSong, VideoListItem } from "../_lib/sanity-queries";
import { urlFor } from "../_lib/sanity";

/** The serializable subset of Station that the client needs. The server
 *  already resolved each station's release-slug set, so the client only
 *  needs to display the chip + look up its count. */
type StationCardProps = { slug: string; label: string; blurb?: string };

type FormatFilter = "all" | "Vinyl" | "Cassette" | "CD";
type Stream = "all" | "crate" | "catalog" | "videos";

// One unified track shape across ALL streams. The `youtubeId` is set
// directly when known (videos / future enriched releases). When null, the
// player uses the title/artist as a search query against /api/radio-search.
type Track = {
  kind: "crate" | "catalog" | "video" | "song";
  key: string;
  title: string;
  artist: string;
  /** Sub-line under the title — e.g. release name for songs */
  subline?: string;
  coverUrl: string | null;
  year?: number | string;
  format?: string;
  externalUrl?: string;
  /** Pre-known YouTube id (videos only). Else we'll search. */
  youtubeId?: string | null;
  /** Used as the YouTube search query — bypass auto-build when present */
  searchQueryOverride?: string;
};

function searchQueryFor(t: Track): string {
  if (t.searchQueryOverride) return t.searchQueryOverride;
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

import { loadYouTubeAPI, type YTPlayer } from "../_lib/yt-iframe";

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
function songToTrack(s: CatalogSong): Track {
  const cover = s.releaseCover ? urlFor(s.releaseCover).width(600).height(600).fit("crop").url() : null;
  const primary = s.releaseArtists[0]?.name ?? "Nick Hook";
  const featLine = s.features && s.features.length > 0 ? ` · feat. ${s.features.join(", ")}` : "";
  return {
    kind: "song",
    key: `song-${s.id}`,
    title: s.title,
    artist: primary,
    subline: `${s.releaseTitle}${featLine}`,
    coverUrl: cover,
    year: s.releaseYear,
    format: s.releaseLabel,
    externalUrl: `/releases/${s.releaseSlug}`,
    searchQueryOverride: s.searchQuery,
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
  songs,
  musicVideos,
  stations,
  stationReleaseSlugs,
  stationTrackCounts,
}: {
  records: DiscogsRelease[];
  songs: CatalogSong[];
  musicVideos: VideoListItem[];
  stations: StationCardProps[];
  /** station slug → array of release slugs in that station */
  stationReleaseSlugs: Record<string, string[]>;
  /** station slug → number of songs in that station */
  stationTrackCounts: Record<string, number>;
}) {
  const [stream, setStream] = useState<Stream>("catalog");
  const [station, setStation] = useState<string>("the-catalog");
  const [format, setFormat] = useState<FormatFilter>("all");
  const [seed, setSeed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);

  // Build the unified pool from selected stream(s) + active station.
  // When stream === "catalog", we use the per-SONG flattened list (so each
  // song is its own queue entry), narrowed by the station's release-slug set
  // when one is picked. For other streams, the station has no effect.
  const pool = useMemo<Track[]>(() => {
    let crate = records.map(crateToTrack);
    if (format !== "all") crate = crate.filter((t) => t.format === format);

    // Catalog → per-song, station-filtered
    const releaseSlugFilter: Set<string> | null =
      station && station !== "the-catalog"
        ? new Set(stationReleaseSlugs[station] ?? [])
        : null;
    let songTracks = songs.map(songToTrack);
    if (releaseSlugFilter) {
      songTracks = songTracks.filter((t) => {
        // each song's externalUrl is /releases/<slug>
        const m = /^\/releases\/(.+)$/.exec(t.externalUrl ?? "");
        return m && releaseSlugFilter.has(m[1]);
      });
    }

    const vids = musicVideos.map(videoToTrack);

    if (stream === "crate") return crate;
    if (stream === "catalog") return songTracks;
    if (stream === "videos") return vids;
    // all = mix everything
    return [...crate, ...songTracks, ...vids];
  }, [records, songs, musicVideos, stream, format, station, stationReleaseSlugs]);

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

  // Counter for consecutive YouTube-lookup failures. When too many records
  // in a row can't be matched (common with obscure crate cuts), we used to
  // auto-skip every 1.2s — visually that read as "records scoring through"
  // because the user couldn't see what was happening. Now we slow down the
  // skip and pause auto-advance entirely after 3 failures in a row, so the
  // listener can manually click "next →" to keep going.
  const consecutiveFailsRef = useRef(0);
  const STUCK_THRESHOLD = 3;
  const SKIP_DELAY_MS = 3500;

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
        consecutiveFailsRef.current += 1;
        // Auto-pause after 3 unmatchable tracks in a row — better UX than
        // the records scoring through and the user not knowing why.
        if (consecutiveFailsRef.current >= STUCK_THRESHOLD) {
          setLookupError(`stuck — ${consecutiveFailsRef.current} tracks in a row had no youtube match. click next → to keep digging.`);
          setPlaying(false);
          consecutiveFailsRef.current = 0;
          return;
        }
        setLookupError(`no youtube match · skipping in ${SKIP_DELAY_MS / 1000}s`);
        setTimeout(() => { if (!cancelled) advance(); }, SKIP_DELAY_MS);
        return;
      }
      // Successful match — reset the streak.
      consecutiveFailsRef.current = 0;
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

  // Reset position when stream/format/station changes.
  useEffect(() => { setIndex(0); setSeed((s) => s + 1); setPlaying(false); }, [stream, format, station]);

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
    song:    { label: "song",    color: "#E83A1C" },
    video:   { label: "video",   color: "#7BD3A8" },
  };
  const badge = STREAM_BADGE[currentTrack.kind];

  return (
    <div className="px-6 sm:px-8 py-8">
      {/* STREAM SELECTOR — top-level: which pool of stuff to draw from */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Chip active={stream === "all"}     onClick={() => setStream("all")}     label={`all · ${records.length + songs.length + musicVideos.length}`} />
        <Chip active={stream === "crate"}   onClick={() => setStream("crate")}   label={`crate · ${records.length}`} />
        <Chip active={stream === "catalog"} onClick={() => setStream("catalog")} label={`catalog · ${songs.length} songs`} />
        <Chip active={stream === "videos"}  onClick={() => setStream("videos")}  label={`videos · ${musicVideos.length}`} />
      </div>

      {/* STATION SELECTOR — only meaningful when catalog is in scope. Each
          chip narrows the catalog pool to a curated sub-vibe (era / label /
          year band / hand-picked). Picking a station also implicitly switches
          the stream to "catalog" so you immediately hear it. */}
      {(stream === "catalog" || stream === "all") && (
        <div className="mt-2 mb-6">
          <div className="font-mono text-[10px] tracking-[.16em] uppercase text-lamp/80 mb-2">
            STATIONS · {stationTrackCounts[station] ?? 0} songs in this station
          </div>
          <div className="flex flex-wrap gap-2">
            {stations.map((s) => {
              const count = stationTrackCounts[s.slug] ?? 0;
              if (count === 0 && s.slug !== "the-catalog") return null;
              return (
                <button
                  key={s.slug}
                  type="button"
                  title={s.blurb}
                  onClick={() => {
                    setStation(s.slug);
                    if (stream !== "catalog") setStream("catalog");
                  }}
                  className={`font-mono text-[10px] tracking-[.14em] uppercase px-3 py-1.5 border transition-colors ${
                    station === s.slug
                      ? "bg-lamp text-ink border-lamp"
                      : "text-paper border-paper hover:bg-paper hover:text-ink"
                  }`}
                >
                  {s.label} · {count}
                </button>
              );
            })}
          </div>
          {/* Active station blurb */}
          {(() => {
            const s = stations.find((x) => x.slug === station);
            return s?.blurb ? (
              <p className="font-serif italic text-[14px] text-paper-2 mt-2">
                {s.blurb}
              </p>
            ) : null;
          })()}
        </div>
      )}

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
            {currentTrack.subline && (
              <div className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2/80 mt-1">
                from · {currentTrack.subline}
              </div>
            )}
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
                  {currentTrack.kind === "crate" ? "discogs ↗" : currentTrack.kind === "video" ? "youtube ↗" : "release →"}
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
