/**
 * Bulk credit importer — pass 2.
 *
 * Adds credits we have data for on releases I missed in the first pass:
 *   · Without You EP (hookemon001-without-you, 2012-13) — El-P, Daryl
 *     Palumbo, Machinedrum, Surkin, L-Vis 1990 per discog.rtf
 *   · Spiritual Friendship iV (cc023-iv, 2021) — Andy Bell, Hinako Omori,
 *     Malena Zavala, Quinquis per press archive doc
 *
 * Plus stub artists for: Daryl Palumbo, Machinedrum, Surkin, L-Vis 1990,
 * Andy Bell, Hinako Omori, Malena Zavala, Quinquis.
 *
 * Idempotent — same signature dedup as pass 1.
 *
 * Run: `npx tsx scripts/import-credits-bulk-2.ts`
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { randomBytes } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const STUBS = [
  { name: "Daryl Palumbo", city: "Long Island · NY", tagline: "glassjaw / head automatica. on nick hook's 'without you' ep (2012)." },
  { name: "Machinedrum", city: "NYC · LA", tagline: "travis stewart. ninja tune. on 'medium rare' from nick's without you ep (2012). also on dj rashad x hook 'understand' (2015)." },
  { name: "Surkin", city: "Paris", tagline: "marble / institubes. on nick hook's without you ep (2012)." },
  { name: "L-Vis 1990", city: "London", tagline: "james connolly. night slugs co-founder. on nick hook's without you ep (2012). nick co-produced/co-wrote his neon dreams lp (island, 2011)." },
  { name: "Andy Bell", city: "London", tagline: "erasure. vocalist on spiritual friendship iV (calm + collect, 2021)." },
  { name: "Hinako Omori", city: "London", tagline: "british-japanese ambient / electronic artist. on spiritual friendship iV (2021)." },
  { name: "Malena Zavala", city: "London · argentina", tagline: "psych-folk vocalist. on spiritual friendship iV (2021)." },
  { name: "Quinquis", city: "Brittany · France", tagline: "mute records. armel meynard. on spiritual friendship iV (2021)." },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const INJECTIONS = [
  {
    slug: "hookemon001-without-you",
    label: "Without You EP",
    credits: [
      { role: "Featured artist", personName: "El-P", note: "on 'Sirens'" },
      { role: "Featured artist", personName: "Daryl Palumbo" },
      { role: "Featured artist", personName: "Machinedrum", note: "on 'Medium Rare'" },
      { role: "Featured artist", personName: "Surkin" },
      { role: "Featured artist", personName: "L-Vis 1990" },
    ],
  },
  {
    slug: "cc023-iv",
    label: "iV",
    credits: [
      { role: "Featured artist", personName: "Andy Bell", note: "Erasure" },
      { role: "Featured artist", personName: "Hinako Omori" },
      { role: "Featured artist", personName: "Malena Zavala" },
      { role: "Featured artist", personName: "Quinquis", note: "Mute Records" },
    ],
  },
];

(async () => {
  console.log("\n👥 Pass 2 — artist stubs\n");
  for (const s of STUBS) {
    const slug = slugify(s.name);
    const existing = await c.fetch(
      `*[_type == "artist" && (slug.current == $slug || lower(name) == lower($name))][0]{_id}`,
      { slug, name: s.name }
    );
    if (existing) {
      console.log(`   · ${s.name.padEnd(28)} already exists`);
      continue;
    }
    await c.createIfNotExists({
      _id: `artist-stub-${slug}`,
      _type: "artist",
      name: s.name,
      slug: { _type: "slug", current: slug },
      ...(s.city ? { city: s.city } : {}),
      ...(s.tagline ? { tagline: s.tagline } : {}),
      displayInitials: true,
    });
    console.log(`   + ${s.name.padEnd(28)} → ${slug}`);
  }

  console.log("\n💿 Pass 2 — credit injection\n");
  const cache = new Map<string, string>();
  const resolvePerson = async (name: string) => {
    const k = name.toLowerCase();
    if (cache.has(k)) return cache.get(k)!;
    const id = await c.fetch(`*[_type == "artist" && lower(name) == lower($name)][0]._id`, { name });
    if (id) cache.set(k, id);
    return id ?? null;
  };

  let total = 0;
  for (const inj of INJECTIONS) {
    const rel = await c.fetch(`*[_type == "release" && slug.current == $slug][0]{_id, title, credits}`, { slug: inj.slug });
    if (!rel) { console.log(`   ✗ ${inj.label} — release not found`); continue; }
    const existing: { role?: string; name?: string; person?: { _ref?: string } }[] = rel.credits ?? [];
    const sigs = new Set(existing.map((cr) => `${(cr.role ?? "").toLowerCase()}|${(cr.person?._ref ?? cr.name ?? "").toLowerCase()}`));
    const news: Record<string, unknown>[] = [];
    for (const cs of inj.credits) {
      const ref = await resolvePerson(cs.personName);
      const sig = `${cs.role.toLowerCase()}|${(ref ?? cs.personName).toLowerCase()}`;
      if (sigs.has(sig)) continue;
      news.push({
        _key: randomBytes(6).toString("hex"),
        role: cs.note ? `${cs.role} (${cs.note})` : cs.role,
        ...(ref ? { person: { _type: "reference", _ref: ref } } : { name: cs.personName }),
      });
    }
    if (news.length === 0) {
      console.log(`   · ${inj.label.padEnd(28)} all already present`);
      continue;
    }
    await c.patch(rel._id).set({ credits: [...existing, ...news] }).commit();
    total += news.length;
    console.log(`   ↻ ${inj.label.padEnd(28)} +${news.length} credits`);
  }
  console.log(`\n✅ ${total} credits added across ${INJECTIONS.length} releases\n`);
})();
