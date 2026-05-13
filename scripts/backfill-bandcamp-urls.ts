/**
 * Backfill bandcampUrl on releases by scraping the Calm + Collect Bandcamp
 * storefront + Nick Hook's solo Bandcamp.
 *
 * Strategy: each Bandcamp profile page lists every release as <a class="item-link"
 * href="/album/SLUG">. We scrape both labels, get the full list, then for
 * each Sanity release without a bandcampUrl we fuzzy-match by title.
 *
 * No auth, no rate limit issues — Bandcamp pages are public HTML.
 *
 * Usage:
 *   npx tsx scripts/backfill-bandcamp-urls.ts --dry-run
 *   npx tsx scripts/backfill-bandcamp-urls.ts
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

const BC_HOSTS = [
  "https://calmcollect.bandcamp.com",
  "https://nickhook.bandcamp.com",
  "https://spiritualfriendship.bandcamp.com",
];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

interface BcAlbum {
  host: string;
  slug: string;       // /album/SLUG
  url: string;        // full URL
  title: string;
}

async function scrapeProfile(host: string): Promise<BcAlbum[]> {
  // Bandcamp's /music page is client-rendered. The full catalog is stored
  // in a single attribute on the music grid: `data-client-items` — a JSON-
  // encoded array of { title, artist, page_url, type, id, art_id }.
  const url = `${host}/music`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) {
    console.log(`  ✗ ${host} returned ${res.status}`);
    return [];
  }
  const html = await res.text();
  const out: BcAlbum[] = [];

  // 1. Static <a href="/album/SLUG"> for the first album (always rendered SSR)
  const ssrLink = /href="(\/album\/[^"]+)"/.exec(html);
  // We'll let the data-client-items capture it anyway, but keep this as a backstop.

  // 2. data-client-items JSON payload — the whole discog
  const dciMatch = /data-client-items="([^"]+)"/.exec(html);
  if (dciMatch) {
    const decoded = dciMatch[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    try {
      const items = JSON.parse(decoded) as Array<{
        title: string;
        page_url: string;
        type?: string;
      }>;
      for (const it of items) {
        if (!it.page_url) continue;
        // page_url is absolute (https://X.bandcamp.com/album/slug?label=...&tab=music)
        // Normalize: strip ?label and ?tab params for clean URLs.
        const clean = it.page_url.split("?")[0];
        // Pull slug for dedupe
        const slugMatch = /\/(album|track)\/([^/?]+)/.exec(clean);
        if (!slugMatch) continue;
        out.push({
          host,
          slug: `/${slugMatch[1]}/${slugMatch[2]}`,
          url: clean,
          title: it.title.replace(/\s+/g, " ").trim(),
        });
      }
    } catch (e) {
      console.log(`  ✗ ${host} JSON parse failed: ${(e as Error).message}`);
    }
  }

  // 3. Fallback for profiles that DON'T expose data-client-items (Spiritual
  //    Friendship's BC works this way — pure SSR). Grab every /album/SLUG
  //    and /track/SLUG link from the page and derive a title from the slug.
  if (out.length === 0) {
    const seen = new Set<string>();
    const linkRe = /href="(\/(album|track)\/[^"#?]+)"/g;
    let lm: RegExpExecArray | null;
    while ((lm = linkRe.exec(html))) {
      const slug = lm[1];
      if (seen.has(slug)) continue;
      seen.add(slug);
      // Derive title from slug: "spiritual-friendship" → "spiritual friendship"
      const slugTitle = slug
        .replace(/^\/(album|track)\//, "")
        .replace(/-/g, " ")
        .trim();
      out.push({
        host,
        slug,
        url: `${host}${slug}`,
        title: slugTitle,
      });
    }
  }

  // Always include SSR link as a final safety net
  if (ssrLink && !out.find((a) => a.slug === ssrLink[1])) {
    const titleMatch = /<p\s+class="title"[^>]*>([\s\S]*?)<\/p>/.exec(html);
    const title = titleMatch
      ? titleMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      : "(untitled)";
    out.push({ host, slug: ssrLink[1], url: `${host}${ssrLink[1]}`, title });
  }

  // Dedupe by slug
  const seen = new Set<string>();
  return out.filter((a) => {
    if (seen.has(a.slug)) return false;
    seen.add(a.slug);
    return true;
  });
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

/**
 * Score Bandcamp candidate `cand` against Sanity wanted title `want`.
 * Asymmetric — see in-body comments.
 */
