/**
 * Enrich the Men Women & Children era page.
 *
 * What it does:
 *  1. Creates artist documents for the MWC lineup (TJ, Rick, Todd, Scully, Jason)
 *     with onLabel:false so they don't pollute the C+C roster.
 *  2. Replaces the MWC project's `story` with a 12-paragraph rich version
 *     pulled from press_archive_MWC.md (compiled May 2026).
 *  3. Wires `members` on the MWC project to those new artist refs.
 *
 * Idempotent — re-runs overwrite the story field and re-create the artist
 * documents in place (createOrReplace).
 *
 * Source: press_archive_MWC.md (Drive id 1-LnINiN2agMKMiHcyrIPNmrU_MYs8P-KoBOgY2Y5MOk).
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

// Helper: turn an array of paragraph strings into a Portable Text body.
function portableText(paragraphs: string[]) {
  return paragraphs.map((p, i) => ({
    _type: "block",
    _key: `mwc-p${i}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `mwc-s${i}`, text: p, marks: [] }],
  }));
}

// MWC lineup — band members to create as artist documents.
// onLabel:false keeps them out of the Calm + Collect roster gating.
const MEMBERS = [
  {
    _id: "artist-tj-penzone",
    name: "TJ Penzone",
    slug: "tj-penzone",
    tagline: "vocals — men women & children. wrote the chorus to 'dance in my blood' in todd's car driving around long island.",
    city: "Long Island, NY",
  },
  {
    _id: "artist-rick-penzone",
    name: "Rick Penzone",
    slug: "rick-penzone",
    tagline: "bass, guitar, keys, additional production — men women & children. tj's brother. still nick's bass player twenty years later.",
    city: "Long Island, NY",
  },
  {
    _id: "artist-todd-weinstock",
    name: "Todd Weinstock",
    slug: "todd-weinstock",
    tagline: "guitar, production — men women & children. ex-glassjaw. heard the first two mixes on a public library computer in hong kong.",
    city: "Long Island, NY",
  },
  {
    _id: "artist-scully-sullivan-kaplan",
    name: "David \"Scully\" Sullivan-Kaplan",
    slug: "scully-sullivan-kaplan",
    tagline: "drums, production — men women & children.",
    city: "NYC",
  },
  {
    _id: "artist-jason-giummule",
    name: "Jason Giummule",
    slug: "jason-giummule",
    tagline: "lead guitar — men women & children. came in as a touring guitarist; stayed.",
    city: "NYC",
  },
];

// 12-paragraph rich story for MWC.
// Trusts the existing seed for disputed facts (2 albums, 183 shows, Nettwerk via Tom Gates).
// Adds everything from press_archive_MWC.md that isn't already in the seed.
const STORY: string[] = [
  "Nick's first band. 2004–2008. Two albums on Warner Brothers, signed through Nettwerk via Tom Gates. Booking: Adam Weiser at Agency Group / WMG.",

  "Started as a deliberately low-profile experiment between Todd Weinstock (ex-Glassjaw guitarist) and Nick — both tired of rock's 'woe-is-me' tone, both reaching for something more ambitious and joyful. The first two finished mixes — 'Lightning Strikes Twice in New York' and 'Dance in My Blood' — landed in Weinstock's inbox while he was in Hong Kong, downloaded from a public library computer.",

  "Ran through three names before sticking. Easy Tiger first (abandoned when a Chicago band by the same name refused to sell the rights). Then Torpedo. Then Men, Women & Children — and later, post-label, performing as Nobody Moves.",

  "Final lineup: TJ Penzone on vocals (he wrote the chorus to 'Dance in My Blood' driving around Long Island in Weinstock's car), Rick Penzone on bass + guitar + keys + additional production, Todd on guitar, Scully Sullivan-Kaplan on drums, Jason Giummule on lead. Nick on keyboards, barely out of his teens when he hit the road in 2004.",

  "Self-titled debut: March 21, 2006 (US) / April 24, 2006 (UK) on Reprise / Warner Bros. Production stack was loaded — Mike Mogis (Bright Eyes) on six tracks, Raine Maida (Our Lady Peace) and Jason Lader (Rick Rubin protégé) on four, Josh Abraham (Ima Robot) on two. Strings + horns by Nathaniel Walcott. Mike Sapone on pre-production. Gareth Jones mixed the major-label record — that's where the Nick + Gareth relationship started, the one that became Spiritual Friendship two decades later.",

  "Press lined up. NME called them 'highly rated newcomers.' The Skinny ran a three-star review framing the Glassjaw turn. Sputnikmusic, 3.5/5, headline: 'Stand aside, Mr. Timberlake, Men, Women And Children are here to claim the most danceable record of 2006 award.' Amazon's official label copy: 'a reminder that rock can be fun.'",

  "Two big syncs. 'Dance in My Blood' played in the background of NBC's Studio 60 on the Sunset Strip — Aaron Sorkin, primetime, 'The Wrap Party' episode, October 2006. Same year, the song appeared on the official EA Sports FIFA World Cup Soccer 2006 soundtrack.",

  "183 shows by the time it ended. Toured the US relentlessly — Baltimore, Wilkes-Barre, Poughkeepsie, Providence, Boston, Hoboken, every market a band could fit into. Co-billed with Nightmare of You on the early run; toured with Diamond Nights, The Bravery, Phantom Planet. Support slots for Panic! At The Disco (UK 2006), Gang of Four (US), Brand New, De La Soul, Metric, Snoop Dogg, Lostprophets at Brixton, Head Automatica, Rx Bandits, The Format, ¡Forward, Russia! Bamboozle 2007. Headlined own shows with We Are The Fury direct support.",

  "On the MTV2 Welcome to the Universe $2 Bill Tour, the van, trailer, and over $100k of equipment got stolen in Detroit. The band set up a PayPal donation page to keep the tour alive — and 30 Seconds to Mars's Echelon fanbase organized in solidarity.",

  "First NYC show, Lower East Side, the lighting rig blew the club's power five times. Crowd loved it anyway.",

  "June 13, 2007 — separation from Warner / Reprise announced via MySpace blog. Stated reason: lack of distribution. Album recorded, released, toured — but the label never moved it. On November 19, 2008, Todd, Nick, and Scully announced their departures. Final show: Gramercy Theatre, NYC, December 29, 2008, with The Gay Blades.",

  "\"I worked on music for 20 hours a day for the next year and a half.\" — Nick on the MWC era.",
];

(async () => {
  console.log("\n🎸 Patching Men Women & Children era\n");

  // 1) Create / refresh the member artist documents.
  console.log("→ creating member artist docs...");
  for (const m of MEMBERS) {
    await client.createOrReplace({
      _id: m._id,
      _type: "artist",
      name: m.name,
      slug: { _type: "slug", current: m.slug },
      city: m.city,
      tagline: m.tagline,
      onLabel: false,
    });
    console.log(`   ✓ ${m.name}  (/artists/${m.slug})`);
  }

  // 2) Patch the MWC project doc — replace story, link members.
  console.log("\n→ patching project-men-women-children...");
  await client
    .patch("project-men-women-children")
    .set({
      story: portableText(STORY),
      members: MEMBERS.map((m) => ({
        _type: "reference",
        _ref: m._id,
        _key: `member-${m.slug}`,
      })),
    })
    .commit();
  console.log("   ✓ story (12 paragraphs) + 5 members linked");

  console.log("\n✅ done — refresh /eras/men-women-children\n");
})();
