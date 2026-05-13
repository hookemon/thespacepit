/**
 * Backfill spotifyUrl + other platforms via MusicBrainz.
 *
 * Why MusicBrainz: the open music encyclopedia. Their database has URL
 * relations attached to releases — including Spotify album URLs, Apple
 * album URLs, Tidal, Deezer, Discogs. No auth, no Premium gate, no
 * dashboard. Spotify locked their own Web API behind Premium; MusicBrainz
 * is the open-data path around it.
 *
 * Strategy:
 *   1. For each Sanity release that has >=1 track with an ISRC, find the
 *      MusicBrainz recording via /recording/?query=isrc:CODE
 *   2. The recording has a `releases` array — pick the first MB release
 *   3. Fetch /release/{mbid}?inc=url-rels — that has the album-level
 *      Spotify, Apple, Tidal, Deezer, Discogs URLs as "relations"
 *   4. Patch back to Sanity
 *
 * Rate limit: MusicBrainz is STRICT at 1 req/sec for unauthenticated
 * requests. With ~69 releases × 2 requests, runtime ~2.5 min.
 *
 * Usage:
 *   npx tsx scripts/backfill-streaming-via-musicbrainz.ts --dry-run
 *   npx tsx scripts/backfill-streaming-via-musicbrainz.ts
 *   npx tsx scripts/backfill-streaming-via-musicbrainz.ts --only 5
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

const MB_BASE = "https://musicbrainz.org/ws/2";
const UA = "thespacepit-backfill/1.0 (https://thespacepit.com)";

interface MbRecording {
  id: string;
  title: string;
  releases?: { id: string; title: string }[];
}

interface MbUrlRelation {
  type: string;  // "free streaming", "purchase for download", "streaming", "discogs", "wikidata", etc.
  url: { resource: string };
}

interface MbRelease {
  id: string;
  title: string;
  relations?: MbUrlRelation[];
}

async function mb<T>(path: string): Promise<T | null> {
  const res = await fetch(`${MB_BASE}${path}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) {
    if (res.status !== 404) console.warn(`  MB ${res.status} on ${path.slice(0, 80)}`);
    return null;
  }
  return (await res.json()) as T;
}

async function lookupIsrc(isrc: string): Promise<MbRecording | null> {
  const d = await mb<{ recordings?: MbRecording[] }>(
    `/recording?query=isrc:${encodeURIComponent(isrc)}&fmt=json`,
  );
  return d?.recordings?.[0] ?? null;
}

async function lookupRelease(mbid: string): Promise<MbRelease | null> {
  return mb<MbRelease>(`/release/${encodeURIComponent(mbid)}?inc=url-rels&fmt=json`);
}

/**
 * Pull the Spotify / Apple / etc. URLs out of a release's relations array.
 * MusicBrainz uses fuzzy `type` labels — "free streaming", "streaming",
 * "purchase for download" — we sniff the URL itself for the platform.
 */
function extractPlatformUrls(rel: MbRelease): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of rel.relations ?? []) {
    const url = r.url?.resource;
    if (!url) continue;
    if (out.spotifyUrl === undefined && /^https:\/\/open\.spotify\.com\/album\//.test(url)) {
      out.spotifyUrl = url;
    }
    if (out.appleMusicUrl === undefined && /^https?:\/\/(music\.apple\.com|geo\.music\.apple\.com)\/[a-z]{2}\/album/i.test(url)) {
      // Normalize to US storefront for consistency
      out.appleMusicUrl = url.replace(/\/[a-z]{2}\/album/i, "/us/album");
    }
    if (out.tidalUrl === undefined && /^https?:\/\/(www\.)?tidal\.com\/album\//.test(url)) {
      out.tidalUrl = url;
    }
    if (out.deezerUrl === undefined && /^https?:\/\/www\.deezer\.com\/album\//.test(url)) {
      out.deezerUrl = url;
    }
    if (out.amazonMusicUrl === undefined && /^https?:\/\/music\.amazon\.com\/albums\//.test(url)) {
      out.amazonMusicUrl = url;
    }
    if (out.youtubeMusicUrl === undefined && /^https?:\/\/music\.youtube\.com\//.test(url)) {
      out.youtubeMusicUrl = url;
    }
  }
  return out;
}

interface ReleaseDoc {
  _id: string;
  title: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  tidalUrl?: string;
  amazonMusicUrl?: string;
  deezerUrl?: string;
  youtubeMusicUrl?: string;
  tracklist?: { title: string; isrc?: string }[];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const onlyArg = process.argv.indexOf("--only");
  const cap = onlyArg !== -1 ? parseInt(process.argv[onlyArg + 1] ?? "0", 10) : 0;
  console.log(`mode: ${dryRun ? "DRY RUN" : "WRITE"}`);

