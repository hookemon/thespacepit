"use client";

import { useEffect } from "react";
import { MediaEmbed } from "./MediaEmbed";

type Props = {
  url: string | null;
  title?: string;
  onClose: () => void;
};

/**
 * Fullscreen lightbox for a video. Click backdrop or press ESC to close.
 * Reuses MediaEmbed so YouTube / IG reels / Vimeo / TikTok all work.
 */
export function VideoModal({ url, title, onClose }: Props) {
  // ESC to close + body scroll lock while open
  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "video"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 backdrop-blur-sm p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="close"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 font-mono text-[11px] tracking-[.14em] uppercase text-paper-2 hover:text-paper transition-colors z-10"
      >
        ✕ close · esc
      </button>
      <div
        className="w-full max-w-[1180px]"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="font-mono text-[11px] tracking-[.18em] uppercase text-paper-2 mb-3">
            {title}
          </div>
        )}
        <MediaEmbed url={url} title={title} />
      </div>
    </div>
  );
}
