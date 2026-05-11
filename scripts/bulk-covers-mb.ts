/**
 * Second-pass cover fetcher — uses MusicBrainz + Cover Art Archive for the
 * iTunes misses. CAA hot-links cleanly without auth.
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

type Release = { _id: string; title: string; year?: number; artistNames: string[] };

function primaryArtist(s: string): string {
  return s.split(/\s*[×]\s*|\s*,\s*|\s*\/\s*|\s+(?:and|with|feat\.?|featuring|ft\.?|x|\+)\s+/i)[0].trim();
}

function strip(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\(\[].*?[\)\]]/g, "")
    .replace(/\b(ep|lp|single|album|instrumentals?|deluxe|edition|remastered|reissue|mixtape)\b/gi, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type MBRelease = {
  id: string;
  title: string;
  date?: string;
  "artist-credit"?: { name?: string; artist?: { name?: string } }[];
  score?: number;
};

async function mbSearch(artist: string, title: string, year?: number): Promise<MBRelease | null> {
  const q = `release:"${strip(title)}" AND artist:"${strip(primaryArtist(artist))}"`;
  const url = `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(q)}&fmt=json&limit=10`;
  try {
    const res = await fetch(url, { headers: { "user-agent": "spacepit-web/1.0 (https://thespacepit.com)" } });
    if (!res.ok) return null;
    const d = (await res.json()) as { releases?: MBRelease[] };
    const candidates = (d.releases ?? []).filter((r) => (r.score ?? 0) >= 70);
    if (candidates.length === 0) return null;
    if (year) {
      // Prefer matching year
      const yearMatch = candidates.find((r) => r.date?.startsWith(String(year)));
      if (yearMatch) return yearMatch;
    }
    return candidates[0];
  } catch {
    return null;
  }
}

async function caaFront(mbid: string): Promise<Buffer | null> {
  // CAA serves the front cover image at this canonical URL.
  const url = `https://coverartarchive.org/release/${mbid}/front-1200`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function attach(r: Release): Promise<{ source: string; preview: string } | null> {
  const artist = r.artistNames[0] ?? "";
  if (!artist) return null;

  // Look up MBID
  const mb = await mbSearch(artist, r.title, r.year);
  if (!mb) return null;
  // Polite: MusicBrainz throttles to 1 req/sec.
  await new Promise((res) => setTimeout(res, 1100));

  // CAA
  const buf = await caaFront(mb.id);
  if (!buf) return null;

  const filename = `${r._id}-cover.jpg`;
  const asset = await client.assets.upload("image", buf, { filename });
  await client.patch(r._id).set({
    cover: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
  }).commit();
  const preview = mb["artist-credit"]?.[0]?.name ?? mb["artist-credit"]?.[0]?.artist?.name ?? "";
  return { source: "musicbrainz/caa", preview: `${preview} / ${mb.title}` };
}

async function main() {
  const rows = await client.fetch<Release[]>(`
    *[_type == "release" && (withdrawn != true) && !defined(cover) && length(title) >= 2]
      | order(year desc) {
      _id, title, year,
      "artistNames": artists[]->name
    }
  `);
  console.log(`🎨 ${rows.length} releases without covers — second pass via MusicBrainz/CAA\n`);

  let ok = 0;
  let miss = 0;
  for (const r of rows) {
    const label = `${r.year ?? "—"} ${r.title}`.slice(0, 50).padEnd(50);
    process.stdout.write(`  ${label} `);
    const result = await attach(r);
    if (result) {
      console.log(`✓ ${result.preview.slice(0, 50)}`);
      ok += 1;
    } else {
      console.log("✗");
      miss += 1;
    }
  }
  console.log(`\n✅ ${ok} more covers · ${miss} still missing`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
