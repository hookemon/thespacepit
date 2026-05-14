/**
 * Round 2 of upcoming-release stubs:
 *   1. Relationships 10 Year Deluxe — anniversary edition of CC015
 *      Relationships, dropping 2026.
 *   2. Nick Hook Album II — the masterpiece. Featured = true so it pins to
 *      the top of /calm-collect/upcoming and reads as the flagship of the
 *      slate, not just another row.
 *
 * Both inherit the same status: "upcoming" / status: "dropping" pattern as
 * KUSA + Old English + the comps — surfaces on /calm-collect/upcoming.
 *
 * Run: npx tsx scripts/stub-upcoming-cc-releases-2.ts
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
  artistRefs: string[];
  format: "Single" | "EP" | "LP" | "Compilation" | "Remix" | "Mixtape";
  tagline: string;
  status: "upcoming" | "dropping";
  year: number;
  label: string;
  featured?: boolean;
  notes?: string;
};

const STUBS: Stub[] = [
  {
    _id: "release-relationships-10-year-deluxe",
    slug: "relationships-10-year-deluxe",
    title: "Relationships — 10 Year Deluxe",
    artistRefs: ["artist-nick-hook"],
    format: "LP",
    tagline:
      "The 2017 record, expanded. Unreleased takes, alternate mixes, jeremy sample, girls-in-the-club bonus cuts. Ten years on, the relationships hold.",
    status: "upcoming",
    year: 2027,
    label: "Calm + Collect",
    notes:
      "Anniversary edition of CC015 Relationships (orig. 2017). Source material in the Jakub Relationships 10 Year Deluxe folder includes \"girls in the club 1213\" and \"jeremy sample\" — unreleased session takes alongside the original record. The package is a full re-issue with the deluxe extras, mastered by [TBD], with new cover treatment.",
  },
  {
    _id: "release-nick-hook-album-ii",
    slug: "nick-hook-album-ii",
    title: "Nick Hook — Album II",
    artistRefs: ["artist-nick-hook"],
    format: "LP",
    tagline:
      "the second album. masterpiece phase. years of sessions, every collaborator, the whole world built into one record.",
    status: "upcoming",
    year: 2027,
    label: "Calm + Collect",
    featured: true,
    notes:
      "The flagship of the 2026–27 C+C slate. Follows the 2017 Relationships LP — ten years later, a record that distills every era since: the Peru threads (Inti, Pawkarmayta, Mikongo, QOQEQA), the Brooklyn studio family, the chakra-series sessions, the Hudson Mohawke / Spinn / Salva / Lao network. Album II is meant as the masterpiece — every gun on the wall fires.",
  },
];

async function main() {
  for (const s of STUBS) {
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
      featured: s.featured ?? false,
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
    await client.createOrReplace(doc);
    console.log(`✓ stubbed ${s._id} :: ${s.title} (${s.format})${s.featured ? " [FEATURED]" : ""}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
