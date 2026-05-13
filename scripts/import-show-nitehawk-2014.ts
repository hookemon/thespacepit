/**
 * Add the Collage v.1 release party at Nitehawk Cinema (Brooklyn) — Nov 18, 2014 —
 * to /shows. Reconstructed from the actual flyer that landed today off the
 * JaySounds drive (`SERATO PRESSING MASTER/COLLAGE NINJA TUNE SERATO/RELEASE
 * PARTY INVITES/new york invite.JPG`):
 *
 *   "We made something tite as fuck. Now we are showing it.
 *    Nick, Gary & Serato. Tuesday 18th Nov, 7pm-8:30 Screening,
 *    Nitehawk Cinema, 138 Metropolitan Ave, Brooklyn.
 *    Party following the screening at Pips, 158 Roebling St
 *    (bet Metropolitan & Grand). DJing + Ping Pong + open bar.
 *    Avion Grapefruit Margaritas + Lost Tribes Beer."
 *
 * Run: `npx tsx scripts/import-show-nitehawk-2014.ts`
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

(async () => {
  const _id = "liveDate-2014-11-18-nitehawk-collage-v1-release";
  const doc = {
    _id,
    _type: "liveDate",
    date: "2014-11-18",
    city: "Brooklyn, NYC",
    venue: "Nitehawk Cinema (138 Metropolitan Ave) → after-party at Pips, 158 Roebling St",
    showType: "Other",
    ticketLabel: "free",
    notes: 'Collage v.1 release party · 7pm–8:30pm Serato/Ninja Tune documentary screening (Nick, Gary & Serato), then DJing + ping pong + open bar at Pips with Avión Grapefruit Margaritas + Lost Tribes Beer.',
  };

  const existing = await c.fetch(`*[_id == $id][0]{_id}`, { id: _id });
  if (existing) {
    await c.patch(_id).set(doc).commit();
    console.log(`↻ patched ${_id}`);
  } else {
    await c.create(doc);
    console.log(`+ created ${_id}`);
  }
})();
