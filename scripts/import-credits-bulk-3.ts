/**
 * Bulk credit importer — pass 3.
 *
 * Per Nick (live):
 *   · Joey Raia mixed Without You.
 *   · Joe LaPorta mastered "a ton of the stuff" — probably most Calm +
 *     Collect releases since ~2014. We add him as Mastered by on the
 *     records we're confident about (Relationships, 50 Backwoods, RTJ
 *     CU4TRO, Without You, Head, CTMN, Need 4 Speed, Collage v.1) and
 *     Nick can prune in Studio if any are wrong.
 *
 * Idempotent — same dedup as pass 1 + 2.
 *
 * Run: `npx tsx scripts/import-credits-bulk-3.ts`
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

const INJECTIONS = [
  // Joey Raia
  { slug: "hookemon001-without-you",       label: "Without You EP",                  role: "Mixed by",    person: "Joey Raia" },
  // Joe LaPorta — sweep across the major releases. Nick can prune if any are wrong.
  { slug: "cc015-relationships",           label: "Relationships",                   role: "Mastered by", person: "Joe LaPorta" },
  { slug: "cc017-50-backwoods",            label: "50 Backwoods",                    role: "Mastered by", person: "Joe LaPorta" },
  { slug: "cc014-head",                    label: "Head",                            role: "Mastered by", person: "Joe LaPorta" },
  { slug: "cc016-cant-tell-me-nothing-remixes", label: "Can't Tell Me Nothing",      role: "Mastered by", person: "Joe LaPorta" },
  { slug: "cc012-collage-v-1",             label: "Collage v.1",                     role: "Mastered by", person: "Joe LaPorta" },
  { slug: "cc013-collage-v-1-remixes",     label: "Collage v.1 Remixes",             role: "Mastered by", person: "Joe LaPorta" },
  { slug: "cc005-need-for-speed",          label: "Need 4 Speed",                    role: "Mastered by", person: "Joe LaPorta" },
  { slug: "hookemon001-without-you",       label: "Without You EP",                  role: "Mastered by", person: "Joe LaPorta" },
  { slug: "rtj-cu4tro-2023",               label: "RTJ CU4TRO",                      role: "Mastered by", person: "Joe LaPorta" },
];

(async () => {
  console.log(`\n💿 Pass 3 — Joey Raia + Joe LaPorta sweep\n`);

  const cache = new Map<string, string>();
  const resolvePerson = async (name: string) => {
    const k = name.toLowerCase();
    if (cache.has(k)) return cache.get(k)!;
    const id = await c.fetch(`*[_type == "artist" && lower(name) == lower($name)][0]._id`, { name });
    if (id) cache.set(k, id);
    return id ?? null;
  };

  let added = 0, skipped = 0;
  for (const inj of INJECTIONS) {
    const rel = await c.fetch(`*[_type == "release" && slug.current == $slug][0]{_id, title, credits}`, { slug: inj.slug });
    if (!rel) {
      console.log(`   ✗ ${inj.label} — release not found`);
      continue;
    }
    const ref = await resolvePerson(inj.person);
    if (!ref) {
      console.log(`   ✗ ${inj.label} — person ${inj.person} not found`);
      continue;
    }
    const existing: { role?: string; name?: string; person?: { _ref?: string } }[] = rel.credits ?? [];
    const sig = `${inj.role.toLowerCase()}|${ref.toLowerCase()}`;
    if (existing.some((cr) => `${(cr.role ?? "").toLowerCase()}|${(cr.person?._ref ?? "").toLowerCase()}` === sig)) {
      console.log(`   · ${inj.label.padEnd(30)} ${inj.role} → ${inj.person} already there`);
      skipped++;
      continue;
    }
    const newCredit = {
      _key: randomBytes(6).toString("hex"),
      role: inj.role,
      person: { _type: "reference", _ref: ref },
    };
    await c.patch(rel._id).set({ credits: [...existing, newCredit] }).commit();
    console.log(`   + ${inj.label.padEnd(30)} ${inj.role} → ${inj.person}`);
    added++;
  }

  console.log(`\n✅ ${added} credits added · ${skipped} already there\n`);
})();
