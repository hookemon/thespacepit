/**
 * The BOO VAULT photo wall — every image we have from the Boo + Hook
 * relationship, tiled as a textured background behind the hero (and at
 * lower opacity behind the rest of the page).
 *
 * Renders as an absolute-positioned grid that sits BEHIND the page
 * content. Each tile is one image from /public/boo. The mosaic is
 * deterministic (no random — server-rendered safe) but varies via
 * scale/offset transforms so the wall doesn't read as a 3×N gallery.
 *
 * Treatment:
 *   - Photos render at low opacity with a desaturate/contrast filter so
 *     they read as a TEXTURE, not the foreground
 *   - BOO yellow radial wash on top adds depth without color-clobbering
 *   - Heavy ink fade at the bottom so the next section reads cleanly
 *
 * Use as the FIRST child of a `relative overflow-hidden` parent.
 */

const BOO_YELLOW = "#F2C84B";

// Every photo we have in the vault. Order matters for variety — alternate
// between portrait/landscape so the mosaic doesn't clump.
const IMAGES = [
  "/boo/halloween-flyer.jpg",
  "/boo/peephole-cover.jpg",
  "/boo/facetime-2020-may.png",
  "/boo/halloween-eventbrite.jpg",
  "/boo/friends-approval.jpg",
  "/boo/halloween-hero.jpg",
];

// Generate a deterministic tile layout. ~28 tiles fill 4 cols × 7 rows
// at hero size. Stride must be COPRIME with IMAGES.length so every image
// appears — stride 5 vs length 6 → full rotation cycle. We also XOR with
// a per-tile shift to break up obvious 5-tile-period banding.
const TILE_COUNT = 28;
const TILES = Array.from({ length: TILE_COUNT }, (_, i) => {
  const imgIdx = (i * 5 + Math.floor(i / IMAGES.length)) % IMAGES.length;
  return {
    src: IMAGES[imgIdx],
    // Per-tile micro-variation so the wall reads organic.
    scale: 1.05 + ((i * 11) % 30) / 100, // 1.05 → 1.34
    rotate: ((i * 13) % 7) - 3, // -3deg → +3deg
    // Cycle blend modes so some tiles tint, some stay neutral.
    blend: (i % 3 === 0 ? "overlay" : i % 3 === 1 ? "luminosity" : "screen") as
      | "overlay"
      | "luminosity"
      | "screen",
  };
});

export function BooWall({
  /** "hero" = denser wall, brighter. "page" = quiet under-wash for the
   *  rest of the page so the texture continues without competing. */
  variant = "hero",
}: {
  variant?: "hero" | "page";
}) {
  const opacity = variant === "hero" ? 0.4 : 0.12;
  const overlayInk = variant === "hero" ? "from-ink/55 via-ink/75 to-ink" : "from-ink/85 to-ink";
  const yellowWashOpacity = variant === "hero" ? 0.18 : 0.05;
  return (
    <>
      {/* MOSAIC GRID — fills the parent. Z-stack: -3 to sit underneath
          the ink wash + yellow wash + page content. */}
      <div
        className="absolute inset-0 -z-30 grid gap-0"
        style={{
          gridTemplateColumns: "repeat(4, 1fr)",
          gridAutoRows: "minmax(180px, 1fr)",
          opacity,
        }}
        aria-hidden
      >
        {TILES.map((t, i) => (
          <div
            key={i}
            className="relative overflow-hidden bg-ink-2"
            style={{
              mixBlendMode: t.blend as "overlay" | "luminosity" | "screen",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={t.src}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                transform: `scale(${t.scale}) rotate(${t.rotate}deg)`,
                filter: "grayscale(20%) contrast(1.1) brightness(0.8)",
              }}
            />
          </div>
        ))}
      </div>

      {/* INK GRADIENT WASH — top is lighter (lets the wall peek through
          behind the logo) → bottom is solid ink so the next section starts
          fresh. */}
      <div
        className={`absolute inset-0 -z-20 bg-gradient-to-b ${overlayInk}`}
        aria-hidden
      />

      {/* BOO YELLOW radial — anchors visual interest center-up so the eye
          lands on the logo, not the wall edges. */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${BOO_YELLOW}${Math.round(
            yellowWashOpacity * 255,
          )
            .toString(16)
            .padStart(2, "0")} 0%, transparent 60%)`,
        }}
        aria-hidden
      />
    </>
  );
}
