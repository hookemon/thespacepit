/**
 * Live React port of "Cover 06 — Dark Mixtape Disc" — the team-approved
 * direction for KUSA (CC · 029). Source: design_handoff_inti_kusa/components/Covers.jsx.
 *
 * Reason this is a live component, not a screenshot of the original:
 *   - scales sharp at any size via CSS container queries (cqi units = 1% of
 *     container inline-size, so a 420px hero cover and a 60px nav thumbnail
 *     are pixel-perfect at the same time)
 *   - lets us swap pieces fast — fontwork, color regrade, animated sun pulse,
 *     etc. — without re-rendering a PNG
 *   - keeps the handoff's exact geometry: the photo disc, the matchbox sun motif,
 *     the bottom red bar with KUSA + credits row are all proportional to the
 *     1000px design grid
 *
 * If we ever do need a flat PNG (DSP delivery, social share), screenshot this
 * component at 3000px container width via headless chrome — see scripts/.
 */

const INK = "#0B0B0B";
const PAPER = "#F4EFE6";
const REDLINE = "#E83A1C";
const REDLINE_DEEP = "#B52810";
const MATCHBOX_BLUE = "#143A8C";
const MATCHBOX_YELLOW = "#FFD600";

// ---- inline helpers ----

function GrainOverlay({ opacity = 0.14 }: { opacity?: number }) {
  // SVG fractal noise as a tiled data URL background. Multiply blend gives
  // the print-grain darkening; lower opacity for darker covers so it stays
  // a texture, not a haze.
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.2 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        opacity,
        mixBlendMode: "multiply",
      }}
    />
  );
}

function CCMark({ sizeCqi, dark = false }: { sizeCqi: number; dark?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/kusa/cc-mark.png"
      alt="calm + collect"
      style={{
        width: `${sizeCqi}cqi`,
        height: `${sizeCqi}cqi`,
        display: "block",
        // dark = on a dark background; invert the white-on-transparent mark
        // to read paper-on-dark.
        filter: dark ? "invert(1)" : "none",
      }}
    />
  );
}

/**
 * Matchbox-faithful sun: radiating rays + stepped Inca arch + horizon bars.
 * SVG viewBox-scaled, so width is the only sizing input. Rays are drawn
 * geometrically (not a baked PNG) so they hold up at print res too.
 */
function MatchboxSun({ widthCqi, color }: { widthCqi: number; color: string }) {
  // Hand-tuned: 13 rays fanning ±78° around vertical, alternating long/short.
  const rays = 13;
  const cx = 500;
  const cy = 600;
  const polar = (deg: number, r: number): [number, number] => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + Math.cos(rad) * r, cy + Math.sin(rad) * r];
  };

  const rayShapes: React.ReactNode[] = [];
  for (let i = 0; i < rays; i++) {
    const t = i / (rays - 1);
    const angle = -78 + t * 156;
    const isLong = i % 2 === 0;
    const len = isLong ? 470 : 330;
    const baseR = 200;
    const halfDeg = isLong ? 4.5 : 3.5;
    const tip = polar(angle, len);
    const b1 = polar(angle - halfDeg, baseR);
    const b2 = polar(angle + halfDeg, baseR);
    rayShapes.push(
      <path
        key={i}
        d={`M ${tip[0]} ${tip[1]} L ${b1[0]} ${b1[1]} L ${b2[0]} ${b2[1]} Z`}
        fill={color}
      />,
    );
  }

  return (
    <svg
      viewBox="0 0 1000 680"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: `${widthCqi}cqi`, height: "auto" }}
    >
      <g>{rayShapes}</g>
      {/* stepped arch / Inca pyramid horizon */}
      <path
        d="M 220 600 L 220 540 L 290 540 L 290 480 L 360 480 L 360 420 L 430 420 L 430 360 L 570 360 L 570 420 L 640 420 L 640 480 L 710 480 L 710 540 L 780 540 L 780 600 Z"
        fill={color}
      />
      {/* thick horizon bar */}
      <rect x="80" y="600" width="840" height="10" fill={color} />
      {/* thin secondary horizon */}
      <rect x="80" y="624" width="840" height="4" fill={color} />
    </svg>
  );
}

// ---- the cover ----

