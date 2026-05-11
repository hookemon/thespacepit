/**
 * Scrape tracklists from Bandcamp for every release that has a bandcampUrl set
 * and doesn't already have a tracklist[] populated.
 *
 * Bandcamp pages embed full track data in a `data-tralbum` HTML attribute on
 * the <body> tag — we parse that JSON and extract titles + durations.
 *
 * Idempotent — pass `--force` to overwrite existing tracklists. Default skips
 * releases that already have one.
 *
 * Run:
 *   npx tsx scripts/scrape-tracklists.ts            # only fill missing
 *   npx tsx scripts/scrape-tracklists.ts --force    # overwrite everything
 *   npx tsx scripts/scrape-tracklists.ts --slug=without-you
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
const ONLY_SLUG = args.find((a) => a.startsWith("--slug="))?.replace("--slug=", "");

type Track = {
  title: string;
  duration?: string;
  feature?: string;
  note?: string;
  videoUrl?: string;
  audioPreviewUrl?: string;
};

type ReleaseRow = {
  _id: string;
  title: string;
  slug: string;
  bandcampUrl?: string;
  tracklistLen?: number;
  existing?: Track[];
};

// Loose title match for merging scraped data into existing rows.
function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function mergeWithExisting(scraped: Track[], existing: Track[] | undefined): Track[] {
  if (!existing || existing.length === 0) return scraped;
  const byTitle = new Map(existing.map((t) => [normalizeTitle(t.title), t]));
  return scraped.map((t) => {
    const prior = byTitle.get(normalizeTitle(t.title));
    if (!prior) return t;
    // Preserve hand-edited fields: videoUrl + note + custom feature.
    return {
      ...t,
      ...(prior.videoUrl ? { videoUrl: prior.videoUrl } : {}),
      ...(prior.note ? { note: prior.note } : {}),
      // Prefer the scraped feature unless we already have one
      ...(prior.feature && !t.feature ? { feature: prior.feature } : {}),
    };
  });
}

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function fmtDuration(secsRaw: number | undefined): string | undefined {
  if (!secsRaw || secsRaw <= 0) return undefined;
  const secs = Math.round(secsRaw);
  const mm = Math.floor(secs / 60);
  const ss = secs % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

// Strip "feat. X" / "ft. X" / "(feat. X)" from a title and return the cleaned
// title + featured artists separately. Handles the tricky cases:
//   "Title feat. X"                           → title="Title", feat="X"
//   "Title (feat. X)"                         → title="Title", feat="X"
//   "Title feat. X (Foo Bar Remix)"           → title="Title (Foo Bar Remix)", feat="X"
//   "Title (feat. X) (Foo Bar Remix)"         → title="Title (Foo Bar Remix)", feat="X"
function splitFeature(rawTitle: string): { title: string; feature?: string } {
  const t = rawTitle.trim();

  // 1. Parenthesized form anywhere: "Title (feat. X) [...rest...]"
  //    Carve the "(feat. X)" chunk out and stitch what's around it back together.
  const parenRe = /\s*[\(\[]\s*(?:feat\.?|featuring|ft\.?|w\/)\s+([^)\]]+?)\s*[\)\]]/i;
  const parenMatch = t.match(parenRe);
  if (parenMatch) {
    const before = t.slice(0, parenMatch.index!).trim();
    const after = t.slice(parenMatch.index! + parenMatch[0].length).trim();
    const title = [before, after].filter(Boolean).join(" ").trim();
    return { title, feature: parenMatch[1].trim().replace(/\s+/g, " ") };
  }

  // 2. Bare form: "Title feat. X [optional trailing parenthetical]"
  //    Capture feat. up to the next opening bracket so a remix annotation that
  //    follows stays with the title.
  const bareRe = /\s+(?:feat\.?|featuring|ft\.?)\s+/i;
  const bareMatch = t.match(bareRe);
  if (bareMatch) {
    const before = t.slice(0, bareMatch.index!).trim();
    const after = t.slice(bareMatch.index! + bareMatch[0].length);

    const bracketIdx = after.search(/\s+[\(\[]/);
    let feature: string;
    let trailing = "";
    if (bracketIdx >= 0) {
      feature = after.slice(0, bracketIdx).trim();
      trailing = after.slice(bracketIdx).trim();
    } else {
      feature = after.trim();
    }

    // Belt-and-suspenders: drop a trailing close-bracket if it survives.
    feature = feature.replace(/[\)\]]+$/, "").trim();

    const title = trailing ? `${before} ${trailing}` : before;
    const opens  = (title.match(/\(/g) ?? []).length;
    const closes = (title.match(/\)/g) ?? []).length;
    if (opens !== closes) {
      // Unbalanced after split — bail and keep original.
      return { title: t };
    }
    return { title: title.trim(), feature: feature.replace(/\s+/g, " ") };
  }

  return { title: t };
}

async function fetchTracklistFromBandcamp(url: string): Promise<Track[] | null> {
  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; spacepit-tracklist/1.0)" },
    });
    if (!res.ok) {
      console.warn(`    ⚠ ${res.status} fetching ${url}`);
      return null;
    }
    html = await res.text();
  } catch (err) {
    console.warn(`    ⚠ ${(err as Error).message}`);
    return null;
  }

  const m = html.match(/data-tralbum="([^"]+)"/);
  if (!m) {
    console.warn(`    ⚠ no data-tralbum on ${url}`);
    return null;
  }

  let parsed: { trackinfo?: { title?: string; duration?: number; file?: { "mp3-128"?: string } }[] };
  try {
    parsed = JSON.parse(decodeEntities(m[1]));
  } catch {
    console.warn(`    ⚠ failed to parse tralbum JSON`);
    return null;
  }

  const items = parsed.trackinfo ?? [];
  const tracks: Track[] = items
    .map((it) => {
      const raw = (it.title ?? "").trim();
      if (!raw) return null;
      const { title, feature } = splitFeature(raw);
      const duration = fmtDuration(it.duration);
      const audioPreviewUrl = it.file?.["mp3-128"];
      return {
        title,
        ...(feature ? { feature } : {}),
        ...(duration ? { duration } : {}),
        ...(audioPreviewUrl ? { audioPreviewUrl } : {}),
      };
    })
    .filter((t): t is Track => t !== null);

  return tracks.length > 0 ? tracks : null;
}

async function main() {
  // Pull all releases with a bandcampUrl. Skip ones with a tracklist unless
  // --force, and unless --slug=X is set in which case we only target one.
  const slugFilter = ONLY_SLUG ? `&& slug.current == "${ONLY_SLUG}"` : "";
  const tracklistFilter = FORCE ? "" : "&& (!defined(tracklist) || count(tracklist) == 0)";

  const rows = await client.fetch<ReleaseRow[]>(`
    *[
      _type == "release"
      && defined(bandcampUrl)
      && (withdrawn != true)
      ${slugFilter}
      ${tracklistFilter}
    ] | order(catalogNumber asc) {
      _id,
      title,
      "slug": slug.current,
      bandcampUrl,
      "tracklistLen": count(tracklist),
      "existing": tracklist[]{ title, videoUrl, note, feature }
    }
  `);

  if (rows.length === 0) {
    console.log("Nothing to do — no releases match the filter.");
    return;
  }

  console.log(`📀 Scraping ${rows.length} release${rows.length === 1 ? "" : "s"}...\n`);

  let okCount = 0;
  let skipCount = 0;
  for (const r of rows) {
    const label = `${r.title.padEnd(34, " ").slice(0, 34)}`;
    process.stdout.write(`  ${label} `);

    const scraped = await fetchTracklistFromBandcamp(r.bandcampUrl!);
    if (!scraped) {
      console.log(`✗ skipped`);
      skipCount += 1;
      continue;
    }

    // Merge — preserve videoUrl/note from existing rows where title matches.
    const tracks = mergeWithExisting(scraped, r.existing);
    const preserved = tracks.filter((t) => t.videoUrl).length;

    await client.patch(r._id).set({ tracklist: tracks }).commit({ autoGenerateArrayKeys: true });
    const previewCount = tracks.filter((t) => t.audioPreviewUrl).length;
    const suffix = preserved > 0 ? ` (${preserved} videoUrl preserved)` : "";
    console.log(`✓ ${tracks.length} tracks · ${previewCount} previews${suffix}`);
    okCount += 1;

    // Be polite — small gap between requests.
    await new Promise((res) => setTimeout(res, 300));
  }

  console.log(`\n✅ ${okCount} updated · ${skipCount} skipped`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
