/* eslint-disable no-console */
/**
 * Cover for Calm + Collect Compilation.
 *
 * Zine treatment per Nick:
 *   - Paper-white background
 *   - Antonio Bold (same display font as the homepage "in the room" wall)
 *   - Tracklist on a diagonal — punk-flyer / band-poster energy
 *   - Black C+C heptagon mark, bottom-left
 *
 * Antonio is loaded via opentype.js from the bundled TTF so the rendering
 * is font-independent (works whether or not Antonio is installed system-
 * wide on the host that builds the cover).
 *
 * Run: npx tsx scripts/build-cc-comp-cover.ts
 */
import sharp from "sharp";
import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const SIZE = 3000;
const OUT =
  "/Users/nickhook/Library/CloudStorage/Dropbox/C + C/cc-compilation-cover-3000.jpg";
// Antonio variable + static fontsource both have a glyph-composition
// feature (ccmp lookupType 6 substFormat 2) that opentype.js doesn't
// support. Anton is the official Antonio fallback (same condensed
// display energy) and renders cleanly through opentype.js.
const FONT_TTF = path.join(__dirname, "_assets", "Anton-Regular.ttf");
const CC_MARK_BLACK = "/Users/nickhook/projects/spacepit-web/public/heptagon-fill-black.png";

// Zine-grade tracklist excerpts — catalog highlights confirmed via the
// Jakub C+C Compilation folder. Not the full final tracklist (Nick will
// finalize); used here as visual diagonal-poster content.
const TRACKS = [
  "UNTIL YOU TURN BLUE — COLOR FILM",
  "I'M FRESH — GANGSTA BOO + NICK HOOK",
  "HEAD — NICK HOOK + 21 SAVAGE + BULLETPROOF DOLPHIN",
  "PRANAMAYA KOSHA — QUAZZY + NICK HOOK",
  "THE INFINITE LOOP — NICK HOOK + DJ RASHAD + CHINO MORENO + NASTY NIGEL",
  "AN HONEST KEY — SPIRITUAL FRIENDSHIP + ANDY BELL",
  "WERK IT MAMI — NICK HOOK × TASO",
  "HOOK CHOP — NICK HOOK + WIKI",
  "CAN'T TELL ME NOTHING — NICK HOOK + NOVELIST",
  "BREATHE YOU UP, BREATHE YOU IN — SUPERHERO KILLER",
  "WE THE PEOPLE — NICK HOOK + MELO-X",
  "J.A.M.I.T. — NICK HOOK + THE EGYPTIAN LOVER",
  "SOL CON NIEVE — SPIRITUAL FRIENDSHIP + MALENA ZAVALA + 89 THE BRAINCHILD",
];

