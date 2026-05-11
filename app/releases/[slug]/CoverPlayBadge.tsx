"use client";

import { useState } from "react";
import { VideoModal } from "../../_components/shared/VideoModal";

/**
 * Small "▶ music video" badge that floats on the album cover. Click → opens
 * the video in a fullscreen modal. Renders a separate VideoModal from the
 * tracklist one — that's fine, only one is ever open at a time.
 */
export function CoverPlayBadge({ url, releaseTitle }: { url: string; releaseTitle: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Play music video"
        className="absolute top-3 right-3 z-10 font-display font-bold uppercase text-[12px] tracking-[.1em] bg-lamp text-ink px-3 py-1.5 border border-ink rounded-full hover:bg-paper transition-colors shadow-[2px_2px_0_#0B0B0B] cursor-pointer flex items-center gap-1.5"
      >
        <span aria-hidden>▶</span>
        <span>music video</span>
      </button>
      <VideoModal
        url={open ? url : null}
        title={`${releaseTitle} — music video`}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