  // Pull every release missing spotifyUrl that has at least one ISRC
  const releases = await c.fetch<ReleaseDoc[]>(`
    *[_type == "release" && !defined(spotifyUrl) && count(tracklist[defined(isrc)]) > 0]
      | order(year asc) {
      _id, title, spotifyUrl, appleMusicUrl, tidalUrl, amazonMusicUrl, deezerUrl, youtubeMusicUrl,
      "tracklist": tracklist[]{ title, isrc }
    }
  `);
  const targets = cap > 0 ? releases.slice(0, cap) : releases;
  console.log(`\neligible (missing Spotify, has >=1 ISRC): ${releases.length}`);
  console.log(`targeting this run:                      ${targets.length}\n`);

  const stats = {
    spotify: 0,
    apple: 0,
    tidal: 0,
    deezer: 0,
    amazon: 0,
    ytm: 0,
    noRec: 0,
    noRelease: 0,
    noUrls: 0,
  };

  for (let i = 0; i < targets.length; i++) {
    const r = targets[i];
    const isrcs = (r.tracklist ?? []).map((t) => t.isrc).filter(Boolean) as string[];
    process.stdout.write(`[${i + 1}/${targets.length}] ${r.title.slice(0, 46).padEnd(46)} `);

    // Try ISRCs in order until one resolves to a MB recording with releases
    let recording: MbRecording | null = null;
    for (const isrc of isrcs) {
      recording = await lookupIsrc(isrc);
      await new Promise((res) => setTimeout(res, 1100)); // MB rate limit
      if (recording?.releases && recording.releases.length > 0) break;
    }
    if (!recording?.releases || recording.releases.length === 0) {
      console.log("✗ no MB recording");
      stats.noRec++;
      continue;
    }

    // Pull URL rels on the first release. Could iterate all releases if the
    // first doesn't have Spotify, but in practice first match is usually
    // the canonical master release.
    let urls: Record<string, string> = {};
    for (const rel of recording.releases.slice(0, 3)) {
      const fullRel = await lookupRelease(rel.id);
      await new Promise((res) => setTimeout(res, 1100));
      if (!fullRel) continue;
      const extracted = extractPlatformUrls(fullRel);
      // Merge — don't overwrite existing
      for (const [k, v] of Object.entries(extracted)) {
        if (!urls[k]) urls[k] = v;
      }
      if (urls.spotifyUrl) break; // got Spotify, that was our main goal
    }

    // Only patch fields where Sanity doesn't already have a value
    const patch: Record<string, string> = {};
    if (urls.spotifyUrl && !r.spotifyUrl) { patch.spotifyUrl = urls.spotifyUrl; stats.spotify++; }
    if (urls.appleMusicUrl && !r.appleMusicUrl) { patch.appleMusicUrl = urls.appleMusicUrl; stats.apple++; }
    if (urls.tidalUrl && !r.tidalUrl) { patch.tidalUrl = urls.tidalUrl; stats.tidal++; }
    if (urls.deezerUrl && !r.deezerUrl) { patch.deezerUrl = urls.deezerUrl; stats.deezer++; }
    if (urls.amazonMusicUrl && !r.amazonMusicUrl) { patch.amazonMusicUrl = urls.amazonMusicUrl; stats.amazon++; }
    if (urls.youtubeMusicUrl && !r.youtubeMusicUrl) { patch.youtubeMusicUrl = urls.youtubeMusicUrl; stats.ytm++; }

    const found = Object.keys(patch);
    if (found.length === 0) {
      console.log("✗ no platform URLs on MB release");
      stats.noUrls++;
    } else {
      console.log(`✓ ${found.map((k) => k.replace("Url", "")).join(" · ")}`);
      if (!dryRun) {
        await c.patch(r._id).set(patch).commit();
      }
    }
  }

  console.log(`\n──── SUMMARY ────`);
  console.log(`  spotify:        +${stats.spotify}`);
  console.log(`  apple:          +${stats.apple}`);
  console.log(`  tidal:          +${stats.tidal}`);
  console.log(`  deezer:         +${stats.deezer}`);
  console.log(`  amazon:         +${stats.amazon}`);
  console.log(`  youtube music:  +${stats.ytm}`);
  console.log(`  ─────────────`);
  console.log(`  no MB recording for any ISRC: ${stats.noRec}`);
  console.log(`  MB found but no platform URLs: ${stats.noUrls}`);
  if (dryRun) console.log(`\n  (DRY RUN — no Sanity writes.)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
