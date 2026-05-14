/* eslint-disable no-console */
/**
 * Targeted: fetch RTJ2 + RTJ3 covers via Bandcamp og:image (the canonical
 * source — RTJ self-publishes there).
 */
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

const RTJ = [
  {
    id: "release-ext-run-the-jewels-2-2014",
    slug: "run-the-jewels-2",
    bandcamp: "https://runthejewels.bandcamp.com/album/run-the-jewels-2-2",
  },
  {
    id: "release-ext-run-the-jewels-3-2016",
    slug: "run-the-jewels-3",
    bandcamp: "https://runthejewels.bandcamp.com/album/run-the-jewels-3-2",
  },
];

async function ogImage(pageUrl: string): Promise<string | null> {
  const res = await fetch(pageUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; spacepit-web/1.0)" },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  return m?.[1] ?? null;
}

async function main() {
  for (const r of RTJ) {
    console.log(`${r.slug}`);
    const img = await ogImage(r.bandcamp);
    if (!img) {
      console.log(`  → no og:image`);
      continue;
    }
    console.log(`  ↳ og:image ${img}`);
    const imgRes = await fetch(img);
    if (!imgRes.ok) {
      console.log(`  → image fetch failed (${imgRes.status})`);
      continue;
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const asset = await client.assets.upload("image", buf, {
      filename: `${r.slug}-bandcamp-cover.jpg`,
      contentType: img.endsWith(".png") ? "image/png" : "image/jpeg",
    });
    await client
      .patch(r.id)
      .set({ cover: { _type: "image", asset: { _type: "reference", _ref: asset._id } } })
      .commit();
    console.log(`  ✓ patched (${buf.length} bytes, asset ${asset._id})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
