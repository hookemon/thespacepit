/**
 * Backfill appleMusicUrl on every release that's missing it.
 *
 * Strategy: iTunes Search API by artist + album name (FREE, no auth, polite
 * UA header). Spotify dashboard was busted — Apple's API is rock-solid.
 *
 * Why search over ISRC: Apple's ISRC lookup endpoint doesn't reliably index
 * our catalog (tested with 3 known ISRCs from your discog xlsx — all 0
 * results). Their FREE-TEXT search by `artist + title` resolves instantly
 * for the same albums. So we use search and score the candidates.
 *
 * Scoring rubric:
 *   - first-artist exact normalized match → +3
 *   - collectionName exact normalized match → +5
 *   - collectionName fuzzy contains → +2
 *   - release year within 2 of Apple releaseDate → +1
 *
 * Auto-apply if topScore >= 6. Lower confidence → logged for review.
 *
 * Usage:
 *   npx tsx scripts/backfill-apple-music.ts --dry-run
 *   npx tsx scripts/backfill-apple-music.ts
 *   npx tsx scripts/backfill-apple-music.ts --only 10  # cap for testing
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

interface ItunesAlbum {
  collectionId: number;
  collectionName: string;
  collectionViewUrl: string;
  artistName: string;
  releaseDate?: string;       // "2025-10-10T07:00:00Z"
  trackCount?: number;
}

function norm(s: string | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchAlbums(artist: string, title: string): Promise<ItunesAlbum[]> {
  const term = encodeURIComponent(`${artist} ${title}`);
  const res = await fetch(
    `https://itunes.apple.com/search?term=${term}&entity=album&limit=5&country=us`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    },
  );
  if (!res.ok) return [];
  try {
    const json = (await res.json()) as { results?: ItunesAlbum[] };
    return json.results ?? [];
  } catch {
    return [];
  }
}

function scoreAlbum(
  album: ItunesAlbum,
  wantArtist: string,
  wantTitle: string,
  wantYear?: number,
): number {
  let score = 0;
  const nwa = norm(wantArtist);
  const nwt = norm(wantTitle);
  const naa = norm(album.artistName);
  const nat = norm(album.collectionName);

  // Artist match
  if (naa === nwa) score += 3;
  else if (naa.includes(nwa) || nwa.includes(naa)) score += 1;

  // Title match
  if (nat === nwt) score += 5;
  else if (nat.includes(nwt) || nwt.includes(nat)) score += 2;
  else {
    // Word-overlap fallback — useful for "Relationships" vs "Relationships (Instrumentals)"
    const wa = new Set(nat.split(" ").filter((w) => w.length > 2));
    const wb = nwt.split(" ").filter((w) => w.length > 2);
    const overlap = wb.filter((w) => wa.has(w)).length;
    if (overlap >= 2) score += 1;
  }

  // Year match (within 2 years is fine — sometimes Apple has reissue dates)
  if (wantYear && album.releaseDate) {
    const ay = parseInt(album.releaseDate.slice(0, 4), 10);
    if (Math.abs(ay - wantYear) <= 1) score += 1;
  }

  return score;
}

interface ReleaseDoc {
  _id: string;
  title: string;
  slug: string;
  year?: number;
  appleMusicUrl?: string;
  artists: { name: string }[];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const onlyArg = process.argv.indexOf("--only");
  const cap = onlyArg !== -1 ? parseInt(process.argv[onlyArg + 1] ?? "0", 10) : 0;

  console.log(`mode: ${dryRun ? "DRY RUN" : "WRITE"}`);

  const releases = await c.fetch<ReleaseDoc[]>(`
    *[_type == "release" && !defined(appleMusicUrl)] | order(year asc) {
      _id, title, "slug": slug.current, year, appleMusicUrl,
      "artists": artists[]->{ name }
    }
  `);
  const targets = cap > 0 ? releases.slice(0, cap) : releases;
  console.log(`\nreleases missing appleMusicUrl: ${releases.length}`);
  console.log(`targeting this run:             ${targets.length}\n`);

  let written = 0;
  let lowScore = 0;
  let noResults = 0;
  const reviewQueue: { title: string; year?: number; candidates: ItunesAlbum[] }[] = [];

  for (const r of targets) {
    const firstArtist = r.artists?.[0]?.name;
    if (!firstArtist) {
      console.log(`  · ${r.title} — no artist, skipping`);
      continue;
    }

    const candidates = await searchAlbums(firstArtist, r.title);
    if (candidates.length === 0) {
      console.log(`  ✗ ${r.title.padEnd(40).slice(0, 40)} — no candidates`);
      noResults++;
      await new Promise((res) => setTimeout(res, 250));
      continue;
    }

    const scored = candidates
      .map((a) => ({ a, score: scoreAlbum(a, firstArtist, r.title, r.year) }))
      .sort((x, y) => y.score - x.score);
    const top = scored[0];

    if (top.score >= 6) {
      const url = top.a.collectionViewUrl.split("?")[0];
      console.log(`  ✓ ${r.title.padEnd(36).slice(0, 36)} → ${top.a.collectionName.slice(0, 30)} (score ${top.score})`);
      if (!dryRun) {
        await c.patch(r._id).set({ appleMusicUrl: url }).commit();
      }
      written++;
    } else {
      console.log(`  ? ${r.title.padEnd(36).slice(0, 36)} → top score ${top.score}, needs review`);
      lowScore++;
      reviewQueue.push({ title: r.title, year: r.year, candidates: scored.slice(0, 3).map((s) => s.a) });
    }
    await new Promise((res) => setTimeout(res, 250));
  }

  console.log(`\n──── SUMMARY ────`);
  console.log(`  Apple Music URLs written: ${written}`);
  console.log(`  low-confidence (review):  ${lowScore}`);
  console.log(`  no results from Apple:    ${noResults}`);
  if (dryRun) console.log(`\n  (DRY RUN — no Sanity writes.)`);

  if (reviewQueue.length > 0 && reviewQueue.length <= 25) {
    console.log(`\n──── NEEDS REVIEW (top candidate per Sanity release) ────`);
    for (const r of reviewQueue) {
      console.log(`\n  ${r.title} (${r.year ?? "?"}):`);
      for (const a of r.candidates) {
        console.log(`    ${a.collectionViewUrl}`);
        console.log(`      "${a.collectionName}" — ${a.artistName} (${a.releaseDate?.slice(0, 4) ?? "?"})`);
      }
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
