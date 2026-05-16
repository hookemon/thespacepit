/* eslint-disable no-console */
/**
 * Cover v6 for Calm + Collect - The Remixes Vol 1.
 *
 * v5 was too marketing-pitch. v6 strips it back to an album cover:
 *   - All text LEFT-aligned, hugging the left margin
 *   - Title block stacks: CALM + COLLECT / THE REMIXES / Vol. 1
 *   - Tracklist below title, left, no numbers, no ✷ markers, no key
 *   - No "18 tracks" stat, no "catalog reshaped" tagline
 *   - Right half of the canvas: photo breathes, no text
 *   - Heptagon bottom-right at standard 7%/4% spec
 *
 * Run: npx tsx scripts/build-cc-remix-comp-cover-v6.ts
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
const CC_MARK_PAPER = "/Users/nickhook/projects/spacepit-web/public/heptagon-paper.png";

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

  // ── 1. Background — B&W sunrise photo, gentle vignette ─────────────────
  const bgBuf = await sharp(BG_PHOTO)
    .resize(SIZE, SIZE, { fit: "cover", position: "centre", kernel: "lanczos3" })
    .greyscale()
    .linear(1.12, -16)
    .png()
    .toBuffer();

  // Left-side darkening so the text reads — gradient runs left to right.
  // Right half stays cleaner so the photo breathes.
  const sideDarken = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#000" stop-opacity="0.72"/>
          <stop offset="50%" stop-color="#000" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0.05"/>
        </linearGradient>
      </defs>
      <rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>
    </svg>
  `);

  // ── 2. TITLE BLOCK — stacked left, vintage record-sleeve style ─────────
  const LEFT_X = 160; // hug the left edge

  // CALM + COLLECT kicker
  const kicker = pathFor(anton, "CALM + COLLECT", 56);
  const kickerY = 280;

  // THE REMIXES huge
  const title = pathFor(anton, "THE REMIXES", 280);
  const titleY = kickerY + 90;

  // Vol. 1 — italic serif fallback
  const volY = titleY + 340;

  // ── 3. TRACKLIST — left-aligned, just the tracks, no numbers/markers ────
  const trackSize = 38;
  const lineGap = 56;
  const trackTopY = Math.round(SIZE * 0.55);

  const trackLines = TRACKS.map((t) => pathFor(anton, t, trackSize));
  const trackGroupSvg = trackLines
    .map((l, i) => {
      const x = LEFT_X;
      const y = trackTopY + i * lineGap + trackSize;
      return `<g transform="translate(${x}, ${y})"><path d="${l.pathData}" fill="#F4EFE6" opacity="0.92"/></g>`;
    })
    .join("");

  // ── 4. SVG composition ─────────────────────────────────────────────────
  const overlaySvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <!-- Kicker -->
  <g transform="translate(${LEFT_X}, ${kickerY + 56})">
    <path d="${kicker.pathData}" fill="#F4EFE6" opacity="0.78"/>
  </g>

  <!-- THE REMIXES -->
  <g transform="translate(${LEFT_X}, ${titleY + 280})">
    <path d="${title.pathData}" fill="#F4EFE6"/>
  </g>

  <!-- Vol. 1 — italic serif (system fallback) -->
  <text x="${LEFT_X}" y="${volY}"
    font-family="'Instrument Serif', 'Georgia', 'Times New Roman', serif"
    font-size="180" font-style="italic" font-weight="400"
    fill="#F2B705">Vol. 1</text>

  <!-- Tracklist (left-aligned, no numbers / markers / key) -->
  ${trackGroupSvg}
</svg>
  `.trim();

  // ── 5. Heptagon bottom-right at standard spec ──────────────────────────
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
      { input: sideDarken },
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
