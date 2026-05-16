/* eslint-disable no-console */
/**
 * Cover v4 for The Remixes Vol 1.
 *
 * v3 was elegant zine on paper-cream. v4 swaps the ground for Nick's
 * Teotihuacan sunrise photo (hot air balloons + pyramid + sun), converted
 * to high-contrast black and white as a full-bleed background. Text
 * stays in cream/paper for legibility against the darkened photo.
 *
 * Treatment:
 *   - Crop the 3840×1200 source to a 3000×3000 square (center-right so
 *     the sun + pyramid stay in frame)
 *   - Convert to B&W with bumped contrast (.threshold/.modulate)
 *   - Apply a darken overlay so the title + tracklist read cleanly
 *   - Render the same text hierarchy from v3 on top, in cream
 *   - White heptagon bottom-left (paper variant) since the bg is now dark
 *
 * Run: npx tsx scripts/build-cc-remix-comp-cover-v4.ts
 */
import sharp from "sharp";
import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const SIZE = 3000;
const OUT =
  "/Users/nickhook/Library/CloudStorage/Dropbox/C + C/cc-remix-comp-cover-3000.jpg";
const BG_PHOTO = "/tmp/remix-comp-bg.png";
const FONT_TTF = path.join(__dirname, "_assets", "Anton-Regular.ttf");
const CC_MARK_PAPER = "/Users/nickhook/projects/spacepit-web/public/heptagon-paper.png";

const TRACKS = [
  "OLD ENGLISH — YOUNG THUG + A$AP FERG + FREDDIE GIBBS (DJ SPINN + NICK HOOK + SCATTA)",
  "I'M FRESH — GANGSTA BOO + NICK HOOK (SINJIN HAWKE)",
  "CAN'T TELL ME NOTHING — NICK HOOK + NOVELIST (SALVA)",
  "HEAD — NICK HOOK + 21 SAVAGE (THEE MIKE B)",
  "JACO — NICK HOOK + KILO KISH + TODD EDWARDS (BIG DOPE P)",
  "PEEPHOLE — NICK HOOK + GANGSTA BOO (OAK CITY SLUMS)",
  "J.A.M.I.T. — NICK HOOK + THE EGYPTIAN LOVER (NEANA)",
  "TARDES DE VERANO — NICK HOOK + LAO + MISSIL (UNIIQUE)",
  "HOES COME OUT AT NIGHT — CUBIC ZIRCONIA + LEX (IKONIKA)",
  "DANCE — SPIRITUAL FRIENDSHIP (EDIT)",
  "WURLY — NICK HOOK + BERNIE WORRELL + CMAT (JESSE ROSE + BRILLSTEIN)",
  "TAKE ME HIGH — CUBIC ZIRCONIA (BART BMORE)",
  "UNTIL YOU TURN BLUE — COLOR FILM (DOC DANEEKA)",
  "JOSEPHINE — CUBIC ZIRCONIA (EGYPTRIXX)",
  "HOW Y'ALL FEELING — NEHUEN + NICK HOOK (CARDOPUSHER E-RAVE '93)",
  "HOOK CHOP — NICK HOOK + DJ EARL (ELIOT LIPP 'WINDOWN')",
  "AN HONEST KEY — SPIRITUAL FRIENDSHIP + ANDY BELL (ADRIAN TERRAZAS GONZÁLEZ)",
  "THE INFINITE LOOP — NICK HOOK + DJ RASHAD + CHINO MORENO (ELECTROGENETIC)",
];

function antonPath(font: opentype.Font, text: string, fontSize: number): {
  pathData: string;
  width: number;
  height: number;
} {
  const tp = font.getPath(text, 0, 0, fontSize);
  const bbox = tp.getBoundingBox();
  return {
    pathData: tp.toPathData(2),
    width: bbox.x2 - bbox.x1,
    height: bbox.y2 - bbox.y1,
  };
}

