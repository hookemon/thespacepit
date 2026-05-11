/**
 * Batch-set releaseDate (and derived year) on releases by fuzzy title match.
 * Usage: edit the BATCH array below, then `npx tsx scripts/patch-dates.ts`.
 *
 * Idempotent — running twice produces the same result.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

// ───────────────────────────────────────────────────────────────────────────
// EDIT THIS LIST. Title is fuzzy-matched against Sanity release titles.
// Date format: YYYY-MM-DD.
// ───────────────────────────────────────────────────────────────────────────
const BATCH: { titleHint: string; date: string }[] = [
  { titleHint: "without you",        date: "2013-08-13" },
  { titleHint: "collage v.1",        date: "2014-12-16" },  // not the remixes
  { titleHint: "relationships",      date: "2016-11-01" },
  { titleHint: "peephole",           date: "2020-01-24" },
  { titleHint: "what you gonna do",  date: "2025-05-23" },
  { titleHint: "jungle juice",       date: "2024-10-18" },
  { titleHint: "la burbuja",         date: "2024-05-31" },  // CC025
  { titleHint: "pranamaya",          date: "2024-04-26" },  // CC024
  { titleHint: "iv",                 date: "2021-12-10" },  // CC023 — Spiritual Friendship 4
  { titleHint: "tardes de verano (polybiu", date: "2021-05-07" }, // CC021
  { titleHint: "the crystal",        date: "2021-03-19" },  // CC020
  { titleHint: "crown",              date: "2021-03-15" },  // CLM009
  { titleHint: "bluni",              date: "2021-03-12" },  // CC019
  { titleHint: "third eye",          date: "2021-03-08" },  // CLM008
  { titleHint: "throat",             date: "2021-03-01" },  // CLM007
  { titleHint: "heart",              date: "2021-02-22" },  // CLM006
  { titleHint: "solar plexus",       date: "2021-02-15" },  // CLM005
  { titleHint: "sacral",             date: "2021-02-08" },  // CLM004
  { titleHint: "root",               date: "2021-02-01" },  // CLM003
  { titleHint: "fresa",              date: "2020-11-20" },
  { titleHint: "im fresh",           date: "2020-11-12" },  // CC007
  { titleHint: "la luz",             date: "2020-11-06" },
  { titleHint: "need 4 speed",       date: "2020-07-10" },  // CC005
  { titleHint: "okada 8000",         date: "2019-05-16" },
  { titleHint: "drums",              date: "2018-12-12" },  // CC003 — Spiritual Friendship Drums (not Drums 2)
  { titleHint: "like water",         date: "2018-11-07" },  // CC002
  { titleHint: "50 backwoods",       date: "2017-12-08" },  // CC017
  { titleHint: "tell me nothing",    date: "2017-04-11" },  // CC016
  { titleHint: "head",               date: "2017-02-08" },  // CC014 — Head ft. 21 Savage
  { titleHint: "spiritual friendship s/t", date: "2016-04-08" }, // hookemon002
  { titleHint: "claws of time",      date: "2023-11-17" },  // CC009 — Sinister Dane
  { titleHint: "breath you out",     date: "2021-12-12" },  // CC022 — Superhero Killer
];
// ───────────────────────────────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[‘’'`]/g, "").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

(async () => {
  const all: { _id: string; title: string }[] = await c.fetch(
    `*[_type == "release" && defined(title)] { _id, title }`
  );
  const byNorm = new Map<string, { _id: string; title: string }>();
  for (const r of all) byNorm.set(norm(r.title), r);

  console.log("\n📅 Patching release dates\n");

  for (const item of BATCH) {
    const hintNorm = norm(item.titleHint);
    // Exact normalized match first
    let match = byNorm.get(hintNorm);
    // Then prefix / contains match
    if (!match) {
      match = all.find(r => norm(r.title).startsWith(hintNorm))
           ?? all.find(r => norm(r.title).includes(hintNorm));
    }
    if (!match) {
      console.log(`   ⚠  "${item.titleHint}" — no Sanity release matched`);
      continue;
    }
    const year = parseInt(item.date.slice(0, 4));
    await c.patch(match._id).set({ releaseDate: item.date, year }).commit();
    console.log(`   ✓ ${match.title.padEnd(36)}  ${item.date}`);
  }

  console.log("\n✅ done\n");
})();
