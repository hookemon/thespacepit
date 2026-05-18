/* eslint-disable no-console */
/**
 * Site-wide cover-color repaint.
 *
 * Problem: every release page paints its background with the release's
 * `coverColor` hex. Many were unset (→ paper fallback) or hand-picked at
 * import time and don't match the cover's palette, leaving credits hard
 * to read (e.g. Cubic Zirconia "Josephine" was a known offender).
 *
 * Fix: for every release with a cover, sample the cover's dominant
 * color, then derive a BACKGROUND-FRIENDLY variant that:
 *   - feels related to the cover (same hue family),
 *   - has enough lightness that the ink-on-paper body text reads at
 *     WCAG-AA (>= 4.5:1) against it,
 *   - keeps a soft amount of saturation so it doesn't go to dead grey.
 *
 * Strategy:
 *   1. Sharp.stats() to get the dominant color of each cover.
 *   2. Convert to HSL.
 *   3. Force lightness to ~88-92% (very soft tint), saturation to ~22-30%.
 *   4. Convert back to hex.
 *   5. Patch release.coverColor.
 *
 * Run with `--dry` to preview without writing.
 *
 * Run: npx tsx scripts/repaint-cover-colors.ts [--dry]
 */
import sharp from "sharp";
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const DRY = process.argv.includes("--dry");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

type Release = {
  _id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  currentColor: string | null;
};

// ── color utilities ───────────────────────────────────────────────────────

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / (max - min) + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / (max - min) + 2;
        break;
      case b:
        h = (r - g) / (max - min) + 4;
        break;
    }
    h *= 60;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = (h / 360 + 1) % 1;
  const hueToRgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [
    Math.round(hueToRgb(hk + 1 / 3) * 255),
    Math.round(hueToRgb(hk) * 255),
    Math.round(hueToRgb(hk - 1 / 3) * 255),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => v.toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

// ── sample dominant color from a cover URL ────────────────────────────────
//
// Strategy: find the most VIVID color (highest saturation, weighted by
// pixel count) rather than the literal most-common pixel. Dark-background
// covers like SF Drums have a near-black "dominant" color but read
// VISUALLY as red/blue/green from their thin streaks — those are what
// the page background should reflect.
async function dominantColor(url: string): Promise<{ r: number; g: number; b: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const { data, info } = await sharp(buf).resize(64, 64).raw().toBuffer({ resolveWithObject: true });
    type Bucket = { r: number; g: number; b: number; count: number; sat: number };
    const buckets = new Map<string, Bucket>();
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const max = Math.max(r,g,b), min = Math.min(r,g,b);
      // Skip near-black and near-white — they have no hue signal.
      if (max < 35 || min > 225) continue;
      const sat = (max - min) / Math.max(max, 1);
      if (sat < 0.25) continue;
      // Quantize to 16-step buckets to merge similar colors.
      const qr = Math.round(r / 24) * 24;
      const qg = Math.round(g / 24) * 24;
      const qb = Math.round(b / 24) * 24;
      const k = `${qr},${qg},${qb}`;
      const existing = buckets.get(k);
      if (existing) existing.count += 1;
      else buckets.set(k, { r: qr, g: qg, b: qb, count: 1, sat });
    }
    if (buckets.size === 0) {
      // No vivid pixels — fall back to sharp's stats dominant.
      const stats = await sharp(buf).resize(200, 200, { fit: "cover" }).stats();
      return stats.dominant;
    }
    // Pick the bucket with the highest score: count × saturation.
    const top = [...buckets.values()].sort((a, b) => b.count * b.sat - a.count * a.sat)[0];
    return { r: top.r, g: top.g, b: top.b };
  } catch {
    return null;
  }
}

// ── derive a soft, readable background from a sampled color ───────────────
//
// Target: a tint that clearly carries the cover's hue identity but stays
// light enough that black body text reads at WCAG-AA. Previous version
// pushed everything to the same pale cream — Nick wanted more distinction
// between releases (2026-05-17). New range: lightness 0.78-0.86, saturation
// 0.35-0.55 — softer than the saturated original but with real hue identity.
function deriveBackground(r: number, g: number, b: number): string {
  const [h, s, l] = rgbToHsl(r, g, b);
  // Achromatic covers (B&W photos, monochrome typography) → paper cream.
  if (s < 0.06) return "#F4EFE6";
  // Carry the cover's hue, keep saturation in the soft-but-visible band,
  // lift lightness so dark text reads without washing the color out.
  const newS = Math.max(0.32, Math.min(0.55, s * 0.7));
  const newL = 0.82 + (l > 0.7 ? -0.04 : 0.02); // mid-light, darker covers go slightly lighter
  const [nr, ng, nb] = hslToRgb(h, newS, newL);
  return rgbToHex(nr, ng, nb);
}

async function main() {
  const releases = await client.fetch<Release[]>(`
    *[_type == "release" && withdrawn != true && defined(cover)]{
      _id, title, "slug": slug.current,
      "coverUrl": cover.asset->url,
      "currentColor": coverColor
    } | order(title asc)
  `);
  console.log(`Found ${releases.length} releases with covers`);

  const updates: { id: string; title: string; old: string | null; new: string }[] = [];

  let i = 0;
  for (const r of releases) {
    i++;
    if (!r.coverUrl) continue;
    const dom = await dominantColor(r.coverUrl);
    if (!dom) {
      console.log(`  ↳ skip ${r.slug}: failed to sample`);
      continue;
    }
    const newColor = deriveBackground(dom.r, dom.g, dom.b);
    if (newColor.toLowerCase() === (r.currentColor ?? "").toLowerCase()) {
      // No-op — already correct.
      continue;
    }
    updates.push({
      id: r._id,
      title: r.title,
      old: r.currentColor,
      new: newColor,
    });
    if (i % 20 === 0) process.stdout.write(`  ${i}/${releases.length}\r`);
  }
  process.stdout.write(`\n`);

  console.log(`\n${updates.length} releases need a coverColor repaint:\n`);
  for (const u of updates) {
    console.log(`  ${u.title.padEnd(50)} ${(u.old ?? "(unset)").padEnd(10)} → ${u.new}`);
  }

  if (DRY) {
    console.log("\n(dry run — no writes)");
    return;
  }

  let applied = 0;
  for (const u of updates) {
    await client.patch(u.id).set({ coverColor: u.new }).commit();
    applied++;
    if (applied % 10 === 0) process.stdout.write(`\rapplied ${applied}/${updates.length}`);
  }
  process.stdout.write(`\rapplied ${applied}/${updates.length}\n`);
  console.log("done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
