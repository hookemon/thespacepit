/**
 * OG image for /nick-hook — the artist world. Redline accent (Nick Hook's
 * brand color), ink black ground, big NICK HOOK wordmark + the credits
 * line that travels (RTJ co-prod, gold, etc.).
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
            color: "#E83A1C",
          }}
        >
          NICK HOOK · ARTIST · PRODUCER · CO-CONSPIRATOR
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 200,
              fontWeight: 900,
              lineHeight: 0.88,
              letterSpacing: -8,
              textTransform: "uppercase",
              color: "#E83A1C",
            }}
          >
            NICK HOOK
          </div>
          <div
            style={{
              fontSize: 32,
              fontStyle: "italic",
              maxWidth: 1000,
              lineHeight: 1.18,
              opacity: 0.88,
            }}
          >
            run the jewels co-prod (cu4tro) · gold records with bronson, gangsta boo, flatbush zombies, rtj, gta · own band MWC · own label calm + collect since 2013.
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
          <span>thespacepit.com/nick-hook</span>
          <span>brooklyn → medellín</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
