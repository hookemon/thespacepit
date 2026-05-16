/* eslint-disable no-console */
/**
 * Cover for "If The Glove Don't Fit" — v2.
 *   Nick Hook + Gangsta Boo + Pawmps (equal billing now, not "ft.")
 *
 * v1 was a centered-photo layout with NH dominant at the top. Nick wants
 * the OJ photo stretched FULL-BLEED across the whole cover, with NH logo
 * and GB logo at equal weight — co-headliners, not Nick first.
 *
 * Composition:
 *   - OJ courtroom photo, FULL BLEED, duotoned BOO purple → cream
 *   - Top: dark scrim → NH wordmark (left) + GB script (right), same height
 *   - Bottom: dark scrim → "If The Glove Don't Fit" blackletter title +
 *     "Nick Hook + Gangsta Boo + Pawmps" credit (one line, equal weight)
 *
 * Run: npx tsx scripts/build-glove-cover-v2.ts
 */
import sharp from "sharp";
import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const SIZE = 3000;
const OUT =
  "/Users/nickhook/Library/CloudStorage/Dropbox/BOO VAULT/glove-cover-3000.jpg";
const OJ_PHOTO = "/tmp/oj-glove.png";

const FONT_TTF = path.join(__dirname, "_assets", "UnifrakturMaguntia-Book.ttf");
const GB_LOGO =
  "/Users/nickhook/projects/spacepit-web/public/boo/boo-logo-purple.png";
const NH_WORDMARK =
  "/Users/nickhook/projects/spacepit-web/public/nick-hook-logo-paper.png";

const BOO_PURPLE = { r: 110, g: 47, b: 156 };
const PAPER = { r: 244, g: 239, b: 230 };

// ── 1. duotone the OJ photo at FULL BLEED size ─────────────────────────────
async function duotoneFullBleed(srcPath: string, edgePx: number): Promise<Buffer> {
  const { data, info } = await sharp(srcPath)
    .resize(edgePx, edgePx, { fit: "cover", position: "centre", kernel: "lanczos3" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const t = y / 255;
    data[i] = Math.round(BOO_PURPLE.r + (PAPER.r - BOO_PURPLE.r) * t);
    data[i + 1] = Math.round(BOO_PURPLE.g + (PAPER.g - BOO_PURPLE.g) * t);
    data[i + 2] = Math.round(BOO_PURPLE.b + (PAPER.b - BOO_PURPLE.b) * t);
  }
  return await sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer();
}

// ── 2. top + bottom dark scrims as separate PNG buffers so the text-overlay
//       zones get extra contrast against the photo.
async function buildScrim(widthPx: number, heightPx: number, kind: "top" | "bottom"): Promise<Buffer> {
  // SVG with a linear gradient from black/0.7 → transparent.
  const gradId = `scrim-${kind}`;
  const fromOpacity = 0.78;
  const stops =
    kind === "top"
      ? `<stop offset="0%" stop-color="#000" stop-opacity="${fromOpacity}"/><stop offset="100%" stop-color="#000" stop-opacity="0"/>`
      : `<stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="${fromOpacity}"/>`;
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient>
      </defs>
      <rect width="${widthPx}" height="${heightPx}" fill="url(#${gradId})" />
    </svg>
  `);
}

// ── 3. blackletter title via opentype.js, fit to width ────────────────────
function buildTitleSvg(text: string, widthPx: number, heightPx: number, fillHex: string): Buffer {
  const font = opentype.parse(readFileSync(FONT_TTF).buffer);
  let fontSize = heightPx;
  let pathData = "";
  let bbox = { x1: 0, y1: 0, x2: 0, y2: 0 };
  while (fontSize > 20) {
    const tp = font.getPath(text, 0, 0, fontSize);
    bbox = tp.getBoundingBox();
    if (bbox.x2 - bbox.x1 <= widthPx * 0.95) {
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

// ── 4. mono credit line ────────────────────────────────────────────────────
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
  // ── 1. full-bleed duotone photo ────────────────────────────────────────
  const photoBuf = await duotoneFullBleed(OJ_PHOTO, SIZE);

  // ── 2. top + bottom scrims for text legibility ─────────────────────────
  const topScrimH = Math.round(SIZE * 0.22);
  const botScrimH = Math.round(SIZE * 0.32);
  const topScrim = await buildScrim(SIZE, topScrimH, "top");
  const botScrim = await buildScrim(SIZE, botScrimH, "bottom");

  // ── 3. NH wordmark + GB script, EQUAL HEIGHT, side-by-side at top ─────
  // Logo strip lives ~5% from top, 90% wide centered. Both logos sized to
  // ~9% of cover edge in height so they read as co-headliners.
  const logoH = Math.round(SIZE * 0.08);
  const logoStripY = Math.round(SIZE * 0.045);
  const stripCenterY = logoStripY + logoH / 2;

  // NH wordmark — resize to height = logoH, keep aspect.
  const nhBuf = await sharp(NH_WORDMARK)
    .resize(null, logoH, { fit: "inside" })
    .toBuffer();
  const nhMeta = await sharp(nhBuf).metadata();
  const nhW = nhMeta.width ?? logoH * 7;

  // GB logo — same target height. GB is more compact (squarish), NH is
  // wide. We let them sit at the same HEIGHT and accept different widths
  // (that's what "equal" means visually for asymmetric marks).
  const gbBuf = await sharp(GB_LOGO)
    .resize(null, logoH, { fit: "inside" })
    .toBuffer();
  const gbMeta = await sharp(gbBuf).metadata();
  const gbW = gbMeta.width ?? logoH;

  // Place them: NH on the LEFT half, GB on the RIGHT half, with a center
  // gap. Total used width: nhW + gap + gbW. Center the whole strip.
  const gap = Math.round(SIZE * 0.05);
  const stripTotalW = nhW + gap + gbW;
  const stripStartX = Math.round((SIZE - stripTotalW) / 2);
  const nhX = stripStartX;
  const gbX = stripStartX + nhW + gap;
  const nhY = stripCenterY - (nhMeta.height ?? logoH) / 2;
  const gbY = stripCenterY - (gbMeta.height ?? logoH) / 2;

  // ── 4. title + credit at bottom ────────────────────────────────────────
  const titleW = Math.round(SIZE * 0.9);
  const titleH = Math.round(SIZE * 0.13);
  const titleX = Math.round((SIZE - titleW) / 2);
  const titleY = Math.round(SIZE * 0.74);
  // Light purple for legibility on the photo (vs. the pure BOO purple).
  const titleBuf = buildTitleSvg("If The Glove Don't Fit", titleW, titleH, "#D8C2FF");

  const creditW = SIZE;
  const creditH = Math.round(SIZE * 0.032);
  const creditBuf = buildCreditSvg(
    "Nick Hook + Gangsta Boo + Pawmps",
    creditW,
    creditH,
  );
  const creditY = titleY + titleH + Math.round(SIZE * 0.012);

  // ── COMPOSE ─────────────────────────────────────────────────────────────
  const composited = await sharp(photoBuf)
    .composite([
      { input: topScrim, left: 0, top: 0 },
      { input: botScrim, left: 0, top: SIZE - botScrimH },
      { input: nhBuf, left: nhX, top: nhY },
      { input: gbBuf, left: gbX, top: gbY },
      { input: titleBuf, left: titleX, top: titleY },
      { input: creditBuf, left: 0, top: creditY },
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
