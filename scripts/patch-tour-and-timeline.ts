/**
 * Seed tourHighlights + timeline arrays on MWC and CZ era projects.
 * Pulls from material already folded into each project's `story` block;
 * surfacing it here makes the era page self-narrating without re-reading
 * the bio. Idempotent.
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

type TH = { year?: number; title: string; note?: string; kind?: string };
type ML = { year: number; month?: string; milestone: string };

const MWC_TOUR: TH[] = [
  { year: 2005, title: "First NYC show, Lower East Side", note: "The lighting rig blew the club's power five times in one set.", kind: "moment" },
  { year: 2007, title: "Bamboozle Festival", note: "Sunday slot, NJ. The set that put the band in front of a real crowd for the first time.", kind: "festival" },
  { year: 2007, title: "MTV2 Welcome to the Universe $2 Bill Tour", note: "Co-headline run with Pierce the Veil. In Detroit, the van + trailer + $100k of gear got stolen.", kind: "tour" },
  { year: 2007, title: "Lostprophets — Brixton Academy", note: "UK support slot.", kind: "support" },
  { year: 2007, title: "Panic! At the Disco — UK arena run", note: "Across British arenas as direct support.", kind: "support" },
  { year: 2007, title: "Gang of Four — US support", note: "Hand-picked openers across the States.", kind: "support" },
  { year: 2007, title: "De La Soul — Cal Poly", note: "Crossover bill the booker still talks about.", kind: "support" },
  { year: 2008, title: "Final show — Gramercy Theatre, NYC", note: "December 19, 2008. End of a 183-show run.", kind: "moment" },
];

const MWC_TIMELINE: ML[] = [
  { year: 2004, milestone: "Form in Brooklyn — TJ Penzone, Rick Penzone, Todd Weinstock (Glassjaw), Scully Sullivan-Kaplan (Glassjaw), Jason Giummule, Nick Hook." },
  { year: 2005, milestone: "First NYC show, Lower East Side. The lighting rig blows the club's power five times." },
  { year: 2006, month: "March", milestone: "Self-titled debut LP on Reprise / Warner Bros. Recorded at Tarbox Road with Dave Fridmann; mixed by Gareth Jones." },
  { year: 2006, month: "October", milestone: "\"Lullabye\" syncs to NBC's Friday Night Lights pilot, putting the band in front of millions of viewers in week one." },
  { year: 2007, month: "May", milestone: "Bamboozle Festival, Sunday slot." },
  { year: 2007, month: "June", milestone: "Leave Warner Bros. The label situation collapses on a record nobody knows how to market." },
  { year: 2008, month: "November", milestone: "Tiombe Lockhart (vocals) and the band part ways." },
  { year: 2008, month: "December", milestone: "Final show, Gramercy Theatre NYC — December 19. 183 shows in four years." },
];

const CZ_TOUR: TH[] = [
  { year: 2009, title: "First UK run — Cargo + Notting Hill Arts Club", note: "London, February. The American duo plays its first international shows two months after forming.", kind: "tour" },
  { year: 2009, title: "Low End Theory — Los Angeles", note: "Onstage with Flying Lotus, Gaslamp Killer, Ras G. The LA beat scene's home turf.", kind: "moment" },
  { year: 2010, title: "SXSW Carniville", note: "Headline-tier slot at Diplo's marquee Austin party. Mainstream-press visibility year.", kind: "festival" },
  { year: 2011, title: "Boiler Room", note: "Streamed sets through the early Boiler Room era — both sides of the Atlantic.", kind: "moment" },
  { year: 2011, title: "Sónar Festival — Barcelona", note: "Europe's biggest electronic festival.", kind: "festival" },
  { year: 2011, title: "Pitchfork Music Festival", note: "Chicago. Indie crossover slot.", kind: "festival" },
  { year: 2012, title: "BPM Festival — Mexico", note: "Underground house/techno destination festival.", kind: "festival" },
];

const CZ_TIMELINE: ML[] = [
  { year: 2009, milestone: "Form as the duo of Tiombe Lockhart and Nick Hook — out of Brooklyn into the global club circuit." },
  { year: 2009, month: "April", milestone: "Debut release \"Fuck Work\" lands on Speakers Don't Vibrate (SVG003). The track that opened every door." },
  { year: 2009, month: "February", milestone: "First UK run — Cargo + Notting Hill Arts Club, London." },
  { year: 2010, month: "March", milestone: "SXSW Carniville with Diplo. Begins the year of mainstream-press visibility." },
  { year: 2011, milestone: "\"Lucid In The Sky\" project arc — multi-format release across Calm + Collect's pipeline." },
  { year: 2012, milestone: "Lockhart Dynasty × Calm + Collect catalog launches as the joint platform for the duo's later output." },
];

const TARGETS: { id: string; tour: TH[]; timeline: ML[] }[] = [
  { id: "project-men-women-children", tour: MWC_TOUR, timeline: MWC_TIMELINE },
  { id: "project-cubic-zirconia", tour: CZ_TOUR, timeline: CZ_TIMELINE },
];

(async () => {
  console.log("\n📅 Seeding tour highlights + timeline\n");

  for (const t of TARGETS) {
    await client
      .patch(t.id)
      .set({
        tourHighlights: t.tour.map((h, i) => ({ _key: `th-${i}`, ...h })),
        timeline: t.timeline.map((m, i) => ({ _key: `ml-${i}`, ...m })),
      })
      .commit();
    console.log(`   ✓ ${t.id} ← ${t.tour.length} tour highlights, ${t.timeline.length} milestones`);
  }

  console.log("\n✅ done\n");
})();
