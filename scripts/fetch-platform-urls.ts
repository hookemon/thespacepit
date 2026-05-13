/**
 * Backfill spotifyUrl / appleMusicUrl / youtubeUrl on releases by:
 *   1. Searching iTunes for the album by artist + title.
 *   2. Passing that iTunes URL to Songlink/Odesli (https://odesli.co/).
 *   3. Storing every platform URL Odesli returns.
 *
 * Idempotent — only patches fields that are currently missing.
 *
 * Run:
 *   npx tsx scripts/fetch-platform-urls.ts                # externals only, missing URLs
 *   npx tsx scripts/fetch-platform-urls.ts --all          # include C+C releases
 *   npx tsx scripts/fetch-platform-urls.ts --slug=run-the-jewels-4-2020
 *   npx tsx scripts/fetch-platform-urls.ts --force        # overwrite existing
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

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const ALL_LABELS = args.includes("--all");
const ONLY_SLUG = args.find((a) => a.startsWith("--slug="))?.replace("--slug=", "");

type ReleaseRow = {
  _id: string;
  title: string;
  slug: string;
  year?: number;
  label?: string;
  artistNames: string[];
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  bandcampUrl?: string;
};

type ITunesResult = {
  artistName?: string;
  collectionName?: string;
  collectionViewUrl?: string;
};

type OdesliEntity = { id: string; type: "song" | "album"; title?: string; artistName?: string };
type OdesliResponse = {
  entityUniqueId: string;
  entitiesByUniqueId: Record<string, OdesliEntity>;
  linksByPlatform: Record<
    string,
    {
      url: string;
      nativeAppUriMobile?: string;
      nativeAppUriDesktop?: string;
      entityUniqueId: string;
    }
  >;
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\(\[].*?[\)\]]/g, "")
    .replace(/feat\.?.*$/i, "")
    .replace(/\b(ep|lp|single|album|instrumentals?|deluxe|edition|remastered|reissue)\b/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function primaryArtist(s: string): string {
  return s
    .split(/\s*[×]\s*|\s*,\s*|\s*\/\s*|\s+(?:and|with|feat\.?|featuring|ft\.?)\s+/i)[0]
    .trim();
}

function tokens(s: string): Set<string> {
  return new Set(normalize(s).split(" ").filter((t) => t.length >= 2));
}

function similarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit += 1;
  return hit / Math.max(ta.size, tb.size);
}

async function findITunesUrl(artist: string, title: string): Promise<string | null> {
  const term = encodeURIComponent(`${normalize(primaryArtist(artist))} ${normalize(title)}`.trim());
  if (!term) return null;
  // Try album first, then song. NOTE: iTunes Search API returns empty
  // bodies to bare fetch() calls — needs a Mozilla-style User-Agent header
  // to actually return JSON. Without this, this function falsely returns
  // null for releases that DO exist on iTunes.
  const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";
  for (const entity of ["album", "song"] as const) {
    const url = `https://itunes.apple.com/search?term=${term}&entity=${entity}&limit=15&country=us`;
    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (!res.ok) continue;
    const data = (await res.json()) as { results: ITunesResult[] };
    let best: { score: number; r: ITunesResult } | null = null;
    for (const r of data.results ?? []) {
      const aSim = similarity(r.artistName ?? "", artist);
      const tSim = similarity(r.collectionName ?? "", title);
      if (tSim < 0.4 || aSim < 0.3) continue;
      const score = tSim * 0.6 + aSim * 0.4;
      if (!best || score > best.score) best = { score, r };
    }
    if (best?.r.collectionViewUrl) return best.r.collectionViewUrl;
  }
  return null;
}

// Odesli's free tier rate-limits HARD (~10 req/min). On 429 we back off and
// retry. Without this, a one-shot run on the catalog gets ~90% of requests
// rejected.
async function odesliLookup(url: string, attempts = 4): Promise<OdesliResponse | null> {
  const api = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(url)}&songIfSingle=false`;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(api);
      if (res.status === 200) return (await res.json()) as OdesliResponse;
      if (res.status === 429) {
        // exponential backoff: 8s, 16s, 32s
        const delay = 8000 * Math.pow(2, i);
        process.stdout.write(` ⏳429,wait ${delay/1000}s `);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      console.warn(`  ⚠ odesli ${res.status}`);
      return null;
    } catch (err) {
      console.warn("  ⚠ odesli error:", (err as Error).message);
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
  return null;
}

async function main() {
  const labelFilter = ALL_LABELS ? "" : `&& label == "Other"`;
  const slugFilter = ONLY_SLUG ? `&& slug.current == "${ONLY_SLUG}"` : "";
  const missing = FORCE
    ? ""
    : "&& (!defined(spotifyUrl) || !defined(appleMusicUrl) || !defined(youtubeUrl))";

  const rows = await client.fetch<ReleaseRow[]>(`
    *[_type == "release" && (withdrawn != true) ${labelFilter} ${slugFilter} ${missing}]
      | order(year desc) {
      _id, title, "slug": slug.current, year, label,
      "artistNames": artists[]->name,
      spotifyUrl, appleMusicUrl, youtubeUrl, bandcampUrl
    }
  `);

  if (rows.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  console.log(`🔗 Backfilling platform URLs for ${rows.length} release${rows.length === 1 ? "" : "s"}...\n`);

  let okCount = 0;
  let skipCount = 0;
  for (const r of rows) {
    const artist = (r.artistNames ?? [])[0] ?? "";
    const label = `${r.title}`.padEnd(34, " ").slice(0, 34);
    process.stdout.write(`  ${label} `);

    // Prefer an existing URL; if none, find one via iTunes search.
    const seedUrl = r.bandcampUrl ?? (await findITunesUrl(artist, r.title));
    if (!seedUrl) {
      console.log("✗ no seed url");
      skipCount += 1;
      await new Promise((res) => setTimeout(res, 300));
      continue;
    }

    const data = await odesliLookup(seedUrl);
    if (!data) {
      console.log("✗ odesli miss");
      skipCount += 1;
      await new Promise((res) => setTimeout(res, 600));
      continue;
    }

    const links = data.linksByPlatform;
    const patch: Record<string, string> = {};
    if (!r.spotifyUrl && links.spotify?.url) patch.spotifyUrl = links.spotify.url;
    if (!r.appleMusicUrl && links.appleMusic?.url) patch.appleMusicUrl = links.appleMusic.url;
    if (!r.youtubeUrl && (links.youtube?.url || links.youtubeMusic?.url)) {
      patch.youtubeUrl = links.youtube?.url ?? links.youtubeMusic!.url;
    }
    if (!r.bandcampUrl && links.bandcamp?.url) patch.bandcampUrl = links.bandcamp.url;

    const fields = Object.keys(patch);
    if (fields.length === 0) {
      console.log("· nothing new");
      skipCount += 1;
    } else {
      await client.patch(r._id).set(patch).commit();
      console.log(`✓ ${fields.map((f) => f.replace("Url", "")).join(" + ")}`);
      okCount += 1;
    }

    // Odesli free-tier is ~10 req/min (we observed 429s at 1100ms). Throttle
    // at 6.5s between calls = ~9/min, under the cap, with retry-on-429 above
    // for the occasional spike.
    await new Promise((res) => setTimeout(res, 6500));
  }

  console.log(`\n✅ ${okCount} updated · ${skipCount} skipped`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
