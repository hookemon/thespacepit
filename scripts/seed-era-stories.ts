/**
 * Add Portable Text "story" content to the major era pages — pulled from the
 * EPK, the master shows spreadsheet (NOTES column), and known career bio.
 * Idempotent — re-runs overwrite the story field.
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
    _key: `p${i}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `s${i}`, text: p, marks: [] }],
  }));
}

const STORIES: Record<string, string[]> = {
  "project-men-women-children": [
    "Nick's first band. 2004–2008. Two albums on Warner Brothers, signed through Nettwerk via Tom Gates. Booking through Adam Weiser at Agency Group / WMG.",
    "Nick on keyboards, barely out of his teens when he hit the road in 2004. Toured the US relentlessly — Baltimore, Wilkes-Barre, Poughkeepsie, Providence, Boston, Hoboken, every market a band could fit into. 167 confirmed dates by 2008.",
    "Co-billed with Nightmare of You on most of the early run. Headline shows after that. Diamond Nights, The Bravery, Phantom Planet on tour with them at various points.",
    "Gareth Jones mixed the major-label record — that's where the long Nick + Gareth relationship started. Two decades later, they're Spiritual Friendship.",
    "\"I worked on music for 20 hours a day for the next year and a half.\" — Nick on the MWC era.",
  ],
  "project-cubic-zirconia": [
    "The grimy techno-soul of NYC's Cubic Zirconia. Downtown New York, late-2000s into the 2010s.",
    "Nick on keys + beats, Tiombe Lockhart on the front. The band that lived in the same scene as Drop The Lime, Trouble & Bass, and the Lucky Me crew across the Atlantic.",
    "34 confirmed shows 2009–2012. Sónar, Boiler Room, Low End Theory, Pitchfork Festival, BPM. Released through Lucky Me + RBMA before the catalog landed at Lockhart Dynasty × Calm + Collect.",
    "Nick was playing live with El-P at the same time — Cubic Zirconia and El-P on the same bills. \"First time we met Flying Lotus, Gaslamp Killer, Ras G\" was a Cubic Zirconia show at Low End Theory.",
    "The whole catalog now lives at /releases under the LDCC imprint — six releases.",
  ],
  "project-hookemon-records": [
    "Nick's first label. Launched right before Calm + Collect, now folded into the C+C catalog for continuity.",
    "Three releases on the imprint: Nick Hook's debut Without You (hookemon001), and the first two Spiritual Friendship records — the self-titled and the Friendship (Remixes).",
    "Operating today as the same entity as Calm + Collect — the imprint is technically retired but the catalog stays alive on the label site.",
  ],
  "project-calm-collect": [
    "Nick's main label. Launched 2013. Brooklyn → Medellín.",
    "29 main-imprint releases and counting (CC001 → CC029, 2025). Plus the Calllm ambient sub-label, the Lockhart Dynasty × C+C imprint for the Cubic Zirconia catalog, and the Instrumental imprint for the producer-driven cuts.",
    "Roster includes Nick Hook, Spiritual Friendship, Quazzy, Geraldina, Sinister Dane, Superhero Killer, Camo UFOs, Gareth Jones (Electrogenetic).",
    "Hip-hop, experimental, and ambient — released with care, one at a time.",
  ],
  "project-calllm-ambient-sub-label": [
    "Calm + Collect's ambient and meditative wing. The full chakra series of seven drone records by Spiritual Friendship — Root through Crown.",
    "Scored to chakra-corresponding keys (C, D, E, F#, G, A, B). Released alongside live watercolor + guided meditation events.",
  ],
  "project-lockhart-dynasty-calm-collect": [
    "A partnership between Nick Hook and Tiombe Lockhart, housing the entire Cubic Zirconia catalog.",
    "Six releases, LDCC001 → LDCC006: Josephine, Black & Blue, Hoes Come Out at Night, Follow Your Heart, Take Me High, Darko.",
  ],
  "project-run-the-jewels-tour-2017": [
    "33 shows. January 11 → March 1, 2017. North American winter tour with Run The Jewels.",
    "Nick opened every night and DJ'd Gangsta Boo's set during the show — the start of the long Boo + Nick run that produced the I'm Fresh / Peephole records.",
    "Cities: New Orleans, Atlanta, Chicago, Detroit, Toronto, Montreal, Boston, NYC, DC, Philly, Charlotte, Nashville, Austin, Houston, Dallas, Phoenix, LA, SF, Portland, Seattle, Denver, Salt Lake — the route every touring rapper knows.",
  ],
  "project-asia-india-tour": [
    "Delhi, Hong Kong, Shenzhen, Seoul, Shanghai. Plus Machinedrum's Vapor City run alongside.",
    "May 2019 → 2020 — cut short by COVID. The pre-pandemic last lap before the world stopped touring.",
  ],
  "project-solo-dj-live": [
    "The umbrella for everything not part of a band or specific tour. 87+ confirmed solo shows 2009 → today.",
    "Boiler Room, Fool's Gold Day Off, Sónar, Moogfest, MoMA PS1, NTS Radio, The Lot, Hopscotch, Pitchfork Festival — every club night in between.",
    "Brooklyn → Medellín, Berlin, Tokyo, anywhere there's a system loud enough.",
  ],
  "project-drop-the-lime-live-engineer": [
    "Late 2000s into the early 2010s — Nick ran sound for Drop The Lime's live shows.",
    "The Trouble & Bass era. Same downtown NYC scene as Cubic Zirconia, NguzuNguzu, the early footwork wave.",
  ],
};

(async () => {
  console.log(`\n📝 Seeding stories for ${Object.keys(STORIES).length} eras...\n`);
  for (const [id, paragraphs] of Object.entries(STORIES)) {
    const story = portableText(paragraphs);
    try {
      await client.patch(id).set({ story }).commit();
      console.log(`  ✓ ${id} — ${paragraphs.length} paragraphs`);
    } catch (err) {
      console.warn(`  ⚠️  ${id} — ${(err as Error).message}`);
    }
  }
  console.log("\n✅ done\n");
})();