async function main() {
  // ── 1. Prepare the background ──────────────────────────────────────────
  // Source is 3840×1200 (super wide). Square-crop center so the sun +
  // pyramid stay in frame, then convert to B&W with bumped contrast.
  const bgBuf = await sharp(BG_PHOTO)
    .resize(SIZE, SIZE, { fit: "cover", position: "centre", kernel: "lanczos3" })
    .greyscale()
    // Bump contrast + slightly drop midtones so the cream text really
    // pops. linear(a, b) applies: pixel = a * pixel + b.
    .linear(1.25, -28)
    .png()
    .toBuffer();

  // Darken overlay so text reads. ~32% black wash across the whole canvas.
  const darken = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><rect width="${SIZE}" height="${SIZE}" fill="#000" fill-opacity="0.36"/></svg>`,
  );

  // ── 2. Text layout ─────────────────────────────────────────────────────
  const font = opentype.parse(readFileSync(FONT_TTF).buffer);

  const kickerText = "CALM + COLLECT";
  const kickerSize = 56;
  const kickerData = antonPath(font, kickerText, kickerSize);
  const kickerX = (SIZE - kickerData.width) / 2;
  const kickerY = 240;

  const titleText = "THE REMIXES VOL 1";
  let titleSize = 280;
  let titleData = antonPath(font, titleText, titleSize);
  while (titleData.width > SIZE * 0.85 && titleSize > 120) {
    titleSize -= 8;
    titleData = antonPath(font, titleText, titleSize);
  }
  const titleX = (SIZE - titleData.width) / 2;
  const titleY = kickerY + kickerSize + 90;

  const subText = "18 TRACKS · 7 UNRELEASED · TWELVE YEARS RESHAPED";
  const subSize = 50;
  const subData = antonPath(font, subText, subSize);
  const subX = (SIZE - subData.width) / 2;
  const subY = titleY + titleSize + 40;

  const trackSize = 52;
  const lineGap = 72;
  const trackLines = TRACKS.map((t) => antonPath(font, t, trackSize));
  const tracklistTop = subY + subSize + 140;
  const trackGroupSvg = trackLines
    .map((l, i) => {
      const x = (SIZE - l.width) / 2;
      const y = tracklistTop + i * lineGap + trackSize;
      return `<g transform="translate(${x}, ${y})"><path d="${l.pathData}" fill="#F4EFE6"/></g>`;
    })
    .join("");

  // Text-overlay SVG. Paper-cream fill on the darkened bg.
  const textSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <!-- Kicker -->
  <g transform="translate(${kickerX}, ${kickerY + kickerSize})">
    <path d="${kickerData.pathData}" fill="#F4EFE6" opacity="0.85"/>
  </g>

  <!-- Title -->
  <g transform="translate(${titleX}, ${titleY + titleSize})">
    <path d="${titleData.pathData}" fill="#F4EFE6"/>
  </g>

  <!-- Subtitle -->
  <g transform="translate(${subX}, ${subY + subSize})">
    <path d="${subData.pathData}" fill="#F4EFE6" opacity="0.7"/>
  </g>

  <!-- Divider rule -->
  <line x1="${SIZE * 0.2}" y1="${tracklistTop - 60}" x2="${SIZE * 0.8}" y2="${tracklistTop - 60}" stroke="#F4EFE6" stroke-width="3" opacity="0.5"/>

  <!-- Tracklist -->
  ${trackGroupSvg}
</svg>
  `.trim();

  // ── 3. Compose: bg → darken → text → heptagon ──────────────────────────
  // Standard spec across all C+C covers: 7% size, 4% margin, bottom-right.
  const heptagonSize = Math.round(SIZE * 0.07);
  const heptagonBuf = await sharp(CC_MARK_PAPER)
    .resize(heptagonSize, heptagonSize, { fit: "inside" })
    .toBuffer();
  const heptaMeta = await sharp(heptagonBuf).metadata();
  const heptaW = heptaMeta.width ?? heptagonSize;
  const heptaH = heptaMeta.height ?? heptagonSize;
  const heptaX = SIZE - heptaW - Math.round(SIZE * 0.04);
  const heptaY = SIZE - heptaH - Math.round(SIZE * 0.04);

  const composited = await sharp(bgBuf)
    .composite([
      { input: darken },
      { input: Buffer.from(textSvg) },
      { input: heptagonBuf, left: heptaX, top: heptaY },
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
