/**
 * Seed Project (era) docs from the Master Show History spreadsheet.
 * Year ranges + show counts come from the data; tagline + color are curated.
 *
 * Run: npx tsx scripts/seed-eras.ts
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

const slugify = (s: string) =>
  s.toLowerCase().replace(/['"’&×x]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type EraSeed = {
  name: string;
  yearStart: number;
  yearEnd?: number;
  kind: "band" | "label era" | "imprint era" | "production era" | "residency" | "other";
  tagline?: string;
  color: string;
  featured?: boolean;
};

const ERAS: EraSeed[] = [
  // === BANDS / PROJECTS ===
  {
    name: "Men Women & Children",
    yearStart: 2004,
    yearEnd: 2008,
    kind: "band",
    tagline: "183 shows. two albums on warner brothers + nettwerk. nick on keys, barely out of his teens, on the road.",
    color: "#1C1A17",
    featured: true,
  },
  {
    name: "Cubic Zirconia",
    yearStart: 2009,
    yearEnd: 2012,
    kind: "band",
    tagline: "the grimy techno-soul of nyc. nick on keys + beats. with tiombe lockhart, downtown new york scene.",
    color: "#9B1B1B",
    featured: true,
  },
  {
    name: "Drop The Lime · live engineer",
    yearStart: 2009,
    yearEnd: 2012,
    kind: "production era",
    tagline: "ran sound for drop the lime's live show through the trouble & bass era.",
    color: "#E83A1C",
  },

  // === LABEL ERAS ===
  {
    name: "Hookemon Records",
    yearStart: 2010,
    yearEnd: 2013,
    kind: "label era",
    tagline: "the first label. nick's debut + spiritual friendship's first records. now folded into calm + collect.",
    color: "#3E8E5A",
  },
  {
    name: "Calm + Collect",
    yearStart: 2013,
    kind: "label era",
    tagline: "the main label. nick + gareth jones. 29 main releases and counting. brooklyn → medellín.",
    color: "#0E4B3A",
    featured: true,
  },
  {
    name: "Calllm · ambient sub-label",
    yearStart: 2018,
    kind: "imprint era",
    tagline: "the ambient + meditation arm. spiritual friendship chakra series. drone weeks.",
    color: "#C9B9E8",
  },
  {
    name: "Lockhart Dynasty × Calm + Collect",
    yearStart: 2009,
    kind: "imprint era",
    tagline: "the cubic zirconia catalogue lives here. partnership with tiombe lockhart.",
    color: "#4B2E83",
  },

  // === SOLO + TOURING ERAS ===
  {
    name: "Solo DJ + Live",
    yearStart: 2009,
    kind: "production era",
    tagline: "87+ dated solo shows. boiler room, fool's gold day off, sonar, mocafest, the lot, nts, every club night in between.",
    color: "#F2B705",
  },
  {
    name: "Elastic Artists · Europe",
    yearStart: 2013,
    yearEnd: 2015,
    kind: "production era",
    tagline: "european booking era — 19 shows across the eu.",
    color: "#2F6FB3",
  },
  {
    name: "Red Bull / RBMA",
    yearStart: 2012,
    yearEnd: 2017,
    kind: "production era",
    tagline: "rbma 2011 alumni. 10+ rbma + red bull dates over the years.",
    color: "#E83A1C",
  },
  {
    name: "Sónar",
    yearStart: 2012,
    yearEnd: 2018,
    kind: "production era",
    tagline: "8 sónar appearances barcelona/iceland — solo, with cubic zirconia, with friends.",
    color: "#E2651A",
  },
  {
    name: "Halcyon Mondays Residency",
    yearStart: 2016,
    yearEnd: 2016,
    kind: "residency",
    tagline: "8-week monday residency at halcyon, brooklyn.",
    color: "#F2C84B",
  },
  {
    name: "Run The Jewels Tour 2017",
    yearStart: 2017,
    yearEnd: 2017,
    kind: "production era",
    tagline: "33 shows. opener + dj for gangsta boo. jan 11 – mar 1 us tour with rtj.",
    color: "#E83A1C",
    featured: true,
  },
  {
    name: "Nick Hook + DJ Earl Tour",
    yearStart: 2017,
    yearEnd: 2017,
    kind: "production era",
    tagline: "9 dates with dj earl behind 50 backwoods.",
    color: "#0E4B3A",
  },
  {
    name: "Gangsta Boo · live + studio",
    yearStart: 2019,
    yearEnd: 2019,
    kind: "production era",
    tagline: "ran the lot radio show with lola mitchell + 6 dated shows. rip the queen.",
    color: "#9B1B1B",
  },
  {
    name: "Asia + India Tour",
    yearStart: 2019,
    yearEnd: 2020,
    kind: "production era",
    tagline: "delhi · hong kong · shenzhen · seoul · shanghai · machinedrum vapor city. cut short by covid.",
    color: "#4B2E83",
  },
  {
    name: "RTJ 10th Anniversary",
    yearStart: 2023,
    yearEnd: 2023,
    kind: "production era",
    tagline: "ten years of run the jewels — back on the road.",
    color: "#E83A1C",
  },
];

async function seed() {
  console.log(`\n🎚  Seeding ${ERAS.length} eras...\n`);
  for (const era of ERAS) {
    const slug = slugify(era.name);
    const _id = `project-${slug}`;
    await client.createOrReplace({
      _id,
      _type: "project",
      name: era.name,
      slug: { _type: "slug", current: slug },
      yearStart: era.yearStart,
      yearEnd: era.yearEnd,
      kind: era.kind,
      tagline: era.tagline,
      color: era.color,
      featured: era.featured ?? false,
    });
    console.log(`  ✓ ${era.name} (${era.yearStart}${era.yearEnd ? `–${era.yearEnd}` : " →"})`);
  }
  console.log(`\n✅ Done. Visit /eras.`);
}

seed().catch((err) => {
  console.error("\n❌ Seed failed:", err);
  process.exit(1);
});
