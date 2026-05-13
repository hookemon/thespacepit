/**
 * Backfill spotifyUrl + every other platform URL using Songlink/Odesli.
 *
 * Why Songlink: Spotify locked their Web API behind Premium in 2024. Songlink
 * is the music industry's universal cross-streaming resolver — no auth, no
 * Premium, no dashboard pain. Feed it any one platform URL and it returns
 * URLs for every other major streaming platform.
 *
 * Strategy:
 *   For each Sanity release missing spotifyUrl AND has bandcampUrl OR
 *   appleMusicUrl: hand the existing URL to Songlink, parse the response,
 *   write spotifyUrl + youtubeMusicUrl + tidalUrl + amazonMusicUrl +
 *   deezerUrl back to Sanity.
 *
 * Throttle: 6.5s between calls (Songlink's free tier ≈ 10/min). With ~50
 * eligible releases, total runtime ~5-6 minutes.
 *
 * Usage:
 *   npx tsx scripts/backfill-streaming-via-songlink.ts --dry-run
 *   npx tsx scripts/backfill-streaming-via-songlink.ts
 *   npx tsx scripts/backfill-streaming-via-songlink.ts --only 10  # cap test
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { lookupWithBackoff } from "../app/_lib/songlink";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

interface ReleaseDoc {
  _id: string;
  title: string;
  bandcampUrl?: string;
  appleMusicUrl?: string;
  spotifyUrl?: string;
  youtubeMusicUrl?: string;
  tidalUrl?: string;
  amazonMusicUrl?: string;
  deezerUrl?: string;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const onlyArg = process.argv.indexOf("--only");
  const cap = onlyArg !== -1 ? parseInt(process.argv[onlyArg + 1] ?? "0", 10) : 0;

  console.log(`mode: ${dryRun ? "DRY RUN" : "WRITE"}`);

  // Find releases that have SOME platform URL but are missing spotifyUrl.
  // Songlink needs an input — without one, we can't resolve anything.
  const releases = await c.fetch<ReleaseDoc[]>(`
    *[_type == "release" && !defined(spotifyUrl) && (defined(bandcampUrl) || defined(appleMusicUrl))]
      | order(year desc) {
      _id, title, bandcampUrl, appleMusicUrl, spotifyUrl,
      youtubeMusicUrl, tidalUrl, amazonMusicUrl, deezerUrl
    }
  `);
  const targets = cap > 0 ? releases.slice(0, cap) : releases;
  console.log(`\neligible (has BC or Apple URL, missing Spotify): ${releases.length}`);
  console.log(`targeting this run:                              ${targets.length}\n`);

  const stats = {
    lookedUp: 0,
    spotifyFound: 0,
    ytMusicFound: 0,
    tidalFound: 0,
    amazonFound: 0,
    deezerFound: 0,
    notFound: 0,
  };

  for (let i = 0; i < targets.length; i++) {
    const r = targets[i];
    const input = r.bandcampUrl ?? r.appleMusicUrl!;
    process.stdout.write(`[${i + 1}/${targets.length}] ${r.title.slice(0, 50).padEnd(50)} `);

    const result = await lookupWithBackoff(input);
    stats.lookedUp++;

    if (!result) {
      console.log(`✗ no match`);
      stats.notFound++;
      await new Promise((res) => setTimeout(res, 6500));
      continue;
    }

    const patch: Record<string, string> = {};
    const links = result.linksByPlatform;
    if (links.spotify?.url && !r.spotifyUrl) {
      patch.spotifyUrl = links.spotify.url;
      stats.spotifyFound++;
    }
    if (links.youtubeMusic?.url && !r.youtubeMusicUrl) {
      patch.youtubeMusicUrl = links.youtubeMusic.url;
      stats.ytMusicFound++;
    }
    if (links.tidal?.url && !r.tidalUrl) {
      patch.tidalUrl = links.tidal.url;
      stats.tidalFound++;
    }
    if (links.amazonMusic?.url && !r.amazonMusicUrl) {
      patch.amazonMusicUrl = links.amazonMusic.url;
      stats.amazonFound++;
    }
    if (links.deezer?.url && !r.deezerUrl) {
      patch.deezerUrl = links.deezer.url;
      stats.deezerFound++;
    }

    const found = Object.keys(patch);
    if (found.length === 0) {
      console.log(`✗ no new platforms returned`);
    } else {
      console.log(`✓ ${found.map((k) => k.replace("Url", "")).join(" · ")}`);
      if (!dryRun) {
        await c.patch(r._id).set(patch).commit();
      }
    }

    // Throttle — Songlink's unauthenticated tier is ~10/min
    if (i < targets.length - 1) {
      await new Promise((res) => setTimeout(res, 6500));
    }
  }

  console.log(`\n──── SUMMARY ────`);
  console.log(`  releases looked up:        ${stats.lookedUp}`);
  console.log(`  + spotifyUrl found:        ${stats.spotifyFound}`);
  console.log(`  + youtubeMusicUrl found:   ${stats.ytMusicFound}`);
  console.log(`  + tidalUrl found:          ${stats.tidalFound}`);
  console.log(`  + amazonMusicUrl found:    ${stats.amazonFound}`);
  console.log(`  + deezerUrl found:         ${stats.deezerFound}`);
  console.log(`  no match at all:           ${stats.notFound}`);
  if (dryRun) console.log(`\n  (DRY RUN — no Sanity writes.)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
