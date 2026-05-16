/* eslint-disable no-console */
/**
 * Cover for "If The Glove Don't Fit"
 *   — Nick Hook Ft. Gangsta Boo + Pawmps —
 *
 * Composition:
 *   - Ink-black ground
 *   - Center: the OJ courtroom photo (Cochran holding up the bloody glove),
 *     upscaled, with a heavy BOO-purple duotone wash so it reads as a
 *     stylized still, not a documentary screenshot
 *   - Top: NICK HOOK wordmark (cream)
 *   - Below the photo: "If The Glove Don't Fit" in UnifrakturMaguntia
 *     blackletter, BOO purple — rhymes with the YOUNG THUG "Old English"
 *     wordmark from the parent compilation
 *   - Bottom: "Ft. Gangsta Boo + Pawmps" credit line in smaller cream/mono
 *   - Bottom-right: GB script logo (BOO yellow on purple)
 *
 * Run: npx tsx scripts/build-glove-cover.ts
 */
import sharp from "sharp";
import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const SIZE = 3000;
const OUT =
  "/Users/nickhook/Library/CloudStorage/Dropbox/BOO VAULT/glove-cover-3000.jpg";
const OJ_PHOTO = "/tmp/oj-glove.png";

// Bundled assets
const FONT_TTF = path.join(__dirname, "_assets", "UnifrakturMaguntia-Book.ttf");
const GB_LOGO =
  "/Users/nickhook/projects/spacepit-web/public/boo/boo-logo-purple.png";
const NH_WORDMARK_INK =
  "/Users/nickhook/projects/spacepit-web/public/nick-hook-logo-paper.png";

// Color palette — BOO purple-on-ink, cream for clean readability.
const INK = { r: 11, g: 11, b: 11 };
const BOO_PURPLE = { r: 110, g: 47, b: 156 }; // #6E2F9C — deep Boo purple
const PAPER = { r: 244, g: 239, b: 230 }; // #F4EFE6

// ── 1. duotone the OJ photo ────────────────────────────────────────────────
//
// Map grayscale luminance → gradient from BOO_PURPLE (shadows) to PAPER
// (highlights), giving a stylized 2-tone treatment that matches the
// Old English bottle's flat-graphic energy.
async function duotonePhoto(srcPath: string, edgePx: number): Promise<Buffer> {
  const { data, info } = await sharp(srcPath)
    .resize(edgePx, edgePx, { fit: "cover", position: "centre", kernel: "lanczos3" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  // Single pass: luminance → blend purple↔paper.
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    // Rec.709 luminance.
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const t = y / 255; // 0 → 1
    data[i] = Math.round(BOO_PURPLE.r + (PAPER.r - BOO_PURPLE.r) * t);
    data[i + 1] = Math.round(BOO_PURPLE.g + (PAPER.g - BOO_PURPLE.g) * t);
    data[i + 2] = Math.round(BOO_PURPLE.b + (PAPER.b - BOO_PURPLE.b) * t);
  }
  return await sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer();
}

// ── 2. blackletter title via opentype.js ───────────────────────────────────
function buildTitleSvg(text: string, widthPx: number, heightPx: number, fillHex: string): Buffer {
  const font = opentype.parse(readFileSync(FONT_TTF).buffer);
  // Iterate font size down until the rendered path fits the width target.
  let fontSize = heightPx;
  let pathData = "";
  let bbox = { x1: 0, y1: 0, x2: 0, y2: 0 };
  while (fontSize > 20) {
    const tp = font.getPath(text, 0, 0, fontSize);
    bbox = tp.getBoundingBox();
    const w = bbox.x2 - bbox.x1;
    if (w <= widthPx * 0.95) {
      pathData = tp.toPathData(2);
      break;
    }
    fontSize -= 4;
  }
  const textW = bbox.x2 - bbox.x1;
  const textH = bbox.y2 - bbox.y1;
  const offsetX = -bbox.x1 + (widthPx - textW) / 2;
  const offsetY = -bbox.y1 + (heightPx - textH) / 2;
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}">
      <g transform="translate(${offsetX}, ${offsetY})">
        <path d="${pathData}" fill="${fillHex}" />
      </g>
    </svg>
  `);
}

// ── 3. small mono credit line ──────────────────────────────────────────────
function buildCreditSvg(line: string, widthPx: number, heightPx: number): Buffer {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}">
      <style>
        .credit {
          font-family: 'JetBrains Mono', 'Menlo', monospace;
          font-weight: 500;
          letter-spacing: 0.32em;
          fill: #f4efe6;
        }
      </style>
      <text class="credit"
        x="${widthPx / 2}"
        y="${heightPx / 2}"
        font-size="${Math.round(heightPx * 0.55)}"
        text-anchor="middle"
        dominant-baseline="middle">
        ${line.toUpperCase()}
      </text>
    </svg>
  `);
}

