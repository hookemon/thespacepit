/**
 * Press import — Complex.com search results for Nick Hook.
 * Source: https://www.complex.com/search?q=nick+hook (7 surfaced; page reports 16 total)
 *
 * Idempotent SHA1(url) IDs; URL cross-check patches pre-existing docs.
 *
 * Run:   npx tsx scripts/import-press-complex.ts
 *        npx tsx scripts/import-press-complex.ts --dry
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

const DRY = process.argv.includes("--dry");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15";
const COMPLEX_BASE = "https://www.complex.com";

type Kind = "review" | "interview" | "feature" | "profile" | "mention" | "list-inclusion" | "premiere";
type Era = "calm-collect" | "cubic-zirconia" | "hookemon-records" | "lockhart-dynasty-calm-collect" | null;

type Item = { path: string; kind: Kind; date?: string; year?: number; releaseSlug?: string; eraSlug: Era; headlineHint?: string; featured?: boolean };

const ITEMS: Item[] = [
  { path: "/music/a/erich-donaldson/video-nick-hook-f-el-p-rood-sirens",                                kind: "premiere",  year: 2012, releaseSlug: "hookemon001-without-you",       eraSlug: "hookemon-records", headlineHint: "Video: Nick Hook f/ EL-P & Rood \"Sirens\"" },
  { path: "/music/a/khrisd/young-thug-freddie-gibbs-aap-ferg-old-english-prod-salva-nick-hook",         kind: "premiere",  year: 2014, releaseSlug: "old-english-2014",              eraSlug: "calm-collect", headlineHint: "Young Thug, Freddie Gibbs & A$AP Ferg — \"Old English\" (Prod. by Salva & Nick Hook)" },
  { path: "/music/a/khrisd/baauer-searching-for-sound-red-bull-documentary",                           kind: "feature",   year: 2015,                                                  eraSlug: "calm-collect", headlineHint: "Red Bull Followed Baauer and Nick Hook Around the World as They Went \"Searching For Sound\"" },
  { path: "/music/a/marcusd4d6dc4c07/nick-hook-and-todd-edwards-ft-kilo-kish-jaco",                    kind: "premiere",  date: "2014-11-29", releaseSlug: "cc012-collage-v-1",     eraSlug: "calm-collect", headlineHint: "Nick Hook and Todd Edwards ft. Kilo Kish — \"Jaco\"" },
  { path: "/music/a/jacob-davey/interview-nick-hook",                                                  kind: "interview", date: "2016-10-20", releaseSlug: "cc015-relationships",   eraSlug: "calm-collect", featured: true, headlineHint: "Premiere: Nick Hook Drops \"Gucci's\" Featuring 24hrs, Talks New Album 'Relationships'" },
  { path: "/music/a/jacob-davey/novelist-nick-hook",                                                   kind: "premiere",  date: "2016-09-01", releaseSlug: "cc016-cant-tell-me-nothing-remixes", eraSlug: "calm-collect", headlineHint: "Novelist And Nick Hook Combine To Devastating Effect On \"Can't Tell Me Nothing\"" },
  { path: "/music/a/khrisd/baauer-nick-hook-reddit-ama",                                               kind: "feature",   year: 2015,                                                  eraSlug: "calm-collect", headlineHint: "10 Things We Learned From Baauer and Nick Hook's Reddit AMA" },
];

function stableId(url: string): string {
  return `pressQuote-complex-${createHash("sha1").update(url).digest("hex").slice(0, 16)}`;
}

async function fetchOg(url: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, signal: ctrl.signal, redirect: "follow" });
    clearTimeout(t);
    if (!res.ok) return {} as { title?: string; description?: string; image?: string };
    const html = await res.text();
    const pick = (re: RegExp) => {
      const m = html.match(re);
      return m ? m[1].trim() : undefined;
    };
    let image =
      pick(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (image && !/^https?:\/\//i.test(image)) { try { image = new URL(image, url).toString(); } catch {} }
    return {
      title: pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ?? pick(/<title>([^<]+)<\/title>/i),
      description: pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ?? pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
      image,
    };
  } catch {
    clearTimeout(t);
    return {} as { title?: string; description?: string; image?: string };
  }
}

async function uploadImage(imageUrl: string, refUrl: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(imageUrl, { headers: { "user-agent": UA, referer: refUrl }, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 1024) return null;
    const ext = (ct.split("/")[1] ?? "jpg").split(";")[0];
    const asset = await c.assets.upload("image", buf, { filename: `complex-press-${Date.now()}.${ext}`, contentType: ct });
    return asset._id;
  } catch { return null; }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const eraSlugs = Array.from(new Set(ITEMS.map((i) => i.eraSlug).filter((s): s is Exclude<Era, null> => s !== null)));
  const eraMap: Record<string, string> = {};
  for (const slug of eraSlugs) {
    const r = await c.fetch<{ _id: string } | null>(`*[_type == "project" && slug.current == $s][0]{ _id }`, { s: slug });
    if (r) eraMap[slug] = r._id;
  }
  const releaseSlugs = Array.from(new Set(ITEMS.map((i) => i.releaseSlug).filter((s): s is string => Boolean(s))));
  const releaseMap: Record<string, string> = {};
  for (const slug of releaseSlugs) {
    const r = await c.fetch<{ _id: string } | null>(`*[_type == "release" && slug.current == $s][0]{ _id }`, { s: slug });
    if (r) releaseMap[slug] = r._id;
    else console.log(`⚠ release "${slug}" not found`);
  }

  console.log(`\ningesting ${ITEMS.length} Complex press pieces${DRY ? " (DRY)" : ""}\n`);

  let created = 0, patched = 0, failed = 0;
  for (let i = 0; i < ITEMS.length; i += 1) {
    const it = ITEMS[i];
    const url = COMPLEX_BASE + it.path;
    const id = stableId(url);
    const releaseId = it.releaseSlug ? releaseMap[it.releaseSlug] : undefined;
    const eraId = it.eraSlug ? eraMap[it.eraSlug] : undefined;

    const existingByUrl = await c.fetch<{ _id: string } | null>(
      `*[_type == "pressQuote" && url == $url && _id != $id][0]{ _id }`,
      { url, id }
    );
    const existing = existingByUrl
      ? await c.fetch<{ _id: string; image?: { _ref: string } } | null>(`*[_id == $id][0]{ _id, "image": image.asset }`, { id: existingByUrl._id })
      : await c.fetch<{ _id: string; image?: { _ref: string } } | null>(`*[_id == $id][0]{ _id, "image": image.asset }`, { id });

    const og = await fetchOg(url);
    const headline = og.title ?? it.headlineHint;
    const quote    = og.description ?? headline ?? "(see article)";
    const year     = it.date ? parseInt(it.date.slice(0, 4), 10) : it.year;

    let imageRef: { _type: "image"; asset: { _type: "reference"; _ref: string } } | undefined;
    if (og.image && !existing?.image && !DRY) {
      const assetId = await uploadImage(og.image, url);
      if (assetId) imageRef = { _type: "image", asset: { _type: "reference", _ref: assetId } };
    }

    const baseDoc: Record<string, unknown> = {
      kind: it.kind, headline, quote, excerpt: og.description,
      outlet: "Complex", source: "Complex", url,
      ...(it.date ? { date: it.date } : {}),
      year, featured: it.featured ?? false,
    };
    if (releaseId) baseDoc.relatedRelease = { _type: "reference", _ref: releaseId };
    if (eraId) baseDoc.relatedEra = { _type: "reference", _ref: eraId };
    if (imageRef) baseDoc.image = imageRef;

    const lbl = `[${(i + 1).toString().padStart(2, " ")}/${ITEMS.length}] ${it.date ?? `~${it.year ?? "????"}`}  ${(headline ?? it.path).slice(0, 65)}`;
    if (DRY) { console.log(`+ ${lbl}${og.image ? " · img" : ""}${releaseId ? "" : " · NO_RELEASE"}`); await sleep(150); continue; }

    try {
      if (existing) {
        await c.patch(existing._id).set(baseDoc).commit();
        patched += 1;
        console.log(`↻ ${lbl}${imageRef ? " + img" : ""}`);
      } else {
        await c.createIfNotExists({ _id: existingByUrl?._id ?? id, _type: "pressQuote", ...baseDoc } as any);
        created += 1;
        console.log(`+ ${lbl}${imageRef ? " + img" : ""}${releaseId ? "" : " · era-only"}`);
      }
    } catch (err) {
      failed += 1;
      console.log(`✗ ${lbl} — ${(err as Error).message}`);
    }
    await sleep(200);
  }
  console.log(`\ndone. created=${created} patched=${patched} failed=${failed}\n`);
})();
