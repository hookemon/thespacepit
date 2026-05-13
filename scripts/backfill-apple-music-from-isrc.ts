/**
 * Backfill appleMusicUrl on releases using iTunes Search API + each release's
 * ISRCs. No auth required — iTunes Search API is the only first-party music
 * lookup that's free + public.
 *
 * Strategy:
 *   For each release where ISRC tracks exist and appleMusicUrl is missing:
 *     1. Pick the first track with an ISRC
 *     2. Hit `https://itunes.apple.com/lookup?isrc=CODE&entity=song` — returns
 *        track metadata including the album's Apple Music URL (collectionViewUrl)
 *     3. Set appleMusicUrl on the release to that album URL
 *
 * iTunes Search API requires a User-Agent header (else returns text/javascript
 * instead of JSON). Polite throttle of 200ms between requests — Apple is way
 * more permissive than Spotify dashboard.
 *
 * Usage:
 *   npx tsx scripts/backfill-apple-music-from-isrc.ts --dry-run
 *   npx tsx scripts/backfill-apple-music-from-isrc.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

interface ItunesTrack {
  collectionViewUrl?: string;  // album page
  trackViewUrl?: string;       // track page
  collectionName?: string;
  artistName?: string;
  trackName?: string;
  primaryGenreName?: string;
}

async function lookupIsrc(isrc: string): Promise<ItunesTrack | null> {
  const res = await fetch(`https://itunes.apple.com/lookup?isrc=${encodeURIComponent(isrc)}&entity=song&country=us`, {
    // CRITICAL: without a real UA, iTunes returns text/javascript and the
    // body needs eval — this header makes it return clean JSON.
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  const text = await res.text();
  try {
    const json = JSON.parse(text) as { results?: ItunesTrack[] };
    return json.results?.[0] ?? null;
  } catch {
    return null;
  }
}

interface ReleaseDoc {
  _id: string;
  title: string;
  slug: string;
  appleMusicUrl?: string;
  tracklist?: { title: string; isrc?: string }[];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`mode: ${dryRun ? "DRY RUN" : "WRITE"}`);

  const releases = await c.fetch<ReleaseDoc[]>(`
    *[_type == "release" && !defined(appleMusicUrl) && count(tracklist[defined(isrc)]) > 0]
      | order(year asc) {
      _id, title, "slug": slug.current, appleMusicUrl,
      "tracklist": tracklist[]{ title, isrc }
    }
  `);
  console.log(`\nreleases missing appleMusicUrl with >=1 ISRC: ${releases.length}\n`);

  let matched = 0;
  let missed = 0;
  const noMatch: string[] = [];

  for (const r of releases) {
    const isrcs = (r.tracklist ?? []).map((t) => t.isrc).filter(Boolean) as string[];
    let hit: ItunesTrack | null = null;
    let usedIsrc = "";
    for (const isrc of isrcs) {
      hit = await lookupIsrc(isrc);
      if (hit?.collectionViewUrl) {
        usedIsrc = isrc;
        break;
      }
      await new Promise((res) => setTimeout(res, 200));
    }
    if (!hit?.collectionViewUrl) {
      console.log(`  ✗ ${r.title.padEnd(40).slice(0, 40)} — no Apple match on any of ${isrcs.length} ISRC(s)`);
      missed++;
      noMatch.push(r.title);
      await new Promise((res) => setTimeout(res, 250));
      continue;
    }
    // Apple's collectionViewUrl has tracking params we want to keep clean — but
    // keeping them works fine for browsers too. Just trim ?uo=4&app=music etc.
    const clean = hit.collectionViewUrl.split("?")[0];
    console.log(`  ✓ ${r.title.padEnd(38).slice(0, 38)} → ${hit.collectionName?.slice(0, 30) ?? "?"} (via ${usedIsrc})`);
    if (!dryRun) {
      await c.patch(r._id).set({ appleMusicUrl: clean }).commit();
    }
    matched++;
    await new Promise((res) => setTimeout(res, 250));
  }

  console.log(`\n──── SUMMARY ────`);
  console.log(`  Apple Music URLs added: ${matched}`);
  console.log(`  no match found:         ${missed}`);
  if (dryRun) console.log(`\n  (DRY RUN — no Sanity writes.)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
