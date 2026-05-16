/* eslint-disable no-console */
/**
 * Cover v5 for The Remixes Vol 1.
 *
 * v4 = correct concept (B&W sunrise bg) but fontwork was dry — tracklist
 * jammed in the middle, didn't let the photo breathe, all-mono-caps.
 *
 * v5 fixes:
 *   - Title now mixes Anton (display caps) with Instrument Serif Italic
 *     (the C+C house serif) for a "label" feel instead of "punk zine"
 *   - Photo breathes in the upper half — title sits at top, tracklist
 *     pushed to bottom 45% so the sunrise + balloons + pyramid are
 *     visible cleanly
 *   - Curly ❧ separator between sections (matches the upcoming page's
 *     C+C ornament)
 *   - Tracklist uses Nick's exact format restored from data:
 *     "Artist Credit - Track Title (Remixer)"
 *   - Standard C+C heptagon spec: 7% size, bottom-right, 4% margin
 *
 * Run: npx tsx scripts/build-cc-remix-comp-cover-v5.ts
 */
import sharp from "sharp";
import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const SIZE = 3000;
const OUT =
  "/Users/nickhook/Library/CloudStorage/Dropbox/C + C/cc-remix-comp-cover-3000.jpg";
const BG_PHOTO = "/tmp/remix-comp-bg.png";

const ANTON_TTF = path.join(__dirname, "_assets", "Anton-Regular.ttf");
const SERIF_ITALIC_TTF = path.join(__dirname, "_assets", "InstrumentSerif-Italic.ttf");
const CC_MARK_PAPER = "/Users/nickhook/projects/spacepit-web/public/heptagon-paper.png";

// Nick's exact format. Pulled from the data restore.
const TRACKS = [
  "Young Thug Ft. A$AP Ferg + Freddie Gibbs - Old English (DJ Spinn + Nick Hook Remix)",
  "Gangsta Boo Ft. Nick Hook - I'm Fresh (Sinjin Hawke Remix)",
  "Nick Hook Ft. 21 Savage - Head (Thee Mike B Remix)",
  "Nick Hook Ft. Novelist - Can't Tell Me Nothing (Salva Remix)",
  "Nick Hook Ft. Kilo Kish + Todd Edwards - Jaco (Big Dope P Remix)",
  "Nick Hook Ft. Gangsta Boo - Peephole (Oak City Slums Remix)",
  "Nick Hook Ft. The Egyptian Lover (Neana Remix)",
  "Nick Hook + Lao Ft. Missil - Tardes De Verano (Uniique Remix)",
  "Cubic Zirconia Ft. Lex - Hoes Come Out At Night (Ikonika Remix)",
  "Spiritual Friendship - Dance (Edit)",
  "Nick Hook Ft. Bernie Worrell + Cmat - Wurly (Jesse Rose + Brillstein Remix)",
  "Cubic Zirconia - Take Me High (Bart Bmore Remix)",
  "Color Film - Until You Turn Blue (Doc Daneeka Remix)",
  "Cubic Zirconia - Josephine (Egyptrixx Remix)",
  "Nehuen + Nick Hook - How Y'all Feeling (Cardopusher E-Rave '93 Mix)",
  "Nick Hook + DJ Earl - Hook Chop - Eliot Lipp",
  "Spiritual Friendship - An Honest Key Ft. Andy Bell (Adrian Terrazas González Remix)",
  "Nick Hook Ft. DJ Rashad + Chino Moreno - The Infinite Loop (Electrogenetic Remix)",
];

const UNRELEASED_IDX = new Set([1, 2, 3, 8, 16, 17, 18]); // 1-indexed

function pathFor(font: opentype.Font, text: string, fontSize: number) {
  const tp = font.getPath(text, 0, 0, fontSize);
  const bbox = tp.getBoundingBox();
  return {
    pathData: tp.toPathData(2),
    width: bbox.x2 - bbox.x1,
    height: bbox.y2 - bbox.y1,
  };
}

