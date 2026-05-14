/**
 * Live React cover for the Old English (DJ Spinn + Nick Hook Remix) release.
 *
 * Visual vocabulary: YSL slime-green ground (Young Thug palette) + blackletter
 * "Old English" wordmark (40oz Old English Malt Liquor / NWA visual reference)
 * + the C+C heptagon in white-fill, prominent. Scales sharp at any size via
 * CSS container queries (1 cqi = 1% of container inline-size).
 *
 * Rendered in the LIVE_COVERS registry on the release page + the upcoming
 * pitch grid. Same swap-in pattern as IntiCover06 for KUSA.
 */

const SLIME = "#7AFB0D";
const SLIME_DEEP = "#5BC908";
const INK = "#0B0B0B";

export function OldEnglishCover({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-square overflow-hidden ${className}`}
      style={{
        containerType: "inline-size",
        background: SLIME,
        fontFamily: "var(--font-blackletter)",
      }}
    >
      {/* Soft radial gloss top-left so the slime has dimension instead of
          reading as a flat green square. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 25% 18%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%)",
        }}
      />

      {/* Top meta strip — mono caps, ink on slime. */}
      <div
        style={{
          position: "absolute",
          top: "2.4cqi",
          left: "2.8cqi",
          right: "2.8cqi",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 5,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "1.2cqi",
            letterSpacing: "0.18em",
            color: INK,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          Calm + Collect
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "1.2cqi",
            letterSpacing: "0.18em",
            color: INK,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          CC · 030 · Remix
        </span>
      </div>

      {/* "OLD ENGLISH" in blackletter — the marquee. Two lines. Centered
          vertically, slammed in ink on slime. */}
      <div
        style={{
          position: "absolute",
          left: "4cqi",
          right: "4cqi",
          top: "50%",
          transform: "translateY(-50%)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-blackletter)",
            fontWeight: 700,
            fontSize: "26cqi",
            lineHeight: 0.86,
            color: INK,
            letterSpacing: "0.005em",
            textShadow: `0.4cqi 0.4cqi 0 rgba(0,0,0,0.18)`,
          }}
        >
          Old
        </div>
        <div
          style={{
            fontFamily: "var(--font-blackletter)",
            fontWeight: 700,
            fontSize: "22cqi",
            lineHeight: 0.9,
            color: INK,
            letterSpacing: "0.005em",
            marginTop: "0.4cqi",
            textShadow: `0.4cqi 0.4cqi 0 rgba(0,0,0,0.18)`,
          }}
        >
          English
        </div>
      </div>

      {/* CC fill-white heptagon — prominent, lower-right corner. */}
      <div
        style={{
          position: "absolute",
          bottom: "4cqi",
          right: "4cqi",
          width: "14cqi",
          height: "14cqi",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/old-english/cc-fill-white.png"
          alt="Calm + Collect"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      </div>

      {/* Bottom credit strip — feature line + remix line stacked, ink on slime. */}
      <div
        style={{
          position: "absolute",
          bottom: "4.5cqi",
          left: "4cqi",
          right: "20cqi",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "1.4cqi",
          letterSpacing: "0.1em",
          color: INK,
          fontWeight: 700,
          lineHeight: 1.45,
        }}
      >
        <div style={{ textTransform: "uppercase" }}>
          Young Thug + Freddie Gibbs + A$AP Ferg
        </div>
        <div style={{ textTransform: "uppercase", marginTop: "0.5cqi", color: SLIME_DEEP }}>
          DJ Spinn + Nick Hook + Scatta Remix
        </div>
      </div>
    </div>
  );
}
