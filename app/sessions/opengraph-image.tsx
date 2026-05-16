/**
 * OG image for /sessions — the $60/hr creative sessions offer. The whole
 * point of this preview is the PRICE + the URGENCY (thru June 1).
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
            color: "#F2B705",
          }}
        >
          CREATIVE SESSIONS · NICK HOOK · THESPACEPIT
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 240,
              fontWeight: 900,
              lineHeight: 0.88,
              letterSpacing: -10,
              color: "#F2B705",
            }}
          >
            $60/hr
          </div>
          <div
            style={{
              fontSize: 38,
              fontStyle: "italic",
              maxWidth: 1000,
              lineHeight: 1.18,
            }}
          >
            production · mixing · feedback · workflow · mentorship. remote, in-pit (brooklyn), or async. thru june 1.
          </div>
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
          <span>thespacepit.com/sessions</span>
          <span>pull up 🪐</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