export function IntiCover06({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-square overflow-hidden ${className}`}
      style={{
        containerType: "inline-size",
        background: INK,
        fontFamily: "Antonio, sans-serif",
      }}
    >
      {/* top meta bar — CC mark + label name left, catalog # right */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "1cqi" }}>
          <CCMark sizeCqi={3.6} dark />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "1.2cqi",
              letterSpacing: "0.14em",
              color: PAPER,
              fontWeight: 700,
            }}
          >
            CALM + COLLECT
          </span>
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "1.2cqi",
            letterSpacing: "0.14em",
            color: PAPER,
            fontWeight: 700,
          }}
        >
          CC · 029
        </span>
      </div>

      {/* photo disc — Inti in the quinoa field, cut into a circle */}
      <div
        style={{
          position: "absolute",
          top: "10cqi",
          left: "50%",
          transform: "translateX(-50%)",
          width: "66cqi",
          height: "66cqi",
          borderRadius: "50%",
          overflow: "hidden",
          border: `0.4cqi solid ${PAPER}`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/kusa/inti-quinoa-field.jpeg"
          alt="Inti in the quinoa field"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "saturate(1.2) contrast(1.05)",
          }}
        />
      </div>

      {/* matchbox sun motif over the disc, screen-blended red */}
      <div
        style={{
          position: "absolute",
          top: "2cqi",
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0.95,
          mixBlendMode: "screen",
        }}
      >
        <MatchboxSun widthCqi={76} color={REDLINE} />
      </div>

      {/* INTI wordmark in matchbox yellow — slammed across the middle */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "40cqi",
          textAlign: "center",
          fontFamily: "Antonio, sans-serif",
          fontWeight: 700,
          fontSize: "44cqi",
          lineHeight: 0.8,
          letterSpacing: "-0.05em",
          color: "#FFD600",
        }}
      >
        INTI
      </div>

      {/* bottom red bar — KUSA + CC mark on top row, credit strip beneath */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: REDLINE,
          color: PAPER,
        }}
      >
        <div
          style={{
            padding: "2cqi 2.8cqi 0.8cqi",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: "Antonio, sans-serif",
              fontWeight: 700,
              fontSize: "12cqi",
              lineHeight: 0.85,
              letterSpacing: "-0.03em",
            }}
          >
            KUSA
          </div>
          <CCMark sizeCqi={6.4} />
        </div>
        <div
          style={{
            padding: "0 2.8cqi 1.6cqi",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "1.2cqi",
            letterSpacing: "0.1em",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>NICK HOOK + PAWKARMAYTA + MIKONGO FT. INTI</span>
          <span>CALM + COLLECT</span>
        </div>
      </div>

      <GrainOverlay opacity={0.14} />
    </div>
  );
}

// ---- KUSA Banner — wide horizontal hero ----

/**
 * 1920×600 banner (3.2:1) reusing Cover 06's visual elements stretched
 * horizontal. Built for the Gumroad product-page hero strip where a square
 * cover reads as a small floating thumbnail. The photo runs full-bleed; INTI
 * + KUSA + the sun motif are laid out across the width.
 *
 * Rendered via /cover-export/kusa-banner — pass the export script
 * `--window-size=1920,600` (not 3000-square).
 */
export function IntiKusaBanner({ className = "" }: { className?: string }) {
  // 1 cqi = 1% of container WIDTH. With width=1920px, 1cqi = 19.2px.
  // Tuned so the banner reads bold even when downscaled to gumroad's hero.
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: "100%",
        aspectRatio: "1920 / 600",
        containerType: "inline-size",
        background: INK,
        fontFamily: "Antonio, sans-serif",
      }}
    >
      {/* Full-bleed photo, slightly darkened so type pops on top. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/kusa/inti-quinoa-field.jpeg"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 60%",
          filter: "saturate(1.1) brightness(0.78)",
        }}
      />
      {/* Subtle dark scrim bottom-up so credits stay readable. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(11,11,11,0.45) 0%, rgba(11,11,11,0.12) 40%, rgba(11,11,11,0.55) 100%)",
        }}
      />

      {/* Top meta strip — CC mark left, CC · 029 right */}
      <div
        style={{
          position: "absolute",
          top: "1.6cqi",
          left: "1.6cqi",
          right: "1.6cqi",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.8cqi" }}>
          <CCMark sizeCqi={2.2} dark />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.8cqi",
              letterSpacing: "0.16em",
              color: PAPER,
              fontWeight: 700,
            }}
          >
            CALM + COLLECT
          </span>
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.8cqi",
            letterSpacing: "0.16em",
            color: PAPER,
            fontWeight: 700,
          }}
        >
          CC · 029 · KUSA
        </span>
      </div>

      {/* Sun motif — centered, screen-blended red over the photo */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "-4cqi",
          transform: "translateX(-50%)",
          opacity: 0.85,
          mixBlendMode: "screen",
        }}
      >
        <MatchboxSun widthCqi={32} color={REDLINE} />
      </div>

      {/* Big INTI — left of center, slammed in yellow */}
      <div
        style={{
          position: "absolute",
          left: "4cqi",
          top: "50%",
          transform: "translateY(-50%)",
          fontFamily: "Antonio, sans-serif",
          fontWeight: 700,
          fontSize: "20cqi",
          lineHeight: 0.78,
          letterSpacing: "-0.05em",
          color: "#FFD600",
          textShadow: `0.5cqi 0.5cqi 0 ${REDLINE}`,
        }}
      >
        INTI
      </div>

      {/* KUSA — right side, rotated red banner, vertically mirrored with INTI */}
      <div
        style={{
          position: "absolute",
          right: "4cqi",
          top: "50%",
          transform: "translateY(-50%) rotate(-2deg)",
          background: REDLINE,
          color: PAPER,
          padding: "1.2cqi 2.4cqi",
          fontFamily: "Antonio, sans-serif",
          fontWeight: 700,
          fontSize: "14cqi",
          lineHeight: 0.85,
          letterSpacing: "-0.03em",
          boxShadow: "0.4cqi 0.4cqi 0 rgba(0,0,0,0.45)",
        }}
      >
        KUSA
      </div>

      {/* Bottom credit strip */}
      <div
        style={{
          position: "absolute",
          left: "1.6cqi",
          right: "1.6cqi",
          bottom: "1.6cqi",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.8cqi",
          letterSpacing: "0.12em",
          color: PAPER,
          fontWeight: 700,
        }}
      >
        <span>NICK HOOK + PAWKARMAYTA + MIKONGO</span>
        <span>CUSCO · 2026</span>
      </div>

      <GrainOverlay opacity={0.18} />
    </div>
  );
}

// ---- Cover 06 / Sample Pack variant ----

/**
 * Same Cover 06 composition (matches the release artwork), with a
 * "SAMPLE PACK" wax-stamp overlay top-right. Use this for the Gumroad
 * sample pack product cover so the pack reads as a clear kin of the
 * release — same world, different deliverable. Rendered via
 * /cover-export/kusa-sample-pack at 3000×3000 for upload.
 */
export function IntiCover06SamplePack({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative ${className}`}
      style={{ aspectRatio: "1 / 1", containerType: "inline-size" }}
    >
      <IntiCover06 />
      <div
        style={{
          position: "absolute",
          top: "4cqi",
          right: "4cqi",
          transform: "rotate(-8deg)",
          zIndex: 30,
          background: "#F4EFE6",
          border: "0.3cqi solid #0B0B0B",
          padding: "1.6cqi 2.4cqi",
          boxShadow: "0.6cqi 0.6cqi 0 #F2B705",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "Antonio, sans-serif",
            fontWeight: 700,
            fontSize: "5cqi",
            lineHeight: 0.9,
            letterSpacing: "-0.02em",
            color: "#0B0B0B",
            textTransform: "uppercase",
          }}
        >
          Sample Pack
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "1.5cqi",
            letterSpacing: "0.18em",
            color: "#3A362E",
            marginTop: "0.5cqi",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          12 loops · 1 one-shot
        </div>
      </div>
    </div>
  );
}

