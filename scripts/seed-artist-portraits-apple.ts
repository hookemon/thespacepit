/**
 * Artist portraits via Apple Music — better than Wikipedia for most music
 * acts because Apple Music has the official artist promo photo, more
 * current and typically higher resolution than fan-uploaded Wikipedia pics.
 *
 * Flow:
 *   1. iTunes Search API (free, no auth) — search "musicArtist" by name
 *      → get back `artistLinkUrl` (e.g. https://music.apple.com/us/artist/run-the-jewels/489010472)
 *   2. Fetch that URL → scrape `og:image` (always the official artist photo
 *      on Apple Music artist pages — typically 1200x1200 square)
 *   3. Upload to Sanity, patch the artist's portrait field.
 *
 * Modes:
 *   --missing       only artists who currently have NO portrait (default)
 *   --all           every artist (overwrites Wikipedia portraits with Apple)
 *   --dry           preview only
 *   --limit N       process only first N candidates (testing)
 *   --replace-wiki  also re-source artists whose current portrait was
 *                   uploaded from Wikipedia (filename starts "portrait-")
 *                   — useful for the "great ones of everyone" upgrade pass
 *
 * Idempotent. Polite throttle (~3 req/sec).
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
const ALL = process.argv.includes("--all");
const REPLACE_WIKI = process.argv.includes("--replace-wiki");
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX >= 0 ? parseInt(process.argv[LIMIT_IDX + 1] ?? "0", 10) : 0;

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

type Artist = { _id: string; name: string; slug: string; portraitFile?: string };

async function itunesSearch(name: string): Promise<{ artistName: string; artistLinkUrl: string } | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=musicArtist&limit=10`;
    const res = await fetch(url, { headers: { "user-agent": UA }, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim()) return null;
    let data: { resultCount: number; results: Array<{ wrapperType: string; artistName: string; artistLinkUrl?: string; primaryGenreName?: string }> };
    try { data = JSON.parse(text); } catch { return null; }

    const norm = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
    const target = norm(name);
    const artistResults = data.results.filter((r) => r.wrapperType === "artist" && r.artistLinkUrl);
    // Tier 1: exact normalized match
    for (const r of artistResults) {
      if (norm(r.artistName) === target) return { artistName: r.artistName, artistLinkUrl: r.artistLinkUrl! };
    }
    // Tier 2: bidirectional substring match (e.g. "Azealia Banks" target,
    // result "Azealia Banks (feat...)" — fuzzy contains)
    for (const r of artistResults) {
      const rn = norm(r.artistName);
      if (rn.includes(target) || target.includes(rn)) return { artistName: r.artistName, artistLinkUrl: r.artistLinkUrl! };
    }
    // Tier 3: when there's only 1 artist result at all, take it (small confidence)
    if (artistResults.length === 1) return { artistName: artistResults[0].artistName, artistLinkUrl: artistResults[0].artistLinkUrl! };
    return null;
  } catch {
    clearTimeout(t);
    return null;
  }
}

async function fetchOgImage(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" }, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
            ?? html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (!m) return null;
    let src = m[1].trim();
    if (!/^https?:\/\//i.test(src)) src = new URL(src, url).toString();
    // Apple Music's og:image is a 1200x630 WIDE crop (social card). The
    // underlying photo is square at the source. Rewrite the size segment to
    // 1500x1500bb so we get a high-res SQUARE crop suitable for portraits.
    // URL pattern: .../mzstatic.com/.../{filename}.jpg/{W}x{H}{transform}.{ext}
    // transforms observed: bb (square), cw (wide-crop), cc (center-crop)
    src = src.replace(/\/(\d{2,4})x(\d{2,4})(bb|cw|cc|sr|fa)\.(jpg|jpeg|png|webp)$/i, "/1500x1500bb.jpg");
    return src;
  } catch {
    clearTimeout(t);
    return null;
  }
}

async function uploadImage(imgUrl: string, filename: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(imgUrl, { headers: { "user-agent": UA }, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 4096) return null;
    const ext = (ct.split("/")[1] ?? "jpg").split(";")[0].split("+")[0];
    const asset = await c.assets.upload("image", buf, { filename: `${filename}.${ext}`, contentType: ct });
    return asset._id;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // Build the working set based on mode.
  let filter = `*[_type == "artist" && defined(name)]`;
  if (!ALL) {
    if (REPLACE_WIKI) {
      // Only artists whose portrait was uploaded by the Wikipedia sweep
      // (its filenames all start with "portrait-{slug}"). Other custom
      // uploads we leave alone.
      filter = `*[_type == "artist" && (
        !defined(portrait)
        || portrait.asset->originalFilename match "portrait-*"
      )]`;
    } else {
      filter = `*[_type == "artist" && !defined(portrait)]`;
    }
  }
  const artists = await c.fetch<Artist[]>(`${filter} | order(name asc) {
    _id, name, "slug": slug.current,
    "portraitFile": portrait.asset->originalFilename
  }`);
  const work = LIMIT > 0 ? artists.slice(0, LIMIT) : artists;
  console.log(`\nApple Music portrait sourcing — ${work.length} artists${DRY ? " (DRY)" : ""}\n`);

  let ok = 0, noSearch = 0, noOg = 0, badUpload = 0;
  for (let i = 0; i < work.length; i += 1) {
    const a = work[i];
    const lbl = `[${String(i + 1).padStart(3, "0")}/${work.length}] ${a.name.padEnd(28)}`;
    const search = await itunesSearch(a.name);
    await sleep(2200);
    if (!search) {
      noSearch += 1;
      console.log(`✗ ${lbl}  — no Apple Music match`);
      continue;
    }
    const og = await fetchOgImage(search.artistLinkUrl);
    await sleep(2200);
    if (!og) {
      noOg += 1;
      console.log(`✗ ${lbl}  — no og:image on ${search.artistLinkUrl.replace(/^https?:\/\//, "")}`);
      continue;
    }
    if (DRY) {
      console.log(`✓ ${lbl}  would upload ${og.slice(0, 70)}`);
      continue;
    }
    const assetId = await uploadImage(og, `portrait-am-${a.slug ?? a._id}`);
    if (!assetId) {
      badUpload += 1;
      console.log(`⚠ ${lbl}  — upload failed`);
      continue;
    }
    try {
      await c.patch(a._id).set({ portrait: { _type: "image", asset: { _type: "reference", _ref: assetId } } }).commit();
      ok += 1;
      console.log(`✓ ${lbl}  → "${search.artistName}"`);
    } catch {
      badUpload += 1;
      console.log(`⚠ ${lbl}  — patch failed`);
    }
  }

  console.log(`\n done. uploaded=${ok}  noSearch=${noSearch}  noOg=${noOg}  badUpload=${badUpload}\n`);
})();
