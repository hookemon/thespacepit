/**
 * Twitter share image — same renderer as opengraph-image.tsx but inlined
 * here because Next 16 requires the `runtime`/`size`/`contentType` exports
 * to be statically declared in this file (re-export from a sibling doesn't
 * survive Turbopack's build-time metadata extraction).
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
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
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#0B0B0B" }} />
          POP-UP · BROOKLYN · COME THRU
        </div>
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
              opacity: 0.78,
            }}
          >
            in-person pop-up · the room, the rig, the records. drop your email — date is dropping to the list first.
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
