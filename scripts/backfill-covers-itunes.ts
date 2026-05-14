/* eslint-disable no-console */
/**
 * Backfill missing cover art from iTunes Search.
 *
 * Strategy:
 *   1. Find every release without a cover
 *   2. Search iTunes for "<title> <primary artist>"
 *   3. If we get a match with artworkUrl100, upgrade to 1200x1200
 *   4. Download → upload to Sanity → patch release.cover
 *
 * iTunes artwork URLs follow the pattern:
 *   https://…/SOURCE/100x100bb.jpg
 * Swap "100x100bb" → "1200x1200bb" for the high-res version.
 *
 * Run: npx tsx scripts/backfill-covers-itunes.ts
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

type ITunesAlbum = {
  collectionId: number;
  artistName: string;
  collectionName: string;
  artworkUrl100?: string;
};

async function search(title: string, artist: string): Promise<ITunesAlbum | null> {
  const term = `${title} ${artist}`;
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=5`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data: { results: ITunesAlbum[] } = await res.json();
  const lowerTitle = title.toLowerCase();
  return (
    data.results.find((r) => (r.collectionName ?? "").toLowerCase().includes(lowerTitle)) ??
    data.results[0] ??
    null
  );
}

function upgradeArtwork(url: string): string {
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/, "/1200x1200bb.$1");
}

async function main() {
  const targets: Array<{ _id: string; title: string; slug: string; artistNames: string[] }> =
    await client.fetch(`
      *[_type == "release" && !defined(cover) && withdrawn != true]{
        _id, title, "slug": slug.current, "artistNames": artists[]->name
      }
    `);

  console.log(`Found ${targets.length} releases without a cover\n`);

  let patched = 0;
  for (const r of targets) {
    const primary = r.artistNames?.[0] ?? "";
    console.log(`${r.slug} — "${r.title}" by ${primary}`);

    const hit = await search(r.title, primary);
    await new Promise((rr) => setTimeout(rr, 1000));
    if (!hit?.artworkUrl100) {
      console.log(`  → no iTunes artwork`);
      continue;
    }
    const big = upgradeArtwork(hit.artworkUrl100);
    console.log(`  ↳ matched "${hit.collectionName}" / artwork: ${big}`);

    // Download
    const imgRes = await fetch(big);
    if (!imgRes.ok) {
      console.log(`  → artwork download failed (${imgRes.status})`);
      continue;
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());

    // Upload to Sanity
    const asset = await client.assets.upload("image", buf, {
      filename: `${r.slug}-itunes-cover.jpg`,
      contentType: "image/jpeg",
    });

    await client
      .patch(r._id)
      .set({ cover: { _type: "image", asset: { _type: "reference", _ref: asset._id } } })
      .commit();
    console.log(`  ✓ patched cover (asset ${asset._id})`);
    patched++;
    await new Promise((rr) => setTimeout(rr, 800));
  }
  console.log(`\nPatched ${patched}/${targets.length} releases.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
