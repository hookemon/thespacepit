/**
 * Razzmatazz Barcelona shows — both Fuego nights Nick promoted/played.
 *
 *   1) Friday Oct 18, 2019 — Nick Hook + Gangsta Boo (her first Spain show ever)
 *   2) Friday March 3, 2023 — Nick Hook + D Double E (post-Boo, same promoter)
 *
 * Reconstructed from Gmail thread chain with Miquel Sanahuja
 * (miquel.sanahuja@salarazzmatazz.com → milesaway.es) — booker for the
 * Razzmatazz "Fuego I Trill I Suave" night. Will at Miles Away (will@milesaway.es)
 * was the EU agent on both.
 *
 * Run: `npx tsx scripts/import-shows-razzmatazz.ts`
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const SHOWS = [
  {
    _id: "liveDate-2019-10-18-razzmatazz-boo",
    date: "2019-10-18",
    city: "Barcelona, ES",
    venue: "Razzmatazz · Fuego",
    showType: "DJ set",
    notes:
      'Gangsta Boo\'s first show in Spain, ever. Nick Hook + Gangsta Boo at Razzmatazz "Fuego" night. Booked through Miquel Sanahuja (Sala Razzmatazz) via Will / Miles Away. Same trip → Paris (Bourbon) Oct 19 + Amsterdam stops with Ben Westbeech. Tied to the upcoming "I\'m Fresh" single drop.',
  },
  {
    _id: "liveDate-2023-03-03-razzmatazz-d-double-e",
    date: "2023-03-03",
    city: "Barcelona, ES",
    venue: "Razzmatazz · Fuego (main stage)",
    showType: "DJ set",
    notes:
      'Nick Hook + D Double E at Razzmatazz "Fuego." First time back to Razzmatazz after Gangsta Boo passed in January 2023 — Nick brought D Double E in her place. "RIP Gangsta Boo. She loved it so much, it was such a great experience."',
  },
];

(async () => {
  for (const s of SHOWS) {
    const doc = {
      _id: s._id,
      _type: "liveDate",
      date: s.date,
      city: s.city,
      venue: s.venue,
      showType: s.showType,
      notes: s.notes,
    };
    const existing = await c.fetch(`*[_id == $id][0]{ _id }`, { id: s._id });
    if (existing) {
      await c.patch(s._id).set(doc).commit();
      console.log(`↻ patched ${s._id}`);
    } else {
      await c.create(doc);
      console.log(`+ created ${s._id}`);
    }
  }

  // Make sure D Double E has an artist doc too (so feat. credits etc. can link)
  const ddeId = "artist-stub-d-double-e";
  const existingDDE = await c.fetch(
    `*[_type == "artist" && (slug.current == "d-double-e" || lower(name) == "d double e")][0]{_id}`
  );
  if (!existingDDE) {
    await c.createIfNotExists({
      _id: ddeId,
      _type: "artist",
      name: "D Double E",
      slug: { _type: "slug", current: "d-double-e" },
      city: "London · East",
      tagline:
        "newham generals / bloodline / grime royalty. nick brought him to razzmatazz barcelona for fuego in march 2023.",
      displayInitials: true,
    });
    console.log(`+ created artist: D Double E → /artists/d-double-e`);
  } else {
    console.log(`· D Double E artist already exists`);
  }
})();
