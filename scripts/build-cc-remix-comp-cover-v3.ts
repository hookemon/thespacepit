/* eslint-disable no-console */
/**
 * Cover v3 for Calm + Collect Remix Compilation.
 *
 * Title is now "THE REMIXES VOL 1". Tracklist runs STRAIGHT (no diagonal
 * rotation). Anton Bold, black on paper-cream. Black C+C heptagon
 * bottom-left. Removed the punk "Vol. 1 · NOT FOR SALE" stamp because
 * "Vol 1" is in the title now — redundant.
 *
 * Layout reserves vertical breathing room mid-canvas in case Nick sends
 * a photo to drop in later. For now the tracklist + heptagon fill the
 * lower half.
 *
 * Run: npx tsx scripts/build-cc-remix-comp-cover-v3.ts
 */
import sharp from "sharp";
import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const SIZE = 3000;
const OUT =
  "/Users/nickhook/Library/CloudStorage/Dropbox/C + C/cc-remix-comp-cover-3000.jpg";
const FONT_TTF = path.join(__dirname, "_assets", "Anton-Regular.ttf");
const CC_MARK_BLACK = "/Users/nickhook/projects/spacepit-web/public/heptagon-fill-black.png";

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
  const font = opentype.parse(readFileSync(FONT_TTF).buffer);

  // ── KICKER ─────────────────────────────────────────────────────────────
  const kickerText = "CALM + COLLECT";
  const kickerSize = 56;
  const kickerData = antonPath(font, kickerText, kickerSize);
  const kickerX = (SIZE - kickerData.width) / 2;
  const kickerY = 240;

  // ── TITLE ──────────────────────────────────────────────────────────────
  const titleText = "THE REMIXES VOL 1";
  let titleSize = 280;
  let titleData = antonPath(font, titleText, titleSize);
  while (titleData.width > SIZE * 0.85 && titleSize > 120) {
    titleSize -= 8;
    titleData = antonPath(font, titleText, titleSize);
  }
  const titleX = (SIZE - titleData.width) / 2;
  const titleY = kickerY + kickerSize + 90;

  // ── SUBTITLE ───────────────────────────────────────────────────────────
  const subText = "18 TRACKS · 7 UNRELEASED · TWELVE YEARS RESHAPED";
  const subSize = 50;
  const subData = antonPath(font, subText, subSize);
  const subX = (SIZE - subData.width) / 2;
  const subY = titleY + titleSize + 40;

  // ── TRACKLIST (straight, centered) ─────────────────────────────────────
  // 18 lines, centered, even line gap.
  const trackSize = 52;
  const lineGap = 72;
  const trackLines = TRACKS.map((t) => {
    const d = antonPath(font, t, trackSize);
    return d;
  });
  const tracklistTop = subY + subSize + 140;
  const trackGroupSvg = trackLines
    .map((l, i) => {
      const x = (SIZE - l.width) / 2;
      const y = tracklistTop + i * lineGap + trackSize;
      return `<g transform="translate(${x}, ${y})"><path d="${l.pathData}" fill="#0B0B0B"/></g>`;
    })
    .join("");

  // ── SVG composition ────────────────────────────────────────────────────
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="7"/>
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>

  <!-- Paper-cream ground -->
  <rect width="${SIZE}" height="${SIZE}" fill="#F4EFE6"/>
  <!-- Subtle grain overlay -->
  <rect width="${SIZE}" height="${SIZE}" filter="url(#grain)"/>

  <!-- Kicker -->
  <g transform="translate(${kickerX}, ${kickerY + kickerSize})">
    <path d="${kickerData.pathData}" fill="#0B0B0B" opacity="0.7"/>
  </g>

  <!-- Title -->
  <g transform="translate(${titleX}, ${titleY + titleSize})">
    <path d="${titleData.pathData}" fill="#0B0B0B"/>
  </g>

  <!-- Subtitle -->
  <g transform="translate(${subX}, ${subY + subSize})">
    <path d="${subData.pathData}" fill="#0B0B0B" opacity="0.55"/>
  </g>

  <!-- Divider rule -->
  <line x1="${SIZE * 0.2}" y1="${tracklistTop - 60}" x2="${SIZE * 0.8}" y2="${tracklistTop - 60}" stroke="#0B0B0B" stroke-width="3" opacity="0.4"/>

  <!-- Tracklist -->
  ${trackGroupSvg}
</svg>
  `.trim();

  const baseBuf = await sharp(Buffer.from(svg)).png().toBuffer();

  // Composite black C+C heptagon bottom-left.
  const heptagonSize = Math.round(SIZE * 0.10);
  const heptagonBuf = await sharp(CC_MARK_BLACK)
    .resize(heptagonSize, heptagonSize, { fit: "inside" })
    .toBuffer();
  const heptaMeta = await sharp(heptagonBuf).metadata();
  const heptaH = heptaMeta.height ?? heptagonSize;
  const heptaX = Math.round(SIZE * 0.04);
  const heptaY = SIZE - heptaH - Math.round(SIZE * 0.04);

  const composited = await sharp(baseBuf)
    .composite([{ input: heptagonBuf, left: heptaX, top: heptaY }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  await fs.writeFile(OUT, composited);
  console.log(`→ wrote ${OUT} (${(composited.length / 1024).toFixed(0)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
