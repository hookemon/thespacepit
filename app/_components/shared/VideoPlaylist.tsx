"use client";

import { useState } from "react";
import { MediaEmbed } from "./MediaEmbed";
import { parseEmbed } from "../../_lib/embed";

/**
 * Hero video player + clickable thumbnail rail.
 *
 * Built for the Old English release page where a single grid of YT embeds
 * wasn't doing the catalog justice — Nick has performances, the Ruffmercy
 * animated video, the Mass Appeal audio rip, the Spinn footwork VIP, and
 * his own vertical reel edits. A playlist UI lets the visitor land on the
 * hero (the official video by default), then bounce between everything
 * else from one cinematic surface.
 *
 * Generic — usable on any release. Pass:
 *   - items: { url, title? }[]
 *   - accent: optional hex (default lamp amber) for the active-thumb ring
 *   - eyebrow: top kicker text (default "PLAYLIST · N VIDEOS")
 */
export function VideoPlaylist({
  items,
  accent = "#F2B705",
  eyebrow,
}: {
  items: { url: string; title?: string }[];
  accent?: string;
  eyebrow?: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  if (items.length === 0) return null;
  const active = items[activeIdx];
  const activeEmbed = parseEmbed(active.url);

  const kicker = eyebrow ?? `PLAYLIST · ${items.length} ${items.length === 1 ? "VIDEO" : "VIDEOS"}`;

  return (
    <div>
      <div
        className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
        style={{ color: accent }}
      >
        {kicker}
      </div>

      {/* MAIN PLAYER — re-mounts on activeIdx change so the iframe loads the new
          video. Keying on idx is the simplest way to force a remount instead
          of swapping src in place (which sometimes leaves the old video
          playing in the background). */}
      <div className="mb-4">
        <MediaEmbed key={activeIdx} url={active.url} title={active.title} />
        {active.title && (
          <div className="font-display uppercase text-[18px] sm:text-[20px] mt-2 leading-tight">
            {active.title}
          </div>
        )}
        {activeEmbed.kind === "youtube" && (
          <div className="font-mono text-[10px] tracking-[.14em] uppercase text-ink-3 mt-1">
            now playing · {activeIdx + 1} of {items.length}
          </div>
        )}
      </div>

      {/* THUMBNAIL RAIL — horizontal scrolling strip on mobile, wraps to grid
          on larger screens. Each thumb is a button so it's keyboard-accessible. */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
        {items.map((item, i) => {
          const embed = parseEmbed(item.url);
          const isActive = i === activeIdx;
          const thumb = embed.thumbnail;
          return (
            <button
              key={`${item.url}-${i}`}
              type="button"
              onClick={() => setActiveIdx(i)}
              aria-pressed={isActive}
              aria-label={`Play ${item.title ?? `video ${i + 1}`}`}
              className="group block text-left no-underline bg-ink-2 border-2 transition-all duration-150 cursor-pointer"
              style={{
                borderColor: isActive ? accent : "var(--color-ink)",
                boxShadow: isActive ? `4px 4px 0 ${accent}` : "none",
                transform: isActive ? "translate(-2px, -2px)" : "none",
              }}
            >
              <div className="relative aspect-video overflow-hidden">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt={item.title ?? "video thumbnail"}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-[.14em] uppercase text-ink-3">
                    {embed.kind}
                  </div>
                )}
                {isActive && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: `${accent}22` }}
                  >
                    <span
                      className="font-mono text-[10px] tracking-[.14em] uppercase px-2 py-1 border-2 border-ink bg-paper"
                      style={{ color: accent }}
                    >
                      ▶ playing
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <div className="font-display uppercase text-[12px] leading-tight line-clamp-2 text-ink">
                  {item.title ?? `Video ${i + 1}`}
                </div>
                <div className="font-mono text-[9px] tracking-[.14em] uppercase text-ink-3 mt-1">
                  {embed.kind}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