// ---- Cover 06b — psicodelia sutil ----

/**
 * 5-petal flower glyph used as ornament on Cover 06b. Sized in cqi to scale
 * with the cover. Position is relative to the cover's 1000-unit grid; the
 * caller passes cx/cy as cqi values (where 100cqi = full container width).
 */
function Flower({ sizeCqi, color, cxCqi, cyCqi, rot = 0 }: { sizeCqi: number; color: string; cxCqi: number; cyCqi: number; rot?: number }) {
  return (
    <svg
      viewBox="-12 -12 24 24"
      style={{
        position: "absolute",
        left: `${cxCqi}cqi`,
        top: `${cyCqi}cqi`,
        width: `${sizeCqi}cqi`,
        height: `${sizeCqi}cqi`,
        transform: `rotate(${rot}deg)`,
        overflow: "visible",
      }}
    >
      {[0, 72, 144, 216, 288].map((a, i) => (
        <ellipse key={i} cx="0" cy="-6" rx="3.2" ry="5.2" fill={color} transform={`rotate(${a})`} />
      ))}
      <circle r="2.2" fill="#FFD600" />
    </svg>
  );
}

export function IntiCover06b({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-square overflow-hidden ${className}`}
      style={{
        containerType: "inline-size",
        background: INK,
        fontFamily: "Antonio, sans-serif",
      }}
    >
      {/* SVG defs: gradient sun + duotone grade for the photo */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="psych-ray" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#E83A1C" />
            <stop offset="55%" stopColor="#FF7A2E" />
            <stop offset="100%" stopColor="#FFC845" />
          </linearGradient>
          <filter id="psych-grade" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="
              1.18 0.05 0.02 0 0
              0.04 1.20 0.04 0 0
              0.02 0.06 1.10 0 0
              0    0    0    1 0" />
            <feComponentTransfer>
              <feFuncR type="gamma" amplitude="1" exponent="0.92" offset="0" />
              <feFuncG type="gamma" amplitude="1" exponent="0.95" offset="0" />
              <feFuncB type="gamma" amplitude="1" exponent="1.02" offset="0" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {/* top meta bar */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "1cqi" }}>
          <CCMark sizeCqi={3.6} dark />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.2cqi", letterSpacing: "0.14em", color: PAPER, fontWeight: 700 }}>
            CALM + COLLECT
          </span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.2cqi", letterSpacing: "0.14em", color: PAPER, fontWeight: 700 }}>
          CC · 029 · PSICODELIA SUTIL
        </span>
      </div>

      {/* photo disc — base grade + magenta + cyan chromatic ghosts + vignette */}
      <div
        style={{
          position: "absolute",
          top: "10cqi",
          left: "50%",
          transform: "translateX(-50%)",
          width: "66cqi",
          height: "66cqi",
          borderRadius: "50%",
          overflow: "hidden",
          border: `0.4cqi solid ${PAPER}`,
        }}
      >
        {/* base graded photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/kusa/inti-quinoa-field.jpeg"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "url(#psych-grade)" }}
        />
        {/* magenta ghost */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/kusa/inti-quinoa-field.jpeg"
          alt=""
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "translate(4px, 0)", mixBlendMode: "screen", opacity: 0.18, filter: "saturate(0) brightness(1.1) sepia(1) hue-rotate(280deg) saturate(6)" }}
        />
        {/* cyan ghost */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/kusa/inti-quinoa-field.jpeg"
          alt=""
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "translate(-4px, 0)", mixBlendMode: "screen", opacity: 0.14, filter: "saturate(0) brightness(1.1) sepia(1) hue-rotate(140deg) saturate(5)" }}
        />
        {/* vignette to ground the disc edges */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 55%, transparent 55%, rgba(0,0,0,0.35) 100%)" }} />
      </div>

      {/* sun motif over the disc — gradient fill (not flat red) */}
      <div
        style={{
          position: "absolute",
          top: "2cqi",
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0.92,
          mixBlendMode: "screen",
        }}
      >
        <MatchboxSun widthCqi={76} color="url(#psych-ray)" />
      </div>

      {/* floral glyphs scattered around the disc — bright punctuation */}
      <Flower sizeCqi={2.8} color="#FF3D8B" cxCqi={14}   cyCqi={21}   rot={-12} />
      <Flower sizeCqi={2.2} color="#33D9C5" cxCqi={83}   cyCqi={17}   rot={20} />
      <Flower sizeCqi={2.0} color="#FFC845" cxCqi={9}    cyCqi={52}   rot={45} />
      <Flower sizeCqi={1.8} color="#7BD389" cxCqi={87}   cyCqi={56}   rot={-30} />
      <Flower sizeCqi={2.4} color="#FF3D8B" cxCqi={78}   cyCqi={72}   rot={10} />
      <Flower sizeCqi={1.8} color="#33D9C5" cxCqi={17}   cyCqi={73}   rot={-50} />

      {/* INTI with chromatic aberration — magenta + cyan ghosts under yellow */}
      <div style={{ position: "absolute", left: 0, right: 0, top: "40cqi", textAlign: "center", pointerEvents: "none" }}>
        <div style={{ position: "relative", display: "inline-block", fontFamily: "Antonio, sans-serif", fontWeight: 700, fontSize: "44cqi", lineHeight: 0.8, letterSpacing: "-0.05em" }}>
          <span aria-hidden="true" style={{ position: "absolute", inset: 0, color: "#FF3D8B", transform: "translate(-3px, 0)", mixBlendMode: "screen", opacity: 0.85 }}>INTI</span>
          <span aria-hidden="true" style={{ position: "absolute", inset: 0, color: "#33D9C5", transform: "translate(3px, 0)", mixBlendMode: "screen", opacity: 0.7 }}>INTI</span>
          <span style={{ position: "relative", color: MATCHBOX_YELLOW }}>INTI</span>
        </div>
      </div>

      {/* bottom red bar — KUSA + CC mark + credits (same as 06) */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: REDLINE, color: PAPER }}>
        <div style={{ padding: "2cqi 2.8cqi 0.8cqi", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "Antonio, sans-serif", fontWeight: 700, fontSize: "12cqi", lineHeight: 0.85, letterSpacing: "-0.03em" }}>KUSA</div>
          <CCMark sizeCqi={6.4} />
        </div>
        <div style={{ padding: "0 2.8cqi 1.6cqi", fontFamily: "'JetBrains Mono', monospace", fontSize: "1.2cqi", letterSpacing: "0.1em", display: "flex", justifyContent: "space-between" }}>
          <span>NICK HOOK + PAWKARMAYTA + MIKONGO FT. INTI</span>
          <span>CALM + COLLECT</span>
        </div>
      </div>

      <GrainOverlay opacity={0.14} />
    </div>
  );
}

// ---- Cover 07 — vertical INTI sidebar ----

export function IntiCover07({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-square overflow-hidden ${className}`}
      style={{
        containerType: "inline-size",
        background: MATCHBOX_YELLOW,
        fontFamily: "Antonio, sans-serif",
      }}
    >
      {/* Left sidebar — yellow ground, red right-border, vertical INTI in the middle */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "22cqi",
          background: MATCHBOX_YELLOW,
          borderRight: `0.4cqi solid ${REDLINE_DEEP}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "2.8cqi 0",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1cqi" }}>
          <CCMark sizeCqi={4.8} />
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "1.1cqi",
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: REDLINE_DEEP,
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              marginTop: "0.4cqi",
            }}
          >
            CALM + COLLECT · 029
          </div>
        </div>

        <div
          style={{
            fontFamily: "Antonio, sans-serif",
            fontWeight: 700,
            fontSize: "22cqi",
            lineHeight: 0.8,
            letterSpacing: "-0.05em",
            color: MATCHBOX_BLUE,
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            WebkitTextStroke: `0.2cqi ${REDLINE_DEEP}`,
          }}
        >
          INTI
        </div>

        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "1.1cqi",
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: REDLINE_DEEP,
            writingMode: "vertical-rl",
            textOrientation: "mixed",
          }}
        >
          KUSA · LÍDER EN CALIDAD
        </div>
      </div>

      {/* Right photo panel — full-bleed quinoa field */}
      <div style={{ position: "absolute", left: "22cqi", top: 0, right: 0, bottom: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/kusa/inti-quinoa-field.jpeg"
          alt="Inti in the quinoa field"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* small sun motif top-right */}
        <div style={{ position: "absolute", top: "3.2cqi", right: "3.2cqi", opacity: 0.95 }}>
          <MatchboxSun widthCqi={22} color={REDLINE_DEEP} />
        </div>
        {/* credit row at bottom of photo, paper text with shadow */}
        <div
          style={{
            position: "absolute",
            bottom: "2.4cqi",
            left: "2.4cqi",
            right: "2.4cqi",
            color: PAPER,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "1.2cqi",
            letterSpacing: "0.12em",
            textShadow: "0 1px 4px rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 700,
          }}
        >
          <span>NICK HOOK + PAWKARMAYTA + MIKONGO</span>
          <span>FT. INTI</span>
        </div>
      </div>

      <GrainOverlay opacity={0.1} />
    </div>
  );
}
