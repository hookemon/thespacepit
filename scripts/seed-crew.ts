/**
 * Seed the TSP Crew — the alumni / regulars who came up through thespacepit.
 *
 * Idempotent. Creates artist docs that don't exist yet, flags `tspCrew=true`
 * on all of them, and sets the `crewRole` framing. Nick can edit bios,
 * portraits, and add socials in /studio after.
 *
 * The story arc Nick wants told: "the interns got golds." So crewRole is
 * written to lean into each member's evolution — from showing up in the
 * room to where they are now.
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

interface CrewMember {
  id: string;        // Sanity doc _id
  name: string;
  slug: string;
  city?: string;
  tagline: string;
  crewRole: string;
  crewYearStart?: number;
  instagramUrl?: string;
}

// Order matters — this is the display order on /crew. Newest interns to
// the longest-running residents, or arrange however Nick wants.
const CREW: CrewMember[] = [
  {
    id: "artist-kid-kreep",
    name: "Kid Kreep",
    slug: "kid-kreep",
    crewRole: "the producer next door · regular at the pit",
    crewYearStart: 2022,
    tagline: "showed up to chop. ended up on damn near every livestream from the pit.",
  },
  {
    id: "artist-leon-kelly",
    name: "Leon Kelly",
    slug: "leon-kelly",
    crewRole: "the gold-record intern",
    crewYearStart: 2018,
    tagline: "[Nick — drop Leon's one-line story here. came up at the pit, went on to gold.]",
  },
  {
    id: "artist-gabe-schuman",
    name: "Gabe Schuman",
    slug: "gabe-schuman",
    crewRole: "from intern to credits",
    crewYearStart: 2019,
    tagline: "[Nick — drop Gabe's one-line here.]",
  },
  {
    id: "artist-mike-bloom",
    name: "Mike Bloom",
    slug: "mike-bloom",
    crewRole: "engineer in the room",
    crewYearStart: 2019,
    tagline: "[Nick — drop Mike's one-line here.]",
  },
];

async function main() {
  for (const m of CREW) {
    const existing = await c.fetch<{ _id: string; tspCrew?: boolean; name?: string } | null>(
      `*[_id == $id][0]{ _id, tspCrew, name }`,
      { id: m.id },
    );
    if (existing) {
      console.log(`↪ patching existing: ${m.name}`);
      await c.patch(m.id).set({
        tspCrew: true,
        crewRole: m.crewRole,
        crewYearStart: m.crewYearStart,
        // Don't overwrite existing tagline if Nick already wrote one
        ...(!existing.tspCrew ? { tagline: m.tagline } : {}),
      }).commit();
    } else {
      console.log(`+ creating: ${m.name}`);
      await c.createIfNotExists({
        _id: m.id,
        _type: "artist",
        name: m.name,
        slug: { _type: "slug", current: m.slug },
        city: m.city ?? "brooklyn",
        tagline: m.tagline,
        instagramUrl: m.instagramUrl,
        tspCrew: true,
        crewRole: m.crewRole,
        crewYearStart: m.crewYearStart,
        onLabel: false,
      });
    }
  }
  console.log("\n✓ crew seeded. Edit bios + portraits + socials in /studio.");
}

main().catch((e) => { console.error(e); process.exit(1); });
