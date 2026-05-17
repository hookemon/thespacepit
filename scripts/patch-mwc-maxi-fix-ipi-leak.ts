/**
 * Same IPI-leak fix applied to the MWC pre-album maxi single (DANCE IN
 * MY BLOOD US DMD MAXI). 4 tracks, same 5 writers as the self-titled
 * (same song, four remixes). See patch-mwc-fix-ipi-leak.ts for full
 * context.
 *
 * Run: npx tsx scripts/patch-mwc-maxi-fix-ipi-leak.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(process.cwd(), ".env.local") });
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false,
});

const MWC_WRITERS = [
  { _key: "wc-nick",    name: "Nicholas Conceller", share: 20, pro: "SESAC", ipiCae: "00467494116", publisher: "Sell Your Money Music", publisherPro: "BMI", publisherIpiCae: "00503499551" },
  { _key: "wc-richard", name: "Richard Penzone",    share: 20, pro: "BMI",   ipiCae: "00467481423", publisher: "Sell Your Money Music", publisherPro: "BMI", publisherIpiCae: "00503499551" },
  { _key: "wc-tom-p",   name: "Thomas Penzone",     share: 20, pro: "BMI",   ipiCae: "00467494018", publisher: "Sell Your Money Music", publisherPro: "BMI", publisherIpiCae: "00503499551" },
  { _key: "wc-tom-s",   name: "Thomas Sullivan",    share: 20, pro: "BMI",   ipiCae: "00358446923", publisher: "Sell Your Money Music", publisherPro: "BMI", publisherIpiCae: "00503499551" },
  { _key: "wc-todd",    name: "Todd Weinstock",     share: 20, pro: "BMI",   ipiCae: "00196359621", publisher: "Sell Your Money Music", publisherPro: "BMI", publisherIpiCae: "00503499551" },
];

const WRITTEN_BY_CREDITS = [
  { _key: "wb-nick",    role: "Written by", person: { _type: "reference", _ref: "artist-nick-hook" } },
  { _key: "wb-richard", role: "Written by", name: "Richard Penzone" },
  { _key: "wb-tom-p",   role: "Written by", name: "Thomas Penzone" },
  { _key: "wb-tom-s",   role: "Written by", name: "Thomas Sullivan" },
  { _key: "wb-todd",    role: "Written by", name: "Todd Weinstock" },
];

async function main() {
  const r = await client.fetch<{ _id?: string; credits: Array<{ _key?: string; role?: string; name?: string }>; tracklist?: Array<{ _key: string }> } | null>(
    `*[_type == "release" && slug.current == "dance-in-my-blood-us-dmd-maxi"][0]{
      _id, credits, tracklist
    }`,
  );
  if (!r?._id) throw new Error("MWC maxi not found");
  console.log("→ patching", r._id);

  const cleanCredits = r.credits.filter((c) => {
    const isSongwriterRow = c.role?.toLowerCase() === "songwriter";
    const hasIpiDump = c.name && /(SESAC|BMI\s*#|ASCAP\s*#|\d{8,})/.test(c.name);
    return !(isSongwriterRow || hasIpiDump);
  });
  const stripped = r.credits.length - cleanCredits.length;
  console.log(`   stripped ${stripped} legacy credit row(s)`);

  const newCredits = [...WRITTEN_BY_CREDITS, ...cleanCredits];
  const newTracklist = (r.tracklist ?? []).map((t) => ({ ...t, writerCredits: MWC_WRITERS }));

  await client.patch(r._id).set({
    credits: newCredits,
    tracklist: newTracklist,
    pCopyright: "℗ 2006 Reprise Records (Warner Music Group)",
    cCopyright: "© 2006 Sell Your Money Music",
  }).commit();
  console.log("   ✓ committed");

  const after = await client.fetch(`*[_id == $id][0]{ pCopyright, "credits": credits[]{ role, name } }`, { id: r._id });
  const json = JSON.stringify(after);
  const leftover = json.match(/\b\d{8,12}\b/g) || [];
  console.log("\nLeftover digit-runs:", leftover);
  if (leftover.length === 0) console.log("✓ clean");
}

main().catch((e) => { console.error(e); process.exit(1); });
