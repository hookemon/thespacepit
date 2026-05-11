/**
 * Import the press_archive_NickHook.md content into Sanity as pressQuote docs.
 *
 * Each entry below is a manually-structured row from the markdown:
 *   - Era / release links wired up so the doc auto-surfaces on the right page
 *   - Idempotent: a stable _id derived from outlet + headline-or-quote-hash
 *
 * Run: `npx tsx scripts/import-press-archive.ts`
 * Dry: `npx tsx scripts/import-press-archive.ts --dry`
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
  relatedEraSlug?: string;     // matches project.slug.current
  relatedReleaseSlug?: string; // matches release.slug.current
  featured?: boolean;          // pin to wall
};

const ITEMS: Item[] = [
  // === MWC ERA ===
  { outlet: "NME", quote: "Highly rated newcomers.", kind: "mention", year: 2006, relatedEraSlug: "men-women-children" },
  { outlet: "The Skinny", quote: "more Earth, Wind & Fire shaking bossa nova ass with The Mars Volta", kind: "review", year: 2006, relatedEraSlug: "men-women-children" },
  { outlet: "Sputnikmusic", quote: "Most danceable record of 2006", kind: "review", year: 2006, relatedEraSlug: "men-women-children" },
  { outlet: "Amazon", author: "official label copy", quote: "ambitious, infectious, over-the-top and liberating spectacle… inspired by everything from Prince and Earth, Wind & Fire to Devo. A reminder that rock can be fun.", kind: "feature", year: 2006, relatedEraSlug: "men-women-children" },

  // === CUBIC ZIRCONIA ===
  { outlet: "Dazed & Confused", quote: "Hyped-up, sexually-charged club music that is raw, unblinkered and very fresh… the real deal.", kind: "review", year: 2011, relatedEraSlug: "cubic-zirconia", featured: true },
  { outlet: "Spin", quote: "Rarely do you find a frontwoman with a voice as purely and powerfully soulful as Cubic Zirconia's Tiombe Lockhart… Nick Hook and Daud Sturdivant's rowdy mix of funk, R&B, soul, boogie, bass, and house.", kind: "feature", year: 2011, relatedEraSlug: "cubic-zirconia" },
  { outlet: "Fool's Gold", author: "A-Trak", quote: "Fool's Gold is all about breaking genre boundaries. Cubic Zirconia's music challenges record store bins' classification and I find that dope.", kind: "mention", year: 2011, relatedEraSlug: "cubic-zirconia", featured: true },

  // === STUDIO ARCHITECT — "212" / Space Pit era ===
  { outlet: "Pitchfork", quote: "a jaw-slackening demo reel", headline: "On Azealia Banks' \"212\"", kind: "review", year: 2011 },
  { outlet: "Fader", quote: "a dancefloor-ready jam", headline: "On Azealia Banks' \"212\"", kind: "review", year: 2011 },
  { outlet: "NME", quote: "3 minutes and 25 seconds of pure filth-pop.", headline: "On Azealia Banks' \"212\"", kind: "review", year: 2011 },
  { outlet: "Vice / Noisey", quote: "Nick Hook is a real New Yorker. Well, not literally, as Nick was born and raised about 1,000 miles west in St. Louis.", headline: "RBMA Mix Series Vol. 3", kind: "feature", date: "2013-05-01" },
  { outlet: "Spin", quote: "Nick Hook Talks DIY Production, Baauer, and Working With Young Thug", kind: "interview", date: "2014-07-01" },

  // === RELATIONSHIPS LP ===
  { outlet: "Pitchfork", quote: "A genre-spanning studio party.", kind: "review", date: "2016-11-01", relatedReleaseSlug: "cc015-relationships", featured: true },
  { outlet: "FACT Magazine", quote: "Super producer Nick Hook has released his debut full-length Relationships today via Fool's Gold… What makes Relationships particularly special is that the opener and closer are collaborations Hook did with footwork luminary DJ Rashad before his untimely passing in 2014.", kind: "review", date: "2016-11-01", relatedReleaseSlug: "cc015-relationships" },
  { outlet: "Complex", quote: "Every year since 2005, I thought my career would be over. Then there's always been this weird left turn with someone like an Azealia Banks or a Young Thug or an El-P that has reinvigorated me just because I've stuck with my shit.", kind: "interview", date: "2016-10-01", relatedReleaseSlug: "cc015-relationships", featured: true },
  { outlet: "Passion of the Weiss", quote: "Life and death are meeting points on the same circle. That truth came to producer Nick Hook during an acid trip last year in Paris.", headline: "At Least You Know What I'm About", kind: "interview", date: "2016-12-08", relatedReleaseSlug: "cc015-relationships" },
  { outlet: "Ableton", quote: "Collaborator In Chief", headline: "Studio feature with full Ableton session", kind: "feature", year: 2016 },
  { outlet: "Fool's Gold", quote: "NYC's waviest resident: an in-demand collaborator, producer extraordinaire, and all around provider of vibes.", kind: "mention", year: 2016, featured: true },
  { outlet: "Instagram", author: "Novelist", quote: "Nick Hook — This man gave me a new outlook on life when I met him in New York at 18 years old. He reiterated to me that FREEDOM starts in the mind.", kind: "mention", year: 2016, featured: true },

  // === 50 BACKWOODS ===
  { outlet: "Billboard", quote: "Nick Hook & DJ Earl Say 50 Blunts in Seven Days Led to the Best Album of Their Lives", kind: "interview", year: 2017, relatedReleaseSlug: "cc017-50-backwoods", featured: true },
  { outlet: "FACT Magazine", quote: "almost entirely as one unit", headline: "Interview + 'Mood Right Now' video premiere", kind: "interview", date: "2017-12-22", relatedReleaseSlug: "cc017-50-backwoods" },
  { outlet: "Resident Advisor", quote: "We always had a vibe, but after Rashad passed we ended up getting closer. Carrying on Rashad's legacy is a part of what we do every day.", kind: "feature", year: 2017, relatedReleaseSlug: "cc017-50-backwoods" },
  { outlet: "Tiny Mix Tapes", quote: "An experimental merger of hip-hop and old school electronic.", kind: "review", year: 2017, relatedReleaseSlug: "cc017-50-backwoods" },
  { outlet: "Dancing Astronaut", quote: "Album release coverage", kind: "mention", year: 2017, relatedReleaseSlug: "cc017-50-backwoods" },

  // === SPIRITUAL FRIENDSHIP ===
  { outlet: "Sound on Sound", quote: "From 2004 to 2014 there was never any talk about creating original music together. That came later, going from drone and experimentals… we accidentally wrote beautiful, strong music.", headline: "Talkback: Nick Hook", kind: "interview", year: 2021, featured: true },

  // === MEXICO / RTJ CUATRO ===
  { outlet: "local.mx", quote: "a beach day soundtrack… speaks to the current context across Latin America where danger, ambition, and joy converge.", headline: "Paquete México — NAAFI collaboration", kind: "feature", year: 2021 },
  { outlet: "Pitchfork", author: "Matthew Ismael Ruiz", quote: "a genuine interest in Latinx artists.", headline: "RTJ CU4TRO — 7.2/10", kind: "review", year: 2022 },
  { outlet: "The Daily Telegraph", author: "Cat Woods", quote: "the original lyrics don't lose any painful poignancy.", headline: "RTJ CU4TRO — perfect score", kind: "review", year: 2022, featured: true },
  { outlet: "AllMusic", author: "Paul Simpson", quote: "wildly different sounds all under a Latin umbrella, including reggaeton, salsa-trap, dub, mariachi, and ranchera with bossa nova.", headline: "RTJ CU4TRO — 3.5/5", kind: "review", year: 2022 },
  { outlet: "Consequence of Sound", quote: "RTJ CU4TRO announcement coverage", kind: "mention", year: 2022 },
  { outlet: "Run The Jewels", author: "El-P", quote: "A reimagining of RTJ4 through the lens of collaboration and a fusing of numerous musical cultures and influences.", kind: "mention", year: 2022, featured: true },

  // === LABEL ERA ===
  { outlet: "FACT Magazine", quote: "FACT Mix 722 — All-Nick-Hook production mix, 22 tracks. One of FACT's most authoritative mixes.", headline: "FACT Mix 722", kind: "feature", date: "2019-08-01" },
  { outlet: "Serato", quote: "bona fide force in New York's musical underground", kind: "profile" },
  { outlet: "ILL-PITCHED", quote: "A gold record recipient and co-executive producer of RTJ Cuatro, known for raw analog energy and genre-blurring live sets. From Boiler Room to Sónar to global club stages, Hook bridges worlds through sound.", kind: "mention", featured: true },
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
  console.log(`\n📰 Importing ${ITEMS.length} press items${DRY ? " (DRY)" : ""}\n`);
  let created = 0, updated = 0, skipped = 0;

  for (const it of ITEMS) {
    const _id = stableId(it);

    // Resolve references
    const eraRef = it.relatedEraSlug ? await resolveRef("project", it.relatedEraSlug) : null;
    const releaseRef = it.relatedReleaseSlug ? await resolveRef("release", it.relatedReleaseSlug) : null;

    const doc: any = {
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
      // Legacy `source` field for back-compat with the old schema:
      source: it.author ? `${it.author} · ${it.outlet}` : it.outlet,
      ...(eraRef ? { relatedEra: { _type: "reference", _ref: eraRef } } : {}),
      ...(releaseRef ? { relatedRelease: { _type: "reference", _ref: releaseRef } } : {}),
    };

    const existing = await c.fetch(`*[_id == $id][0]{_id}`, { id: _id });

    if (DRY) {
      console.log(`   ${existing ? "↻" : "+"} ${it.outlet.padEnd(28)} ${(it.headline ?? it.quote).slice(0, 60)}`);
      if (existing) updated++; else created++;
      continue;
    }

    if (existing) {
      await c.patch(_id).set(doc).commit();
      updated++;
      console.log(`   ↻ ${it.outlet.padEnd(28)} ${(it.headline ?? it.quote).slice(0, 60)}`);
    } else {
      await c.create(doc);
      created++;
      console.log(`   + ${it.outlet.padEnd(28)} ${(it.headline ?? it.quote).slice(0, 60)}`);
    }
  }

  console.log(`\n✅ ${created} created · ${updated} updated · ${skipped} skipped${DRY ? " (DRY)" : ""}\n`);
})();
