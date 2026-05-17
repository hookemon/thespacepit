/**
 * Dynamic OG image for the homepage / pop-up landing.
 *
 * Renders a 1200×630 share preview at request time using Next's ImageResponse
 * (Edge-rendered React → PNG). This is what shows up when someone pastes
 * thespacepit.com into iMessage, Discord, IG DMs, Twitter, Slack, LinkedIn —
 * basically any link unfurler.
 *
 * Design: full-bleed lamp-amber background (#F2B705), big black wordmark,
 * pop-up campaign eyebrow + tagline + url. Drama on purpose — the visitor
 * who hasn't clicked yet needs ONE visual to understand what's happening.
 *
 * Why dynamic (not a static .png): when the pop-up date locks, we can swap
 * the eyebrow text from "DATE TBA" to the real date in seconds — no design
 * round-trip, no Figma export, no cache-busting headache.
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F2B705",
          color: "#0B0B0B",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top — eyebrow */}
        <div
          style={{
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#0B0B0B",
            }}
          />
          POP-UP · BROOKLYN · COME THRU
        </div>

        {/* Middle — the wordmark */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 168,
              fontWeight: 900,
              lineHeight: 0.88,
              letterSpacing: -6,
              textTransform: "lowercase",
            }}
          >
            thespacepit.
          </div>
          <div
            style={{
              fontSize: 36,
              fontStyle: "italic",
              maxWidth: 900,
              lineHeight: 1.15,
              color: "#0B0B0B",
              opacity: 0.78,
            }}
          >
            in-person pop-up · the room, the rig, the records. drop your email — date is dropping to the list first.
          </div>
        </div>

        {/* Bottom — url + sign */}
        <div
          style={{
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontWeight: 700,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>thespacepit.com</span>
          <span>see u in the pit 🪐</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
