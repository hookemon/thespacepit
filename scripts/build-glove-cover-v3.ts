/* eslint-disable no-console */
/**
 * Cover for "If The Glove Don't Fit" — v3.
 *
 * v3 replaces the OJ courtroom photo with Gangsta Boo's actual handwritten
 * signature on the wall ("Gangsta Boo aka Miss hOnEy ♡ YEAH HOE!!").
 * It's an intimate artifact she literally made — way truer to the record
 * than a public-domain courtroom screenshot.
 *
 * Composition:
 *   - Full-bleed signature photo, FADED into BOO purple via a duotone
 *     gradient mix (preserves the marker linework while harmonizing the
 *     yellow wall with the record's purple palette)
 *   - Top + bottom dark scrim gradients for text legibility
 *   - Title "If The Glove Don't Fit" in UnifrakturMaguntia blackletter
 *   - Credit "Nick Hook + Gangsta Boo + Pawmps" in mono caps
 *   - Calm + Collect heptagon mark, bottom-right, small + clean
 *   - NO Nick Hook wordmark + NO Gangsta Boo logo — the signature IS the
 *     Gangsta Boo mark, and CC's mark stamps the release
 *
 * Run: npx tsx scripts/build-glove-cover-v3.ts
 */
import sharp from "sharp";
import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const SIZE = 3000;
const OUT =
  "/Users/nickhook/Library/CloudStorage/Dropbox/BOO VAULT/glove-cover-3000.jpg";
const SIGNATURE_PHOTO = "/tmp/boo-signature.jpg";

const FONT_TTF = path.join(__dirname, "_assets", "UnifrakturMaguntia-Book.ttf");
const CC_MARK = "/Users/nickhook/projects/spacepit-web/public/heptagon-paper.png";

// Duotone palette: shadows → deep BOO purple, highlights → pale lavender.
// The signature is green marker on a yellow/tan wall — the lighter
// mid-tones of the wall become lavender, the dark marker linework stays
// dark purple. Reads cohesively with the rest of the record's palette.
const SHADOW = { r: 78, g: 28, b: 122 }; // #4E1C7A — deep purple
const HIGHLIGHT = { r: 232, g: 218, b: 248 }; // #E8DAF8 — pale lavender

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
    data[i] = Math.round(SHADOW.r + (HIGHLIGHT.r - SHADOW.r) * t);
    data[i + 1] = Math.round(SHADOW.g + (HIGHLIGHT.g - SHADOW.g) * t);
    data[i + 2] = Math.round(SHADOW.b + (HIGHLIGHT.b - SHADOW.b) * t);
  }
  return await sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer();
}

async function buildScrim(widthPx: number, heightPx: number, kind: "top" | "bottom"): Promise<Buffer> {
  const gradId = `scrim-${kind}`;
  const fromOpacity = 0.55;
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
  // 1. Full-bleed duotoned signature photo.
  const photoBuf = await duotoneFullBleed(SIGNATURE_PHOTO, SIZE);

  // 2. Scrims for text zones.
  const topScrimH = Math.round(SIZE * 0.18);
  const botScrimH = Math.round(SIZE * 0.32);
  const topScrim = await buildScrim(SIZE, topScrimH, "top");
  const botScrim = await buildScrim(SIZE, botScrimH, "bottom");

  // 3. Title + credit.
  const titleW = Math.round(SIZE * 0.9);
  const titleH = Math.round(SIZE * 0.13);
  const titleX = Math.round((SIZE - titleW) / 2);
  const titleY = Math.round(SIZE * 0.74);
  const titleBuf = buildTitleSvg("If The Glove Don't Fit", titleW, titleH, "#F4EFE6");

  const creditW = SIZE;
  const creditH = Math.round(SIZE * 0.032);
  const creditBuf = buildCreditSvg(
    "Nick Hook + Gangsta Boo + Pawmps",
    creditW,
    creditH,
  );
  const creditY = titleY + titleH + Math.round(SIZE * 0.012);

  // 4. CC heptagon mark, bottom-right, small and clean. Cream/paper variant
  //    reads against the purple ground.
  const ccSize = Math.round(SIZE * 0.07);
  const ccBuf = await sharp(CC_MARK)
    .resize(ccSize, ccSize, { fit: "inside" })
    .toBuffer();
  const ccMeta = await sharp(ccBuf).metadata();
  const ccW = ccMeta.width ?? ccSize;
  const ccH = ccMeta.height ?? ccSize;
  const ccX = SIZE - ccW - Math.round(SIZE * 0.035);
  const ccY = SIZE - ccH - Math.round(SIZE * 0.035);

  // COMPOSE
  const composited = await sharp(photoBuf)
    .composite([
      { input: topScrim, left: 0, top: 0 },
      { input: botScrim, left: 0, top: SIZE - botScrimH },
      { input: titleBuf, left: titleX, top: titleY },
      { input: creditBuf, left: 0, top: creditY },
      { input: ccBuf, left: ccX, top: ccY },
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
