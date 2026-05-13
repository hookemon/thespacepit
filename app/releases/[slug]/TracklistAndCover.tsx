"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { Track, ReleaseCredit } from "../../_lib/sanity-queries";
import { VideoModal } from "../../_components/shared/VideoModal";
import { useListening, type ListeningTrack } from "../../_components/listening/ListeningProvider";

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
  releaseSlug,
  releaseCoverUrl,
  fallbackYouTubeUrl,
  credits,
}: {
  tracklist: Track[];
  releaseArtistText?: string;
  releaseTitle?: string;
  releaseSlug?: string;
  releaseCoverUrl?: string | null;
  fallbackYouTubeUrl?: string;
  /** Album credits — when any have a `tracks[]` scope set, the relevant
   *  rows in the tracklist get a "▾ credits" toggle that expands to show
   *  the per-track personnel (in addition to the inline `features` chips
   *  for billed featured artists). */
  credits?: ReleaseCredit[];
}) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [searchingIdx, setSearchingIdx] = useState<number | null>(null);
  /** Which tracklist rows have their per-track credit pop-out open. Index
   *  into tracklist[]. Multi-select so you can compare two songs side-by-
   *  side without one closing the other. */
  const [openRows, setOpenRows] = useState<Set<number>>(new Set());

  // Index album credits by lowercased + normalized track title so each row
  // can do a quick `creditsByTrack.get(normalize(title)) ?? []` lookup.
  // Normalization matches whatever the credit author typed (case + light
  // punctuation) against the actual stored track titles (which sometimes
  // arrive ALL CAPS or with stray "FT. X" suffixes).
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[\(\[].*?[\)\]]/g, " ").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const creditsByTrack = useMemo(() => {
    const m = new Map<string, ReleaseCredit[]>();
    for (const cr of credits ?? []) {
      const scope = cr.tracks ?? [];
      if (scope.length === 0) continue; // album-wide — handled by the credits room, not per-row
      for (const tt of scope) {
        const k = normalize(tt);
        const list = m.get(k) ?? [];
        list.push(cr);
        m.set(k, list);
      }
    }
    return m;
  }, [credits]);

  // Audio playback now flows through the GLOBAL ListeningProvider so the
  // mini-player follows you across navigation. Local "playing" state is
  // derived from whether the current global track is one of OUR rows.
  const { current, isPlaying: globalPlaying, progress: globalProgress, play: dispatchPlay, playQueue, toggle } = useListening();

  // Which row (if any) is the currently-playing global track? We key by a
  // release-scoped track id so two releases playing the same audio URL (rare)
  // don't conflict.
  const rowIdFor = useCallback((i: number) => `${releaseSlug ?? "release"}-t${i}`, [releaseSlug]);
  const playingIdx = (() => {
    if (!current) return null;
    for (let i = 0; i < tracklist.length; i++) if (current.id === rowIdFor(i)) return i;
    return null;
  })();
  const progress = playingIdx !== null ? globalProgress : 0;

  // Build a ListeningTrack from a tracklist row.
  const toListening = useCallback((i: number, t: Track): ListeningTrack => ({
    id: rowIdFor(i),
    title: t.title,
    artist: t.feature ? `${releaseArtistText ?? ""} · feat. ${t.feature}`.trim() : releaseArtistText,
    coverUrl: releaseCoverUrl ?? null,
    audioUrl: t.audioPreviewUrl!,
    releaseSlug,
    releaseTrackNumber: i + 1,
    duration: t.duration,
  }), [releaseArtistText, releaseCoverUrl, releaseSlug, rowIdFor]);

  const playTrack = useCallback((idx: number) => {
    const t = tracklist[idx];
    if (!t?.audioPreviewUrl) return;
    // If THIS row is what's already playing, toggle pause; else queue + play
    // the whole release from this index so "next" advances through the album.
    if (playingIdx === idx) { toggle(); return; }
    const playable = tracklist.filter((tt) => tt.audioPreviewUrl);
    if (playable.length === tracklist.length) {
      // Every track has audio — queue the full album, start at idx.
      playQueue(tracklist.map((tt, i) => toListening(i, tt)), idx);
    } else {
      // Mixed — just play the one. (Rare in practice; bandcamp gives us
      // previews for whole albums together.)
      dispatchPlay(toListening(idx, t));
    }
  }, [tracklist, playingIdx, toggle, playQueue, dispatchPlay, toListening]);

  const openVideo = (url: string, title: string) => {
    setVideoUrl(url);
    setVideoTitle(title);
  };

  // Smart play: try preview audio → try song's videoUrl → fall back to a
  // YouTube search for "$artist $title" → open in modal.
  const smartPlay = useCallback(async (idx: number, t: Track) => {
    if (t.audioPreviewUrl) { playTrack(idx); return; }
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
          // "playing" = this row is the global current AND audio is running.
          // We show the morphing pause icon only while actually playing; while
          // paused the number/▶ comes back so it's obvious you can resume.
          const isCurrent = playingIdx === i;
          const isPlaying = isCurrent && globalPlaying;
          // Per-track credits for THIS row (filtered from album credits[]
          // by tracks[] scope). When non-empty we render a "▾ credits"
          // toggle on the row + an expandable panel below it.
          const trackCredits = creditsByTrack.get(normalize(t.title)) ?? [];
          const isOpen = openRows.has(i);
          const toggleOpen = () => setOpenRows((prev) => {
            const next = new Set(prev);
            if (next.has(i)) next.delete(i);
            else next.add(i);
            return next;
          });
          return (
            <li
              key={i}
              className={`border-b border-ink/30 ${isCurrent ? "bg-ink/5" : ""}`}
            >
            <div className="relative flex items-baseline gap-3 sm:gap-4 py-3">
              {/* Progress bar — sits along the bottom of the row while this
                  track is the active one (even when paused). */}
              {isCurrent && (
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
                  {/* Feature credits — prefer the resolved featureLinks array
                      (each entry has an optional artist slug; render as a
                      clickable Link when present, plain text when not).
                      Fall back to the legacy single-string `feature` field
                      for releases that haven't been re-imported yet. */}
                  {(() => {
                    const links = (t.featureLinks ?? []).filter((f) => f && f.name);
                    if (links.length > 0) {
                      return (
                        <span className="font-serif italic text-[15px] sm:text-[17px] text-ink-3 normal-case ml-2">
                          feat.{" "}
                          {links.map((f, i) => (
                            <span key={`${f.name}-${i}`}>
                              {f.slug ? (
                                <Link
                                  href={`/artists/${f.slug}`}
                                  className="text-ink-3 hover:text-collect underline-offset-4 decoration-1 hover:underline transition-colors no-underline"
                                >
                                  {f.name}
                                </Link>
                              ) : (
                                <span>{f.name}</span>
                              )}
                              {i < links.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </span>
                      );
                    }
                    if (t.feature) {
                      return (
                        <span className="font-serif italic text-[15px] sm:text-[17px] text-ink-3 normal-case ml-2">
                          feat. {t.feature}
                        </span>
                      );
                    }
                    return null;
                  })()}
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
              {/* Per-song credits toggle — only renders when this track has
                  credit rows scoped to it. Click to pop out the cast panel. */}
              {trackCredits.length > 0 && (
                <button
                  type="button"
                  onClick={toggleOpen}
                  className="font-mono text-[10px] tracking-[.14em] uppercase px-2.5 py-1 border border-ink rounded-full hover:bg-ink hover:text-paper transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? "Hide" : "Show"} per-track credits for ${t.title}`}
                  title={`${isOpen ? "Hide" : "Show"} cast`}
                >
                  <span aria-hidden>{isOpen ? "▴" : "▾"}</span>
                  <span>cast · {trackCredits.length}</span>
                </button>
              )}
              {t.duration && (
                <span className="font-mono text-[12px] tabular-nums text-ink-3 shrink-0 w-12 text-right">
                  {t.duration}
                </span>
              )}
            </div>

            {/* Per-track credit pop-out — visible when the toggle is on.
                Rendered as a left-indented panel that aligns with the title
                column (past the play-button gutter). Credits are grouped by
                role-family (Production / Engineering / Performance / Other)
                so the cast reads cleanly even on a song with 8 contributors. */}
            {isOpen && trackCredits.length > 0 && (
              <div className="pl-12 pr-2 pb-4 -mt-1 max-w-[760px]">
                <div className="border-l-2 border-ink/30 pl-4">
                  <div className="font-mono text-[10px] tracking-[.16em] uppercase text-ink-3 mb-2">
                    on this song
                  </div>
                  {(() => {
                    type Family = "Production" | "Engineering" | "Performance" | "Other";
                    const familyOf = (role: string): Family => {
                      const r = role.toLowerCase();
                      if (/produc|exec/.test(r)) return "Production";
                      if (/mix|master|record|engineer|track/.test(r)) return "Engineering";
                      if (/vocal|backing|bass|guitar|drum|key|synth|string|programming|beat|percuss|sax|horn|brass/.test(r)) return "Performance";
                      return "Other";
                    };
                    const groups = new Map<Family, ReleaseCredit[]>([
                      ["Production", []], ["Engineering", []], ["Performance", []], ["Other", []],
                    ]);
                    for (const cr of trackCredits) groups.get(familyOf(cr.role))!.push(cr);
                    return (
                      <ul className="grid gap-1.5">
                        {[...groups.entries()].flatMap(([family, list]) =>
                          list.length === 0 ? [] : list.map((cr, idx) => (
                            <li key={`${family}-${idx}`} className="flex items-baseline gap-3">
                              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-ink-3 shrink-0 w-[140px]">
                                {cr.role}{cr.instrument ? ` · ${cr.instrument}` : ""}
                              </span>
                              <span className="flex-1 font-display font-semibold text-[15px] uppercase tracking-[-0.005em] leading-tight">
                                {cr.person ? (
                                  <Link
                                    href={`/artists/${cr.person.slug}`}
                                    className="text-ink hover:text-collect underline-offset-4 decoration-1 hover:underline transition-colors no-underline"
                                  >
                                    {cr.person.name}
                                  </Link>
                                ) : (
                                  cr.name ?? "—"
                                )}
                              </span>
                            </li>
                          ))
                        )}
                      </ul>
                    );
                  })()}
                </div>
              </div>
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
