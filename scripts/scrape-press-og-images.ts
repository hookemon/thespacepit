/**
 * Scrape og:image off every pressQuote that has a URL but no image.
 *
 * For each eligible doc:
 *   1. fetch the article HTML (with a real-looking UA so publishers don't 403)
 *   2. parse <meta property="og:image"> (also twitter:image as fallback)
 *   3. resolve relative URLs against the page origin
 *   4. set `imageUrl` on the Sanity doc
 *
 * Also opportunistically backfills `headline` (og:title) + `excerpt`
 * (og:description) when those fields are missing — single fetch, more data.
 *
 * Polite: 800ms sleep between requests, 10s timeout per fetch, retries once
 * on 5xx. Skips obvious non-article URLs (twitter.com, instagram.com,
 * youtu.be — they don't expose useful og tags publicly).
 *
 * Usage:
 *   npx tsx scripts/scrape-press-og-images.ts            # commit
 *   npx tsx scripts/scrape-press-og-images.ts --dry-run  # preview
 *   npx tsx scripts/scrape-press-og-images.ts --only 10  # cap to 10 docs
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

// Try Chrome first. If we get a 403/406 (publisher anti-bot), retry as
// Googlebot — many news sites whitelist Google for SEO and let it through
// the WAF. Worst case, both fail and we move on.
const UA_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/120.0.0.0 Safari/537.36";
const UA_GOOGLEBOT =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

const SKIP_HOSTS = new Set([
  "twitter.com", "x.com", "t.co",
  "instagram.com", "www.instagram.com",
  "youtu.be", "youtube.com", "www.youtube.com",
  "tiktok.com", "vm.tiktok.com",
]);

function decode(s: string): string {
  // Cheap HTML-entity decode for the common ones in og:title / og:description.
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .trim();
}

function pickMeta(html: string, prop: string): string | null {
  // Match <meta property="X" content="Y"> OR <meta name="X" content="Y">
  // (some pages use name=, others property=, twitter:image uses name=).
  // Also handle reversed attribute order.
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decode(m[1]);
  }
  return null;
}

async function fetchWithTimeout(url: string, ua: string, ms = 10000): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      headers: {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: controller.signal,
      redirect: "follow",
    });
  } finally {
    clearTimeout(t);
  }
}

interface ScrapeResult {
  ogImage: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
}

async function scrape(url: string): Promise<ScrapeResult | null> {
  // Two-pass fetch: real Chrome UA first. On 403/406/429/5xx, retry as
  // Googlebot. If both fail, skip.
  async function tryFetch(ua: string): Promise<Response | null> {
    try {
      const r = await fetchWithTimeout(url, ua);
      return r;
    } catch (e) {
      console.log(`    ✗ fetch failed (${ua === UA_CHROME ? "chrome" : "googlebot"}): ${(e as Error).message}`);
      return null;
    }
  }

  let res = await tryFetch(UA_CHROME);
  if (!res || res.status === 403 || res.status === 406 || res.status === 429 || res.status >= 500) {
    await new Promise((r) => setTimeout(r, 600));
    const retry = await tryFetch(UA_GOOGLEBOT);
    if (retry && retry.ok) res = retry;
  }
  if (!res) return null;
  if (!res.ok) {
    console.log(`    ✗ HTTP ${res.status}`);
    return null;
  }
  const html = await res.text();
  let ogImage = pickMeta(html, "og:image") ?? pickMeta(html, "og:image:url") ?? pickMeta(html, "twitter:image");
  if (ogImage) {
    // Resolve relative URLs against the article URL
    try { ogImage = new URL(ogImage, url).toString(); } catch { /* ignore */ }
  }
  return {
    ogImage,
    ogTitle: pickMeta(html, "og:title"),
    ogDescription: pickMeta(html, "og:description") ?? pickMeta(html, "description"),
  };
}

interface PressDoc {
  _id: string;
  url: string;
  headline?: string;
  excerpt?: string;
  outlet?: string;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const onlyArg = process.argv.indexOf("--only");
  const cap = onlyArg !== -1 ? parseInt(process.argv[onlyArg + 1] ?? "0", 10) : 0;

  const all = await c.fetch<PressDoc[]>(
    `*[_type == "pressQuote" && defined(url) && !defined(image) && !defined(imageUrl)]
      | order(coalesce(date, "0000") desc) {
      _id, url, headline, excerpt, outlet
    }`,
  );

  // Filter out skip-hosts so we don't waste budget on twitter / IG embeds.
  const eligible = all.filter((d) => {
    try {
      const h = new URL(d.url).hostname.replace(/^www\./, "");
      return !SKIP_HOSTS.has(h);
    } catch {
      return false;
    }
  });

  const targets = cap > 0 ? eligible.slice(0, cap) : eligible;
  console.log(`mode: ${dryRun ? "DRY RUN" : "WRITE"}`);
  console.log(`eligible after host-skip:  ${eligible.length}`);
  console.log(`targeting this run:        ${targets.length}${cap ? ` (capped at --only ${cap})` : ""}`);
  console.log(`skipped social/video hosts: ${all.length - eligible.length}\n`);

  let imgCount = 0;
  let headlineCount = 0;
  let excerptCount = 0;
  let failedCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const d = targets[i];
    const host = new URL(d.url).hostname.replace(/^www\./, "");
    console.log(`[${i + 1}/${targets.length}] ${host}\n    ${d.url.slice(0, 100)}`);
    const result = await scrape(d.url);
    if (!result) {
      failedCount++;
      await new Promise((r) => setTimeout(r, 800));
      continue;
    }
    const patch: Record<string, string> = {};
    if (result.ogImage) {
      patch.imageUrl = result.ogImage;
      imgCount++;
    }
    if (!d.headline && result.ogTitle) {
      patch.headline = result.ogTitle.slice(0, 160);
      headlineCount++;
    }
    if (!d.excerpt && result.ogDescription) {
      patch.excerpt = result.ogDescription.slice(0, 400);
      excerptCount++;
    }
    const updates = Object.keys(patch);
    if (updates.length === 0) {
      console.log(`    ↪ no og tags found`);
      failedCount++;
    } else {
      console.log(`    ✓ ${updates.map((k) => `${k}=✓`).join(" · ")}`);
      if (!dryRun) {
        await c.patch(d._id).set(patch).commit();
      }
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`\n--- summary ---`);
  console.log(`  images scraped:   ${imgCount}`);
  console.log(`  headlines added:  ${headlineCount}`);
  console.log(`  excerpts added:   ${excerptCount}`);
  console.log(`  failed (no og):   ${failedCount}`);
  if (dryRun) console.log(`\n(DRY RUN — no Sanity writes.)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
