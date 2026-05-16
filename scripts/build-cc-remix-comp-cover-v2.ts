/* eslint-disable no-console */
/**
 * Cover v2 for Calm + Collect Remix Compilation.
 *
 * v1 was a 4×5 collage of source covers — Nick called it ugly. v2 mirrors
 * the elegant zine treatment of the Calm + Collect Compilation:
 *
 *   - Paper-cream ground with subtle grain
 *   - Big "CALM + COLLECT REMIX COMP" header in Anton Bold
 *   - Subtitle: 18 TRACKS · 7 UNRELEASED · TWELVE YEARS RESHAPED
 *   - 18 remix tracks running diagonally across the canvas
 *   - Black C+C heptagon mark, bottom-left
 *   - Rotated "VOL. 1 · NOT FOR SALE" stamp, top-right
 *
 * Run: npx tsx scripts/build-cc-remix-comp-cover-v2.ts
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

// Diagonal tracklist content — keep the remixer in parens so each line
// reads as "ORIGINAL TRACK (REMIXER)". Mirrors the way punk-flyer
// tracklists do it. Order matches the Sanity tracklist.
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

  // ── TITLE ─────────────────────────────────────────────────────────────
  const titleText = "CALM + COLLECT REMIX COMP";
  let titleSize = 168;
  let titleData = antonPath(font, titleText, titleSize);
  while (titleData.width > SIZE * 0.9 && titleSize > 80) {
    titleSize -= 8;
    titleData = antonPath(font, titleText, titleSize);
  }
  const titleX = (SIZE - titleData.width) / 2;
  const titleY = 220;

  // ── SUBTITLE ──────────────────────────────────────────────────────────
  const subText = "18 TRACKS · 7 UNRELEASED · TWELVE YEARS RESHAPED";
  const subSize = 52;
  const subData = antonPath(font, subText, subSize);
  const subX = (SIZE - subData.width) / 2;
  const subY = titleY + titleSize + 40;

  // ── TRACKLIST (diagonal) ───────────────────────────────────────────────
  // 18 tracks at ~62px = denser than CC Comp (which had 13 at 92px).
  // Need to fit more lines without crowding.
  const trackSize = 60;
  const lineGap = 88;
  const trackLines = TRACKS.map((t, i) => {
    const d = antonPath(font, t, trackSize);
    return { ...d, y: i * lineGap };
  });
  const blockHeight = (TRACKS.length - 1) * lineGap + trackSize;
  const blockCenterX = SIZE / 2;
  const blockCenterY = SIZE / 2 + 100;
  const trackGroupSvg = trackLines
    .map((l) => {
      const lineX = -l.width / 2;
      return `<g transform="translate(${lineX}, ${l.y - blockHeight / 2})"><path d="${l.pathData}" fill="#0B0B0B"/></g>`;
    })
    .join("");

  // ── SVG composition ───────────────────────────────────────────────────
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

  <!-- TITLE — black Anton at the top, level -->
  <g transform="translate(${titleX}, ${titleY + titleSize})">
    <path d="${titleData.pathData}" fill="#0B0B0B"/>
  </g>

  <!-- SUBTITLE — smaller, level -->
  <g transform="translate(${subX}, ${subY + subSize})">
    <path d="${subData.pathData}" fill="#0B0B0B" opacity="0.7"/>
  </g>

  <!-- TRACKLIST — rotated -22°, crossing the canvas diagonal -->
  <g transform="translate(${blockCenterX}, ${blockCenterY}) rotate(-22)">
    ${trackGroupSvg}
  </g>

  <!-- Punk-zine stamp — rotated chip top-right -->
  <g transform="translate(${SIZE * 0.86}, ${SIZE * 0.08}) rotate(8)">
    <rect x="-180" y="-32" width="360" height="64" fill="#0B0B0B"/>
    <text x="0" y="6" font-family="monospace" font-size="22" font-weight="700"
          letter-spacing="0.18em" fill="#F4EFE6" text-anchor="middle">
      VOL. 1 · NOT FOR SALE
    </text>
  </g>
</svg>
  `.trim();

  const baseBuf = await sharp(Buffer.from(svg)).png().toBuffer();

  // Composite black C+C heptagon bottom-left.
  const heptagonSize = Math.round(SIZE * 0.13);
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
