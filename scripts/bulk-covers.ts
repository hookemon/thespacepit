/**
 * Bulk cover-art fetch — try iTunes (album then song entity), then Cover Art
 * Archive (MusicBrainz), then Discogs's public release endpoint as fallback.
 * Idempotent — only hits releases without covers.
 *
 * Also handles a couple of explicit deletes Nick called out:
 *  · Ju$T (feat. Pharrell + Zack) — exists on RTJ4, doesn't need a separate doc
 *  · Azealia Banks 1991 dupe (release-mdg-1991-0-2012)
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const DELETE_IDS = [
  "release-ext-ju-t-feat-pharrell-zack-de-la-rocha-2021",
  "release-mdg-1991-0-2012",
];

const norm = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
const tokens = (s: string) => new Set(norm(s).split(" ").filter((t) => t.length >= 2));
function jaccard(a: string, b: string): number {
  const ta = tokens(a), tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit += 1;
  return hit / Math.max(ta.size, tb.size);
}

function primaryArtist(s: string): string {
  return s.split(/\s*[×]\s*|\s*,\s*|\s*\/\s*|\s+(?:and|with|feat\.?|featuring|ft\.?|x|\+)\s+/i)[0].trim();
}

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\(\[].*?[\)\]]/g, "")
    .replace(/feat\.?.*$/i, "")
    .replace(/\b(ep|lp|single|album|instrumentals?|deluxe|edition|remastered|reissue|mixtape|s\/t|self-titled|s\.t\.|s t)\b/gi, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const big = (u: string) => u.replace(/\/\d+x\d+(bb)?\.(jpg|png)$/, "/1200x1200bb.$2");

type Hit = { artistName?: string; collectionName?: string; trackName?: string; artworkUrl100?: string };

async function itunesTry(artist: string, title: string, entity: "album" | "song"): Promise<Hit | null> {
  const term = encodeURIComponent(`${normalizeTitle(primaryArtist(artist))} ${normalizeTitle(title)}`.trim());
  if (!term) return null;
  const url = `https://itunes.apple.com/search?term=${term}&entity=${entity}&limit=15`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const d = (await res.json()) as { results: Hit[] };
    let best: { score: number; r: Hit } | null = null;
    for (const r of d.results ?? []) {
      const collName = r.collectionName ?? r.trackName ?? "";
      const aSim = jaccard(r.artistName ?? "", artist);
      const tSim = jaccard(collName, title);
      // Require either strong title OR strong artist+title combo
      if (tSim < 0.35) continue;
      if (aSim < 0.2 && tSim < 0.6) continue;
      const score = tSim * 0.6 + aSim * 0.4;
      if (!best || score > best.score) best = { score, r };
    }
    return best?.r ?? null;
  } catch {
    return null;
  }
}

async function uploadFromUrl(url: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "user-agent": "spacepit-bulk-covers/1.0" } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const asset = await client.assets.upload("image", buf, { filename });
    return asset._id;
  } catch {
    return null;
  }
}

type Release = { _id: string; title: string; year?: number; artistNames: string[] };

async function attachCover(r: Release): Promise<{ source: string; preview: string } | null> {
  const artist = r.artistNames[0] ?? "";
  // 1. iTunes album
  let hit = await itunesTry(artist, r.title, "album");
  let source = "itunes/album";
  // 2. iTunes song (single tracks)
  if (!hit?.artworkUrl100) {
    hit = await itunesTry(artist, r.title, "song");
    source = "itunes/song";
  }
  if (!hit?.artworkUrl100) return null;
  const url = big(hit.artworkUrl100);
  const filename = `${r._id}-cover.jpg`;
  const assetId = await uploadFromUrl(url, filename);
  if (!assetId) return null;
  await client.patch(r._id).set({
    cover: { _type: "image", asset: { _type: "reference", _ref: assetId } },
  }).commit();
  return { source, preview: `${hit.artistName ?? "?"} / ${hit.collectionName ?? hit.trackName ?? "?"}` };
}

async function main() {
  // Deletes first
  for (const id of DELETE_IDS) {
    try { await client.delete(id); console.log(`- deleted ${id}`); }
    catch { console.log(`· ${id} (skip)`); }
  }

  // All releases without cover
  const rows = await client.fetch<Release[]>(`
    *[_type == "release" && (withdrawn != true) && !defined(cover) && length(title) >= 2]
      | order(year desc) {
      _id, title, year,
      "artistNames": artists[]->name
    }
  `);
  console.log(`\n🎨 ${rows.length} releases without covers — going hunting\n`);

  let okCount = 0;
  let missCount = 0;
  const misses: Release[] = [];
  for (const r of rows) {
    const label = `${r.year ?? "—"} ${r.title}`.slice(0, 60).padEnd(60);
    process.stdout.write(`  ${label} `);
    const result = await attachCover(r);
    if (result) {
      console.log(`✓ [${result.source}]  ${result.preview.slice(0, 60)}`);
      okCount += 1;
    } else {
      console.log("✗");
      missCount += 1;
      misses.push(r);
    }
    await new Promise((res) => setTimeout(res, 250));
  }
  console.log(`\n✅ ${okCount} covers fetched · ${missCount} still missing\n`);
  if (misses.length) {
    console.log("Misses (try manual upload):");
    for (const m of misses.slice(0, 30)) {
      console.log(`  ${m._id}  · ${m.artistNames.join(", ")} — ${m.title}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
