/* eslint-disable no-console */
/**
 * Old English (DJ Spinn + Nick Hook + Scatta VIP) — cover recolor.
 *
 * Source: the 2014 Mass Appeal yellow-bottle artwork.
 * Output: same composition recolored YSL slime-green, with:
 *   - bottom-right Mass Appeal logo blacked out and replaced with the
 *     canonical C+C white-fill heptagon mark
 *   - "Dj Spinn + Nick Hook + Scatta VIP" rotated -90° on the left side
 *     in blackletter, slime-green on black background
 *   - bottle yellow → slime green via pixel walk
 */
import sharp from "sharp";
import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
// opentype.js parses the TTF and converts text → SVG path data so we get
// the actual blackletter glyphs regardless of which fonts are installed
// on the host machine where the SVG is rendered.
import opentype from "opentype.js";

const SRC =
  "/Users/nickhook/Library/CloudStorage/Dropbox/Jakub/Calm + Collect Remix Compilation/MUSIC/OLD ENGLISH/OLD ENGLISH COVER.jpg";

// Blackletter TTF for the rotated left-side credit. macOS doesn't ship a
// fraktur face, so we bundle UnifrakturMaguntia-Book (SIL OFL) and embed
// it as a base64 data URL inside the SVG so sharp's text renderer picks
// it up regardless of what's installed system-wide.
const FONT_TTF = path.join(
  __dirname,
  "_assets",
  "UnifrakturMaguntia-Book.ttf",
);
const OUT =
  "/Users/nickhook/Library/CloudStorage/Dropbox/Jakub/Nick Hook Ft. Inti, Pawkarmayta, Mikongo-Kusa/old-english-cover-slime-vip-3000.jpg";
const CC_WHITE =
  "/Users/nickhook/Library/CloudStorage/Dropbox/C + C/untitled folder/CC QUICK ACCESS/CC FILL WHITE.png";

const SIZE = 3000;
// YSL slime-green palette used across the C+C "Old English" rollout.
const SLIME = { r: 122, g: 251, b: 13 };

// CC FILL WHITE.png is the canonical C+C brand mark (heptagon with inscribed
// rotated quadrilateral). We recolor the white pixels to slime green so the
// mark sits inside the bottle's color story instead of fighting it.
async function buildSlimeCcMark(sourcePath: string, sizePx: number): Promise<Buffer> {
  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    if (data[i + 3] > 20) {
      data[i] = SLIME.r;
      data[i + 1] = SLIME.g;
      data[i + 2] = SLIME.b;
    }
  }
  return await sharp(data, { raw: { width, height, channels: 4 } })
    .resize(sizePx, sizePx, { fit: "contain" })
    .png()
    .toBuffer();
}

// ── 2. left-side rotated credit ────────────────────────────────────────────
//
// The credit text wants to FEEL like the bottle's hand-painted blackletter
// ("Young Thug", "Old English"), not a generic monospace gothic. We parse
// UnifrakturMaguntia-Book.ttf with opentype.js and convert the text into
// an SVG <path>, which renders independent of which fonts sharp/librsvg
// can resolve at runtime.
//
// Mixed-case ("Dj Spinn + Nick Hook Remix") reads more like the bottle's
// "Old English" wordmark than ALLCAPS, which fights blackletter shapes.
function buildLeftCreditSvg(coverPx: number): Buffer {
  const stripW = Math.round(coverPx * 0.07);
  const stripH = coverPx;
  const fontSize = Math.round(coverPx * 0.05);

  // opentype.loadSync is deprecated; new API expects a parsed buffer.
  const font = opentype.parse(readFileSync(FONT_TTF).buffer);
  const credit = "Dj Spinn + Nick Hook + Scatta VIP";
  // Generate path at origin, centered later via transform.
  const textPath = font.getPath(credit, 0, 0, fontSize);
  const pathData = textPath.toPathData(2);
  // Get the path's bounding box so we can center it on the rotation pivot.
  const bbox = textPath.getBoundingBox();
  const textW = bbox.x2 - bbox.x1;
  const textH = bbox.y2 - bbox.y1;
  const offsetX = -bbox.x1 - textW / 2;
  const offsetY = -bbox.y1 - textH / 2;

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${stripW}" height="${stripH}">
      <g transform="translate(${stripW * 0.6}, ${stripH * 0.5}) rotate(-90)">
        <g transform="translate(${offsetX}, ${offsetY})">
          <path d="${pathData}" fill="#7afb0d" />
        </g>
      </g>
    </svg>
  `);
}

async function main() {
  console.log("→ loading source", path.basename(SRC));
  // Upscale 600 → 3000 with a sharpening lanczos kernel; bottle linework
  // survives this fine because it's mostly solid color blocks.
  let base = sharp(SRC).resize(SIZE, SIZE, { kernel: "lanczos3" });

  // ── pixel walk: yellow → slime ───────────────────────────────────────────
  const { data, info } = await base
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let swapped = 0;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    // Yellow band: red high, green high, blue low, and red > blue by a wide
    // margin (so cream/gray pixels don't trip the filter).
    if (r > 200 && g > 170 && b < 90 && r > b + 100) {
      data[i] = SLIME.r;
      data[i + 1] = SLIME.g;
      data[i + 2] = SLIME.b;
      swapped++;
    }
  }
  console.log(`→ swapped ${swapped.toLocaleString()} yellow pixels to slime`);

  // ── black out the original Mass Appeal wordmark only ────────────────────
  // Precise bbox from the inspect script: x 0.847-0.957, y 0.945-0.975 in
  // the source. We pad ~1% on every side so we erase the wordmark plus
  // its tight margin, but nothing else.
  const blackoutX = Math.round(SIZE * 0.835);
  const blackoutY = Math.round(SIZE * 0.935);
  const blackoutW = Math.round(SIZE * 0.135);
  const blackoutH = Math.round(SIZE * 0.05);

  // ── slime-green C+C mark in the corner ───────────────────────────────────
  // ~11% of cover edge, anchored bottom-right with a ~3% margin. Recolored
  // to slime green so the mark lives inside the bottle's color story.
  // Standard C+C heptagon spec across the catalog: 7% size, 4% margin
  // from the bottom + right edges. Matches Just Nico / Glove / Comp /
  // Remix Comp covers.
  const markSize = Math.round(SIZE * 0.07);
  const markX = SIZE - markSize - Math.round(SIZE * 0.04);
  const markY = SIZE - markSize - Math.round(SIZE * 0.04);

  // Compose all layers ──────────────────────────────────────────────────────
  const creditSvg = buildLeftCreditSvg(SIZE);
  const ccMark = await buildSlimeCcMark(CC_WHITE, markSize);

  const composited = await sharp(data, { raw: { width, height, channels } })
    .composite([
      // 1. paint a thin wide black bar over the Mass Appeal wordmark zone
      //    so the slime-green-recolored letters don't peek through
      {
        input: {
          create: {
            width: blackoutW,
            height: blackoutH,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 1 },
          },
        },
        left: blackoutX,
        top: blackoutY,
      },
      // 2. slime-green C+C mark, anchored to the corner
      {
        input: ccMark,
        left: markX,
        top: markY,
      },
      // 3. rotated "Dj Spinn + Nick Hook + Scatta VIP" credit on the left
      //    edge, blackletter font, slime green
      {
        input: creditSvg,
        left: 0,
        top: 0,
      },
    ])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  await fs.writeFile(OUT, composited);
  console.log("→ wrote", OUT, `(${(composited.length / 1024).toFixed(0)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
