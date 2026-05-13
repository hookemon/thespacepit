/**
 * Backfill press images.
 *
 * Walks every pressQuote that has a URL but no image, scrapes og:image from
 * the article (with fallbacks: twitter:image, link rel=image_src, first JSON-LD
 * image), uploads it to Sanity, and patches the doc.
 *
 * Idempotent — skips any doc that already has `image` set. Prints per-doc
 * status (✓ uploaded · ↻ skipped (had image) · ✗ no og:image · ⚠ fetch failed).
 *
 * Run:  npx tsx scripts/backfill-press-images.ts
 * Limit: --limit 20  (process only first 20 pieces; useful for testing)
 * Dry:   --dry  (scrape only, don't write to Sanity)
 *
 * Polite: 250ms throttle between requests + a desktop-Safari UA.
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

const DRY = process.argv.includes("--dry");
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX >= 0 ? parseInt(process.argv[LIMIT_IDX + 1] ?? "0", 10) : 0;

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

type PressDoc = {
  _id: string;
  url?: string;
  outlet?: string;
  source?: string;
  headline?: string;
  hasImage: boolean;
};

async function fetchOg(url: string): Promise<{ image?: string; rawHtml?: string }> {
  // 8s timeout — some sites stall forever on bot UAs.
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { headers: { "user-agent": UA, "accept": "text/html,application/xhtml+xml" }, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return {};
    const html = await res.text();
    const pick = (re: RegExp) => {
      const m = html.match(re);
      return m ? m[1].trim() : undefined;
    };
    let image =
      pick(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<meta[^>]+name=["']twitter:image:src["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i);
    // JSON-LD fallback — many news sites embed Article schema with image[]
    if (!image) {
      const ldMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
      if (ldMatch) {
        try {
          const data = JSON.parse(ldMatch[1].trim());
          const candidates: unknown[] = Array.isArray(data) ? data : [data];
          for (const d of candidates) {
            if (typeof d !== "object" || d === null) continue;
            const o = d as Record<string, unknown>;
            const img = o.image;
            if (typeof img === "string") { image = img; break; }
            if (Array.isArray(img) && typeof img[0] === "string") { image = img[0] as string; break; }
            if (img && typeof img === "object" && typeof (img as { url?: unknown }).url === "string") {
              image = (img as { url: string }).url;
              break;
            }
          }
        } catch {}
      }
    }
    // Resolve relative URLs against the article URL
    if (image && !/^https?:\/\//i.test(image)) {
      try { image = new URL(image, url).toString(); } catch {}
    }
    return { image, rawHtml: html };
  } catch {
    clearTimeout(t);
    return {};
  }
}

async function uploadImage(imageUrl: string, refUrl: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(imageUrl, { headers: { "user-agent": UA, "referer": refUrl }, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 1024) return null; // suspiciously small
    const ext = (ct.split("/")[1] ?? "jpg").split(";")[0];
    const filename = `press-og-${Date.now()}.${ext}`;
    const asset = await c.assets.upload("image", buf, { filename, contentType: ct });
    return asset._id;
  } catch (err) {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const docs = await c.fetch<PressDoc[]>(
    `*[_type == "pressQuote" && defined(url) && !defined(image)] | order(_createdAt desc) {
      _id, url, outlet, source, headline,
      "hasImage": defined(image)
    }`
  );
  const work = LIMIT > 0 ? docs.slice(0, LIMIT) : docs;
  console.log(`\nfound ${docs.length} press pieces with URL + no image. processing ${work.length}.${DRY ? " (DRY RUN)" : ""}\n`);

  let ok = 0, miss = 0, fail = 0;
  for (let i = 0; i < work.length; i += 1) {
    const d = work[i];
    const lbl = `[${i + 1}/${work.length}] ${(d.outlet ?? d.source ?? "?")}: ${(d.headline ?? d.url ?? "").slice(0, 60)}`;
    if (!d.url) continue;
    const og = await fetchOg(d.url);
    if (!og.image) {
      miss += 1;
      console.log(`✗ ${lbl} — no og:image`);
      await sleep(250);
      continue;
    }
    if (DRY) {
      ok += 1;
      console.log(`✓ ${lbl} — would upload ${og.image.slice(0, 80)}`);
      await sleep(250);
      continue;
    }
    const assetId = await uploadImage(og.image, d.url);
    if (!assetId) {
      fail += 1;
      console.log(`⚠ ${lbl} — upload failed`);
      await sleep(250);
      continue;
    }
    await c.patch(d._id).set({ image: { _type: "image", asset: { _type: "reference", _ref: assetId } } }).commit();
    ok += 1;
    console.log(`✓ ${lbl}`);
    await sleep(250);
  }
  console.log(`\n done. ok=${ok}  no-og-image=${miss}  upload-failed=${fail}\n`);
})();
