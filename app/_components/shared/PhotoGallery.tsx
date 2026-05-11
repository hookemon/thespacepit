"use client";

import { useEffect, useState } from "react";

type GalleryPhoto = { src: string; alt?: string; aspectRatio?: number };

/**
 * Cinematic photo gallery for release pages. First photo is a full-width
 * banner; rest land in a varied grid (2 large, then 3-up rows). Click any
 * photo → fullscreen lightbox with arrow-key navigation.
 */
export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    if (activeIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIdx(null);
      if (e.key === "ArrowRight") setActiveIdx((i) => (i === null ? null : (i + 1) % photos.length));
      if (e.key === "ArrowLeft") setActiveIdx((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [activeIdx, photos.length]);

  if (photos.length === 0) return null;

  const [hero, ...rest] = photos;
  const pairAfterHero = rest.slice(0, 2);
  const tail = rest.slice(2);

  return (
    <>
      {/* Hero shot — big full-width banner */}
      <button
        type="button"
        onClick={() => setActiveIdx(0)}
        className="block w-full mb-3 group relative overflow-hidden border border-ink"
        style={{ aspectRatio: "16 / 9" }}
        aria-label="Open photo 1 of gallery"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hero.src} alt={hero.alt ?? ""} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="eager" />
      </button>

      {/* Two-up under the hero, if there are at least 2 more */}
      {pairAfterHero.length > 0 && (
        <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: `repeat(${pairAfterHero.length}, minmax(0, 1fr))` }}>
          {pairAfterHero.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i + 1)}
              className="group relative overflow-hidden border border-ink aspect-[4/3]"
              aria-label={`Open photo ${i + 2}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={p.alt ?? ""} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Tail — uniform 3-4 column grid */}
      {tail.length > 0 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {tail.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i + 3)}
              className="group relative overflow-hidden border border-ink aspect-square"
              aria-label={`Open photo ${i + 4}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={p.alt ?? ""} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {activeIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setActiveIdx(null)}
        >
          <button
            type="button"
            onClick={() => setActiveIdx(null)}
            aria-label="close"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 font-mono text-[11px] tracking-[.14em] uppercase text-paper-2 hover:text-paper transition-colors z-10"
          >
            ✕ close · esc
          </button>
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 font-mono text-[11px] tracking-[.14em] uppercase text-paper-2">
            the gallery
          </div>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIdx((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
                }}
                aria-label="previous"
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 font-display text-[40px] text-paper-2 hover:text-paper transition-colors"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIdx((i) => (i === null ? null : (i + 1) % photos.length));
                }}
                aria-label="next"
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 font-display text-[40px] text-paper-2 hover:text-paper transition-colors"
              >
                ›
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[activeIdx].src}
            alt={photos[activeIdx].alt ?? ""}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
