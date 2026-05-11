/**
 * Ingest a single press piece from a URL into Sanity.
 *
 * Scrapes the article's og:title, og:image, og:description, twitter:image.
 * Attaches the og:image as the press piece's image. Creates a pressQuote doc
 * with metadata + optional era/release/artist references.
 *
 * Usage:
 *   npx tsx scripts/add-press.ts \
 *     --url "https://pitchfork.com/reviews/albums/..." \
 *     --kind review \
 *     --era men-women-children \
 *     --release some-release-slug \
 *     --quote "the standout line" \
 *     --author "Author Name"
 *
 * Flags:
 *   --url       (required)  article URL
 *   --kind      (default review)  review · interview · feature · profile · mention · list-inclusion · premiere
 *   --era       (optional) project doc slug, e.g. "men-women-children"
 *   --release   (optional) release doc slug, e.g. "cc015-relationships"
 *   --artist    (optional) artist doc slug
 *   --outlet    (optional) override the auto-detected outlet name
 *   --author    (optional) author byline
 *   --headline  (optional) override the og:title
 *   --quote     (optional) pull-quote — defaults to the og:description
 *   --date      (optional) YYYY-MM-DD
 *   --year      (optional) integer (fallback if no --date)
 *   --featured            pin to the homepage press wall
 *   --no-image            skip image upload (smaller doc)
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

const URL_ARG = arg("url");
if (!URL_ARG) { console.error("❌ --url is required"); process.exit(1); }

const KIND      = arg("kind") ?? "review";
const ERA_SLUG  = arg("era");
const REL_SLUG  = arg("release");
const ART_SLUG  = arg("artist");
const OUTLET    = arg("outlet");
const AUTHOR    = arg("author");
const HEADLINE  = arg("headline");
const QUOTE     = arg("quote");
const DATE_ARG  = arg("date");
const YEAR_ARG  = arg("year");
const FEATURED  = flag("featured");
const NO_IMAGE  = flag("no-image");

async function fetchOG(url: string) {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  const html = await res.text();
  const pick = (re: RegExp) => {
    const m = html.match(re);
    return m ? m[1].trim() : undefined;
  };
  // Try multiple patterns since outlets vary in how they emit meta tags
  return {
    title:
      pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<title>([^<]+)<\/title>/i),
    description:
      pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
    image:
      pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i),
    siteName: pick(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i),
    publishedTime:
      pick(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<meta[^>]+property=["']og:published_time["'][^>]+content=["']([^"']+)["']/i),
  };
}

async function uploadImageFromUrl(url: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const asset = await sanity.assets.upload("image", buf, { filename });
    return asset._id;
  } catch (err) {
    console.log(`   ✗ image upload failed: ${(err as Error).message}`);
    return null;
  }
}

async function resolveRef(type: "release" | "project" | "artist", slug: string): Promise<string | null> {
  return sanity.fetch<string | null>(
    `*[_type == $type && slug.current == $slug][0]._id`,
    { type, slug }
  );
}

// outlet inference from URL host
function inferOutlet(url: string, siteName?: string): string | undefined {
  if (siteName) return siteName;
  try {
    const host = new URL(url).host.replace(/^www\./, "");
    const known: Record<string, string> = {
      "pitchfork.com": "Pitchfork",
      "factmag.com": "FACT",
      "thefader.com": "The FADER",
      "rollingstone.com": "Rolling Stone",
      "billboard.com": "Billboard",
      "stereogum.com": "Stereogum",
      "vice.com": "VICE",
      "noisey.vice.com": "Noisey",
      "thump.vice.com": "THUMP",
      "complex.com": "Complex",
      "okayplayer.com": "Okayplayer",
      "djmag.com": "DJ Mag",
      "residentadvisor.net": "Resident Advisor",
      "ra.co": "Resident Advisor",
      "mixmag.net": "Mixmag",
      "spin.com": "SPIN",
      "soundonsound.com": "Sound on Sound",
      "nytimes.com": "The New York Times",
      "newyorker.com": "The New Yorker",
      "ableton.com": "Ableton",
      "teenage.engineering": "Teenage Engineering",
    };
    return known[host] ?? host;
  } catch {
    return undefined;
  }
}

async function main() {
  console.log(`\n→ scraping ${URL_ARG}`);
  const og = await fetchOG(URL_ARG!);
  console.log(`   title:       ${og.title}`);
  console.log(`   description: ${(og.description ?? "").slice(0, 100)}…`);
  console.log(`   image:       ${og.image ?? "—"}`);
  console.log(`   published:   ${og.publishedTime ?? "—"}\n`);

  const headline = HEADLINE ?? og.title;
  const quote    = QUOTE ?? og.description ?? headline ?? "(no quote captured)";
  const outlet   = OUTLET ?? inferOutlet(URL_ARG!, og.siteName);
  // Date: --date flag > og:article:published_time > --year > undefined
  const date = DATE_ARG ?? (og.publishedTime ? og.publishedTime.slice(0, 10) : undefined);
  const year = YEAR_ARG ? parseInt(YEAR_ARG, 10) : (date ? parseInt(date.slice(0, 4), 10) : undefined);

  // Image upload
  let imageRef: { _type: "image"; asset: { _type: "reference"; _ref: string } } | undefined;
  if (!NO_IMAGE && og.image) {
    console.log("→ uploading article image…");
    const ext = og.image.split(".").pop()?.split("?")[0] ?? "jpg";
    const assetId = await uploadImageFromUrl(og.image, `press-${Date.now()}.${ext}`);
    if (assetId) {
      imageRef = { _type: "image", asset: { _type: "reference", _ref: assetId } };
      console.log(`   ✓ ${assetId}`);
    }
  }

  // Resolve refs
  const relations: Record<string, { _type: "reference"; _ref: string }> = {};
  if (ERA_SLUG) {
    const id = await resolveRef("project", ERA_SLUG);
    if (!id) { console.error(`❌ era "${ERA_SLUG}" not found`); process.exit(1); }
    relations.relatedEra = { _type: "reference", _ref: id };
    console.log(`→ linked to era: ${ERA_SLUG}`);
  }
  if (REL_SLUG) {
    const id = await resolveRef("release", REL_SLUG);
    if (!id) { console.error(`❌ release "${REL_SLUG}" not found`); process.exit(1); }
    relations.relatedRelease = { _type: "reference", _ref: id };
    console.log(`→ linked to release: ${REL_SLUG}`);
  }
  if (ART_SLUG) {
    const id = await resolveRef("artist", ART_SLUG);
    if (!id) { console.error(`❌ artist "${ART_SLUG}" not found`); process.exit(1); }
    relations.relatedArtist = { _type: "reference", _ref: id };
    console.log(`→ linked to artist: ${ART_SLUG}`);
  }

  // Build the doc
  const doc: Record<string, unknown> = {
    _type: "pressQuote",
    kind: KIND,
    headline,
    quote,
    excerpt: og.description ?? undefined,
    outlet,
    author: AUTHOR,
    source: outlet && AUTHOR ? `${AUTHOR} · ${outlet}` : (outlet ?? AUTHOR),
    url: URL_ARG,
    date,
    year,
    featured: FEATURED,
    ...(imageRef ? { image: imageRef } : {}),
    ...relations,
  };

  const created = await sanity.create(doc as any);
  console.log(`\n✅ created ${created._id}`);
  console.log(`→ open http://localhost:3000/press`);
  if (REL_SLUG) console.log(`→ also visible on http://localhost:3000/releases/${REL_SLUG}`);
  if (ERA_SLUG) console.log(`→ also visible on http://localhost:3000/eras/${ERA_SLUG}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
