/**
 * Dynamic OG image per partner / brand. Same edge-fetch pattern as the era
 * OG — pulls the brand's name, tagline, relationship, and accent color
 * from Sanity over plain fetch (no SDK, edge-safe).
 *
 * URL: thespacepit.com/partners/<slug>/opengraph-image
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const API_VERSION = "2025-01-01";

interface BrandOg {
  name?: string;
  tagline?: string;
  relationship?: string;
  logoColor?: string;
}

async function fetchBrand(slug: string): Promise<BrandOg | null> {
  if (!PROJECT_ID) return null;
  const query = `*[_type == "brand" && slug.current == "${slug.replace(/"/g, "")}"][0]{ name, tagline, relationship, logoColor }`;
  const url = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: BrandOg };
    return json.result ?? null;
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await fetchBrand(slug);
  const accent = brand?.logoColor ?? "#F2B705";
  const name = brand?.name ?? slug.replace(/-/g, " ");
  const relationship = brand?.relationship ?? "partner";
  const tagline = brand?.tagline ?? "";

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
        <div
          style={{
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontWeight: 700,
            color: accent,
          }}
        >
          PARTNER · {relationship.toUpperCase()} · THESPACEPIT
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              fontSize: name.length > 14 ? 140 : 200,
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: -6,
              textTransform: "uppercase",
              color: accent,
              maxWidth: 1050,
            }}
          >
            {name}
          </div>
          {tagline && (
            <div
              style={{
                fontSize: 30,
                fontStyle: "italic",
                maxWidth: 1000,
                lineHeight: 1.2,
                opacity: 0.85,
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
          <span>thespacepit.com/partners/{slug}</span>
          <span>since the room 🪐</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
