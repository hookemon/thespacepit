/* eslint-disable no-console */
/**
 * Cover for Calm + Collect Remix Compilation.
 *
 * Collage approach: 18 source covers from the catalog tiled in a 6×3
 * grid (each cell 500×1000 — wait, that's too squished; using 6 cols ×
 * 3 rows where each cell is exactly square 500×500 vertical strips
 * stacked, with title strip across the bottom third).
 *
 * Simplified: 4 cols × 5 rows = 20 cells at 750×600 each. 18 covers
 * fill the first 18 cells, 2 heptagon stamps fill the remaining 2.
 * Title + label text overlay at the bottom in a dark scrim.
 *
 * Run: npx tsx scripts/build-cc-remix-comp-cover.ts
 */
import sharp from "sharp";
import { promises as fs } from "node:fs";
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const SIZE = 3000;
const OUT =
  "/Users/nickhook/Library/CloudStorage/Dropbox/C + C/cc-remix-comp-cover-3000.jpg";
const CC_MARK = "/Users/nickhook/projects/spacepit-web/public/heptagon-paper.png";

// 18 source covers — slugs of the C+C catalog records being remixed.
// Order = the remix tracklist order so the collage tells the story
// top-to-bottom, left-to-right.
const SLUGS = [
  "old-english-spinn-hook-remix",     // 1. Old English
  "cc007-im-fresh",                   // 2. I'm Fresh
  "cc016-cant-tell-me-nothing-remixes", // 3. Can't Tell Me Nothing
  "cc014-head",                       // 4. Head
  "cc024-pranamaya-kosha",            // 5. (Jaco-source not in catalog; fallback)
  "cc004-peephole",                   // 6. Peephole
  "cc012-collage-v-1",                // 7. (J.A.M.I.T. source unknown; fallback)
  "cc018-tardes-de-verano",           // 8. Tardes De Verano
  "ldcc003-hoes-come-out-at-night",   // 9. Hoes Come Out At Night
  "cc003-drums",                      // 10. Dance (SF) — using Drums as adjacent
  "cc026-jungle-juice-v-1",           // 11. Wurly source fallback
  "ldcc005-take-me-high",             // 12. Take Me High
  "cc001-until-you-turn-blue",        // 13. Until You Turn Blue
  "ldcc001-josephine",                // 14. Josephine
  "cc010-i-can-feel-it-ep",           // 15. How Y'all Feeling (Nehuen) — fallback
  "cc002-like-water",                 // 16. Hook Chop — fallback
  "cc023-iv",                         // 17. An Honest Key (from iV)
  "cc008-magnetoreception",           // 18. Infinite Loop — fallback
];

async function fetchCoverUrls(): Promise<Array<{ slug: string; url: string }>> {
  const rows = await client.fetch<Array<{ slug: string; url: string | null }>>(
    `*[_type == "release" && slug.current in $slugs]{
      "slug": slug.current,
      "url": cover.asset->url
    }`,
    { slugs: SLUGS },
  );
  // Preserve the order in SLUGS.
  return SLUGS.map((s) => rows.find((r) => r.slug === s))
    .filter((r): r is { slug: string; url: string } => !!r?.url);
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`failed to fetch ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const covers = await fetchCoverUrls();
  console.log(`→ pulled ${covers.length} source covers`);
  if (covers.length < 18) {
    console.warn(`⚠ only ${covers.length} covers found; remaining cells will use heptagon stamp`);
  }

  // Grid: 4 cols × 5 rows = 20 cells. Each cell 750×600 (slight aspect
  // squish — covers are square sources rendered into a 1.25:1 ratio cell
  // to fill 3000×3000 without padding).
  const COLS = 4;
  const ROWS = 5;
  const CELL_W = Math.round(SIZE / COLS); // 750
  const CELL_H = Math.round(SIZE / ROWS); // 600

  // Download + resize each cover to cell size.
  const tiles: Buffer[] = [];
  for (const c of covers) {
    const buf = await downloadBuffer(c.url);
    const resized = await sharp(buf)
      .resize(CELL_W, CELL_H, { fit: "cover", position: "centre", kernel: "lanczos3" })
      .toBuffer();
    tiles.push(resized);
  }

  // Heptagon fallback for remaining cells.
  const heptaTile = await sharp(CC_MARK)
    .resize(CELL_W, CELL_H, { fit: "contain", background: { r: 11, g: 11, b: 11, alpha: 1 } })
    .toBuffer();
  while (tiles.length < COLS * ROWS) tiles.push(heptaTile);

  // Compose base: ink-black canvas with all tiles placed.
  const composites: { input: Buffer; left: number; top: number }[] = [];
  for (let i = 0; i < tiles.length; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    composites.push({
      input: tiles[i],
      left: col * CELL_W,
      top: row * CELL_H,
    });
  }

  // Dark bottom scrim so the title reads against busy tiles.
  const scrimH = Math.round(SIZE * 0.32);
  const scrim = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${scrimH}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000" stop-opacity="0"/>
          <stop offset="55%" stop-color="#000" stop-opacity="0.78"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0.92"/>
        </linearGradient>
      </defs>
      <rect width="${SIZE}" height="${scrimH}" fill="url(#g)"/>
    </svg>
  `);
  composites.push({ input: scrim, left: 0, top: SIZE - scrimH });

  // Title + label text overlay.
  const titleSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
      <style>
        .kicker {
          font-family: 'JetBrains Mono', 'Menlo', monospace;
          font-weight: 500;
          letter-spacing: 0.32em;
          fill: #F2B705;
        }
        .title {
          font-family: 'JetBrains Mono', 'Menlo', monospace;
          font-weight: 900;
          letter-spacing: 0.06em;
          fill: #F4EFE6;
        }
        .sub {
          font-family: 'JetBrains Mono', 'Menlo', monospace;
          font-weight: 500;
          letter-spacing: 0.28em;
          fill: #F4EFE6;
        }
      </style>
      <text class="kicker" x="${SIZE / 2}" y="${SIZE * 0.82}" font-size="48" text-anchor="middle">
        CALM + COLLECT · 2026
      </text>
      <text class="title" x="${SIZE / 2}" y="${SIZE * 0.89}" font-size="240" text-anchor="middle">
        REMIX COMP
      </text>
      <text class="sub" x="${SIZE / 2}" y="${SIZE * 0.95}" font-size="42" text-anchor="middle" opacity="0.85">
        18 TRACKS · 7 UNRELEASED · TWELVE YEARS OF THE CATALOG
      </text>
    </svg>
  `);
  composites.push({ input: titleSvg, left: 0, top: 0 });

  const base = await sharp({
    create: { width: SIZE, height: SIZE, channels: 3, background: { r: 11, g: 11, b: 11 } },
  })
    .png()
    .toBuffer();

  const composited = await sharp(base)
    .composite(composites)
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  await fs.writeFile(OUT, composited);
  console.log(`→ wrote ${OUT} (${(composited.length / 1024).toFixed(0)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
