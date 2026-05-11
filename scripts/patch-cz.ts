/**
 * Enrich the Cubic Zirconia era page.
 *
 * What it does:
 *  1. Creates the Tiombe Lockhart artist doc (onLabel:false — she's not on
 *     the C+C roster, she's the partner in Lockhart Dynasty).
 *  2. Updates Todd Weinstock's tagline so it reads sensibly when reached
 *     from EITHER MWC or CZ (he was in both bands).
 *  3. Replaces the CZ project's `story` with a 10-paragraph rich version
 *     pulled from the existing seed + the SVG003/Fuck Work marketing plan
 *     + the Carniville SXSW 2010 advance sheet.
 *  4. Wires `members` on CZ to Tiombe + Todd.
 *
 * Idempotent (createOrReplace + patch.set).
 *
 * Sources:
 *   - existing seed: scripts/seed-era-stories.ts ("project-cubic-zirconia")
 *   - Drive: SVG003CubicZirconiaMarketingPlan (id 1izw9S3im46MAqr3RejYo-tpijJAjovbgf7Vls9M_aE8)
 *   - Drive: Cubic Zirconia= Sxsw 2010_carn_adv (id 1QjJ2E3XBoNh5LezYen_XCKj5ZIe50jSBEnMOvNr5KC0)
 *
 * NOTE: there's a recent Cubic_Zirconia_FuckWork_Situation_Memo_v2 (modified
 * 2026-05-05) — active legal/contract activity. Story sticks to historical
 * narrative; nothing about current rights/contract status.
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

function portableText(paragraphs: string[]) {
  return paragraphs.map((p, i) => ({
    _type: "block",
    _key: `cz-p${i}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `cz-s${i}`, text: p, marks: [] }],
  }));
}

const TIOMBE = {
  _id: "artist-tiombe-lockhart",
  name: "Tiombe Lockhart",
  slug: "tiombe-lockhart",
  tagline: "vocals — cubic zirconia. front of the band. partner in lockhart dynasty × calm + collect.",
  city: "NYC",
};

// Todd is already an artist doc from the MWC patch — broaden his tagline so
// it reads right whether you reach it from MWC or CZ.
const TODD_UPDATED = {
  _id: "artist-todd-weinstock",
  name: "Todd Weinstock",
  slug: "todd-weinstock",
  tagline: "guitar, production — ex-glassjaw, men women & children, cubic zirconia. heard the first two mwc mixes on a public library computer in hong kong.",
  city: "NYC",
};

const STORY: string[] = [
  "Cubic Zirconia. The grimy techno-soul of downtown NYC, late-2000s into the 2010s — Nick on keys + beats, Tiombe Lockhart out front, Todd Weinstock back from the MWC days. A real band, six-piece live, four-person crew.",

  "The scene was Drop The Lime + Trouble & Bass on one side, the Lucky Me crew across the Atlantic on the other. Cubic Zirconia lived in the middle of all of it.",

  "First record dropped April 2009 — Fuck Work, SVG003 on The Savant Guard. 12-inch black vinyl, 130-gram, four-color label, full-color sleeve. Boutique launch — physical at Turntable Lab and Other Music, digital across Beatport, Traxsource, Bleep. Aggressive $2.99 digital point so it'd land on every DSP.",

  "Promo run out of London by Your Army — James Pitt, head of Virgin Dance promo for a decade, hand-delivering 175+ promo CDs to the most relevant DJs in the world. Plus Music2Mix (Pete Tong's former manager) and Release Promo for chart contributors. Long-lead press serviced to URB, XLR8R, Mixmag, DJ Mag, Filter, The Fader, Vice, Stereogum, Brooklyn Vegan, Pitchfork, iheartcomix, Daytrotter, KEXP.",

  "First UK run kicked off February 2009 — Cargo, the Notting Hill Arts Club, the kind of small-room dates that turn into the actual fanbase.",

  "March 2010 — Carniville SXSW. Mexican American Cultural Center, outdoor stage, 12:15 PM slot. The crew rented a two-bedroom house on 13th and Concho for the festival run.",

  "34 confirmed shows 2009–2012. Sónar, Boiler Room, Low End Theory, Pitchfork Festival, BPM.",

  "El-P sat in for live sets. \"First time we met Flying Lotus, Gaslamp Killer, Ras G\" was a Cubic Zirconia show at Low End Theory.",

  "Catalog moved over time — Savant Guard first, then Lucky Me + RBMA, then the whole thing landed at Lockhart Dynasty × Calm + Collect for the long haul. Six releases under LDCC: Josephine (LDCC001), Black & Blue f/ Spoek Mathambo (LDCC002), Hoes Come Out At Night (LDCC003), Follow Your Heart (LDCC004), Take Me High (LDCC005), Darko (LDCC006).",

  "All six live at /releases under the LDCC imprint.",
];

(async () => {
  console.log("\n💎 Patching Cubic Zirconia era\n");

  console.log("→ artist docs...");
  await client.createOrReplace({
    _id: TIOMBE._id,
    _type: "artist",
    name: TIOMBE.name,
    slug: { _type: "slug", current: TIOMBE.slug },
    city: TIOMBE.city,
    tagline: TIOMBE.tagline,
    onLabel: false,
  });
  console.log(`   ✓ ${TIOMBE.name}  (/artists/${TIOMBE.slug})`);

  await client
    .patch(TODD_UPDATED._id)
    .set({ tagline: TODD_UPDATED.tagline })
    .commit();
  console.log(`   ✓ ${TODD_UPDATED.name}  (tagline broadened to cover MWC + CZ)`);

  console.log("\n→ patching project-cubic-zirconia...");
  // LDCC001–006 catalog (already exists in Sanity from earlier seed work).
  const releaseIds = [
    "release-ldcc001-josephine",
    "release-ldcc002-black-blue",
    "release-ldcc003-hoes-come-out-at-night",
    "release-ldcc004-follow-your-heart",
    "release-ldcc005-take-me-high",
    "release-ldcc006-darko",
  ];
  await client
    .patch("project-cubic-zirconia")
    .set({
      story: portableText(STORY),
      members: [
        { _type: "reference", _ref: TIOMBE._id, _key: "member-tiombe-lockhart" },
        { _type: "reference", _ref: TODD_UPDATED._id, _key: "member-todd-weinstock" },
      ],
      releases: releaseIds.map((id) => ({
        _type: "reference",
        _ref: id,
        _key: `rel-${id}`,
      })),
    })
    .commit();
  console.log(`   ✓ story (10 paragraphs) + 2 members + ${releaseIds.length} releases linked`);

  console.log("\n✅ done — refresh /eras/cubic-zirconia\n");
})();