async function main() {
  // ── 1. INK ground at 3000x3000 ──────────────────────────────────────────
  const ground = await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 3,
      background: INK,
    },
  })
    .png()
    .toBuffer();

  // ── 2. duotone the OJ photo. Center-cropped to a square inset with margin
  //       so the text + GB script have room to breathe.
  const photoSize = Math.round(SIZE * 0.58);
  const photoBuf = await duotonePhoto(OJ_PHOTO, photoSize);
  const photoY = Math.round(SIZE * 0.18);
  const photoX = Math.round((SIZE - photoSize) / 2);

  // ── 3. NICK HOOK wordmark across the top, paper-cream.
  const nhWidth = Math.round(SIZE * 0.62);
  const nhBuf = await sharp(NH_WORDMARK_INK)
    .resize(nhWidth, null, { fit: "inside" })
    .toBuffer();
  const nhX = Math.round((SIZE - nhWidth) / 2);
  const nhY = Math.round(SIZE * 0.05);

  // ── 4. "If The Glove Don't Fit" title — blackletter, BOO purple,
  //       sits BELOW the photo with some breathing room.
  const titleW = Math.round(SIZE * 0.85);
  const titleH = Math.round(SIZE * 0.09);
  const titleX = Math.round((SIZE - titleW) / 2);
  const titleY = Math.round(SIZE * 0.78);
  const titleBuf = buildTitleSvg("If The Glove Don't Fit", titleW, titleH, "#A87BFF");

  // ── 5. GB script logo — small stamp centered between title and credit.
  const gbSize = Math.round(SIZE * 0.075);
  const gbBuf = await sharp(GB_LOGO)
    .resize(gbSize, gbSize, { fit: "inside" })
    .toBuffer();
  const gbMeta = await sharp(gbBuf).metadata();
  const gbW = gbMeta.width ?? gbSize;
  const gbH = gbMeta.height ?? gbSize;
  const gbX = Math.round((SIZE - gbW) / 2);
  const gbY = titleY + titleH + Math.round(SIZE * 0.01);

  // ── 6. "Ft. Gangsta Boo + Pawmps" credit line — small mono caps,
  //       below the GB stamp so the visual stack reads: TITLE → GB → CREDIT.
  const creditW = SIZE;
  const creditH = Math.round(SIZE * 0.03);
  const creditBuf = buildCreditSvg(
    "Ft. Gangsta Boo + Pawmps",
    creditW,
    creditH,
  );
  const creditY = gbY + gbH + Math.round(SIZE * 0.005);

  // ── COMPOSE ─────────────────────────────────────────────────────────────
  const composited = await sharp(ground)
    .composite([
      { input: nhBuf, left: nhX, top: nhY },
      { input: photoBuf, left: photoX, top: photoY },
      { input: titleBuf, left: titleX, top: titleY },
      { input: creditBuf, left: 0, top: creditY },
      { input: gbBuf, left: gbX, top: gbY },
    ])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  await fs.writeFile(OUT, composited);
  console.log(`→ wrote ${OUT} (${(composited.length / 1024).toFixed(0)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
