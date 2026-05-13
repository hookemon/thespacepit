/**
 * Cubic Zirconia press archive — URL backfill / new-doc import.
 *
 * Same shape as import-press-urls.ts (Nick Hook):
 *   - stableId() = sha1("outlet::headline::quote(0,80)") so re-runs patch
 *   - tagged to either the cubic-zirconia era (project.slug) or a specific
 *     release (Follow Your Heart, Fuck Work, Darko)
 *
 * Sources: Spin album review, FADER premieres + features, FACT track posts,
 * Glorious Noise, Freshpaved, blahblahblah, Okayplayer, Fool's Gold artist page.
 *
 * Run: `npx tsx scripts/import-press-cubic-zirconia.ts`
 * Dry: `npx tsx scripts/import-press-cubic-zirconia.ts --dry`
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

type Item = {
  outlet: string;
  author?: string;
  quote: string;
  headline?: string;
  excerpt?: string;
  kind?: "review" | "interview" | "feature" | "profile" | "mention" | "list-inclusion" | "premiere";
  year?: number;
  date?: string;
  url?: string;
  relatedEraSlug?: string;
  relatedReleaseSlug?: string;
  featured?: boolean;
};

const ITEMS: Item[] = [
  // ── ALBUM REVIEW ─────────────────────────────────────────
  {
    outlet: "Spin",
    headline: "Cubic Zirconia, 'Follow Your Heart' (Fool's Gold)",
    quote: "Spin reviews the Cubic Zirconia debut LP Follow Your Heart on Fool's Gold.",
    kind: "review",
    year: 2011,
    date: "2011-11-01",
    url: "https://www.spin.com/2011/11/cubic-zirconia-follow-your-heart-fools-gold/",
    relatedReleaseSlug: "ldcc004-follow-your-heart",
    relatedEraSlug: "cubic-zirconia",
    featured: true,
  },

  // ── SINGLES / VIDEO PREMIERES (FADER) ────────────────────
  {
    outlet: "The FADER",
    headline: "Video Premiere: Cubic Zirconia, “Hoes Come Out at Night” + Night Slugs Test Pressing Giveaway",
    quote: "FADER premieres the “Hoes Come Out at Night” video and runs a Night Slugs test pressing giveaway.",
    kind: "premiere",
    date: "2010-09-22",
    url: "https://www.thefader.com/2010/09/22/video-premiere-cubic-zirconia-hoes-come-out-at-night-night-slugs-test-pressing-giveaway",
    relatedEraSlug: "cubic-zirconia",
  },
  {
    outlet: "The FADER",
    headline: "The Let Out: SBTRKT & Cubic Zirconia",
    quote: "FADER's The Let Out — featuring SBTRKT and Cubic Zirconia.",
    kind: "feature",
    date: "2010-06-25",
    url: "https://www.thefader.com/2010/06/25/the-let-out-sbtrkt-cubic-zirconia",
    relatedEraSlug: "cubic-zirconia",
  },
  {
    outlet: "The FADER",
    headline: "Kid Cudi, “Make Her Say (Cubic Zirconia RMX)” MP3",
    quote: "FADER posts the Cubic Zirconia remix of Kid Cudi's “Make Her Say.”",
    kind: "premiere",
    date: "2009-09-16",
    url: "https://www.thefader.com/2009/09/16/kid-cudi-make-her-say-cubic-zirconia-rmx-mp3",
    relatedEraSlug: "cubic-zirconia",
  },

  // ── FACT MAGAZINE COVERAGE ───────────────────────────────
  {
    outlet: "FACT Magazine",
    headline: "Watch the video for Cubic Zirconia's nightlife ode “Darko”",
    quote: "FACT premieres the “Darko” video — Cubic Zirconia's nightlife ode.",
    kind: "premiere",
    date: "2012-07-25",
    url: "https://www.factmag.com/2012/07/25/watch-the-video-for-cubic-zirconias-nightlife-ode-darko/",
    relatedReleaseSlug: "ldcc006-darko",
    relatedEraSlug: "cubic-zirconia",
  },
  {
    outlet: "FACT Magazine",
    headline: "Watch a blood-splattering new video from Cubic Zirconia's Tiombe Lockhart",
    quote: "FACT premieres a blood-splattering new video from Cubic Zirconia frontwoman Tiombe Lockhart.",
    kind: "premiere",
    date: "2012-08-28",
    url: "https://www.factmag.com/2012/08/28/watch-a-blood-splattering-new-video-from-cubic-zirconias-tiombe-lockhart/",
    relatedEraSlug: "cubic-zirconia",
  },
  {
    outlet: "FACT Magazine",
    headline: "Hear Tiombe Lockhart's Hudson Mohawke-produced new single “Can't Get Enough”",
    quote: "FACT premieres Tiombe Lockhart's HudMo-produced solo single — adjacent to the CZ orbit.",
    kind: "premiere",
    date: "2014-01-14",
    url: "https://www.factmag.com/2014/01/14/hear-tiombe-lockharts-hudson-mohawke-produced-new-single-cant-get-enough/",
    relatedEraSlug: "cubic-zirconia",
  },
  {
    outlet: "The FADER",
    headline: "Video: Tiombe Lockhart, “Can't Get Enough (Prod. Hudson Mohawke)”",
    quote: "FADER posts the “Can't Get Enough” video — Tiombe Lockhart solo, produced by Hudson Mohawke.",
    kind: "premiere",
    date: "2014-01-14",
    url: "http://www.thefader.com/2014/01/14/video-tiombe-lockhart-cant-get-enough-prod-hudson-mohawke",
    relatedEraSlug: "cubic-zirconia",
  },

  // ── BLOG / FEATURE COVERAGE ──────────────────────────────
  {
    outlet: "Glorious Noise",
    headline: "Cubic Zirconia is Lacan's love child, may cause orgasms",
    quote: "Glorious Noise feature on Cubic Zirconia — “Lacan's love child, may cause orgasms.”",
    kind: "feature",
    year: 2010,
    url: "https://gloriousnoise.com/2010/cubic_zirconia_is_lacans_love",
    relatedEraSlug: "cubic-zirconia",
  },
  {
    outlet: "Freshpaved Magazine",
    headline: "Cubic Zirconia",
    quote: "Freshpaved feature/profile on Cubic Zirconia.",
    kind: "feature",
    url: "http://freshpavedmag.tumblr.com/post/6961651398/cubic-zirconia",
    relatedEraSlug: "cubic-zirconia",
  },
  {
    outlet: "blahblahblahscience",
    headline: "Cubic Zirconia — “Night or Day (CZ Club Mix)” feat. Bilal",
    quote: "Track review of the Cubic Zirconia Club Mix of “Night or Day” feat. Bilal.",
    kind: "review",
    url: "https://blahblahblahscience.com/track-reviews/cubic-zirconia-night-or-day-cz-club-mix-feat-bilal/",
    relatedReleaseSlug: "ldcc004-follow-your-heart",
    relatedEraSlug: "cubic-zirconia",
  },
  {
    outlet: "Okayplayer",
    headline: "Okayfuture Video: Cubic Zirconia “Take Me High” (Bart B More Remix)",
    quote: "Okayplayer premieres the Bart B More remix video for Cubic Zirconia's “Take Me High.”",
    kind: "premiere",
    url: "https://www.okayplayer.com/news/okayfuture-video-cubic-zirconia-take-me-high-bart-b-more-remix.html",
    relatedEraSlug: "cubic-zirconia",
  },

  // ── LABEL HUB ────────────────────────────────────────────
  {
    outlet: "Fool's Gold",
    headline: "Cubic Zirconia — artist page",
    quote: "Fool's Gold's evergreen Cubic Zirconia artist hub.",
    kind: "profile",
    url: "https://foolsgoldrecs.com/artists/cubic-zirconia/",
    relatedEraSlug: "cubic-zirconia",
  },
];

function stableId(it: Item): string {
  const h = createHash("sha1")
    .update(`${it.outlet}::${it.headline ?? ""}::${it.quote.slice(0, 80)}`)
    .digest("hex")
    .slice(0, 16);
  return `pressQuote-archive-${h}`;
}

async function resolveRef(type: string, slug: string): Promise<string | null> {
  const id = await c.fetch(`*[_type == $type && slug.current == $slug][0]._id`, { type, slug });
  return id || null;
}

(async () => {
  console.log(`\n📰 Cubic Zirconia press — ${ITEMS.length} items${DRY ? " (DRY)" : ""}\n`);
  let created = 0, patched = 0;

  for (const it of ITEMS) {
    const _id = stableId(it);
    const eraRef = it.relatedEraSlug ? await resolveRef("project", it.relatedEraSlug) : null;
    const releaseRef = it.relatedReleaseSlug ? await resolveRef("release", it.relatedReleaseSlug) : null;

    const doc: Record<string, unknown> = {
      _id,
      _type: "pressQuote",
      kind: it.kind ?? "review",
      outlet: it.outlet,
      ...(it.author ? { author: it.author } : {}),
      ...(it.headline ? { headline: it.headline } : {}),
      quote: it.quote,
      ...(it.date ? { date: it.date } : {}),
      ...(it.year ? { year: it.year } : {}),
      ...(it.url ? { url: it.url } : {}),
      ...(it.featured ? { featured: true } : {}),
      source: it.author ? `${it.author} · ${it.outlet}` : it.outlet,
      ...(eraRef ? { relatedEra: { _type: "reference", _ref: eraRef } } : {}),
      ...(releaseRef ? { relatedRelease: { _type: "reference", _ref: releaseRef } } : {}),
    };

    const existing = await c.fetch(`*[_id == $id][0]{_id}`, { id: _id });
    const tag = it.url ? "🔗" : "  ";
    const label = `${it.outlet.padEnd(24)} ${(it.headline ?? it.quote).slice(0, 64)}`;

    if (DRY) {
      console.log(`   ${existing ? "↻" : "+"} ${tag} ${label}`);
      if (existing) patched++; else created++;
      continue;
    }

    if (existing) {
      await c.patch(_id).set(doc).commit();
      patched++;
      console.log(`   ↻ ${tag} ${label}`);
    } else {
      await c.create(doc);
      created++;
      console.log(`   + ${tag} ${label}`);
    }
  }

  console.log(`\n✅ ${created} created · ${patched} patched${DRY ? " (DRY)" : ""}\n`);
})();
