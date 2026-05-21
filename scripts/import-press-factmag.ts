/**
 * Press import — FACT Magazine for Nick Hook.
 * Sources:
 *   · https://www.factmag.com/?s=nick%20hook  (search)
 *   · https://www.factmag.com/tag/nick-hook/  (tag archive)
 *
 * Deduped union of both = 16 unique URLs. Each becomes a pressQuote doc
 * (or upserts an existing one), wired to the right release + era. OG
 * metadata + thumbnail are pulled at import time.
 *
 * Idempotent — stable id by SHA1(url). Cross-checks pre-existing docs by
 * URL (e.g. import-press-relationships.ts created the FACT "In The Studio"
 * piece already) and patches instead of duplicating.
 *
 * Run:   npx tsx scripts/import-press-factmag.ts          (real)
 *        npx tsx scripts/import-press-factmag.ts --dry    (no writes)
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
const FACT_BASE = "https://www.factmag.com";

type Kind = "review" | "interview" | "feature" | "profile" | "mention" | "list-inclusion" | "premiere";
type Era = "calm-collect" | "cubic-zirconia" | "hookemon-records" | "lockhart-dynasty-calm-collect" | null;

type Item = {
  path: string;
  kind: Kind;
  date: string;
  releaseSlug?: string;
  eraSlug: Era;
  headlineHint?: string;
  featured?: boolean;
};

const ITEMS: Item[] = [
  { path: "/2020/07/11/nick-hook-3asic-need-4-speed/",                                                  kind: "premiere",  date: "2020-07-11", releaseSlug: "cc005-need-for-speed",                eraSlug: "calm-collect", headlineHint: "Nick Hook and 3ASiC have a 'Need 4 Speed' in their frenetic new video" },
  { path: "/2019/08/12/fact-mix-722-nick-hook/",                                                        kind: "feature",   date: "2019-08-12",                                                     eraSlug: "calm-collect", featured: true, headlineHint: "FACT mix 722: Nick Hook" },
  { path: "/2017/12/22/nick-hook-dj-earl-mood-right-now-video-interview/",                              kind: "interview", date: "2017-12-22", releaseSlug: "cc017-50-backwoods",                  eraSlug: "calm-collect", headlineHint: "Nick Hook and DJ Earl on their collab album 50 Backwoods and new video for 'Mood Right Now'" },
  { path: "/2016/11/01/nick-hook-relationships-fools-gold/",                                            kind: "feature",   date: "2016-11-01", releaseSlug: "cc015-relationships",                 eraSlug: "calm-collect", featured: true, headlineHint: "Nick Hook releases Relationships featuring Novelist, Hudson Mohawke and more" },
  { path: "/2016/10/05/nick-hook-in-the-studio/",                                                       kind: "feature",   date: "2016-10-05", releaseSlug: "cc015-relationships",                 eraSlug: "calm-collect", featured: true, headlineHint: "Nick Hook · In The Studio" },
  { path: "/2016/09/29/nick-hook-against-the-clock/",                                                   kind: "feature",   date: "2016-09-29", releaseSlug: "cc015-relationships",                 eraSlug: "calm-collect", featured: true, headlineHint: "Nick Hook · Against The Clock" },
  { path: "/2016/05/10/nick-hook-head-featuring-21-savage-bulletproof-dolphin/",                        kind: "premiere",  date: "2016-05-10", releaseSlug: "cc015-relationships",                 eraSlug: "calm-collect", headlineHint: "Nick Hook enlists 21 Savage and Bulletproof Dolphin on 'Head'" },
  { path: "/2015/05/20/stream-nick-hook-j-a-m-i-t-neana-remix/",                                        kind: "premiere",  date: "2015-05-20", releaseSlug: "cc013-collage-v-1-remixes",           eraSlug: "calm-collect", headlineHint: "Stream Neana's tidy remix of Nick Hook, from Collage v.1 Remixes" },
  { path: "/2014/11/29/hear-jaco-nick-hooks-uplifting-collaboration-with-todd-edwards-and-kilo-kish/",  kind: "premiere",  date: "2014-11-29", releaseSlug: "cc012-collage-v-1",                   eraSlug: "calm-collect", headlineHint: "Hear 'Jaco', Nick Hook's uplifting collaboration with Todd Edwards and Kilo Kish" },
  { path: "/2014/11/22/lets-jam-nick-hook-and-egyptian-lover-j-a-m-i-t-for-serato-and-ninja-tune-collage-v-1-ep/", kind: "feature", date: "2014-11-22", releaseSlug: "cc012-collage-v-1",          eraSlug: "calm-collect", headlineHint: "Let's Jam! Nick Hook and Egyptian Lover 'J.A.M.I.T' for Serato and Ninja Tune's Collage V.1 EP" },
  { path: "/2013/03/04/nick-hook-vin-sol-and-matrixxman-come-together-for-a-raucous-ep-on-classicworks/", kind: "feature", date: "2013-03-04", releaseSlug: "cc010-i-can-feel-it-ep",              eraSlug: "calm-collect", headlineHint: "Nick Hook, Vin Sol, and Matrixxman come together for a raucous EP on Classicworks" },
  { path: "/2013/01/10/legowelt-gerd-and-mr-beatnick-sign-up-for-tender-hooks-night-in-february/",       kind: "feature",  date: "2013-01-10",                                                     eraSlug: "calm-collect", headlineHint: "Legowelt, Gerd and Mr. Beatnick sign up for Tender Hooks night in February" },
  { path: "/2012/10/09/download-renaissance-man-nick-hooks-without-you-ep/",                            kind: "feature",   date: "2012-10-09", releaseSlug: "hookemon001-without-you",             eraSlug: "hookemon-records", headlineHint: "Download renaissance man Nick Hook's Without You EP" },
  { path: "/2012/10/05/111646/",                                                                        kind: "premiere",  date: "2012-10-05", releaseSlug: "hookemon001-without-you",             eraSlug: "hookemon-records", headlineHint: "Premiere another track from Azealia Banks and Hud Mo collaborator Nick Hook's Without You" },
  { path: "/2012/10/03/stream-nick-hooks-medium-rare-a-collaboration-with-machinedrum-from-his-forthcoming-ep/", kind: "premiere", date: "2012-10-03", releaseSlug: "hookemon001-without-you",      eraSlug: "hookemon-records", headlineHint: "Stream Nick Hook's 'Medium Rare', a collaboration with Machinedrum from his forthcoming EP" },
  { path: "/2012/05/11/stream-azealia-banks-jumanji/",                                                  kind: "premiere",  date: "2012-05-11", releaseSlug: "fantasea",                            eraSlug: null,            headlineHint: "Stream Azealia Banks' 'Jumanji', produced by Hudson Mohawke and Nick Hook" },
];

function stableId(url: string): string {
  return `pressQuote-factmag-${createHash("sha1").update(url).digest("hex").slice(0, 16)}`;
}

async function fetchOg(url: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, signal: ctrl.signal });
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
    if (image && !/^https?:\/\//i.test(image)) {
      try { image = new URL(image, url).toString(); } catch {}
    }
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
    const asset = await c.assets.upload("image", buf, { filename: `factmag-press-${Date.now()}.${ext}`, contentType: ct });
    return asset._id;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const eraSlugs = Array.from(new Set(ITEMS.map((i) => i.eraSlug).filter((s): s is Exclude<Era, null> => s !== null)));
  const eraMap: Record<string, string> = {};
  for (const slug of eraSlugs) {
    const r = await c.fetch<{ _id: string } | null>(`*[_type == "project" && slug.current == $s][0]{ _id }`, { s: slug });
    if (r) eraMap[slug] = r._id;
    else console.log(`⚠ era "${slug}" not found in Sanity`);
  }

  const releaseSlugs = Array.from(new Set(ITEMS.map((i) => i.releaseSlug).filter((s): s is string => Boolean(s))));
  const releaseMap: Record<string, string> = {};
  for (const slug of releaseSlugs) {
    const r = await c.fetch<{ _id: string } | null>(`*[_type == "release" && slug.current == $s][0]{ _id }`, { s: slug });
    if (r) releaseMap[slug] = r._id;
    else console.log(`⚠ release "${slug}" not found in Sanity — item will import without a release link`);
  }

  console.log(`\ningesting ${ITEMS.length} FACT Magazine press pieces${DRY ? " (DRY)" : ""}\n`);

  let created = 0, patched = 0, skipped = 0, failed = 0;
  for (let i = 0; i < ITEMS.length; i += 1) {
    const it = ITEMS[i];
    const url = FACT_BASE + it.path;
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
    const year     = parseInt(it.date.slice(0, 4), 10);

    let imageRef: { _type: "image"; asset: { _type: "reference"; _ref: string } } | undefined;
    if (og.image && !existing?.image && !DRY) {
      const assetId = await uploadImage(og.image, url);
      if (assetId) imageRef = { _type: "image", asset: { _type: "reference", _ref: assetId } };
    }

    const baseDoc: Record<string, unknown> = {
      kind: it.kind,
      headline,
      quote,
      excerpt: og.description,
      outlet: "FACT Magazine",
      source: "FACT Magazine",
      url,
      date: it.date,
      year,
      featured: it.featured ?? false,
    };
    if (releaseId) baseDoc.relatedRelease = { _type: "reference", _ref: releaseId };
    if (eraId) baseDoc.relatedEra = { _type: "reference", _ref: eraId };
    if (imageRef) baseDoc.image = imageRef;

    const lbl = `[${(i + 1).toString().padStart(2, " ")}/${ITEMS.length}] ${it.date}  ${(headline ?? it.path).slice(0, 70)}`;
    if (DRY) {
      console.log(`+ ${lbl}${og.image ? " · img" : ""}${releaseId ? "" : " · NO_RELEASE"}`);
      await sleep(150);
      continue;
    }

    try {
      if (existing) {
        await c.patch(existing._id).set(baseDoc).commit();
        patched += 1;
        console.log(`↻ ${lbl}${imageRef ? " + img" : ""}`);
      } else {
        const targetId = existingByUrl?._id ?? id;
        await c.createIfNotExists({ _id: targetId, _type: "pressQuote", ...baseDoc } as any);
        created += 1;
        console.log(`+ ${lbl}${imageRef ? " + img" : ""}${releaseId ? "" : " · era-only"}`);
      }
    } catch (err) {
      failed += 1;
      console.log(`✗ ${lbl} — ${(err as Error).message}`);
    }
    await sleep(200);
  }
  console.log(`\ndone. created=${created} patched=${patched} skipped=${skipped} failed=${failed}\n`);
})();
