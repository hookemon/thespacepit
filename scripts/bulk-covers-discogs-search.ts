/**
 * Fifth-pass cover fetcher — for releases whose Sanity _id ISN'T a Discogs
 * ID (the `release-ext-*` family), search Discogs by artist + title, take the
 * top hit, and grab its cover image.
 *
 * Discogs has the deepest catalog of small-label / underground / 12" stuff
 * that iTunes and MusicBrainz miss entirely. Unauthenticated search works
 * at 25 req/min — we throttle to 1.2s between calls.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const UA = "spacepit-web/1.0 +https://thespacepit.com";

type Release = { _id: string; title: string; year?: number; artistNames: string[] };

const norm = (s: string) =>
  s.toLowerCase()
    .replace(/[\(\[].*?[\)\]]/g, "")
    .replace(/\bfeat\.?.*$/i, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function primaryArtist(s: string): string {
  return s.split(/\s*[×]\s*|\s*,\s*|\s*\/\s*|\s+(?:and|with|feat\.?|featuring|ft\.?|x|\+)\s+/i)[0].trim();
}

// Strip the "(Single)" / "(EP)" / "(Mixtape)" suffix that our DB sometimes has.
function cleanTitle(s: string): string {
  return s
    .replace(/\s*[\(\[][^\)\]]*(single|ep|lp|mixtape|edition|remixes?)[^\)\]]*[\)\]]/gi, "")
    .trim();
}

// Hard overrides where the obvious artist+title search returns garbage or
// the canonical Discogs entry uses a different name.
const OVERRIDES: Record<string, { artist?: string; title?: string }> = {
  "release-ext-rap-monument-2015": { artist: "Various", title: "Rap Monument" },
  "release-ext-movin-forward-a-tribute-to-dj-rashad": {
    artist: "Various", title: "Movin' Forward A Tribute To DJ Rashad",
  },
  "release-ext-casino-heist-online-mission": {
    artist: "Grand Theft Auto", title: "Casino Heist",
  },
  "release-ext-scion-a-v-presents-trouble-bass-sounds-of-nyc": {
    artist: "Various", title: "Sounds Of NYC",
  },
  "release-ext-kitsune-maison-compilation-14": {
    artist: "Various", title: "Kitsune Maison 14",
  },
  "release-ext-weightin-on": { artist: "Lucki Eck$", title: "Weightin On" },
  "release-stub-young-thug-nick-hook-remix": { artist: "Young Thug", title: "Old English" },
};

type DiscogsHit = {
  id: number;
  title?: string;
  year?: string;
  cover_image?: string;
  thumb?: string;
  type?: string;
};

async function discogs(path: string): Promise<unknown | null> {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(`https://api.discogs.com${path}`, {
        headers: { "user-agent": UA },
      });
      if (res.status === 200) return await res.json();
      if (res.status === 429 || res.status === 403) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      return null;
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return null;
}

async function search(artist: string, title: string): Promise<DiscogsHit | null> {
  const q = new URLSearchParams({
    artist: norm(primaryArtist(artist)),
    release_title: norm(cleanTitle(title)),
    type: "release",
    per_page: "10",
  });
  const d = (await discogs(`/database/search?${q.toString()}`)) as
    | { results?: DiscogsHit[] } | null;
  const results = d?.results ?? [];
  // Drop ones without any cover (they'd be a wasted lookup downstream)
  const withCover = results.filter((r) => r.cover_image && !r.cover_image.includes("spacer.gif"));
  return withCover[0] ?? results[0] ?? null;
}

type DiscogsRelease = { images?: { type?: string; uri?: string }[] };

async function fetchFullCover(id: number): Promise<string | null> {
  const d = (await discogs(`/releases/${id}`)) as DiscogsRelease | null;
  if (!d) return null;
  const primary = d.images?.find((i) => i.type === "primary");
  return primary?.uri ?? d.images?.[0]?.uri ?? null;
}

async function uploadFromUrl(url: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const asset = await sanity.assets.upload("image", buf, { filename });
    return asset._id;
  } catch {
    return null;
  }
}

async function main() {
  const rows = await sanity.fetch<Release[]>(`
    *[_type == "release" && (withdrawn != true) && !defined(cover) && length(title) >= 2]
      | order(year desc) {
      _id, title, year,
      "artistNames": artists[]->name
    }
  `);
  console.log(`🎨 ${rows.length} releases without covers — Discogs search\n`);

  let ok = 0;
  let miss = 0;
  for (const r of rows) {
    const override = OVERRIDES[r._id];
    const artist = override?.artist ?? r.artistNames[0] ?? "";
    const title = override?.title ?? r.title;
    const label = `${(r.artistNames ?? [])[0] ?? "?"} — ${r.title}`.slice(0, 50).padEnd(50);
    process.stdout.write(`  ${label} `);

    if (!artist || !title) {
      console.log("✗ no artist/title");
      miss += 1;
      continue;
    }

    const hit = await search(artist, title);
    if (!hit) {
      console.log("✗ no discogs hit");
      miss += 1;
      await new Promise((res) => setTimeout(res, 1200));
      continue;
    }
    // Throttle
    await new Promise((res) => setTimeout(res, 1200));

    // Try the search-result cover first (small), then go deep for hi-res.
    let coverUrl = await fetchFullCover(hit.id);
    if (!coverUrl) coverUrl = hit.cover_image ?? null;
    await new Promise((res) => setTimeout(res, 1200));

    if (!coverUrl) {
      console.log(`✗ no image (hit ${hit.id} ${hit.title})`);
      miss += 1;
      continue;
    }
    const assetId = await uploadFromUrl(coverUrl, `${r._id}-cover.jpg`);
    if (!assetId) {
      console.log(`✗ upload failed`);
      miss += 1;
      continue;
    }
    await sanity.patch(r._id).set({
      cover: { _type: "image", asset: { _type: "reference", _ref: assetId } },
    }).commit();
    console.log(`✓ ${hit.title?.slice(0, 50) ?? hit.id}`);
    ok += 1;
  }

  console.log(`\n✅ ${ok} covers · ${miss} still missing`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
