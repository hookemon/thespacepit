/**
 * Seed the two studios — thespacepit (Brooklyn) + la burbuja (Medellín) —
 * with story content + gear lists. Hero photos can be uploaded via /studio
 * later, or we'll use the existing hallway shot.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

function pt(paragraphs: string[]) {
  return paragraphs.map((p, i) => ({
    _type: "block",
    _key: `p${i}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `s${i}`, text: p, marks: [] }],
  }));
}

async function uploadHallwayHero(): Promise<string | null> {
  try {
    const buffer = readFileSync("/Users/nickhook/projects/spacepit-web/public/spacepit-hallway.jpg");
    const asset = await client.assets.upload("image", buffer, {
      filename: "spacepit-hallway-hero.jpg",
      contentType: "image/jpeg",
    });
    return asset._id;
  } catch (err) {
    console.warn("hero upload failed:", (err as Error).message);
    return null;
  }
}

(async () => {
  console.log("\n🏠  Seeding studios\n");

  const heroAssetId = await uploadHallwayHero();
  console.log(`hallway hero asset: ${heroAssetId ?? "—"}\n`);

  const STUDIOS = [
    {
      _id: "studio-thespacepit",
      name: "thespacepit",
      slug: "thespacepit",
      city: "Greenpoint, Brooklyn",
      country: "USA",
      yearOpened: 2014,
      tagline: "the original. yellow walls signed by every artist who's recorded here. a creative recording hub for platinum records, underground classics, and the global community of artists who pull up.",
      color: "#F2B705",
      instagramUrl: "https://www.instagram.com/thespacepit/",
      featured: true,
      story: pt([
        "Greenpoint, Brooklyn. Opened 2014. The room with the yellow walls and the dark grey door — every artist who's recorded here has signed somewhere on the way in.",
        "Recording, mixing, residencies, content — the whole thing happens here. From Gangsta Boo's Lot Radio episodes to Spiritual Friendship's Drones series to most of the Calm + Collect catalog.",
        "Nothing turned off. If you pull up and something isn't patched in, patch it in.",
      ]),
      gear: [
        "Roland TR-808 (signed by Bruce Forat · near-death at Sónar, she back)",
        "EMT 250 reverb (allegedly Jeff Porcaro's)",
        "Elektron Octatrack mk2",
        "Prophet '08",
        "Akai MPC 2500",
        "Manley Cardioid Reference mic",
        "Distressor stack",
        "Pultec EQ chain",
        "Eventide H3000",
        "Moog Modular",
      ],
      ...(heroAssetId && {
        hero: { _type: "image", asset: { _type: "reference", _ref: heroAssetId } },
      }),
    },
    {
      _id: "studio-la-burbuja",
      name: "la burbuja",
      slug: "la-burbuja",
      city: "Medellín",
      country: "Colombia",
      yearOpened: 2022,
      tagline: "the medellín room. the garden. the second pit. quazzy + nick recorded La Burbuja LP here — the album it's named for. tropical rain on the roof, OP-1 field travel kit, eternal patch bay.",
      color: "#3E8E5A",
      featured: true,
      story: pt([
        "Medellín, Colombia. The garden room. Where the second half of the spacepit story plays out — equal parts studio, residency, and place to be.",
        "Quazzy + Nick recorded La Burbuja LP here. CC024 (Pranamaya Kosha) and most of the Calllm chakra series caught their final mix passes in this room too.",
        "Lighter setup than Brooklyn — TE OP-1 field as the travel kit, the Octatrack, a Moog, a portable patch bay. Built to write and finish, not to track full bands.",
        "Open to collaborators passing through Latin America — Pawkarmayta, Inti, Mikongo on Union EP started here.",
      ]),
      gear: [
        "Teenage Engineering OP-1 field",
        "Elektron Octatrack",
        "Moog (portable)",
        "Travel rack + monitors",
      ],
    },
  ];

  for (const s of STUDIOS) {
    await client.createOrReplace({ _type: "studio", ...s, slug: { _type: "slug", current: s.slug } });
    console.log(`  ✓ ${s.name} — ${s.city}`);
  }
  console.log("\n✅ done\n");
})();
