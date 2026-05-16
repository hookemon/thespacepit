/* eslint-disable no-console */
/**
 * Cover for "If The Glove Don't Fit" — v4.
 *
 * Back to the OJ-glove courtroom photo per Nick. No NH/GB logos this
 * round — just the photo + title + credit + the canonical Calm + Collect
 * heptagon stamped bottom-right. The Boo signature lives on the release
 * PAGE background separately (see wire-glove-page-bg.ts).
 *
 * Run: npx tsx scripts/build-glove-cover-v4.ts
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
  const photoBuf = await duotoneFullBleed(OJ_PHOTO, SIZE);

  const topScrimH = Math.round(SIZE * 0.18);
  const botScrimH = Math.round(SIZE * 0.32);
  const topScrim = await buildScrim(SIZE, topScrimH, "top");
  const botScrim = await buildScrim(SIZE, botScrimH, "bottom");

  // Title — sits in the bottom third.
  const titleW = Math.round(SIZE * 0.9);
  const titleH = Math.round(SIZE * 0.13);
  const titleX = Math.round((SIZE - titleW) / 2);
  const titleY = Math.round(SIZE * 0.74);
  const titleBuf = buildTitleSvg("If The Glove Don't Fit", titleW, titleH, "#F4EFE6");

  // Credit line — under the title.
  const creditW = SIZE;
  const creditH = Math.round(SIZE * 0.032);
  const creditBuf = buildCreditSvg(
    "Nick Hook + Gangsta Boo + Pawmps",
    creditW,
    creditH,
  );
  const creditY = titleY + titleH + Math.round(SIZE * 0.012);

  // Calm + Collect heptagon stamp, bottom-right, cream so it reads on dark.
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
