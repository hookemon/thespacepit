/* eslint-disable no-console */
/**
 * Cover for Just Nico (Album II, working title).
 *
 * Approach: credits-poster typography. Different from the Remix Comp's
 * source-cover collage — this is the artist's own solo statement, so the
 * cover IS the credits. Big "JUST NICO" wordmark up top, then every
 * collaborator name in a sized cloud below (rappers BIG, players smaller,
 * etc.). Movie-poster credits layout. Ink-black ground, paper-cream text.
 *
 * Treatment:
 *   - kicker:  NICK HOOK · CALM + COLLECT · 2027 (top, JetBrains Mono, lamp amber)
 *   - title:   JUST NICO (huge, JetBrains Mono ExtraBold)
 *   - subtitle: WORKING TITLE · THE SECOND ALBUM
 *   - vocalists row: BIG (Gangsta Boo, Pawmps, Lido Pimienta, Fatboi
 *     Sharif, Apache, Ghetto Living, Andres Belloso, Felisa Tambor,
 *     Metricas Frias, La Pardo, Pezcatore, Tulliz, SIIDS, Lrel, Guadalupe,
 *     Liliana Romero Música)
 *   - producers row: MEDIUM (Brodinski, Doug Surreal, Kid Kreep,
 *     MadStarBase, Chad Hugo, Taso, Spiritual Friendship, Nick Hook)
 *   - players row:  SMALL (Cassie Watson Francillon, Adrian Terrazas
 *     González, Henry D'Arthenay, Rubén Jaramillo, Yulian Percs, Eva
 *     Peroni, Chucho Llano, Electrogenetic, Byron The Aquarius)
 *   - footer: MIXED @ THE ARTLAB BY GARETH JONES · MASTERED @ STERLING
 *     SOUND BY JOE LAPORTA
 *   - corner: CC heptagon
 *
 * Run: npx tsx scripts/build-just-nico-cover.ts
 */
import sharp from "sharp";
import { promises as fs } from "node:fs";

const SIZE = 3000;
const OUT =
  "/Users/nickhook/Library/CloudStorage/Dropbox/C + C/just-nico-cover-3000.jpg";
const CC_MARK = "/Users/nickhook/projects/spacepit-web/public/heptagon-paper.png";

