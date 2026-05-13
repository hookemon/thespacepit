/**
 * Relationships LP + Head + Can't Tell Me Nothing press batch.
 *
 * Source: Yash Zadeh / Biz 3 PR recap email "PRESS UPDATE: NICK HOOK
 * 'RELATIONSHIPS' - 10/28/2016" forwarded to thespacepit@gmail.com.
 *
 * Each URL becomes a pressQuote doc tied to:
 *   · Relationships LP — most album-level pieces
 *   · "Gucci's" — singles pickup pieces
 *   · "Can't Tell Me Nothing" — singles pickup pieces
 *
 * Idempotent — stable id by SHA1(url) so re-runs upsert in place.
 * Skips any URL that already exists on a different doc (don't dupe).
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { createHash } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const DRY = process.argv.includes("--dry");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15";

const ERA_SLUG = "calm-collect";

type Item = {
  outlet: string;
  url: string;
  kind: "review" | "interview" | "feature" | "profile" | "mention" | "list-inclusion" | "premiere";
  date?: string;
  relatedReleaseSlug: string;
  featured?: boolean;
  headlineHint?: string;
  quoteHint?: string;
};

const NATIONAL_CONFIRMS: Item[] = [
  { outlet: "XXL",                 kind: "feature",   date: "2016-10-28", relatedReleaseSlug: "cc015-relationships", url: "http://www.xxlmag.com/news/2016/10/21-savage-ilovemakonnen-nick-hooks-relationships-album/", featured: true },
  { outlet: "The FADER",           kind: "feature",   date: "2016-10-27", relatedReleaseSlug: "cc015-relationships", url: "http://www.thefader.com/2016/10/27/fader-mix-nick-hook", headlineHint: "FADER Mix: Nick Hook", featured: true },
  { outlet: "Pitchfork",           kind: "feature",   date: "2016-10-21", relatedReleaseSlug: "cc015-relationships", url: "http://pitchfork.com/news/69176-nick-hook-announces-new-album-featuring-hudson-mohawke-deftones-chino-moreno-dj-rashad-more/", featured: true },
  { outlet: "Mass Appeal",         kind: "feature",   date: "2016-10-15", relatedReleaseSlug: "cc015-relationships", url: "https://www.youtube.com/watch?v=RBveQ9gXkAw", headlineHint: "Rhythm Roulette — Nick Hook", featured: true },
  { outlet: "FACT Magazine",       kind: "feature",   date: "2016-09-29", relatedReleaseSlug: "cc015-relationships", url: "https://www.youtube.com/watch?v=lv91yT_WAPA", headlineHint: "Against The Clock — Nick Hook", featured: true },
  { outlet: "Paper Magazine",      kind: "premiere",  date: "2016-09-28", relatedReleaseSlug: "cc016-cant-tell-me-nothing-remixes", url: "http://www.papermag.com/premiere-listen-to-salvas-remix-of-nick-hook-and-novelists-cant-tell-m-2020880022.html" },
  { outlet: "FACT Magazine",       kind: "feature",   date: "2016-10-05", relatedReleaseSlug: "cc015-relationships", url: "http://www.factmag.com/2016/10/05/nick-hook-in-the-studio/", headlineHint: "Nick Hook · In The Studio" },
  { outlet: "The FADER",           kind: "premiere",  date: "2016-09-01", relatedReleaseSlug: "cc016-cant-tell-me-nothing-remixes", url: "http://www.thefader.com/2016/09/01/novelist-nick-hook-cant-tell-me-nothing" },
];

const GUCCIS_PICKUPS: Item[] = [
  { outlet: "HotNewHipHop",        kind: "premiere",       date: "2016-10-20", relatedReleaseSlug: "cc015-relationships", url: "http://www.hotnewhiphop.com/nick-hook-guccis-feat-24hrs-new-song.1971670.html" },
  { outlet: "EDM Boutique",        kind: "premiere",       date: "2016-10-20", relatedReleaseSlug: "cc015-relationships", url: "http://edmboutique.com/nick-hook-guccis-feat-24hrs-fools-gold/" },
  { outlet: "The Hype Magazine",   kind: "premiere",       date: "2016-10-20", relatedReleaseSlug: "cc015-relationships", url: "http://www.thehypemagazine.com/2016/10/nick-hook-guccis/" },
  { outlet: "The Ransom Note",     kind: "feature",        date: "2016-10-20", relatedReleaseSlug: "cc015-relationships", url: "http://www.theransomnote.com/music/news/nick-hook-announces-debut-album-featuring-late-dj-rashad/" },
  { outlet: "Vents Magazine",      kind: "feature",        date: "2016-10-21", relatedReleaseSlug: "cc015-relationships", url: "http://ventsmagazine.com/2016/10/21/nick-hook-release-new-single-guccis-ft-24hrs/" },
  { outlet: "2DOPEBOYZ",           kind: "premiere",       date: "2016-10-20", relatedReleaseSlug: "cc015-relationships", url: "http://2dopeboyz.com/2016/10/20/nick-hook-guccis-24hrs/" },
  { outlet: "OnSmash",             kind: "premiere",       date: "2016-10-20", relatedReleaseSlug: "cc015-relationships", url: "http://onsmash.com/music/nick-hook-24hrs-guccis-new-song/" },
  { outlet: "DAGR8FM",             kind: "premiere",       date: "2016-10-20", relatedReleaseSlug: "cc015-relationships", url: "http://www.dagr8fm.com/premiere-nick-hook-drops-guccis-featuring-24hrs-talks-new-album-relationships/" },
  { outlet: "HipHopDaily",         kind: "premiere",       date: "2016-10-20", relatedReleaseSlug: "cc015-relationships", url: "http://www.hiphopdaily.com/71519" },
  { outlet: "Rapwave",             kind: "premiere",       date: "2016-10-20", relatedReleaseSlug: "cc015-relationships", url: "http://www.rapwave.net/2016/10/20/nick-hook-guccis-feat-24hrs/" },
  { outlet: "Trackblasters",       kind: "premiere",       date: "2016-10-20", relatedReleaseSlug: "cc015-relationships", url: "http://trackblasters.com/2016/10/20/nick-hook-feat-24hrs-guccis-audio/" },
  { outlet: "Music Bronx",         kind: "premiere",       date: "2016-10-20", relatedReleaseSlug: "cc015-relationships", url: "http://musicbronx.com/nick-hook-guccis-feat-24hrs/" },
];

const CTMN_PICKUPS: Item[] = [
  { outlet: "Hypetrak",            kind: "feature",        date: "2016-09-01", relatedReleaseSlug: "cc016-cant-tell-me-nothing-remixes", url: "http://hypetrak.com/2016/09/nick-hook-novelist-cant-tell-me-nothing-video/" },
  { outlet: "Paper Magazine",      kind: "feature",        date: "2016-09-01", relatedReleaseSlug: "cc016-cant-tell-me-nothing-remixes", url: "http://www.papermag.com/watch-the-whiplash-inducing-video-for-nick-hook-and-novelists-incredib-1994147261.html" },
  { outlet: "EDM Boutique",        kind: "feature",        date: "2016-09-01", relatedReleaseSlug: "cc016-cant-tell-me-nothing-remixes", url: "https://edmboutique.com/nick-hook-cant-tell-me-nothing-feat-novelist-official-video/" },
  { outlet: "RWD Magazine",        kind: "feature",        date: "2016-09-01", relatedReleaseSlug: "cc016-cant-tell-me-nothing-remixes", url: "http://rwdmag.com/novelist-links-up-with-fools-gold-producer-nick-hook-for-anarchic-banger-cant-tell-me-nothing/" },
];

const ALL: Item[] = [...NATIONAL_CONFIRMS, ...GUCCIS_PICKUPS, ...CTMN_PICKUPS];

function stableId(url: string): string {
  return `pressQuote-rel-${createHash("sha1").update(url).digest("hex").slice(0, 16)}`;
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
    const asset = await c.assets.upload("image", buf, { filename: `relationships-press-${Date.now()}.${ext}`, contentType: ct });
    return asset._id;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const eraId = await c.fetch<string | null>(`*[_type == "project" && slug.current == $s][0]._id`, { s: ERA_SLUG });
  if (!eraId) { console.error(`❌ era ${ERA_SLUG} not found`); process.exit(1); }

  // Pre-resolve release IDs
  const releaseSlugs = Array.from(new Set(ALL.map((i) => i.relatedReleaseSlug)));
  const releaseMap: Record<string, string> = {};
  for (const slug of releaseSlugs) {
    const r = await c.fetch<{ _id: string } | null>(`*[_type == "release" && slug.current == $s][0]{ _id }`, { s: slug });
    if (r) releaseMap[slug] = r._id;
    else console.log(`⚠ release "${slug}" not found in Sanity — skipping pieces`);
  }

  console.log(`\ningesting ${ALL.length} relationships LP press pieces${DRY ? " (DRY)" : ""}\n`);

  let created = 0, skipped = 0, patched = 0, failed = 0;
  for (let i = 0; i < ALL.length; i += 1) {
    const it = ALL[i];
    const releaseId = releaseMap[it.relatedReleaseSlug];
    if (!releaseId) { skipped += 1; continue; }
    const id = stableId(it.url);

    // Dedupe: check if a DIFFERENT doc already has this URL
    const existingByUrl = await c.fetch<{ _id: string; image?: { _ref: string } } | null>(
      `*[_type == "pressQuote" && url == $url && _id != $id][0]{ _id, "image": image.asset }`,
      { url: it.url, id }
    );
    if (existingByUrl) {
      skipped += 1;
      console.log(`↻ [${i + 1}/${ALL.length}] ${it.outlet.padEnd(22)}  — already exists as ${existingByUrl._id}`);
      continue;
    }

    const existing = await c.fetch<{ _id: string; image?: { _ref: string } } | null>(`*[_id == $id][0]{ _id, "image": image.asset }`, { id });
    const og = await fetchOg(it.url);
    const headline = it.headlineHint ?? og.title;
    const quote    = it.quoteHint ?? og.description ?? headline ?? "(see article)";
    const year     = it.date ? parseInt(it.date.slice(0, 4), 10) : undefined;

    let imageRef: { _type: "image"; asset: { _type: "reference"; _ref: string } } | undefined;
    if (og.image && (!existing?.image) && !DRY) {
      const assetId = await uploadImage(og.image, it.url);
      if (assetId) imageRef = { _type: "image", asset: { _type: "reference", _ref: assetId } };
    }

    const doc: Record<string, unknown> = {
      _id: id,
      _type: "pressQuote",
      kind: it.kind,
      headline,
      quote,
      excerpt: og.description,
      outlet: it.outlet,
      source: it.outlet,
      url: it.url,
      date: it.date,
      year,
      featured: it.featured ?? false,
      relatedRelease: { _type: "reference", _ref: releaseId },
      relatedEra: { _type: "reference", _ref: eraId },
      ...(imageRef ? { image: imageRef } : {}),
    };

    const lbl = `[${i + 1}/${ALL.length}] ${it.outlet.padEnd(22)}  ·  ${(headline ?? it.url).slice(0, 55)}`;
    if (DRY) { console.log(`+ ${lbl} ${og.image ? "· img" : ""}`); await sleep(250); continue; }

    try {
      if (existing) {
        await c.patch(existing._id).set({ headline, quote, outlet: it.outlet, source: it.outlet, url: it.url, date: it.date, year, kind: it.kind, relatedRelease: { _type: "reference", _ref: releaseId }, relatedEra: { _type: "reference", _ref: eraId } }).commit();
        patched += 1;
        console.log(`↻ ${lbl} ${imageRef ? "+ img" : ""}`);
      } else {
        await c.createIfNotExists(doc as any);
        created += 1;
        console.log(`+ ${lbl} ${imageRef ? "+ img" : ""}`);
      }
    } catch (err) {
      failed += 1;
      console.log(`✗ ${lbl} — ${(err as Error).message}`);
    }
    await sleep(250);
  }
  console.log(`\n done. created=${created} patched=${patched} skipped=${skipped} failed=${failed}\n`);
})();
