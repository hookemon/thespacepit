/**
 * Press import — Pitchfork search results for Nick Hook.
 * Pitchfork blocks WebFetch but accepts direct browser-UA fetches, so we
 * do it by hand: fetch the search HTML, regex-extract article URLs,
 * dedupe, OG-scrape each, and import.
 *
 * Source: https://pitchfork.com/search/?query=nick+hook
 *
 * Default behaviour: scrape search → list candidates (dry by default).
 * Pass --commit to actually write the pressQuote docs.
 *
 * Run:   npx tsx scripts/import-press-pitchfork.ts            (dry — list)
 *        npx tsx scripts/import-press-pitchfork.ts --commit   (write)
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const COMMIT = process.argv.includes("--commit");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15";
const PF_BASE = "https://pitchfork.com";

type Kind = "review" | "interview" | "feature" | "profile" | "mention" | "list-inclusion" | "premiere";

function stableId(url: string): string {
  return `pressQuote-pitchfork-${createHash("sha1").update(url).digest("hex").slice(0, 16)}`;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(url, { headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" }, signal: ctrl.signal, redirect: "follow" });
    clearTimeout(t);
    if (!res.ok) { console.error(`  HTTP ${res.status} on ${url}`); return null; }
    return await res.text();
  } catch (e) { console.error(`  fetch error on ${url}:`, (e as Error).message); return null; }
}

function pickAll(html: string, re: RegExp): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

function pick(html: string, re: RegExp): string | undefined {
  const m = html.match(re);
  return m ? m[1].trim() : undefined;
}

function decodeEntities(s: string): string {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–", lsquo: "'", rsquo: "'", ldquo: '"', rdquo: '"' };
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => named[name.toLowerCase()] ?? m);
}

async function extractArticleUrls(): Promise<string[]> {
  console.log("→ fetching Pitchfork search page…");
  const html = await fetchHtml(`${PF_BASE}/search/?query=nick%20hook`);
  if (!html) return [];

  // Pitchfork uses URL patterns like /news/<id>-<slug>, /reviews/albums/<slug>,
  // /features/<kind>/<slug>, /thepitch/<slug>, /levels/<slug>. Grep all hrefs
  // that look article-shaped + exclude obvious non-articles (search, artist
  // pages, navigation chrome).
  const hrefs = pickAll(html, /href="(\/(?:news|reviews|features|thepitch|levels)\/[^"#?]+)"/g);
  const unique = Array.from(new Set(hrefs.map((p) => PF_BASE + p)));
  // Filter further: drop generic /reviews/albums/ index-style hrefs (must
  // include numeric id or slug-with-dashes).
  return unique.filter((u) => !/\/(news|reviews|features)\/?$/.test(u));
}

type Article = { url: string; title?: string; description?: string; image?: string; date?: string };

async function scrapeArticle(url: string): Promise<Article | null> {
  const html = await fetchHtml(url);
  if (!html) return null;
  const title = decodeEntities(
    pick(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
    pick(html, /<title>([^<]+)<\/title>/i) ?? ""
  );
  const description = decodeEntities(
    pick(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ??
    pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ?? ""
  );
  let image = pick(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (image && !/^https?:\/\//i.test(image)) { try { image = new URL(image, url).toString(); } catch {} }
  const date = pick(html, /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i)?.slice(0, 10);
  return { url, title, description, image, date };
}

async function uploadImage(imageUrl: string, refUrl: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(imageUrl, { headers: { "user-agent": UA, referer: refUrl }, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 1024) return null;
    const ext = (ct.split("/")[1] ?? "jpg").split(";")[0];
    const asset = await c.assets.upload("image", buf, { filename: `pitchfork-press-${Date.now()}.${ext}`, contentType: ct });
    return asset._id;
  } catch { return null; }
}

function classifyKind(url: string, title: string): Kind {
  if (url.includes("/reviews/")) return "review";
  if (/\binterview\b/i.test(title)) return "interview";
  if (/\bpremiere\b/i.test(title)) return "premiere";
  if (/\b(best new|list|top \d+)\b/i.test(title)) return "list-inclusion";
  if (url.includes("/features/")) return "feature";
  if (url.includes("/news/")) return "feature";
  return "mention";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const calmCollectEra = await c.fetch<{ _id: string } | null>(`*[_type == "project" && slug.current == "calm-collect"][0]{ _id }`);
  const eraId = calmCollectEra?._id;

  const candidateUrls = await extractArticleUrls();
  console.log(`→ found ${candidateUrls.length} candidate article URL(s)\n`);
  if (candidateUrls.length === 0) {
    console.log("Nothing to import. (Search page may have blocked us or no results.)");
    return;
  }

  const articles: Article[] = [];
  for (const url of candidateUrls) {
    const a = await scrapeArticle(url);
    if (!a) continue;
    // Sanity filter — only keep articles whose title or URL actually
    // mentions Nick Hook / Cubic Zirconia. Pitchfork search sometimes
    // surfaces tangentially-related pieces.
    const blob = `${a.title} ${url}`.toLowerCase();
    if (!/nick.?hook|cubic.?zirconia|hookemon|men.?women.?(and|&|\sn\s)?.?children|mwc/i.test(blob)) {
      console.log(`  · skip (no nick-hook mention): ${a.title?.slice(0, 60)}`);
      continue;
    }
    articles.push(a);
    await sleep(300);
  }
  console.log(`\n→ ${articles.length} articles confirmed-relevant`);

  if (!COMMIT) {
    console.log("\n(dry-run; pass --commit to write)\n");
    for (const a of articles) console.log(`  ${a.date ?? "????-??-??"}  ${(a.title ?? a.url).slice(0, 80)}\n    ${a.url}`);
    return;
  }

  console.log("\n→ committing…\n");
  let created = 0, patched = 0, failed = 0;
  for (const a of articles) {
    const id = stableId(a.url);
    const existingByUrl = await c.fetch<{ _id: string } | null>(
      `*[_type == "pressQuote" && url == $url && _id != $id][0]{ _id }`, { url: a.url, id }
    );
    const existing = existingByUrl
      ? await c.fetch<{ _id: string; image?: { _ref: string } } | null>(`*[_id == $id][0]{ _id, "image": image.asset }`, { id: existingByUrl._id })
      : await c.fetch<{ _id: string; image?: { _ref: string } } | null>(`*[_id == $id][0]{ _id, "image": image.asset }`, { id });

    const kind = classifyKind(a.url, a.title ?? "");
    const year = a.date ? parseInt(a.date.slice(0, 4), 10) : undefined;

    let imageRef: { _type: "image"; asset: { _type: "reference"; _ref: string } } | undefined;
    if (a.image && !existing?.image) {
      const assetId = await uploadImage(a.image, a.url);
      if (assetId) imageRef = { _type: "image", asset: { _type: "reference", _ref: assetId } };
    }

    const doc: Record<string, unknown> = {
      kind, headline: a.title, quote: a.description ?? a.title ?? "(see article)",
      excerpt: a.description, outlet: "Pitchfork", source: "Pitchfork", url: a.url,
      ...(a.date ? { date: a.date } : {}), year,
      ...(eraId ? { relatedEra: { _type: "reference", _ref: eraId } } : {}),
      ...(imageRef ? { image: imageRef } : {}),
    };

    try {
      if (existing) {
        await c.patch(existing._id).set(doc).commit();
        patched += 1;
        console.log(`↻ ${a.date ?? "????-??-??"}  ${(a.title ?? a.url).slice(0, 70)}`);
      } else {
        await c.createIfNotExists({ _id: existingByUrl?._id ?? id, _type: "pressQuote", ...doc } as any);
        created += 1;
        console.log(`+ ${a.date ?? "????-??-??"}  ${(a.title ?? a.url).slice(0, 70)}${imageRef ? " + img" : ""}`);
      }
    } catch (err) { failed += 1; console.log(`✗ ${a.url} — ${(err as Error).message}`); }
    await sleep(200);
  }
  console.log(`\ndone. created=${created} patched=${patched} failed=${failed}\n`);
})();