// Helper to render a single line of Antonio Bold text as SVG path data.
function antonioPath(font: opentype.Font, text: string, fontSize: number): {
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

  // We render everything inside one SVG document because we want
  // <text> via <path> (font-independent), rotations on individual
  // tracklist rows, and clean composition control.
  //
  // Diagonal: rotate the whole tracklist block -22°. Each track line
  // renders at increasing Y. We render them inside a rotated <g>.
  //
  // Title sits at the top, NOT rotated, so it reads cleanly. Heptagon
  // sits at bottom-left.

  // Big TITLE at the top — Antonio Bold caps.
  const titleText = "CALM + COLLECT COMPILATION";
  const titleSize = 168;
  const titleFit = antonioPath(font, titleText, titleSize);
  // Auto-shrink if too wide.
  let actualTitleSize = titleSize;
  let titleData = titleFit;
  while (titleData.width > SIZE * 0.9 && actualTitleSize > 80) {
    actualTitleSize -= 8;
    titleData = antonioPath(font, titleText, actualTitleSize);
  }
  const titleX = (SIZE - titleData.width) / 2;
  const titleY = 220; // top margin

  // Subtitle line.
  const subText = "SINCE 2013 · BROOKLYN → MEDELLÍN · CATALOG RETROSPECTIVE";
  const subSize = 56;
  const subData = antonioPath(font, subText, subSize);
  const subX = (SIZE - subData.width) / 2;
  const subY = titleY + actualTitleSize + 40;

  // Tracklist rendered in a -22° rotated group. Each row spaced ~120px
  // vertically. The whole rotated block is positioned so it crosses the
  // canvas diagonally and reads from top-left to bottom-right.
  const trackSize = 92;
  const lineGap = 130;
  // Width of the longest track determines block centering.
  let maxTrackW = 0;
  for (const t of TRACKS) {
    const d = antonioPath(font, t, trackSize);
    if (d.width > maxTrackW) maxTrackW = d.width;
  }

  // Build path data for each line + corresponding offset.
  const trackLines = TRACKS.map((t, i) => {
    const d = antonioPath(font, t, trackSize);
    return { ...d, y: i * lineGap };
  });

  // Center the block of lines: total block height = N × lineGap. Group
  // gets translated to center then rotated.
  const blockHeight = (TRACKS.length - 1) * lineGap + trackSize;
  const blockCenterX = SIZE / 2;
  const blockCenterY = SIZE / 2 + 80; // slightly below dead-center, gives the title breathing room above

  const trackGroupSvg = trackLines
    .map((l) => {
      const lineX = -l.width / 2; // center each line on the group's origin
      return `<g transform="translate(${lineX}, ${l.y - blockHeight / 2})"><path d="${l.pathData}" fill="#0B0B0B"/></g>`;
    })
    .join("");

  // Composition — paper-white ground with subtle texture grain (cream).
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="3"/>
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>

  <!-- Paper-cream ground -->
  <rect width="${SIZE}" height="${SIZE}" fill="#F4EFE6"/>
  <!-- Subtle grain overlay -->
  <rect width="${SIZE}" height="${SIZE}" filter="url(#grain)"/>

  <!-- TITLE — black Antonio Bold, top, level -->
  <g transform="translate(${titleX}, ${titleY + actualTitleSize})">
    <path d="${titleData.pathData}" fill="#0B0B0B"/>
  </g>

  <!-- SUBTITLE — smaller, black, level -->
  <g transform="translate(${subX}, ${subY + subSize})">
    <path d="${subData.pathData}" fill="#0B0B0B" opacity="0.7"/>
  </g>

  <!-- TRACKLIST — rotated -22°, crossing the canvas diagonal -->
  <g transform="translate(${blockCenterX}, ${blockCenterY}) rotate(-22)">
    ${trackGroupSvg}
  </g>

  <!-- Punk-zine stamp: rotated chip in upper-LEFT corner so it doesn't
       collide with the heptagon's new bottom-right home. -->
  <g transform="translate(${SIZE * 0.14}, ${SIZE * 0.08}) rotate(-8)">
    <rect x="-180" y="-32" width="360" height="64" fill="#0B0B0B"/>
    <text x="0" y="6" font-family="monospace" font-size="22" font-weight="700"
          letter-spacing="0.18em" fill="#F4EFE6" text-anchor="middle">
      VOL. 1 · NOT FOR SALE
    </text>
  </g>
</svg>
  `.trim();

  // Render base SVG.
  const baseBuf = await sharp(Buffer.from(svg)).png().toBuffer();

  // Composite the black C+C heptagon at bottom-RIGHT, standard spec
  // (same as Just Nico + Glove): 7% of canvas size, 4% margin from
  // bottom + right edges.
  const heptagonSize = Math.round(SIZE * 0.07);
  const heptagonBuf = await sharp(CC_MARK_BLACK)
    .resize(heptagonSize, heptagonSize, { fit: "inside" })
    .toBuffer();
  const heptaMeta = await sharp(heptagonBuf).metadata();
  const heptaW = heptaMeta.width ?? heptagonSize;
  const heptaH = heptaMeta.height ?? heptagonSize;
  const heptaX = SIZE - heptaW - Math.round(SIZE * 0.04);
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
