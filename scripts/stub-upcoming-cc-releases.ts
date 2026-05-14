/**
 * Stub the upcoming Calm + Collect releases that exist as Dropbox folders
 * but don't have Sanity docs yet. They land in the pipeline with status:
 * "upcoming" so /calm-collect/upcoming surfaces them and Nick + I can
 * flesh them out as artwork lands.
 *
 * Conservative: only stubs records we have concrete file/folder evidence
 * for. The Boo single + the 2 compilations are clear; "Nick Hook Album"
 * and "Relationships 10 Year Deluxe" stay un-stubbed because their
 * folders are essentially empty.
 *
 * Run: npx tsx scripts/stub-upcoming-cc-releases.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

type Stub = {
  _id: string;
  slug: string;
  title: string;
  /** Sanity artist doc IDs — must already exist. */
  artistRefs: string[];
  /** Free-text artist names used when no doc exists yet. */
  artistNamesFallback?: string[];
  format: "Single" | "EP" | "LP" | "Compilation" | "Remix" | "Mixtape";
  tagline: string;
  status: "upcoming" | "dropping";
  year: number;
  label: string;
  notes?: string;
  /** Pre-populated tracklist when we know it (e.g. from a Dropbox folder
   *  listing of WAVs). */
  trackTitles?: string[];
};

const STUBS: Stub[] = [
  {
    _id: "release-nick-hook-boo-pawmps-glove",
    slug: "nick-hook-boo-pawmps-glove",
    title: "If The Glove Don't Fit",
    artistRefs: ["artist-nick-hook"],
    artistNamesFallback: ["Gangsta Boo", "Pawmps"],
    format: "Single",
    tagline:
      "Nick Hook Ft. Gangsta Boo + Pawmps. Hyper-merengue remix by QOQEQA. Dropping August 2026.",
    status: "upcoming",
    year: 2026,
    label: "Calm + Collect",
    notes:
      "The August 2026 Boo single. Two versions: original + QOQEQA hyper-merengue remix (Peru / cumbia-merengue energy, threading the same Peru-2026-era thread as KUSA).",
    trackTitles: [
      "If The Glove Don't Fit",
      "If The Glove Don't Fit (QOQEQA Hyper-Merengue Remix)",
    ],
  },
  {
    _id: "release-cc-remix-compilation-2026",
    slug: "calm-collect-remix-compilation",
    title: "Calm + Collect Remix Compilation",
    artistRefs: ["artist-nick-hook"],
    artistNamesFallback: ["Various Artists"],
    format: "Compilation",
    tagline:
      "The label as a remix machine. Every C+C record handed to a new producer. 15 tracks.",
    status: "upcoming",
    year: 2026,
    label: "Calm + Collect",
    notes:
      "A remix retrospective: each track from the C+C catalogue handed off to a remixer. Includes DJ Spinn + Nick Hook + Scatta on Old English, Salva on Can't Tell Me Nothing, Egyptrixx on Josephine, Cardopusher on How Yall Feeling, Ikonika on Hoes Come Out At Night, and more.",
    trackTitles: [
      "Old English (DJ Spinn + Nick Hook + Scatta Remix) — Young Thug Ft. A$AP Ferg + Freddie Gibbs",
      "How Y'all Feeling, Work That Pussy (Cardopusher E-Rave 93 Mix) — Nehuen + Nick Hook",
      "Can't Tell Me Nothing (Salva Remix) — Nick Hook Ft. Novelist",
      "Head (Thee Mike B Remix) — Nick Hook Ft. 21 Savage",
      "Jaco (Big Dope P Remix) — Nick Hook Ft. Kilo Kish + Todd Edwards",
      "Peephole (Oak City Slums Remix) — Nick Hook Ft. Gangsta Boo",
      "J.A.M.I.T. (Neana Remix) — Nick Hook Ft. The Egyptian Lover",
      "Tardes De Verano (Uniique Remix) — Nick Hook + Lao Ft. Missil",
      "Hoes Come Out At Night (Ikonika Remix) — Cubic Zirconia Ft. Lex",
      "Dance (Spiritual Friendship Edit)",
      "Wurly (Jesse Rose + Brillstein Remix) — Nick Hook Ft. Bernie Worrell + Cmat",
      "Take Me High (Bart Bmore Remix) — Cubic Zirconia",
      "Until You Turn Blue (Doc Daneeka Remix) — Color Film",
      "Josephine (Egyptrixx Remix) — Cubic Zirconia",
      "How Y'all Feeling (Cardopusher E-Rave 93 Mix) — Nehuen + Nick Hook",
    ],
  },
  {
    _id: "release-cc-compilation-2026",
    slug: "calm-collect-compilation",
    title: "Calm + Collect Compilation",
    artistRefs: ["artist-nick-hook"],
    artistNamesFallback: ["Various Artists"],
    format: "Compilation",
    tagline:
      "The catalogue as one record. Curated retrospective of Calm + Collect since 2013.",
    status: "upcoming",
    year: 2026,
    label: "Calm + Collect",
    notes:
      "A curated retrospective compilation — pulls highlights from across the C+C catalog (Color Film, Spiritual Friendship, Nick Hook collaborations, Hookemon early run, Cubic Zirconia legacy). Tracklist pending.",
  },
];

async function main() {
  for (const s of STUBS) {
    // Idempotent: skip if doc already exists.
    const existing = await client.fetch<{ _id: string } | null>(
      `*[_id == $id][0]{ _id }`,
      { id: s._id },
    );
    if (existing) {
      console.log(`  ↳ skip (already exists): ${s._id}`);
      continue;
    }

    const doc: Record<string, unknown> = {
      _id: s._id,
      _type: "release",
      title: s.title,
      slug: { _type: "slug", current: s.slug },
      format: s.format,
      tagline: s.tagline,
      status: s.status,
      year: s.year,
      label: s.label,
      featured: false,
      artists: s.artistRefs.map((ref) => ({
        _key: randomUUID(),
        _type: "reference",
        _ref: ref,
      })),
    };
    if (s.notes) {
      doc.notes = [
        {
          _key: randomUUID(),
          _type: "block",
          style: "normal",
          children: [{ _key: randomUUID(), _type: "span", text: s.notes }],
        },
      ];
    }
    if (s.trackTitles && s.trackTitles.length > 0) {
      doc.tracklist = s.trackTitles.map((t) => ({
        _key: randomUUID(),
        _type: "track",
        title: t,
      }));
    }
    await client.createOrReplace(doc);
    console.log(`✓ stubbed ${s._id} :: ${s.title} (${s.format})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
