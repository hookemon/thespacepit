"use client";

import type { PressQuoteItem } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";

/**
 * Shared press section used by /collabs/* world pages and any other page
 * that wants to surface a row of press quotes for an era/release/artist.
 *
 *   <PressGrid
 *     items={press}
 *     accent="#E83A1C"
 *     eyebrow="PRESS · WHAT THEY SAID"
 *     heading="press"
 *   />
 *
 * Each quote becomes a clickable card → links to the source article in a
 * new tab when q.url is set. When the headline + outlet are populated we
 * show those above the quote so the source reads at a glance.
 */
export function PressGrid({
  items,
  accent = "#E83A1C",
  eyebrow = "PRESS",
  heading = "press",
  subhead,
  variant = "dark",
}: {
  items: PressQuoteItem[];
  accent?: string;
  eyebrow?: string;
  heading?: string;
  subhead?: string;
  /** "dark" = white text on ink. "light" = ink text on paper. */
  variant?: "dark" | "light";
}) {
  if (items.length === 0) return null;
  const isDark = variant === "dark";
  const borderClass = isDark ? "border-paper" : "border-ink";
  const textClass = isDark ? "text-paper" : "text-ink";
  const mutedClass = isDark ? "text-paper-2" : "text-ink-3";

  return (
    <section className="px-5 sm:px-8 py-12 max-w-[1180px] mx-auto">
      <div
        className="font-mono text-[11px] tracking-[.18em] uppercase mb-2"
        style={{ color: accent }}
      >
        {eyebrow} · {items.length} {items.length === 1 ? "PIECE" : "PIECES"}
      </div>
      <h2
        className={`font-display font-bold uppercase m-0 mb-2 ${textClass}`}
        style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
      >
        {heading}
      </h2>
      {subhead && (
        <p className={`font-serif italic text-[16px] ${mutedClass} mb-6 max-w-[680px]`}>
          {subhead}
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-2 mt-6">
        {items.map((q) => {
          const headline = q.headline ?? "";
          const outletLine = [q.outlet ?? q.source, q.author && `· ${q.author}`, q.date ? `· ${q.date.slice(0, 4)}` : q.year ? `· ${q.year}` : ""]
            .filter(Boolean)
            .join(" ");
          const body = q.excerpt ?? q.quote;
          // Image precedence:
          //   1. Manual Sanity upload (q.image) — curated wins
          //   2. OG-scraped URL (q.imageUrl) — hotlinked from the article
          //   3. Linked release cover — fallback when neither exists
          //   none → text-only card
          const heroImg = q.image
            ? urlFor(q.image).width(800).height(450).fit("crop").url()
            : q.imageUrl
              ? q.imageUrl
              : q.release?.cover
                ? urlFor(q.release.cover).width(800).height(800).fit("crop").url()
                : null;
          const heroFromRelease = !q.image && !q.imageUrl && !!q.release?.cover;
          const inner = (
            <>
              {heroImg && (
                <div
                  className={`relative overflow-hidden border ${borderClass}`}
                  style={{ aspectRatio: heroFromRelease ? "1 / 1" : "16 / 9", marginBottom: "1rem" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroImg}
                    alt={headline || q.source}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    // referrerPolicy is critical for hotlinks — some publishers
                    // block requests with the wrong Referer header (the source
                    // article's domain expects its OWN domain, not ours).
                    referrerPolicy="no-referrer"
                  />
                  {heroFromRelease && (
                    <div
                      className="absolute top-2 left-2 font-mono text-[8px] tracking-[.18em] uppercase px-1.5 py-0.5 rounded-full"
                      style={{ background: accent, color: "#0B0B0B" }}
                    >
                      ↪ release art
                    </div>
                  )}
                </div>
              )}
              {headline && (
                <div
                  className={`font-display font-semibold uppercase leading-tight mb-2 ${textClass}`}
                  style={{ fontSize: "clamp(18px, 2vw, 22px)", letterSpacing: "-0.005em" }}
                >
                  {headline}
                </div>
              )}
              <div
                className={`font-serif italic leading-snug ${isDark ? "text-paper" : "text-ink"}`}
                style={{ fontSize: "clamp(16px, 1.8vw, 19px)", letterSpacing: "-0.003em" }}
              >
                &ldquo;{body}&rdquo;
              </div>
              <div className={`font-mono text-[10px] tracking-[.14em] uppercase mt-3 ${mutedClass}`}>
                — {outletLine || q.source}
                {q.url && <span className="ml-2" style={{ color: accent }}>· read →</span>}
              </div>
            </>
          );

          // External article = anchor with hover lift. No URL = static card.
          return q.url ? (
            <a
              key={q._id}
              href={q.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block border ${borderClass} p-5 sm:p-6 transition-all duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] no-underline`}
              style={{ boxShadow: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `4px 4px 0 ${accent}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
            >
              {inner}
            </a>
          ) : (
            <div key={q._id} className={`block border ${borderClass} p-5 sm:p-6 opacity-90`}>
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
