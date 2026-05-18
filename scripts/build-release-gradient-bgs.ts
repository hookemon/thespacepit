/**
 * Per-release gradient backgrounds — the Rothko sweep treatment we proved
 * out on CC003 Drums, applied across the owned catalog.
 *
 * For each release:
 *   1. Pull the cover image
 *   2. Sample TWO distinct vivid colors (different hue families)
 *   3. Lighten each to a readable pastel
 *   4. Render a diagonal 135° SVG gradient (pastel-A → cream → pastel-B)
 *   5. Upload as pageBackgroundImage
 *
 * Skips releases where the cover is essentially achromatic (B&W typography
 * covers) — those keep their solid cream background, the neg-space play.
 *
 * Run:
 *   npx tsx scripts/build-release-gradient-bgs.ts                # all owned releases
 *   npx tsx scripts/build-release-gradient-bgs.ts --slug=cc014-head
 *   npx tsx scripts/build-release-gradient-bgs.ts --dry          # preview only
 *   npx tsx scripts/build-release-gradient-bgs.ts --force        # overwrite existing pageBg
 */
import sharp from "sharp";
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const FORCE = args.includes("--force");
const ONLY_SLUG = args.find((a) => a.startsWith("--slug="))?.replace("--slug=", "");

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

// ── HSL helpers ────────────────────────────────────────────────────────────
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }
  return [h, s, l];
}
function hslToHex(h: number, s: number, l: number): string {
  function hueToRgb(p: number, q: number, t: number) {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1/3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1/3);
  }
  const to = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

// ── extract the two most distinct vivid hues from a cover ─────────────────
async function extractTwoHues(coverUrl: string): Promise<[string, string] | null> {
  const res = await fetch(coverUrl);
  if (!res.ok) return null;
  const { data, info } = await sharp(Buffer.from(await res.arrayBuffer()))
    .resize(96, 96, { fit: "cover" }).raw().toBuffer({ resolveWithObject: true });

  // 12 hue buckets covering 360°. Each tracks the most-saturated pixel + a count.
  type Bucket = { h: number; s: number; l: number; count: number; sat: number };
  const buckets: Array<Bucket | null> = Array(12).fill(null);
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max < 30 || min > 230) continue;
    const sat = (max - min) / Math.max(max, 1);
    if (sat < 0.30) continue;
    const [h, s, l] = rgbToHsl(r, g, b);
    const idx = Math.floor(h * 12) % 12;
    const existing = buckets[idx];
    if (!existing) buckets[idx] = { h, s, l, count: 1, sat };
    else {
      existing.count += 1;
      if (sat > existing.sat) {
        existing.h = h; existing.s = s; existing.l = l; existing.sat = sat;
      }
    }
  }

  const filled = buckets.filter(Boolean) as Bucket[];
  if (filled.length === 0) return null;
  // Sort by saturation × count (vivid AND common)
  filled.sort((a, b) => (b.sat * b.count) - (a.sat * a.count));
  // Find two distinct hues — at least 90° apart so we get real contrast
  const first = filled[0];
  let second: Bucket | null = null;
  for (const b of filled.slice(1)) {
    const dh = Math.min(Math.abs(b.h - first.h), 1 - Math.abs(b.h - first.h));
    if (dh > 0.25) { second = b; break; }
  }
  if (!second) {
    // Only one hue family — make a complementary by rotating 180°.
    second = { ...first, h: (first.h + 0.5) % 1, count: 1 };
  }
  // Lighten both into the readable pastel band (lightness 0.62-0.74, sat 0.38-0.55)
  const pastel = (b: Bucket) => hslToHex(b.h, Math.max(0.38, Math.min(0.55, b.s)), 0.66);
  return [pastel(first), pastel(second)];
}

// ── build a diagonal SVG sweep ────────────────────────────────────────────
function gradientSvg(c1: string, c2: string): string {
  // Soft sweep with cream center so dark text stays legible across the
  // page when this is rendered at 75% opacity over the cream wash.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="2400">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="${c1}"/>
        <stop offset="35%"  stop-color="${lighten(c1)}"/>
        <stop offset="55%"  stop-color="#F4EFE6"/>
        <stop offset="75%"  stop-color="${lighten(c2)}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="2400" height="2400" fill="url(#g)"/>
  </svg>`;
}
function lighten(hex: string): string {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  const [h, s, l] = rgbToHsl(r, g, b);
  return hslToHex(h, s * 0.7, Math.min(0.88, l + 0.12));
}

// ── main loop ─────────────────────────────────────────────────────────────
type Row = { _id: string; title: string; slug: string; coverUrl: string | null; hasBg: boolean };
(async () => {
  const slugFilter = ONLY_SLUG ? `&& slug.current == "${ONLY_SLUG}"` : "";
  const rows: Row[] = await c.fetch(`*[_type == "release" && label != "Other" && withdrawn != true && defined(cover) ${slugFilter}] {
    _id, title, "slug": slug.current,
    "coverUrl": cover.asset->url,
    "hasBg": defined(pageBackgroundImage.asset)
  } | order(title asc)`);

  console.log(`${rows.length} releases${DRY ? " (dry-run)" : ""}\n`);
  let built = 0, skipped = 0;
  for (const r of rows) {
    if (r.hasBg && !FORCE) { console.log(`· ${r.slug}  · already has bg, skip (use --force to overwrite)`); skipped++; continue; }
    if (!r.coverUrl) { console.log(`✗ ${r.slug}  · no cover URL`); skipped++; continue; }
    try {
      const pair = await extractTwoHues(r.coverUrl);
      if (!pair) { console.log(`· ${r.slug}  · achromatic cover, keeping neg-space`); skipped++; continue; }
      const [c1, c2] = pair;
      console.log(`  ${r.slug.padEnd(40)}  ${c1} → cream → ${c2}`);
      if (DRY) { built++; continue; }
      const svg = gradientSvg(c1, c2);
      const out = await sharp(Buffer.from(svg)).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
      const asset = await c.assets.upload("image", out, {
        filename: `${r.slug}-rothko-bg.jpg`, contentType: "image/jpeg",
      });
      await c.patch(r._id).set({
        pageBackgroundImage: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
      }).commit();
      built++;
    } catch (err) {
      console.log(`✗ ${r.slug}  · ${(err as Error).message}`);
      skipped++;
    }
  }
  console.log(`\n${built} built · ${skipped} skipped`);
})().catch((err) => { console.error(err); process.exit(1); });
