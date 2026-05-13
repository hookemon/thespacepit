/**
 * Backfill spotifyUrl on every release where we can find a confident match.
 *
 * Two-pass strategy:
 *
 *   PASS 1 — ISRC lookup (exact). For every release that has at least one
 *     track with an ISRC, hit Spotify's `isrc:CODE` search → grab the
 *     track's album.external_urls.spotify → that's our release URL.
 *
 *   PASS 2 — Fuzzy lookup (artist:X track:Y). For releases with no ISRC,
 *     search by first-artist + first-track-title. Score each candidate
 *     (artist exact match + title exact match + album-name match) and only
 *     auto-apply if the top score is HIGH (>= 6). Lower scores get logged
 *     for human review — Nick decides.
 *
 * Usage:
 *   npx tsx scripts/backfill-spotify-urls.ts --dry-run     # preview
 *   npx tsx scripts/backfill-spotify-urls.ts               # commit
 *   npx tsx scripts/backfill-spotify-urls.ts --pass 1      # ISRC pass only
 *   npx tsx scripts/backfill-spotify-urls.ts --pass 2      # fuzzy pass only
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import {
  getAccessToken,
  searchByIsrc,
  searchByArtistTitle,
  scoreMatch,
  type SpotifyTrack,
} from "../app/_lib/spotify";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) {
    console.error(`✗ Missing env var: ${key}`);
    console.error(`  Get it from https://developer.spotify.com/dashboard`);
    console.error(`  (Make a new app, hit "Show client secret", copy both into .env.local)`);
    process.exit(1);
  }
  return v;
}

interface ReleaseDoc {
  _id: string;
  title: string;
  slug: string;
  year?: number;
  spotifyUrl?: string;
  bandcampUrl?: string;
  artists: { name: string }[];
  tracklist?: { title: string; isrc?: string }[];
}

async function pass1Isrc(
  releases: ReleaseDoc[],
  token: string,
  dryRun: boolean,
): Promise<{ matched: string[]; notFound: string[] }> {
  const matched: string[] = [];
  const notFound: string[] = [];
  console.log(`\n── PASS 1 ── ISRC lookup ──`);
  for (const r of releases) {
    if (r.spotifyUrl) continue; // already set
    const isrcs = (r.tracklist ?? []).map((t) => t.isrc).filter(Boolean) as string[];
    if (isrcs.length === 0) continue;
    // Try ISRCs in order until one resolves
    let hit: SpotifyTrack | null = null;
    for (const isrc of isrcs) {
      hit = await searchByIsrc(isrc, token);
      if (hit) break;
      await new Promise((res) => setTimeout(res, 150));
    }
    if (!hit) {
      console.log(`  ✗ ${r.title} — ISRCs returned no Spotify match`);
      notFound.push(r._id);
      continue;
    }
    const url = hit.album.external_urls.spotify;
    console.log(`  ✓ ${r.title.padEnd(38).slice(0, 38)} → ${hit.album.name.slice(0, 32)}`);
    if (!dryRun) {
      await c.patch(r._id).set({ spotifyUrl: url }).commit();
    }
    matched.push(r._id);
    await new Promise((res) => setTimeout(res, 200));
  }
  return { matched, notFound };
}

async function pass2Fuzzy(
  releases: ReleaseDoc[],
  token: string,
  dryRun: boolean,
): Promise<{ matched: string[]; review: { id: string; title: string; candidates: SpotifyTrack[]; topScore: number }[] }> {
  const matched: string[] = [];
  const review: { id: string; title: string; candidates: SpotifyTrack[]; topScore: number }[] = [];
  console.log(`\n── PASS 2 ── Fuzzy artist + title ──`);

  for (const r of releases) {
    if (r.spotifyUrl) continue;
    const firstArtist = r.artists?.[0]?.name;
    const firstTrack = r.tracklist?.[0]?.title;
    const wantTitle = firstTrack ?? r.title;
    if (!firstArtist || !wantTitle) continue;

    const candidates = await searchByArtistTitle(firstArtist, wantTitle, token);
    if (candidates.length === 0) {
      console.log(`  ✗ ${r.title} — no candidates`);
      continue;
    }
    const scored = candidates
      .map((c) => ({ c, score: scoreMatch(c, firstArtist, wantTitle, r.title) }))
      .sort((a, b) => b.score - a.score);
    const top = scored[0];
    if (top.score >= 6) {
      // High confidence — auto-apply
      const url = top.c.album.external_urls.spotify;
      console.log(`  ✓ ${r.title.padEnd(38).slice(0, 38)} → ${top.c.album.name.slice(0, 28)} (score ${top.score})`);
      if (!dryRun) {
        await c.patch(r._id).set({ spotifyUrl: url }).commit();
      }
      matched.push(r._id);
    } else {
      // Ambiguous — log for human review
      console.log(`  ? ${r.title.padEnd(38).slice(0, 38)} → top score only ${top.score}, needs review`);
      review.push({
        id: r._id,
        title: r.title,
        candidates: scored.map((s) => s.c),
        topScore: top.score,
      });
    }
    await new Promise((res) => setTimeout(res, 200));
  }
  return { matched, review };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const passArg = process.argv.indexOf("--pass");
  const passOnly = passArg !== -1 ? parseInt(process.argv[passArg + 1] ?? "0", 10) : 0;

  const clientId = requireEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = requireEnv("SPOTIFY_CLIENT_SECRET");
  console.log(`→ Requesting Spotify access token…`);
  const token = await getAccessToken(clientId, clientSecret);
  console.log(`✓ Authorized.`);

  // Pull every release that needs a spotifyUrl. Even withdrawn ones — we
  // can fill data, the UI decides whether to render.
  const releases = await c.fetch<ReleaseDoc[]>(`
    *[_type == "release" && !defined(spotifyUrl)] | order(year asc) {
      _id, title, "slug": slug.current, year, spotifyUrl, bandcampUrl,
      "artists": artists[]->{ name },
      "tracklist": tracklist[]{ title, isrc }
    }
  `);
  console.log(`\nReleases missing spotifyUrl: ${releases.length}`);

  let p1Matched: string[] = [];
  let p2Matched: string[] = [];
  let review: { id: string; title: string; candidates: SpotifyTrack[]; topScore: number }[] = [];

  if (passOnly === 0 || passOnly === 1) {
    const r = await pass1Isrc(releases, token, dryRun);
    p1Matched = r.matched;
  }
  if (passOnly === 0 || passOnly === 2) {
    // Re-fetch so Pass 2 doesn't try anything Pass 1 just filled
    const remaining = await c.fetch<ReleaseDoc[]>(`
      *[_type == "release" && !defined(spotifyUrl)] | order(year asc) {
        _id, title, "slug": slug.current, year, spotifyUrl, bandcampUrl,
        "artists": artists[]->{ name },
        "tracklist": tracklist[]{ title, isrc }
      }
    `);
    const r = await pass2Fuzzy(remaining, token, dryRun);
    p2Matched = r.matched;
    review = r.review;
  }

  console.log(`\n──── SUMMARY ────`);
  console.log(`  pass 1 (ISRC):  +${p1Matched.length}`);
  console.log(`  pass 2 (fuzzy): +${p2Matched.length}`);
  console.log(`  needs review:    ${review.length}`);
  if (dryRun) console.log(`\n  (DRY RUN — no Sanity writes.)`);

  if (review.length > 0) {
    console.log(`\n──── NEEDS REVIEW ────`);
    console.log("Top 5 candidates per release (verify the right one in Spotify):");
    for (const r of review.slice(0, 20)) {
      console.log(`\n  ${r.title} (top score ${r.topScore}):`);
      for (const c of r.candidates.slice(0, 3)) {
        console.log(`    ${c.album.external_urls.spotify}`);
        console.log(`      "${c.name}" — ${c.artists.map((a) => a.name).join(", ")} (${c.album.name})`);
      }
    }
    if (review.length > 20) console.log(`\n  …and ${review.length - 20} more not shown`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
