/**
 * Dynamic OG image per era. Hits Sanity via fetch (no SDK — edge-runtime
 * safe) to grab the era's name, tagline, year range, and accent color.
 * Each era shares with its own brand color in a 1200×630 PNG.
 *
 * URL: thespacepit.com/eras/<slug>/opengraph-image
 *
 * Falls back to a generic ink-and-amber render if the Sanity fetch fails
 * (slug typo, doc deleted, etc) — never returns a 500 for a share crawler.
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const API_VERSION = "2025-01-01";

interface EraOg {
  name?: string;
  tagline?: string;
  yearStart?: number;
  yearEnd?: number;
  color?: string;
}

async function fetchEra(slug: string): Promise<EraOg | null> {
  if (!PROJECT_ID) return null;
  // GROQ query — only the fields the OG needs. URL-encoded for fetch.
  const query = `*[_type == "project" && slug.current == "${slug.replace(/"/g, "")}"][0]{ name, tagline, yearStart, yearEnd, color }`;
  const url = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: EraOg };
    return json.result ?? null;
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const era = await fetchEra(slug);
  // Sensible fallbacks — never crash the share preview
  const accent = era?.color ?? "#F2B705";
  const name = era?.name ?? slug.replace(/-/g, " ");
  const tagline = era?.tagline ?? "an era on thespacepit.";
  const years =
    era?.yearStart && era.yearEnd
      ? `${era.yearStart}–${era.yearEnd}`
      : era?.yearStart
        ? `${era.yearStart}–`
        : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0B0B0B",
          color: "#F4EFE6",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top eyebrow — era marker */}
        <div
          style={{
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontWeight: 700,
            color: accent,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: 999, background: accent }} />
          ERA · {years || "THESPACEPIT"}
        </div>

        {/* Era name — bigger if shorter */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              fontSize: name.length > 18 ? 120 : 168,
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: -5,
              textTransform: "lowercase",
              color: accent,
              maxWidth: 1050,
            }}
          >
            {name}.
          </div>
          {tagline && (
            <div
              style={{
                fontSize: 30,
                fontStyle: "italic",
                maxWidth: 1000,
                lineHeight: 1.2,
                opacity: 0.88,
              }}
            >
              {tagline}
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontWeight: 700,
            display: "flex",
            justifyContent: "space-between",
            opacity: 0.7,
          }}
        >
          <span>thespacepit.com/eras/{slug}</span>
          <span>see u in the pit 🪐</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
