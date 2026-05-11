/**
 * Seed Nick's Gumroad packs into Sanity. Downloads each cover, creates a Pack
 * doc, and wires gear + release references.
 *
 * Idempotent. Run: npx tsx scripts/seed-gumroad-packs.ts
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
  s.toLowerCase().replace(/['"’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type PackSeed = {
  gumroadSlug: string;          // /l/{slug}
  name: string;
  kind: "sample-pack" | "preset-pack" | "template" | "tutorial" | "loop-pack" | "drum-kit";
  tagline?: string;
  description: string;
  coverUrl: string;
  price?: string;
  gearSlugs?: string[];
  releaseSlugs?: string[];
  featured?: boolean;
};

const PACKS: PackSeed[] = [
  {
    gumroadSlug: "SP1200",
    name: "SP-1200 Sample Pack",
    kind: "sample-pack",
    tagline: "off Nick's SP-1200 (originally owned by Paul C.)",
    description:
      "Hot fire straight off Nick's E-mu SP-1200 — originally owned by Paul C. Short passages of a range of the machine's sounds and one-shot samples: 4 snare shots, 3 snare rolls, 4 snaps, 1 snap roll, 3 claps, 1 clap roll, 3 kicks, 1 kick roll, 2 sub-bass tones, 2 hats, 1 hat roll, 1 weird filter sound, 1 groovy loop.",
    coverUrl: "https://public-files.gumroad.com/0n54c74c0zosx86e0l3i9hb39xyh",
    gearSlugs: ["e-mu-sp-1200"],
    featured: true,
  },
  {
    gumroadSlug: "909DAYV1",
    name: "909 Day Pack v1",
    kind: "sample-pack",
    tagline: "free · 909 day tribute",
    description:
      "After owning my 909 for over 15 years, I figured today was the day to finally participate in 909 Day. Free for the day, my very first 909 pack. My way of paying tribute.",
    coverUrl: "https://public-files.gumroad.com/zyvx0yu2aisiyzstbcl9b9pz7el5",
    price: "free",
    gearSlugs: ["roland-tr-909"],
  },
  {
    gumroadSlug: "STYLOPHONEBEAT",
    name: "Stylophone Beat Pack",
    kind: "sample-pack",
    tagline: "18 loops + 48 one-shots · 24-bit",
    description:
      "A late-night Stylophone session pushed through my favorite multi-FX racks. 18 loops + 48 one-shots, all experimental, saturated, and ready to flip. Royalty-free 24-bit WAVs.",
    coverUrl: "https://public-files.gumroad.com/gkbqq5i45nra9yxlfj4ds3uflubm",
  },
  {
    gumroadSlug: "WHATYOUGONNADO",
    name: "What You Gonna Do — Sample Pack",
    kind: "sample-pack",
    tagline: "Calm + Collect × thespacepit · the WYGD stems & one-shots",
    description:
      "Calm + Collect + thespacepit present: WHAT YOU GONNA DO — Sample Pack featuring Kid Kreep + Logo No Logo. Straight from the sessions — this pack gives you the raw ingredients to flip your own version.",
    coverUrl: "https://public-files.gumroad.com/o0gbdkgzw4x25xxdrma04ky572fk",
    releaseSlugs: ["cc027-what-you-gonna-do"],
    featured: true,
  },
  {
    gumroadSlug: "dancehall103am",
    name: "Dancehall 103am — Move Set",
    kind: "template",
    tagline: "ableton move set from the IG reel",
    description:
      "From my lil Ableton Move reel. Cop the full set from the video. Let's see what you do with it next.",
    coverUrl: "https://public-files.gumroad.com/yquj2lpgfoxmdfs20omq192y0hdy",
    gearSlugs: ["ableton-move"],
  },
  {
    gumroadSlug: "1on1",
    name: "1-on-1 with Nick",
    kind: "tutorial",
    tagline: "session / coaching",
    description:
      "Yo — I'm Nick Hook. I've produced for Run The Jewels, Young Thug, Azealia Banks, and scored Grand Theft Auto. I've toured the world, built studios in Brooklyn and Colombia, and helped artists. Book a 1-on-1.",
    coverUrl: "https://public-files.gumroad.com/7p8ofycowjz87appqeh0819hk8hx",
  },
];

async function uploadAssetFromUrl(url: string, filename: string): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": "spacepit-pack-seed/1.0" } });
  if (!res.ok) throw new Error(`failed to fetch cover (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const asset = await client.assets.upload("image", buf, { filename });
  return asset._id;
}

async function findId(slug: string, type: string): Promise<string | null> {
  const r = await client.fetch<{ _id: string } | null>(
    `*[_type == $type && slug.current == $slug][0]{ _id }`,
    { type, slug }
  );
  return r?._id ?? null;
}

async function main() {
  console.log(`📦 seeding ${PACKS.length} Gumroad packs...\n`);

  for (const p of PACKS) {
    const slug = slugify(p.name);
    const _id = `pack-${slug}`;
    const downloadUrl = `https://nickhook.gumroad.com/l/${p.gumroadSlug}`;

    // Has it already been seeded?
    const existing = await client.fetch<{ _id: string } | null>(
      `*[_id == $id][0]{ _id }`,
      { id: _id }
    );

    let coverAssetId: string | undefined;
    if (!existing) {
      const filename = `${slug}-cover.jpg`;
      try {
        coverAssetId = await uploadAssetFromUrl(p.coverUrl, filename);
      } catch (err) {
        console.warn(`  ⚠ cover failed for ${p.name}: ${(err as Error).message}`);
      }
    }

    // Resolve gear + release refs.
    const gearRefs = [];
    for (const gs of p.gearSlugs ?? []) {
      const id = await findId(gs, "gear");
      if (id) gearRefs.push({ _key: `g-${gs.slice(0, 8)}`, _type: "reference", _ref: id });
    }
    const releaseRefs = [];
    for (const rs of p.releaseSlugs ?? []) {
      const id = await findId(rs, "release");
      if (id) releaseRefs.push({ _key: `r-${rs.slice(0, 8)}`, _type: "reference", _ref: id });
    }

    const doc = {
      _id,
      _type: "pack",
      name: p.name,
      slug: { _type: "slug", current: slug },
      kind: p.kind,
      ...(p.tagline ? { tagline: p.tagline } : {}),
      description: [
        {
          _type: "block",
          _key: "d0",
          style: "normal",
          markDefs: [],
          children: [{ _type: "span", _key: "d0s", text: p.description, marks: [] }],
        },
      ],
      downloadUrl,
      ...(p.price ? { price: p.price } : {}),
      ...(p.featured ? { featured: p.featured } : {}),
      ...(coverAssetId
        ? { cover: { _type: "image", asset: { _type: "reference", _ref: coverAssetId } } }
        : {}),
      ...(gearRefs.length ? { gear: gearRefs } : {}),
      ...(releaseRefs.length ? { releases: releaseRefs } : {}),
    };

    if (existing) {
      // Update non-cover fields (preserve cover so we don't lose it).
      await client.patch(_id)
        .set({
          name: doc.name,
          slug: doc.slug,
          kind: doc.kind,
          tagline: p.tagline,
          description: doc.description,
          downloadUrl: doc.downloadUrl,
          ...(p.price ? { price: p.price } : {}),
          ...(p.featured ? { featured: p.featured } : {}),
          ...(gearRefs.length ? { gear: gearRefs } : {}),
          ...(releaseRefs.length ? { releases: releaseRefs } : {}),
        })
        .commit({ autoGenerateArrayKeys: true });
      console.log(`  ↺ updated ${p.name}`);
    } else {
      await client.create(doc);
      console.log(`  + ${p.name}  (${gearRefs.length} gear, ${releaseRefs.length} release)`);
    }
  }

  console.log(`\n✅ done`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
