/**
 * Third-pass cover fetcher — for releases by well-known artists where the
 * generic iTunes search fails (e.g. "Old" by Danny Brown matches a thousand
 * other things). Strategy:
 *
 *   1. Search iTunes for the artist → grab their artistId
 *   2. Lookup that artistId with entity=album → full discography
 *   3. Fuzzy match by title within that discography
 *
 * Way more reliable than generic search for big-name artists.
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

// Sanity release IDs grouped by their iTunes artist. The artist name is what
// we'll feed to iTunes; the title is what we'll match against the resulting
// discography. Some have explicit title overrides because the spelling in
// our DB doesn't match Apple's catalog exactly.
type Target = { id: string; title: string; titleOverride?: string };
type Group = { artist: string; targets: Target[] };

const GROUPS: Group[] = [
  {
    artist: "Danny Brown",
    targets: [
      { id: "release-ext-old-2013", title: "Old" },
    ],
  },
  {
    artist: "Azealia Banks",
    targets: [
      { id: "release-ext-1991", title: "1991" },
    ],
  },
  {
    artist: "El-P",
    targets: [
      { id: "release-ext-cancer-4-cure", title: "Cancer 4 Cure" },
    ],
  },
  {
    artist: "Action Bronson",
    targets: [
      { id: "release-ext-blue-chips-7000-2018", title: "Blue Chips 7000" },
    ],
  },
  {
    artist: "Lana Del Rey",
    targets: [
      { id: "release-ext-blue-jeans-remixes", title: "Blue Jeans Remixes", titleOverride: "Blue Jeans" },
    ],
  },
  {
    artist: "Cassius",
    targets: [
      { id: "release-discogs-303826", title: "The Rawkers EP", titleOverride: "The Rawkers" },
    ],
  },
  {
    artist: "TOKiMONSTA",
    targets: [
      { id: "release-ext-the-force-remixes", title: "The Force Remixes", titleOverride: "The Force" },
    ],
  },
  {
    artist: "Kilo Kish",
    targets: [
      { id: "release-ext-k", title: "K+" },
    ],
  },
  {
    artist: "Fudge",
    targets: [
      { id: "release-ext-lady-parts", title: "Lady Parts" },
    ],
  },
  {
    artist: "Cadence Weapon",
    targets: [
      { id: "release-ext-wormhole", title: "Wormhole" },
    ],
  },
  {
    artist: "Hudson Mohawke",
    targets: [
      { id: "release-ext-rap-monument-2015", title: "Rap Monument" },
    ],
  },
  {
    artist: "Sizarr",
    targets: [
      { id: "release-ext-red-bull-studios-tour", title: "Red Bull Studios Tour" },
    ],
  },
  {
    artist: "Ben Klock",
    targets: [
      { id: "release-discogs-1092696", title: "Untitled" },
    ],
  },
];

const norm = (s: string) =>
  s.toLowerCase()
    .replace(/[\(\[].*?[\)\]]/g, "")
    .replace(/\bfeat\.?.*$/i, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function tokens(s: string): Set<string> {
  return new Set(norm(s).split(" ").filter((t) => t.length >= 2));
}

function similarity(a: string, b: string): number {
  const ta = tokens(a), tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  // dice
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit += 1;
  return (2 * hit) / (ta.size + tb.size);
}

const big = (u: string) => u.replace(/\/\d+x\d+(bb)?\.(jpg|png)$/, "/1200x1200bb.$2");

type Hit = {
  wrapperType?: string;
  artistName?: string;
  artistId?: number;
  collectionName?: string;
  artworkUrl100?: string;
};

// iTunes requires a real UA — bare `fetch()` from Node gets back an empty body.
// It also rate-limits aggressively, so retry on 403 with backoff.
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

async function itunesFetch(url: string, attempts = 4): Promise<unknown | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA } });
      if (res.status === 200) return await res.json();
      if (res.status === 403 || res.status === 429) {
        // Rate-limited — backoff and retry
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      return null;
    } catch {
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return null;
}

async function findArtistIds(artist: string): Promise<number[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=musicArtist&limit=10&country=us`;
  const d = (await itunesFetch(url)) as { results: Hit[] } | null;
  if (!d) return [];
  const ids: number[] = [];
  for (const r of d.results ?? []) {
    if (r.wrapperType !== "artist" || !r.artistId) continue;
    const score = similarity(r.artistName ?? "", artist);
    if (score >= 0.7) ids.push(r.artistId);
  }
  return ids;
}

async function fetchAllAlbums(artistId: number): Promise<Hit[]> {
  const url = `https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=200&country=us`;
  const d = (await itunesFetch(url)) as { results: Hit[] } | null;
  if (!d) return [];
  return (d.results ?? []).filter((r) => r.wrapperType === "collection" && r.artworkUrl100);
}

async function uploadFromUrl(url: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const asset = await client.assets.upload("image", buf, { filename });
    return asset._id;
  } catch {
    return null;
  }
}

async function main() {
  let ok = 0;
  let miss = 0;

  for (const group of GROUPS) {
    console.log(`\n🎤 ${group.artist}`);
    const ids = await findArtistIds(group.artist);
    if (ids.length === 0) {
      console.log(`  ✗ no iTunes artistIds for "${group.artist}"`);
      miss += group.targets.length;
      continue;
    }
    // Pull discographies from ALL matching artistIds (homonyms — multiple
    // "Danny Brown"s exist on iTunes), pool them.
    const albums: Hit[] = [];
    for (const id of ids.slice(0, 4)) {
      const got = await fetchAllAlbums(id);
      albums.push(...got);
      await new Promise((res) => setTimeout(res, 150));
    }
    console.log(`  → ${ids.length} artistIds · ${albums.length} albums pooled`);

    for (const t of group.targets) {
      const query = t.titleOverride ?? t.title;
      const label = `   ${t.title}`.padEnd(40);
      // Best title match across pooled discographies
      let best: { score: number; album: Hit } | null = null;
      for (const a of albums) {
        const score = similarity(a.collectionName ?? "", query);
        if (!best || score > best.score) best = { score, album: a };
      }
      if (!best || best.score < 0.5) {
        console.log(`${label} ✗ no match (best=${best?.score.toFixed(2) ?? "—"} / ${best?.album.collectionName ?? "—"})`);
        miss += 1;
        continue;
      }
      const url = big(best.album.artworkUrl100!);
      const assetId = await uploadFromUrl(url, `${t.id}-cover.jpg`);
      if (!assetId) {
        console.log(`${label} ✗ upload failed`);
        miss += 1;
        continue;
      }
      await client.patch(t.id).set({
        cover: { _type: "image", asset: { _type: "reference", _ref: assetId } },
      }).commit();
      console.log(`${label} ✓ ${best.album.collectionName} [${best.score.toFixed(2)}]`);
      ok += 1;
    }

    // Throttle hard between artists — iTunes 403s if we hammer it.
    await new Promise((res) => setTimeout(res, 1500));
  }

  console.log(`\n✅ ${ok} covers fetched · ${miss} still missing`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
