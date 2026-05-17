/* eslint-disable no-console */
/**
 * Build + upload typographic "archive" covers for 5 underground releases
 * that have no native artwork findable on iTunes/Discogs:
 *
 *   - FOLLOW THAT MONEY (Nick Hook ft Fatman Scoop + Bunji Garlin, 2017)
 *   - STREET POLITICAN (Novelist, 2016)
 *   - Movin' Forward — A Tribute To DJ Rashad (2015)
 *   - Weightin On (Lucki Eck$ x Danny Brown, 2014)
 *   - I'm Hungry (GLUE + Daryl Palumbo + Nick Hook, 2007)
 *
 * Treatment: ink-black ground, lamp-amber kicker year, BIG mono-caps title
 * (multi-line as needed), credit line below, accent rule in vibe color.
 * No C+C heptagon (these aren't C+C releases) — instead a small "n.h. ✦
 * archive" mark bottom-right so the reader knows it's a curated reference
 * cover, not the original artwork.
 *
 * Output goes to /tmp/<slug>-cover.jpg, then uploads to Sanity + patches.
 *
 * Run: npx tsx scripts/build-archive-covers.ts
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
const PAPER = "#F4EFE6";
const INK = "#0B0B0B";
const LAMP = "#F2B705";

type Cover = {
  releaseId: string;
  slug: string;
  titleLines: string[]; // 1-3 lines, will be auto-sized
  artist: string;
  year: string;
  accent: string; // brand color for the rule
  blurb?: string; // small italic line beneath title (genre/role)
};

const COVERS: Cover[] = [
  {
    releaseId: "release-ext-follow-that-money",
    slug: "follow-that-money",
    titleLines: ["FOLLOW", "THAT", "MONEY"],
    artist: "NICK HOOK · FT. FATMAN SCOOP + BUNJI GARLIN",
    year: "2017",
    accent: "#0CA85B", // soca green
    blurb: "Soca · NYC",
  },
  {
    releaseId: "release-ext-street-politican",
    slug: "street-politican",
    titleLines: ["STREET", "POLITICAN"],
    artist: "NOVELIST · PROD. NICK HOOK",
    year: "2016",
    accent: "#3066D9", // grime blue
    blurb: "South London Grime",
  },
  {
    releaseId: "release-ext-movin-forward-a-tribute-to-dj-rashad",
    slug: "movin-forward",
    titleLines: ["MOVIN'", "FORWARD"],
    artist: "DJ RASHAD · NICK HOOK · MACHINEDRUM",
    year: "2015",
    accent: "#A03DB8", // teklife purple
    blurb: "A Tribute To DJ Rashad",
  },
  {
    releaseId: "release-ext-weightin-on",
    slug: "weightin-on",
    titleLines: ["WEIGHTIN", "ON"],
    artist: "LUCKI ECK$ × DANNY BROWN · PROD. NICK HOOK",
    year: "2014",
    accent: "#2DAAB0", // cloud rap teal
    blurb: "Chicago / Detroit",
  },
  {
    releaseId: "release-sports-im-hungry-2007",
    slug: "im-hungry",
    titleLines: ["I'M", "HUNGRY"],
    artist: "GLUE · DARYL PALUMBO · NICK HOOK",
    year: "2007",
    accent: "#D9322B", // noise red
    blurb: "Noise Rock 7\"",
  },
];

function fontSizeFor(line: string, lineCount: number): number {
  // Title vertical zone is y=540 to y=1980 (1440px tall). Allocate that
  // across lineCount lines, leave ~10% gap between lines, never exceed
  // 460pt (otherwise 1-2 line titles look comically large).
  const maxPerLineHeight = Math.floor((1440 / lineCount) * 0.9);
  // Horizontal: mono caps at 0.04 tracking are ~0.62 of font size wide.
  // Cap line at 2200px wide → font ≤ 2200 / (chars * 0.62).
  const widthCap = Math.floor(2200 / (line.length * 0.62));
  return Math.min(460, maxPerLineHeight, widthCap);
}

function buildSvg(c: Cover): string {
  const lineCount = c.titleLines.length;
  const sizes = c.titleLines.map((l) => fontSizeFor(l, lineCount));
  // All lines use the SAME size (the smallest) so the block reads as one shape.
  const uniformSize = Math.min(...sizes);
  const lineHeight = uniformSize * 1.08;
  const totalH = lineHeight * lineCount;
  // Center the title block vertically around y=1260 (gives space for kicker above + blurb/credit below).
  const startY = 1260 - totalH / 2 + uniformSize * 0.55;

  const titleSvg = c.titleLines
    .map((line, i) => {
      const y = startY + i * lineHeight;
      return `<text class="title" x="${SIZE / 2}" y="${y}" font-size="${uniformSize}" text-anchor="middle">${line}</text>`;
    })
    .join("\n  ");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <style>
      .kicker { font-family: 'JetBrains Mono', 'Menlo', monospace; font-weight: 500; letter-spacing: 0.32em; fill: ${LAMP}; }
      .title  { font-family: 'JetBrains Mono', 'Menlo', monospace; font-weight: 900; letter-spacing: 0.04em; fill: ${PAPER}; }
      .credit { font-family: 'JetBrains Mono', 'Menlo', monospace; font-weight: 600; letter-spacing: 0.14em; fill: ${PAPER}; }
      .blurb  { font-family: 'JetBrains Mono', 'Menlo', monospace; font-weight: 400; letter-spacing: 0.32em; fill: ${PAPER}; opacity: 0.55; }
      .footer { font-family: 'JetBrains Mono', 'Menlo', monospace; font-weight: 500; letter-spacing: 0.32em; fill: ${PAPER}; opacity: 0.6; }
      .mark   { font-family: 'JetBrains Mono', 'Menlo', monospace; font-weight: 700; letter-spacing: 0.18em; fill: ${PAPER}; opacity: 0.8; }
    </style>
  </defs>

  <rect width="${SIZE}" height="${SIZE}" fill="${INK}"/>

  <!-- Top kicker: year -->
  <text class="kicker" x="${SIZE / 2}" y="320" font-size="56" text-anchor="middle">${c.year}</text>

  <!-- Accent rule beneath kicker -->
  <line x1="${SIZE * 0.42}" y1="380" x2="${SIZE * 0.58}" y2="380" stroke="${c.accent}" stroke-width="4"/>

  <!-- TITLE BLOCK (auto-sized + centered) -->
  ${titleSvg}

  ${c.blurb ? `<text class="blurb" x="${SIZE / 2}" y="2100" font-size="38" text-anchor="middle">${c.blurb.toUpperCase()}</text>` : ""}

  <!-- Accent rule beneath blurb -->
  <line x1="${SIZE * 0.35}" y1="2180" x2="${SIZE * 0.65}" y2="2180" stroke="${c.accent}" stroke-width="2" opacity="0.6"/>

  <!-- Credit -->
  <text class="credit" x="${SIZE / 2}" y="2300" font-size="42" text-anchor="middle">${c.artist}</text>

  <!-- Bottom footer -->
  <text class="footer" x="${SIZE / 2}" y="2780" font-size="32" text-anchor="middle">N.H. ARCHIVE · thespacepit.com</text>

  <!-- Bottom-right mark -->
  <text class="mark" x="${SIZE - 120}" y="${SIZE - 120}" font-size="34" text-anchor="end">★ n.h.</text>
</svg>
  `.trim();
}

async function buildOne(c: Cover): Promise<Buffer> {
  const svg = buildSvg(c);
  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  const path = `/tmp/${c.slug}-cover.jpg`;
  await fs.writeFile(path, buf);
  console.log(`  → wrote ${path} (${(buf.length / 1024).toFixed(0)} KB)`);
  return buf;
}

async function uploadAndPatch(c: Cover, buf: Buffer): Promise<void> {
  const asset = await client.assets.upload("image", buf, {
    filename: `${c.slug}-cover.jpg`,
  });
  await client
    .patch(c.releaseId)
    .set({
      cover: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
    })
    .commit();
  console.log(`  ✓ patched ${c.releaseId} (asset ${asset._id})`);
}

async function main() {
  for (const c of COVERS) {
    console.log(`\n${c.releaseId}`);
    const buf = await buildOne(c);
    await uploadAndPatch(c, buf);
  }
  console.log(`\n✅ ${COVERS.length} archive covers built + patched`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
