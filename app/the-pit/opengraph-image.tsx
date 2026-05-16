/**
 * OG image for /the-pit — the spacepit world home. Different framing from
 * the root pop-up landing: this is the "fifteen years of records" angle.
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
          THESPACEPIT · BROOKLYN → MEDELLÍN · SINCE 2011
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              fontSize: 168,
              fontWeight: 900,
              lineHeight: 0.88,
              letterSpacing: -6,
              textTransform: "lowercase",
              color: "#F2B705",
            }}
          >
            thespacepit.
          </div>
          <div
            style={{
              fontSize: 34,
              fontStyle: "italic",
              maxWidth: 1000,
              lineHeight: 1.18,
              opacity: 0.85,
            }}
          >
            nick hook · run the jewels co-prod · gold records · the studio · calm + collect · the catalog · the crew · the room.
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
          <span>thespacepit.com</span>
          <span>see u in the pit 🪐</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