async function main() {
  const anton = opentype.parse(readFileSync(ANTON_TTF).buffer);
  // NOTE: Instrument Serif has glyph substitution features (ccmp) that
  // opentype.js can't parse, so we render serif italic via SVG <text>
  // with a system fallback chain (Times/Georgia). On macOS where the
  // covers are built, librsvg picks up Times Italic cleanly.
  // const serif = opentype.parse(readFileSync(SERIF_ITALIC_TTF).buffer);
  void SERIF_ITALIC_TTF; // reserved for later when we find a parseable serif

  // ── 1. Background: photo, B&W, contrast bumped ──────────────────────────
  const bgBuf = await sharp(BG_PHOTO)
    .resize(SIZE, SIZE, { fit: "cover", position: "centre", kernel: "lanczos3" })
    .greyscale()
    .linear(1.15, -18)
    .png()
    .toBuffer();

  // ── 2. Vignette / fade — top zone slightly darkened for title legibility,
  //       big dark wash at bottom for the tracklist zone.
  const titleZoneOverlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
      <defs>
        <linearGradient id="topfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="bottomfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000" stop-opacity="0"/>
          <stop offset="50%" stop-color="#000" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0.82"/>
        </linearGradient>
      </defs>
      <rect width="${SIZE}" height="${Math.round(SIZE * 0.3)}" fill="url(#topfade)"/>
      <rect width="${SIZE}" height="${Math.round(SIZE * 0.55)}" y="${Math.round(SIZE * 0.45)}" fill="url(#bottomfade)"/>
    </svg>`
  );

  // ── 3. TITLE BLOCK at top — Anton + Instrument Serif Italic together ─────
  // Kicker: small caps mono "CALM + COLLECT"
  const kicker = pathFor(anton, "CALM + COLLECT", 52);
  const kickerX = (SIZE - kicker.width) / 2;
  const kickerY = 220;

  // Main: "THE REMIXES" in big Anton
  const title = pathFor(anton, "THE REMIXES", 320);
  const titleX = (SIZE - title.width) / 2;
  const titleY = kickerY + 80;

  // "Vol. 1" + tagline both render via SVG <text> with serif italic
  // fallback (Instrument Serif intended; Times Italic as fallback). See
  // composition below — we just compute positions here.
  const volY = titleY + 470; // baseline Y for "Vol. 1"
  const taglineY = volY + 110;

  // ── 4. TRACKLIST BLOCK — pushed to bottom 45% of canvas ──────────────────
  const trackSize = 44;
  const lineGap = 60;
  const trackTopY = Math.round(SIZE * 0.55); // tracklist starts at 55% down

  const trackLines = TRACKS.map((t, i) => {
    const lineNum = i + 1;
    const prefix = lineNum.toString().padStart(2, "0") + ".";
    const path = pathFor(anton, prefix + " " + t, trackSize);
    return { path, lineNum };
  });

  const trackGroupSvg = trackLines
    .map((l, i) => {
      const x = (SIZE - l.path.width) / 2;
      const y = trackTopY + i * lineGap + trackSize;
      const opacity = UNRELEASED_IDX.has(l.lineNum) ? "1" : "0.78";
      const star = UNRELEASED_IDX.has(l.lineNum)
        ? `<text x="${x - 28}" y="${y}" font-family="serif" font-size="42" font-style="italic" fill="#F2B705">✷</text>`
        : "";
      return `${star}<g transform="translate(${x}, ${y})"><path d="${l.path.pathData}" fill="#F4EFE6" opacity="${opacity}"/></g>`;
    })
    .join("");

  // ── 5. Curly section ornament + "previously unreleased" key ─────────────
  // Both serif elements rendered inline via SVG <text>.
  const ornament = `<text x="${SIZE / 2}" y="${trackTopY - 30}" font-family="'Instrument Serif', 'Georgia', 'Times New Roman', serif" font-size="48" font-style="italic" text-anchor="middle" fill="#F2B705" opacity="0.85">❧</text>`;
  const keyY = SIZE - 130;

  // ── 6. SVG composition ──────────────────────────────────────────────────
  const overlaySvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <!-- KICKER -->
  <g transform="translate(${kickerX}, ${kickerY + 52})">
    <path d="${kicker.pathData}" fill="#F4EFE6" opacity="0.8"/>
  </g>

  <!-- BIG TITLE -->
  <g transform="translate(${titleX}, ${titleY + 320})">
    <path d="${title.pathData}" fill="#F4EFE6"/>
  </g>

  <!-- "Vol. 1" — italic serif via system fallback (Times/Georgia italic) -->
  <text x="${SIZE / 2}" y="${volY}"
    font-family="'Instrument Serif', 'Georgia', 'Times New Roman', serif"
    font-size="220" font-style="italic" font-weight="400"
    text-anchor="middle" fill="#F2B705">Vol. 1</text>

  <!-- Italic tagline -->
  <text x="${SIZE / 2}" y="${taglineY}"
    font-family="'Instrument Serif', 'Georgia', 'Times New Roman', serif"
    font-size="60" font-style="italic" font-weight="400"
    text-anchor="middle" fill="#F4EFE6" opacity="0.78">the calm + collect catalog, reshaped.</text>

  <!-- Curly ornament dividing title from tracklist -->
  ${ornament}

  <!-- Tracklist -->
  ${trackGroupSvg}

  <!-- Unreleased key at bottom -->
  <text x="${SIZE / 2}" y="${keyY}"
    font-family="'Instrument Serif', 'Georgia', 'Times New Roman', serif"
    font-size="30" font-style="italic" font-weight="400"
    text-anchor="middle" fill="#F4EFE6" opacity="0.7">✷ previously unreleased  ·  18 tracks total</text>
</svg>
  `.trim();

  // ── 7. Heptagon bottom-right at standard spec ───────────────────────────
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
      { input: titleZoneOverlay },
      { input: Buffer.from(overlaySvg) },
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