function score(cand: string, want: string): number {
  const nc = norm(cand);
  const nw = norm(want);
  if (!nc || !nw) return 0;
  if (nc === nw) return 10;
  // Volume / sequel guard: if either title has a trailing volume marker
  // ("2", "vol 2", "ii", "v.2") that the other doesn't, these are DIFFERENT
  // releases (e.g. "Drums" vs "Drums 2", "Jungle Juice" vs "Jungle Juice v.1").
  const volumeRe = /\b(v(?:ol)?\.?\s*[12-9]|[2-9]|ii+|iv|v)$/i;
  const candHasVol = volumeRe.test(nc);
  const wantHasVol = volumeRe.test(nw);
  if (candHasVol !== wantHasVol) {
    // Drop hard — these are different volumes.
    return 0;
  }
  if (nc.includes(nw) || nw.includes(nc)) {
    const ratio = Math.min(nc.length, nw.length) / Math.max(nc.length, nw.length);
    // Bias: candidate longer than wanted (BC title with extra "ft. X" info)
    // → still likely same album, score higher. Wanted longer than candidate
    // (BC title is a stem like "Drums") → likely a DIFFERENT release, dock.
    const directionalBonus = nc.length >= nw.length ? 4 : 1;
    return 5 + ratio * directionalBonus;
  }
  const wa = new Set(nc.split(" ").filter((w) => w.length > 2));
  const wb = nw.split(" ").filter((w) => w.length > 2);
  const overlap = wb.filter((w) => wa.has(w)).length;
  if (overlap >= 2) return 2 + overlap * 0.5;
  return 0;
}

interface ReleaseDoc {
  _id: string;
  title: string;
  bandcampUrl?: string;
  artists: { name: string }[];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`mode: ${dryRun ? "DRY RUN" : "WRITE"}`);

  console.log(`\n→ Scraping Bandcamp profiles…`);
  const allAlbums: BcAlbum[] = [];
  for (const host of BC_HOSTS) {
    const albums = await scrapeProfile(host);
    console.log(`  ${host}/music → ${albums.length} albums`);
    allAlbums.push(...albums);
    await new Promise((res) => setTimeout(res, 400));
  }
  console.log(`  TOTAL: ${allAlbums.length} albums on Bandcamp\n`);

  if (allAlbums.length === 0) {
    console.error("✗ No albums scraped. Bandcamp may have changed their markup.");
    process.exit(1);
  }

  const releases = await c.fetch<ReleaseDoc[]>(`
    *[_type == "release" && !defined(bandcampUrl)] | order(year asc) {
      _id, title, bandcampUrl,
      "artists": artists[]->{ name }
    }
  `);
  console.log(`releases missing bandcampUrl: ${releases.length}\n`);

  let written = 0;
  let lowScore = 0;
  let noMatch = 0;
  const review: { sanityTitle: string; candidates: BcAlbum[] }[] = [];

  for (const r of releases) {
    const scored = allAlbums
      .map((a) => ({ a, score: score(a.title, r.title) }))
      .sort((x, y) => y.score - x.score);
    const top = scored[0];

    if (!top || top.score === 0) {
      noMatch++;
      console.log(`  · ${r.title.padEnd(40).slice(0, 40)} — not on Bandcamp`);
      continue;
    }
    if (top.score >= 6) {
      console.log(`  ✓ ${r.title.padEnd(36).slice(0, 36)} → ${top.a.title.slice(0, 30)} (score ${top.score.toFixed(1)})`);
      if (!dryRun) {
        await c.patch(r._id).set({ bandcampUrl: top.a.url }).commit();
      }
      written++;
    } else {
      lowScore++;
      console.log(`  ? ${r.title.padEnd(36).slice(0, 36)} → top "${top.a.title.slice(0, 28)}" (score ${top.score.toFixed(1)})`);
      review.push({ sanityTitle: r.title, candidates: scored.slice(0, 3).map((s) => s.a) });
    }
  }

  console.log(`\n──── SUMMARY ────`);
  console.log(`  Bandcamp URLs written: ${written}`);
  console.log(`  low-confidence:        ${lowScore}`);
  console.log(`  not on Bandcamp:       ${noMatch}`);
  if (dryRun) console.log(`\n  (DRY RUN — no Sanity writes.)`);

  if (review.length > 0 && review.length <= 20) {
    console.log(`\n──── NEEDS REVIEW (top 3 candidates each) ────`);
    for (const r of review) {
      console.log(`\n  ${r.sanityTitle}:`);
      for (const c of r.candidates) console.log(`    ${c.url}  —  "${c.title}"`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
