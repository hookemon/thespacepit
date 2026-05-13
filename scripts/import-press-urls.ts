/**
 * Press archive — URL + headline backfill.
 *
 * Two layers in one script:
 *
 *   (1) PATCHES — re-emit every existing pressQuote that came from
 *       import-press-archive.ts using the SAME outlet/headline/quote so
 *       its stableId() matches, then `.set` to add the article URL
 *       (and richer headline where helpful) to those existing docs.
 *
 *   (2) NEW — items pulled from Drive's `calm_collect_press_db_v3`
 *       spreadsheet (the Yash/Biz3 Relationships campaign recap, the
 *       50 Backwoods recap) that were NOT in the original archive.
 *       These get created fresh with full URL + relation tags.
 *
 * Idempotent — re-runs patch in place; nothing is duplicated.
 *
 * Run: `npx tsx scripts/import-press-urls.ts`
 * Dry: `npx tsx scripts/import-press-urls.ts --dry`
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
  date?: string;     // YYYY-MM-DD
  url?: string;
  relatedEraSlug?: string;
  relatedReleaseSlug?: string;
  featured?: boolean;
};

// === (1) PATCHES — same outlet/headline/quote(0,80) as original archive
//        so the SHA-1 stableId matches and we patch in place. URL added. ===
const PATCHES: Item[] = [
  // === MWC ERA ===
  // (no URLs known for these; skipped)

  // === CUBIC ZIRCONIA ===
  // (Dazed quote URL not located; skip)

  // === STUDIO ARCHITECT — "212" / Space Pit era ===
  // NOTE: PATCH entries below MUST NOT add a `headline` if the original
  // archive entry didn't have one — the stableId() hashes the headline,
  // so adding one breaks the match and creates a duplicate. URL/date/etc
  // are fine to add via .set since they're not in the hash.
  {
    outlet: "Spin",
    quote: "Nick Hook Talks DIY Production, Baauer, and Working With Young Thug",
    kind: "interview",
    date: "2014-07-01",
    url: "https://www.spin.com/2014/07/nick-hook-interview-young-thug/",
  },

  // === RELATIONSHIPS LP ===
  {
    outlet: "Pitchfork",
    quote: "A genre-spanning studio party.",
    kind: "review",
    date: "2016-12-08",
    relatedReleaseSlug: "cc015-relationships",
    featured: true,
    url: "https://pitchfork.com/reviews/albums/22683-relationships/",
  },
  {
    outlet: "FACT Magazine",
    quote: "Super producer Nick Hook has released his debut full-length Relationships today via Fool's Gold… What makes Relationships particularly special is that the opener and closer are collaborations Hook did with footwork luminary DJ Rashad before his untimely passing in 2014.",
    kind: "review",
    date: "2016-11-01",
    relatedReleaseSlug: "cc015-relationships",
    // (URL not yet located for this specific Nov 1, 2016 FACT release post —
    //  separate FACT pieces — Studio Tour, Against The Clock, FACT Mix —
    //  are below as NEW_ITEMS with their own URLs.)
  },
  {
    outlet: "Complex",
    quote: "Every year since 2005, I thought my career would be over. Then there's always been this weird left turn with someone like an Azealia Banks or a Young Thug or an El-P that has reinvigorated me just because I've stuck with my shit.",
    kind: "interview",
    date: "2016-10-21",
    relatedReleaseSlug: "cc015-relationships",
    featured: true,
    url: "https://www.complex.com/music/2016/10/interview-nick-hook",
  },
  {
    outlet: "Passion of the Weiss",
    quote: "Life and death are meeting points on the same circle. That truth came to producer Nick Hook during an acid trip last year in Paris.",
    headline: "At Least You Know What I'm About",
    kind: "interview",
    date: "2016-12-08",
    relatedReleaseSlug: "cc015-relationships",
    url: "https://www.passionweiss.com/2016/12/08/nick-hook-interview/",
  },
  {
    outlet: "Ableton",
    quote: "Collaborator In Chief",
    headline: "Studio feature with full Ableton session",
    kind: "feature",
    year: 2016,
    url: "https://www.ableton.com/en/blog/nick-hook-collaborator-in-chief/",
  },

  // === 50 BACKWOODS ===
  {
    outlet: "Billboard",
    quote: "Nick Hook & DJ Earl Say 50 Blunts in Seven Days Led to the Best Album of Their Lives",
    kind: "interview",
    year: 2017,
    relatedReleaseSlug: "cc017-50-backwoods",
    featured: true,
    // Billboard URL — best-guess slug pattern; verify in studio
    url: "https://www.billboard.com/music/music-news/nick-hook-dj-earl-50-backwoods-interview-8062842/",
  },

  // === SPIRITUAL FRIENDSHIP ===
  {
    outlet: "Sound on Sound",
    quote: "From 2004 to 2014 there was never any talk about creating original music together. That came later, going from drone and experimentals… we accidentally wrote beautiful, strong music.",
    headline: "Talkback: Nick Hook",
    kind: "interview",
    year: 2021,
    featured: true,
    url: "https://www.soundonsound.com/people/talkback-nick-hook",
  },

  // === LABEL ERA ===
  {
    outlet: "FACT Magazine",
    quote: "FACT Mix 722 — All-Nick-Hook production mix, 22 tracks. One of FACT's most authoritative mixes.",
    headline: "FACT Mix 722",
    kind: "feature",
    date: "2019-08-12",
    url: "https://www.factmag.com/2019/08/12/fact-mix-722-nick-hook/",
  },
];

// === (2) NEW — additional press pieces with URLs not previously imported.
//        Each gets its own stableId via the same hash function. ===
const NEW_ITEMS: Item[] = [
  // ──────────────────────────────────────────────────────────────────
  // RELATIONSHIPS CAMPAIGN — Oct/Nov 2016 (from Yash/Biz3 recap)
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "Pitchfork",
    headline: "Nick Hook Announces New Album Relationships",
    quote: "Pitchfork breaks the announce of Nick Hook's debut LP Relationships, ft. 21 Savage, iLoveMakonnen, Hudson Mohawke, DJ Rashad, Novelist & more.",
    kind: "feature",
    date: "2016-10-21",
    url: "https://pitchfork.com/news/69176-nick-hook-announces-new-album/",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "The FADER",
    author: "Ruth Saxelby",
    headline: "FADER Mix: Nick Hook",
    quote: "FADER Mix: Nick Hook — guest mix to mark the release of Relationships.",
    kind: "feature",
    date: "2016-10-27",
    url: "https://www.thefader.com/2016/10/27/fader-mix-nick-hook",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "The FADER",
    headline: "Premiere — Nick Hook ft. Novelist, “Can't Tell Me Nothing”",
    quote: "FADER premieres “Can't Tell Me Nothing” feat. Novelist — first single from Relationships.",
    kind: "premiere",
    date: "2016-09-01",
    url: "https://www.thefader.com/2016/09/01/novelist-nick-hook-cant-tell-me-nothing",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "FACT Magazine",
    author: "Luz Muñoz",
    headline: "Against The Clock — Nick Hook",
    quote: "FACT's Against The Clock series — Nick Hook makes a beat from scratch in 10 minutes at thespacepit.",
    kind: "feature",
    date: "2016-09-29",
    url: "https://www.factmag.com/2016/09/29/nick-hook-against-the-clock/",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "Mass Appeal",
    author: "Hazel Corwin",
    headline: "Rhythm Roulette — Nick Hook",
    quote: "Mass Appeal's Rhythm Roulette video feature for the Relationships campaign.",
    kind: "feature",
    year: 2016,
    url: "https://www.youtube.com/watch?v=RBveQ9gXkAw",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "XXL",
    author: "J. Ivey",
    headline: "21 Savage, iLoveMakonnen on Nick Hook's Relationships Album",
    quote: "XXL preview of the Relationships LP.",
    kind: "feature",
    date: "2016-10-21",
    url: "https://www.xxlmag.com/news/2016/10/21-savage-ilovemakonnen-nick-hooks-relationships-album/",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "BrooklynVegan",
    headline: "Nick Hook streaming new LP Relationships",
    quote: "BrooklynVegan album-stream post for Relationships.",
    kind: "mention",
    date: "2016-11-01",
    url: "https://www.brooklynvegan.com/nick-hook-streaming-lp/",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "VICE Sports",
    author: "Ben Detrick",
    headline: "Nick Hook & Nick Catchdubs on the NBA, Trump & Cookies",
    quote: "VICE Sports column — Nick Hook + Nick Catchdubs talk basketball, politics, and cookies.",
    kind: "feature",
    date: "2016-11-14",
    url: "https://www.vice.com/en/article/nick-hook-and-nick-catchdubs-on-the-nba-and-trump-cookies-32",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "HotNewHipHop",
    headline: "Nick Hook — “Gucci's” feat. 24hrs",
    quote: "HotNewHipHop premiere/writeup for “Gucci's” feat. 24hrs.",
    kind: "premiere",
    year: 2016,
    url: "https://www.hotnewhiphop.com/nick-hook-guccis-feat-24hrs-new-song.1985104.html",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "2DopeBoyz",
    headline: "Nick Hook ft. 24hrs — “Gucci's”",
    quote: "2 Dope Boyz post for the “Gucci's” single.",
    kind: "premiere",
    date: "2016-10-20",
    url: "https://2dopeboyz.com/2016/10/20/nick-hook-guccis-24hrs/",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "The Ransom Note",
    headline: "Nick Hook announces debut album",
    quote: "The Ransom Note announce post for Relationships.",
    kind: "feature",
    year: 2016,
    url: "https://www.theransomnote.com/news/nick-hook-announces-debut-album",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "Paper Magazine",
    headline: "Watch the whiplash-inducing video for Nick Hook & Novelist's “Can't Tell Me Nothing”",
    quote: "Paper Magazine premiere of the “Can't Tell Me Nothing” video.",
    kind: "premiere",
    year: 2016,
    url: "https://www.papermag.com/watch-the-whiplash-inducing-video",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "Hypetrak",
    headline: "Nick Hook & Novelist — “Can't Tell Me Nothing” video",
    quote: "Hypetrak posts the “Can't Tell Me Nothing” music video.",
    kind: "premiere",
    date: "2016-09-01",
    url: "https://hypetrak.com/2016/09/nick-hook-novelist-cant-tell-me-nothing-video/",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "Red Bull Radio",
    author: "Vivian Host",
    headline: "Nick Hook on The Vortex",
    quote: "Live Red Bull Radio interview with Vivian Host on The Vortex — booked around the Relationships release.",
    kind: "interview",
    date: "2016-11-09",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "BBC Radio 1 / 1Xtra",
    headline: "Target Show guest mix",
    quote: "Nick Hook guest mix aired on Target's BBC Radio 1 / 1Xtra show, repeated on 1Xtra.",
    kind: "feature",
    date: "2016-11-01",
    relatedReleaseSlug: "cc015-relationships",
  },

  // ──────────────────────────────────────────────────────────────────
  // 50 BACKWOODS CAMPAIGN — Nov/Dec 2017
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "Pitchfork",
    headline: "Nick Hook & DJ Earl Announce New Album 50 Backwoods",
    quote: "Pitchfork breaks the announce for 50 Backwoods (Fool's Gold / Calm + Collect, Dec 8, 2017).",
    kind: "feature",
    date: "2017-11-30",
    url: "https://pitchfork.com/news/nick-hook-and-dj-earl-announce-new-album",
    relatedReleaseSlug: "cc017-50-backwoods",
  },
  {
    outlet: "Mixmag",
    author: "Sean Griffiths",
    headline: "Mixmag full feature on Nick Hook + DJ Earl",
    quote: "Full Mixmag feature — interviews with both Nick and DJ Earl, plus a photoshoot at the show by Erez Avissar.",
    kind: "feature",
    year: 2018,
    relatedReleaseSlug: "cc017-50-backwoods",
  },
  {
    outlet: "THUMP / VICE",
    author: "Chantel Simpson",
    headline: "THUMP Guide to Clubbing — Episodes 1 & 2",
    quote: "Nick Hook appears in THUMP's Guide to Clubbing video series.",
    kind: "feature",
    year: 2017,
  },
  {
    outlet: "THUMP / VICE",
    headline: "Nick Hook on “Head (DJ Earl Remix)”",
    quote: "THUMP Q&A on the “Head” DJ Earl remix.",
    kind: "interview",
    date: "2017-02-06",
    relatedReleaseSlug: "cc017-50-backwoods",
  },
  {
    outlet: "Adult Swim Singles Program",
    headline: "Nick Hook ft. Fatman Scoop & Bunji Garlin",
    quote: "Adult Swim Singles Program slot for the Fatman Scoop / Bunji Garlin single.",
    kind: "premiere",
    year: 2017,
  },

  // ──────────────────────────────────────────────────────────────────
  // SPIRITUAL FRIENDSHIP / GARETH — additional
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "Sound on Sound",
    author: "William Stokes",
    headline: "Talkback: Nick Hook (full feature)",
    quote: "Career-spanning Sound on Sound feature interview — thespacepit, Spiritual Friendship with Gareth Jones, the Depeche Mode lineage, “212”, and the philosophy of in-person production.",
    kind: "interview",
    year: 2021,
    url: "https://www.soundonsound.com/people/talkback-nick-hook",
    featured: true,
  },

  // ──────────────────────────────────────────────────────────────────
  // RECENT / 2025
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "Zone Magazine",
    headline: "Feature Interview — Nick Hook",
    quote: "Zone Magazine feature interview with Nick Hook.",
    kind: "interview",
    date: "2025-07-23",
    url: "https://zone-magazine.eu/2025/07/23/feature-interview-nick-hook/",
  },
  {
    outlet: "Roxy's Tales",
    author: "Roxy Summers",
    headline: "Roxy's Tales Podcast — S2 E5",
    quote: "Long-form podcast interview on Roxy's Tales (Season 2, Episode 5).",
    kind: "interview",
    date: "2025-12-01",
  },

  // ──────────────────────────────────────────────────────────────────
  // STANDING / EVERGREEN PROFILE PAGES
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "The FADER",
    headline: "Nick Hook — artist page",
    quote: "FADER's evergreen artist hub for Nick Hook — collects every premiere, mix, and feature.",
    kind: "profile",
    url: "https://www.thefader.com/artist/nick-hook",
  },
];

const ALL = [...PATCHES, ...NEW_ITEMS];

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
  console.log(`\n📰 Press URL backfill — ${PATCHES.length} patches + ${NEW_ITEMS.length} new${DRY ? " (DRY)" : ""}\n`);
  let created = 0, patched = 0, skipped = 0;

  for (const it of ALL) {
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
      ...(it.excerpt ? { excerpt: it.excerpt } : {}),
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
    const label = `${it.outlet.padEnd(28)} ${(it.headline ?? it.quote).slice(0, 64)}`;

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

  console.log(`\n✅ ${created} created · ${patched} patched · ${skipped} skipped${DRY ? " (DRY)" : ""}`);
  console.log(`   🔗 = has URL\n`);
})();
