/**
 * Seed the Men Women & Children self-titled debut as a Sanity release doc,
 * with full 12-track tracklist + production credits, then link it to the
 * project-men-women-children doc's releases array.
 *
 * Also creates a band-level artist doc (artist-men-women-children) so the
 * release has a primary artist (per release schema validation).
 *
 * Idempotent — re-runnable.
 *
 * Sources:
 *   - press_archive_MWC.md (Drive id 1-LnINiN2agMKMiHcyrIPNmrU_MYs8P-KoBOgY2Y5MOk)
 *     for tracklist, durations, and per-track production credits
 *   - existing seed (Gareth Jones as mix)
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const BAND_ARTIST = {
  _id: "artist-men-women-children",
  name: "Men Women & Children",
  slug: "men-women-children-band",
  tagline: "long island electropop / dance-rock. 2004–2008. reprise / warner bros.",
  city: "Long Island, NY",
};

const RELEASE = {
  _id: "release-mwc-self-titled",
  title: "Men Women & Children",
  slug: "men-women-children-self-titled",
  catalogNumber: "REP-MWC",
  year: 2006,
  format: "LP",
  label: "Other",
  tagline: "self-titled · 2006",
  coverColor: "#1C1A17",
  // Reprise / Warner Bros release — no Bandcamp URL of our own.
  // YouTube has the official "Dance in My Blood" video uploaded April 9, 2006.
  youtubeUrl: "https://www.youtube.com/results?search_query=men+women+%26+children+dance+in+my+blood",
};

// Track-level credits per the press archive doc:
// Mogis = tracks 2,6,8,9,10,11   |   Maida + Lader = tracks 3,4,5,12
// Abraham = tracks 1,7           |   Walcott = strings/horns
// Sapone = pre-production        |   Mix = Gareth Jones (per Nick's seed) + Rudyard Lee Cullers
const TRACKLIST = [
  { title: "Dance in My Blood", duration: "4:18", note: "prod. Josh Abraham" },
  { title: "Lightning Strikes Twice in New York", duration: "3:13", note: "prod. Mike Mogis" },
  { title: "Photosynthesis (We're Losing O²)", duration: "3:14", note: "prod. Raine Maida + Jason Lader" },
  { title: "Who Found Mister Fabulous?", duration: "3:48", note: "prod. Raine Maida + Jason Lader" },
  { title: "Messy", duration: "3:22", note: "prod. Raine Maida + Jason Lader" },
  { title: "At Night We Like to Fight", duration: "3:48", note: "prod. Mike Mogis" },
  { title: "Monkey Monkee Men", duration: "2:24", feature: "Chantal Kreviazuk", note: "prod. Josh Abraham" },
  { title: "Time for the Future (Bang Bang)", duration: "3:19", note: "prod. Mike Mogis" },
  { title: "The Name of the Train is the Hurricane", duration: "3:37", note: "prod. Mike Mogis" },
  { title: "¡Celebracion!", duration: "3:34", note: "prod. Mike Mogis" },
  { title: "Sell Your Money", duration: "3:30", note: "prod. Mike Mogis" },
  { title: "Vowels", duration: "3:24", note: "prod. Raine Maida + Jason Lader" },
];

// Album-level credits. Use person refs for the band members we already have
// artist docs for; free-text for the producers/engineers who don't.
type Credit =
  | { role: string; personRef: string; _key: string }
  | { role: string; name: string; _key: string };

const CREDITS: Credit[] = [
  // Band (people we have docs for)
  { role: "vocals", personRef: "artist-tj-penzone", _key: "c-tj" },
  { role: "bass · guitar · keys · additional production", personRef: "artist-rick-penzone", _key: "c-rick" },
  { role: "guitar · production", personRef: "artist-todd-weinstock", _key: "c-todd" },
  { role: "drums · production", personRef: "artist-scully-sullivan-kaplan", _key: "c-scully" },
  { role: "lead guitar", personRef: "artist-jason-giummule", _key: "c-jason" },
  { role: "keyboards · production", personRef: "artist-nick-hook", _key: "c-nick" },
  // Producers (free-text — no artist docs yet)
  { role: "additional production (tracks 2, 6, 8, 9, 10, 11)", name: "Mike Mogis", _key: "c-mogis" },
  { role: "additional production (tracks 3, 4, 5, 12)", name: "Raine Maida", _key: "c-maida" },
  { role: "additional production (tracks 3, 4, 5, 12)", name: "Jason Lader", _key: "c-lader" },
  { role: "additional production (tracks 1, 7)", name: "Josh Abraham", _key: "c-abraham" },
  { role: "pre-production · additional recording", name: "Mike Sapone", _key: "c-sapone" },
  { role: "string + horn arrangements", name: "Nathaniel Walcott", _key: "c-walcott" },
  { role: "additional vocals (Monkey Monkee Men)", name: "Chantal Kreviazuk", _key: "c-kreviazuk" },
  { role: "mix", name: "Gareth Jones", _key: "c-gareth" },
  { role: "additional mix", name: "Rudyard Lee Cullers", _key: "c-cullers" },
  { role: "engineering", name: "Danny Kalb", _key: "c-kalb" },
  { role: "engineering", name: "Ryan Williams", _key: "c-williams" },
  { role: "engineering", name: "AJ Mogis", _key: "c-aj-mogis" },
];

const NOTES: string[] = [
  "Released March 21, 2006 (US) / April 24, 2006 (UK) on Reprise / Warner Bros.",
  "Twelve songs, four producers (Mogis, Maida, Lader, Abraham). Pre-production by Mike Sapone, strings + horns by Nathaniel Walcott, additional vocals on 'Monkey Monkee Men' by Chantal Kreviazuk. Gareth Jones mixed — the start of a relationship that would, two decades later, become Spiritual Friendship.",
  "'Dance in My Blood' got the syncs — NBC Studio 60 on the Sunset Strip ('The Wrap Party' episode, October 2006), and the EA Sports FIFA World Cup 2006 soundtrack.",
];

(async () => {
  console.log("\n💿 Seeding MWC self-titled debut\n");

  // 1) Band-level artist doc (release validation requires a primary artist).
  await client.createOrReplace({
    _id: BAND_ARTIST._id,
    _type: "artist",
    name: BAND_ARTIST.name,
    slug: { _type: "slug", current: BAND_ARTIST.slug },
    tagline: BAND_ARTIST.tagline,
    city: BAND_ARTIST.city,
    onLabel: false,
  });
  console.log(`   ✓ artist-men-women-children (band-level)`);

  // 2) Release doc.
  const credits = CREDITS.map((c) => {
    if ("personRef" in c) {
      return {
        _key: c._key,
        role: c.role,
        person: { _type: "reference", _ref: c.personRef },
      };
    }
    return { _key: c._key, role: c.role, name: c.name };
  });

  await client.createOrReplace({
    _id: RELEASE._id,
    _type: "release",
    title: RELEASE.title,
    slug: { _type: "slug", current: RELEASE.slug },
    catalogNumber: RELEASE.catalogNumber,
    year: RELEASE.year,
    format: RELEASE.format,
    label: RELEASE.label,
    tagline: RELEASE.tagline,
    coverColor: RELEASE.coverColor,
    youtubeUrl: RELEASE.youtubeUrl,
    artists: [{ _type: "reference", _ref: BAND_ARTIST._id, _key: "a-band" }],
    tracklist: TRACKLIST.map((t, i) => ({ _type: "track", _key: `t${i + 1}`, ...t })),
    credits,
    notes: NOTES.map((p, i) => ({
      _type: "block",
      _key: `note-p${i}`,
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: `note-s${i}`, text: p, marks: [] }],
    })),
    withdrawn: false,
  });
  console.log(`   ✓ release-mwc-self-titled (12 tracks · ${CREDITS.length} credits)`);

  // 3) Link the release to the MWC project.
  console.log("\n→ linking release to project-men-women-children...");
  await client
    .patch("project-men-women-children")
    .set({
      releases: [
        { _type: "reference", _ref: RELEASE._id, _key: "rel-mwc-st" },
      ],
    })
    .commit();
  console.log("   ✓ linked");

  console.log("\n✅ done — refresh /eras/men-women-children and /releases/men-women-children-self-titled\n");
})();