async function main() {
  // Build the whole poster as one big SVG, render via sharp.
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <style>
      .mono-thin { font-family: 'JetBrains Mono', 'Menlo', monospace; font-weight: 400; letter-spacing: 0.2em; fill: #F4EFE6; }
      .mono-mid  { font-family: 'JetBrains Mono', 'Menlo', monospace; font-weight: 500; letter-spacing: 0.14em; fill: #F4EFE6; }
      .mono-bold { font-family: 'JetBrains Mono', 'Menlo', monospace; font-weight: 800; letter-spacing: 0.08em; fill: #F4EFE6; }
      .mono-black { font-family: 'JetBrains Mono', 'Menlo', monospace; font-weight: 900; letter-spacing: 0.04em; fill: #F4EFE6; }
      .kicker { font-family: 'JetBrains Mono', 'Menlo', monospace; font-weight: 500; letter-spacing: 0.32em; fill: #F2B705; }
      .footer { font-family: 'JetBrains Mono', 'Menlo', monospace; font-weight: 500; letter-spacing: 0.18em; fill: #BBB; }
    </style>
  </defs>

  <!-- Ink ground -->
  <rect width="${SIZE}" height="${SIZE}" fill="#0B0B0B"/>

  <!-- Kicker -->
  <text class="kicker" x="${SIZE / 2}" y="280" font-size="46" text-anchor="middle">
    NICK HOOK · CALM + COLLECT · 2027
  </text>

  <!-- Title — split into 2 lines for big poster impact -->
  <text class="mono-black" x="${SIZE / 2}" y="600" font-size="380" text-anchor="middle">JUST</text>
  <text class="mono-black" x="${SIZE / 2}" y="970" font-size="380" text-anchor="middle">NICO</text>

  <!-- Subtitle -->
  <text class="kicker" x="${SIZE / 2}" y="1090" font-size="34" text-anchor="middle" opacity="0.7">
    WORKING TITLE · THE SECOND ALBUM
  </text>

  <!-- Divider -->
  <line x1="${SIZE * 0.2}" y1="1180" x2="${SIZE * 0.8}" y2="1180" stroke="#F2B705" stroke-width="3" opacity="0.5"/>

  <!-- Vocals row (big) — line 1 -->
  <text class="mono-bold" x="${SIZE / 2}" y="1300" font-size="76" text-anchor="middle">
    GANGSTA BOO · PAWMPS · LIDO PIMIENTA
  </text>
  <!-- line 2 -->
  <text class="mono-bold" x="${SIZE / 2}" y="1400" font-size="68" text-anchor="middle">
    FATBOI SHARIF · APACHE · GHETTO LIVING
  </text>
  <!-- line 3 -->
  <text class="mono-bold" x="${SIZE / 2}" y="1492" font-size="60" text-anchor="middle">
    ANDRES BELLOSO · FELISA TAMBOR · METRICAS FRIAS
  </text>
  <!-- line 4 -->
  <text class="mono-bold" x="${SIZE / 2}" y="1582" font-size="56" text-anchor="middle">
    LA PARDO · PEZCATORE · TULLIZ · SIIDS · LREL
  </text>
  <!-- line 5 -->
  <text class="mono-bold" x="${SIZE / 2}" y="1668" font-size="54" text-anchor="middle">
    GUADALUPE · LILIANA ROMERO MÚSICA
  </text>

  <!-- Divider -->
  <line x1="${SIZE * 0.3}" y1="1740" x2="${SIZE * 0.7}" y2="1740" stroke="#F2B705" stroke-width="2" opacity="0.4"/>

  <!-- Producers (medium) -->
  <text class="kicker" x="${SIZE / 2}" y="1820" font-size="30" text-anchor="middle" opacity="0.7">
    PRODUCED BY
  </text>
  <text class="mono-mid" x="${SIZE / 2}" y="1910" font-size="56" text-anchor="middle">
    BRODINSKI · DOUG SURREAL · KID KREEP
  </text>
  <text class="mono-mid" x="${SIZE / 2}" y="1988" font-size="52" text-anchor="middle">
    MADSTARBASE · CHAD HUGO · TASO
  </text>
  <text class="mono-mid" x="${SIZE / 2}" y="2060" font-size="50" text-anchor="middle">
    SPIRITUAL FRIENDSHIP · NICK HOOK
  </text>

  <!-- Divider -->
  <line x1="${SIZE * 0.3}" y1="2140" x2="${SIZE * 0.7}" y2="2140" stroke="#F2B705" stroke-width="2" opacity="0.4"/>

  <!-- Players (small) -->
  <text class="kicker" x="${SIZE / 2}" y="2210" font-size="26" text-anchor="middle" opacity="0.6">
    PLAYERS
  </text>
  <text class="mono-thin" x="${SIZE / 2}" y="2280" font-size="36" text-anchor="middle">
    ADRIAN TERRAZAS GONZÁLEZ · HENRY D'ARTHENAY · CASSIE WATSON FRANCILLON
  </text>
  <text class="mono-thin" x="${SIZE / 2}" y="2336" font-size="34" text-anchor="middle">
    RUBÉN JARAMILLO · YULIAN PERCS · EVA PERONI · CHUCHO LLANO
  </text>
  <text class="mono-thin" x="${SIZE / 2}" y="2390" font-size="32" text-anchor="middle">
    ELECTROGENETIC · BYRON THE AQUARIUS
  </text>

  <!-- Footer -->
  <text class="footer" x="${SIZE / 2}" y="2640" font-size="28" text-anchor="middle">
    MIXED @ THE ARTLAB BY GARETH JONES
  </text>
  <text class="footer" x="${SIZE / 2}" y="2690" font-size="28" text-anchor="middle">
    MASTERED @ STERLING SOUND BY JOE LAPORTA
  </text>
  <text class="kicker" x="${SIZE / 2}" y="2810" font-size="34" text-anchor="middle">
    FIRST SINGLE · IF THE GLOVE DON'T FIT · AUG 7 2026
  </text>
</svg>
  `.trim();

  const base = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  // Composite CC heptagon, bottom-right.
  const heptagonSize = Math.round(SIZE * 0.07);
  const heptagon = await sharp(CC_MARK)
    .resize(heptagonSize, heptagonSize, { fit: "inside" })
    .toBuffer();
  const heptaMeta = await sharp(heptagon).metadata();
  const heptaX = SIZE - (heptaMeta.width ?? heptagonSize) - Math.round(SIZE * 0.04);
  const heptaY = SIZE - (heptaMeta.height ?? heptagonSize) - Math.round(SIZE * 0.04);

  const composited = await sharp(base)
    .composite([{ input: heptagon, left: heptaX, top: heptaY }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  await fs.writeFile(OUT, composited);
  console.log(`→ wrote ${OUT} (${(composited.length / 1024).toFixed(0)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
