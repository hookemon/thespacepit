/**
 * OG image for /calm-collect — the label world. Collect-green ground
 * (the brand color of C+C), serif tagline that matches the page's hero
 * voice. "calm + collect. making records since 2013."
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
          background: "#0E4B3A",
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
          }}
        >
          CALM + COLLECT · A RECORD LABEL · SINCE 2013
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 176,
              fontWeight: 900,
              lineHeight: 0.86,
              letterSpacing: -6,
              textTransform: "lowercase",
            }}
          >
            calm
          </div>
          <div
            style={{
              fontSize: 176,
              fontWeight: 900,
              lineHeight: 0.86,
              letterSpacing: -6,
              textTransform: "lowercase",
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <span style={{ fontWeight: 300, opacity: 0.85 }}>+</span>
            collect
          </div>
          <div
            style={{
              fontSize: 30,
              fontStyle: "italic",
              maxWidth: 1000,
              lineHeight: 1.2,
              opacity: 0.85,
              marginTop: 14,
            }}
          >
            making records since 2013. brooklyn → medellín.
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
          <span>thespacepit.com/calm-collect</span>
          <span>stay high 💚</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
