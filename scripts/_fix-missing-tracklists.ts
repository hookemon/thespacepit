/**
 * Patch tracklists for releases that were missing entries in Sanity.
 * Preserves any existing track (so the audio asset reference survives) and
 * appends the missing ones. Run upload-owned-tracks.ts afterward to fill
 * audio for the new tracks.
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { randomUUID } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const FIXES = [
  {
    _id: "release-ldcc002-black-blue",
    label: "LDCC002 Black & Blue",
    // Order matches the file numbering 1..5 in the catalog folder.
    desiredTitles: [
      "Black & Blue",
      // file "1-2--1-..." looks like an alt/instrumental — name conservatively
      "Black & Blue (Alt)",
      "Black & Blue (Bim Marx Rubber Dub)",
      "Black & Blue (Caligula Remix)",
      "Black & Blue (Oneauff Remix)",
    ],
  },
  {
    _id: "release-ldcc006-darko",
    label: "LDCC006 Darko",
    // Sanity currently has 5 remix/version tracks but is missing the
    // original "Darko". File numbering puts the original at slot 1.
    desiredTitles: [
      "Darko",
      "Darko (Tommy Trash Remix)",
      "Darko (Tony Senghore Trashy 3AM Remix)",
      "Darko (Tony Senghore Deep Remix)",
      "Darko (Instrumental)",
      "Darko (Acapella)",
    ],
  },
  {
    _id: "release-cc022-breath-you-out-and-breath-you-in",
    label: "CC022 Breath You Out and Breath You In",
    desiredTitles: [
      "Caught In A Storm",
      "Sampaguita",
      "You Against Me",
      "My Favorite Rhyme",
      "The Heat",
      "And Then You Came Along",
    ],
  },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(accappella|acappella|accapella|acapella|acap)\b/g, "acapella")
    .replace(/\s+/g, " ")
    .trim();
}

(async () => {
  for (const fix of FIXES) {
    const doc = await c.fetch<{ _id: string; tracklist: Array<{ _key: string; title: string; [k: string]: unknown }> } | null>(
      `*[_id == $id][0]{ _id, tracklist }`,
      { id: fix._id }
    );
    if (!doc) {
      console.log(`✗ ${fix.label}: doc not found`);
      continue;
    }
    const existing = doc.tracklist ?? [];
    // Build new tracklist by walking desired titles. For each, check if an
    // existing track matches (by normalized title) — if so reuse its _key
    // and full object (so audio reference survives). Otherwise create new.
    const newTracklist = fix.desiredTitles.map((title) => {
      const match = existing.find((e) => normalize(e.title) === normalize(title));
      if (match) return match;
      return { _key: randomUUID(), _type: "object", title };
    });
    // Are we adding tracks (vs reorder-only)?
    const oldKeys = existing.map((t) => t._key).sort().join(",");
    const newKeys = newTracklist.map((t) => t._key).sort().join(",");
    const isAdditive = newTracklist.length > existing.length;
    const reorderOnly = oldKeys === newKeys;
    const newCount = newTracklist.filter((t) => !existing.some((e) => e._key === t._key)).length;

    console.log(`\n📀 ${fix.label}`);
    console.log(`   before: ${existing.length} track${existing.length === 1 ? "" : "s"}`);
    console.log(`   after : ${newTracklist.length} track${newTracklist.length === 1 ? "" : "s"}  (${newCount} new, ${newTracklist.length - newCount} preserved)`);
    if (reorderOnly) {
      console.log(`   (reorder only — no audio reupload needed)`);
    }
    for (const t of newTracklist) {
      const isNew = !existing.some((e) => e._key === t._key);
      console.log(`     · ${t.title}${isNew ? "  (NEW)" : "  (existing — preserves audio)"}`);
    }
    await c.patch(fix._id).set({ tracklist: newTracklist }).commit();
    console.log(`   ✓ patched`);
  }
})().catch((err) => { console.error(err); process.exit(1); });
