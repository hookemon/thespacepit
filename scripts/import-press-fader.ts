/**
 * Press import — The FADER artist archives for Nick Hook + Cubic Zirconia.
 * Sources:
 *   · https://www.thefader.com/artist/nick-hook
 *   · https://www.thefader.com/artist/cubic-zirconia
 *
 * Each URL becomes a pressQuote doc (or upserts an existing one), wired
 * to the right release + era. OG metadata + thumbnail are pulled at
 * import time to fill headline, description, and the image asset.
 *
 * Idempotent — stable id by SHA1(url) so re-runs are safe. Cross-checks
 * for any pre-existing doc on the same URL (from older imports like
 * import-press-relationships.ts) and patches instead of duplicating.
 *
 * Run:   npx tsx scripts/import-press-fader.ts          (real)
 *        npx tsx scripts/import-press-fader.ts --dry    (no writes)
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
const FADER_BASE = "https://www.thefader.com";

type Kind = "review" | "interview" | "feature" | "profile" | "mention" | "list-inclusion" | "premiere";
type Era = "calm-collect" | "cubic-zirconia" | "hookemon-records" | "lockhart-dynasty-calm-collect" | null;

type Item = {
  path: string;          // FADER path (joined with base)
  kind: Kind;
  date: string;          // YYYY-MM-DD
  releaseSlug?: string;  // optional — release to attach to
  eraSlug: Era;          // era to attach to (sometimes only era, no release)
  headlineHint?: string; // headline override if OG scrape fails
  featured?: boolean;
};

// Nick Hook artist archive (page 1 — 10 items)
const NICK_HOOK_ITEMS: Item[] = [
  { path: "/2016/12/14/nick-hook-relationships-album-video",            kind: "interview", date: "2016-12-14", releaseSlug: "cc015-relationships",                eraSlug: "calm-collect", featured: true, headlineHint: "Watch Nick Hook Explain The Inspiration Behind His Album, Relationships" },
  { path: "/2016/11/01/nick-hook-relationships-stream",                  kind: "premiere",  date: "2016-11-01", releaseSlug: "cc015-relationships",                eraSlug: "calm-collect", featured: true, headlineHint: "Listen To Nick Hook's Debut Full-Length Album, Relationships" },
  { path: "/2016/10/27/fader-mix-nick-hook",                             kind: "feature",   date: "2016-10-27", releaseSlug: "cc015-relationships",                eraSlug: "calm-collect", featured: true, headlineHint: "FADER Mix: Nick Hook" },
  { path: "/2016/09/01/novelist-nick-hook-cant-tell-me-nothing",         kind: "premiere",  date: "2016-09-01", releaseSlug: "cc016-cant-tell-me-nothing-remixes", eraSlug: "calm-collect" },
  { path: "/2014/11/29/stream-nick-hook-todd-edwards-kilo-kish-jaco",    kind: "premiere",  date: "2014-11-29", releaseSlug: "cc012-collage-v-1",                  eraSlug: "calm-collect", headlineHint: "Have A Perfect Day With This Sweet Collaboration From Nick Hook, Kilo Kish And Todd Edwards" },
  { path: "/2014/01/13/photos-cons-project-in-brooklyn-with-el-p-and-nick-hook", kind: "feature", date: "2014-01-13",                                                eraSlug: "calm-collect", headlineHint: "Photos: CONS Project in Brooklyn with El-P and Nick Hook" },
  { path: "/2014/01/10/make-beats-with-el-p-and-nick-hook-this-weekend-at-cons-project-brooklyn", kind: "feature", date: "2014-01-10",                            eraSlug: "calm-collect", headlineHint: "Make Beats with El-P and Nick Hook This Weekend at CONS Project: Brooklyn" },
  { path: "/2012/12/03/video-nick-hook-f-el-p-and-rood-sirens",          kind: "premiere",  date: "2012-12-03", releaseSlug: "hookemon001-without-you",            eraSlug: "hookemon-records", headlineHint: "Video: Nick Hook f. El-P and Rood, \"Sirens\"" },
  { path: "/2012/05/11/azealia-banks-jumanji-prod-by-hudson-mohawke-and-nick-hook-mp3", kind: "premiere", date: "2012-05-11", releaseSlug: "fantasea",            eraSlug: null, headlineHint: "Azealia Banks, \"Jumanji\" (Prod. by Hudson Mohawke and Nick Hook) MP3" },
  { path: "/2011/02/04/studio-time-with-l-vis-1990",                     kind: "feature",   date: "2011-02-04", releaseSlug: "neon-dreams-2011",                   eraSlug: null,  headlineHint: "Studio Time With L-Vis 1990" },
];

// Cubic Zirconia artist archive (pages 1 + 2 — 11 items)
const CUBIC_ZIRCONIA_ITEMS: Item[] = [
  { path: "/2014/02/21/video-tiombe-lockhart-gone",                                                   kind: "premiere", date: "2014-02-21",                                                eraSlug: "cubic-zirconia", headlineHint: "Video: Tiombe Lockhart, \"Gone\"" },
  { path: "/2012/01/26/video-cubic-zirconia-take-me-high-bart-b-more-remix",                          kind: "premiere", date: "2012-01-26", releaseSlug: "ldcc005-take-me-high",            eraSlug: "cubic-zirconia", headlineHint: "Video: Cubic Zirconia, \"Take Me High (Bart B More Remix)\"" },
  { path: "/2010/09/22/video-premiere-cubic-zirconia-hoes-come-out-at-night-night-slugs-test-pressing-giveaway", kind: "premiere", date: "2010-09-22", releaseSlug: "ldcc003-hoes-come-out-at-night", eraSlug: "cubic-zirconia", headlineHint: "Video Premiere: Cubic Zirconia, \"Hoes Come Out at Night\" & Night Slugs Test Pressing Giveaway" },
  { path: "/2010/06/25/the-let-out-sbtrkt-cubic-zirconia",                                            kind: "feature",  date: "2010-06-25",                                                eraSlug: "cubic-zirconia", headlineHint: "The Let Out: SBTRKT & Cubic Zirconia" },
  { path: "/2010/06/14/video-cubic-zirconia-f-spoek-mathambo-black-blue",                             kind: "premiere", date: "2010-06-14", releaseSlug: "ldcc002-black-blue",              eraSlug: "cubic-zirconia", headlineHint: "Video: Cubic Zirconia f. Spoek Mathambo, \"Black & Blue\"" },
  { path: "/2010/02/17/cubic-zirconia-josephine-greenmoney-trancestep-rmx-mp3",                       kind: "premiere", date: "2010-02-17", releaseSlug: "ldcc001-josephine",               eraSlug: "cubic-zirconia", headlineHint: "Cubic Zirconia, \"Josephine (Greenmoney Trancestep RMX)\" MP3" },
  { path: "/2010/02/03/video-premiere-cubic-zirconia-josephine",                                      kind: "premiere", date: "2010-02-03", releaseSlug: "ldcc001-josephine",               eraSlug: "cubic-zirconia", headlineHint: "Video Premiere: Cubic Zirconia, \"Josephine\"" },
  { path: "/2010/01/29/cubic-zirconia-josephine-minimix-mp3",                                         kind: "premiere", date: "2010-01-29", releaseSlug: "ldcc001-josephine",               eraSlug: "cubic-zirconia", headlineHint: "Cubic Zirconia, \"Josephine\" Minimix MP3" },
  { path: "/2009/09/16/kid-cudi-make-her-say-cubic-zirconia-rmx-mp3",                                 kind: "premiere", date: "2009-09-16",                                                eraSlug: "cubic-zirconia", headlineHint: "Kid Cudi, \"Make Her Say (Cubic Zirconia RMX)\" MP3" },
  { path: "/2009/06/23/nyc-win-tickets-to-cubic-zirconia-s-ep-release-party",                         kind: "feature",  date: "2009-06-23", releaseSlug: "fuck-work",                       eraSlug: "cubic-zirconia", headlineHint: "NYC: Win Tickets to Cubic Zirconia's EP Release Party" },
  { path: "/2009/05/28/video-premiere-cubic-zirconia-funk-work-dam-funk-remix",                       kind: "premiere", date: "2009-05-28", releaseSlug: "fuck-work",                       eraSlug: "cubic-zirconia", headlineHint: "Video Premiere: Cubic Zirconia 'Fuck Work' + Dam-Funk Remix" },
];

const ALL: Item[] = [...NICK_HOOK_ITEMS, ...CUBIC_ZIRCONIA_ITEMS];

function stableId(url: string): string {
  return `pressQuote-fader-${createHash("sha1").update(url).digest("hex").slice(0, 16)}`;
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
    const asset = await c.assets.upload("image", buf, { filename: `fader-press-${Date.now()}.${ext}`, contentType: ct });
    return asset._id;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // Pre-resolve era IDs
  const eraSlugs = Array.from(new Set(ALL.map((i) => i.eraSlug).filter((s): s is Exclude<Era, null> => s !== null)));
  const eraMap: Record<string, string> = {};
  for (const slug of eraSlugs) {
    const r = await c.fetch<{ _id: string } | null>(`*[_type == "project" && slug.current == $s][0]{ _id }`, { s: slug });
    if (r) eraMap[slug] = r._id;
    else console.log(`⚠ era "${slug}" not found in Sanity`);
  }

  // Pre-resolve release IDs
  const releaseSlugs = Array.from(new Set(ALL.map((i) => i.releaseSlug).filter((s): s is string => Boolean(s))));
  const releaseMap: Record<string, string> = {};
  for (const slug of releaseSlugs) {
    const r = await c.fetch<{ _id: string } | null>(`*[_type == "release" && slug.current == $s][0]{ _id }`, { s: slug });
    if (r) releaseMap[slug] = r._id;
    else console.log(`⚠ release "${slug}" not found in Sanity — that item will import without a release link`);
  }

  console.log(`\ningesting ${ALL.length} FADER press pieces${DRY ? " (DRY)" : ""}\n`);

  let created = 0, skipped = 0, patched = 0, failed = 0;
  for (let i = 0; i < ALL.length; i += 1) {
    const it = ALL[i];
    const url = FADER_BASE + it.path;
    const id = stableId(url);
    const releaseId = it.releaseSlug ? releaseMap[it.releaseSlug] : undefined;
    const eraId = it.eraSlug ? eraMap[it.eraSlug] : undefined;

    // Cross-check for any pre-existing doc with this URL on a different
    // _id (e.g. from import-press-relationships.ts which used a different
    // id prefix). If found, patch THAT doc; don't dupe.
    const existingByUrl = await c.fetch<{ _id: string } | null>(
      `*[_type == "pressQuote" && url == $url && _id != $id][0]{ _id }`,
      { url, id }
    );
    const targetId = existingByUrl?._id ?? id;
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
      outlet: "The FADER",
      source: "The FADER",
      url,
      date: it.date,
      year,
      featured: it.featured ?? false,
      author: undefined,
    };
    if (releaseId) baseDoc.relatedRelease = { _type: "reference", _ref: releaseId };
    if (eraId) baseDoc.relatedEra = { _type: "reference", _ref: eraId };
    if (imageRef) baseDoc.image = imageRef;

    const lbl = `[${(i + 1).toString().padStart(2, " ")}/${ALL.length}] ${it.date}  ${(headline ?? it.path).slice(0, 64)}`;
    if (DRY) {
      console.log(`+ ${lbl}${og.image ? " · img" : ""}${releaseId ? "" : " · NO_RELEASE"}`);
      await sleep(200);
      continue;
    }

    try {
      if (existing) {
        await c.patch(existing._id).set(baseDoc).commit();
        patched += 1;
        console.log(`↻ ${lbl}${imageRef ? " + img" : ""}`);
      } else {
        await c.createIfNotExists({ _id: targetId, _type: "pressQuote", ...baseDoc } as any);
        created += 1;
        console.log(`+ ${lbl}${imageRef ? " + img" : ""}${releaseId ? "" : " · era-only"}`);
      }
    } catch (err) {
      failed += 1;
      console.log(`✗ ${lbl} — ${(err as Error).message}`);
    }
    await sleep(250);
  }
  console.log(`\ndone. created=${created} patched=${patched} skipped=${skipped} failed=${failed}\n`);
})();
