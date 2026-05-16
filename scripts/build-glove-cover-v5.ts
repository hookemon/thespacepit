/* eslint-disable no-console */
/**
 * Cover for "If The Glove Don't Fit" — v5.
 *
 * v5 changes per Nick:
 *   - Title font mirrors the credit font (JetBrains Mono caps, not
 *     blackletter). Title + credit now read as the SAME family — title
 *     is just bigger and bolder.
 *   - Title bigger: 0.13 → 0.085 of the size (mono caps fit wider, so
 *     same canvas needs a smaller font-size; we go BOLD weight + max
 *     letter-spacing for impact).
 *
 * Everything else stays: full-bleed OJ photo, purple duotone, scrims,
 * CC heptagon bottom-right.
 *
 * Run: npx tsx scripts/build-glove-cover-v5.ts
 */
import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";

const SIZE = 3000;
const OUT =
  "/Users/nickhook/Library/CloudStorage/Dropbox/BOO VAULT/glove-cover-3000.jpg";
const OJ_PHOTO = "/tmp/oj-glove.png";

const CC_MARK = "/Users/nickhook/projects/spacepit-web/public/heptagon-paper.png";

const BOO_PURPLE = { r: 110, g: 47, b: 156 };
const PAPER = { r: 244, g: 239, b: 230 };

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

// Big bold mono title — same font family as the credit line below, just
// upsized. Renders on TWO LINES ("IF THE GLOVE / DON'T FIT") because
// mono caps at bold weight + tracking is too wide for a single line at
// any size that reads as "big". Two lines also feels like a courtroom
// statement, which fits the song.
function buildMonoTitleSvg(line1: string, line2: string, widthPx: number, heightPx: number, fillHex: string): Buffer {
  const fontSize = Math.round(heightPx * 0.46);
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}">
      <style>
        .title {
          font-family: 'JetBrains Mono', 'Menlo', 'Courier New', monospace;
          font-weight: 800;
          letter-spacing: 0.04em;
          fill: ${fillHex};
        }
      </style>
      <text class="title"
        x="${widthPx / 2}"
        y="${heightPx * 0.42}"
        font-size="${fontSize}"
        text-anchor="middle"
        dominant-baseline="middle">
        ${line1.toUpperCase()}
      </text>
      <text class="title"
        x="${widthPx / 2}"
        y="${heightPx * 0.85}"
        font-size="${fontSize}"
        text-anchor="middle"
        dominant-baseline="middle">
        ${line2.toUpperCase()}
      </text>
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
  const photoBuf = await duotoneFullBleed(OJ_PHOTO, SIZE);

  const topScrimH = Math.round(SIZE * 0.18);
  const botScrimH = Math.round(SIZE * 0.34);
  const topScrim = await buildScrim(SIZE, topScrimH, "top");
  const botScrim = await buildScrim(SIZE, botScrimH, "bottom");

  // Big bold mono title, 2 lines.
  const titleW = Math.round(SIZE * 0.92);
  const titleH = Math.round(SIZE * 0.18);
  const titleX = Math.round((SIZE - titleW) / 2);
  const titleY = Math.round(SIZE * 0.68);
  const titleBuf = buildMonoTitleSvg("If The Glove", "Don't Fit", titleW, titleH, "#F4EFE6");

  // Credit line sits below title — same font, smaller, less weight.
  const creditW = SIZE;
  const creditH = Math.round(SIZE * 0.032);
  const creditBuf = buildCreditSvg(
    "Nick Hook + Gangsta Boo + Pawmps",
    creditW,
    creditH,
  );
  const creditY = titleY + titleH + Math.round(SIZE * 0.018);

  // CC heptagon bottom-right.
  const ccSize = Math.round(SIZE * 0.07);
  const ccBuf = await sharp(CC_MARK)
    .resize(ccSize, ccSize, { fit: "inside" })
    .toBuffer();
  const ccMeta = await sharp(ccBuf).metadata();
  const ccW = ccMeta.width ?? ccSize;
  const ccH = ccMeta.height ?? ccSize;
  const ccX = SIZE - ccW - Math.round(SIZE * 0.035);
  const ccY = SIZE - ccH - Math.round(SIZE * 0.035);

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
