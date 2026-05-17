/* eslint-disable no-console */
/**
 * Two MWC credit fixes Nick flagged after reviewing the page:
 *
 *   1. The 5th band-member writer is "David Sullivan Kaplan", NOT
 *      "Thomas Sullivan" — that was a transcription error. Same person
 *      across both MWC releases (self-titled + DANCE IN MY BLOOD MAXI).
 *      IPI stays as-is (canonical to him at BMI); only the name changes.
 *
 *   2. On MWC self-titled, mix credit was rendering as
 *      "Mixed by: Gareth Jones + Rudyard Lee Cullers". Wrong — Gareth
 *      was the mix engineer, Rudyard was his assistant. Change Rudyard's
 *      role from "Mixed by" → "Mix assistant" so they read in the right
 *      hierarchy on the credits room.
 *
 * Run: npx tsx scripts/patch-mwc-sullivan-and-mix-assist.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const OLD_NAME = "Thomas Sullivan";
const NEW_NAME = "David Sullivan Kaplan";
const TARGETS = ["release-mwc-self-titled", "release-ext-dance-in-my-blood-us-dmd-maxi"];

type Credit = { _key?: string; role?: string; name?: string };
type WriterCredit = { _key?: string; name?: string; [k: string]: unknown };
type Track = { _key: string; writerCredits?: WriterCredit[]; [k: string]: unknown };

async function main() {
  for (const id of TARGETS) {
    console.log(`\n→ ${id}`);
    const r = await client.fetch<{ credits?: Credit[]; tracklist?: Track[] } | null>(
      `*[_id == $id][0]{ credits, tracklist }`,
      { id },
    );
    if (!r) {
      console.log("   ! not found, skipping");
      continue;
    }

    // 1a. Rename in credits[] (the public "Written by" row).
    const newCredits = (r.credits ?? []).map((c) =>
      c.name === OLD_NAME ? { ...c, name: NEW_NAME } : c,
    );

    // 1b. Rename in tracklist[].writerCredits[].name (private splits).
    const newTracklist = (r.tracklist ?? []).map((t) => ({
      ...t,
      writerCredits: (t.writerCredits ?? []).map((w) =>
        w.name === OLD_NAME ? { ...w, name: NEW_NAME } : w,
      ),
    }));

    // 2. On MWC self-titled only: Rudyard Lee Cullers → "Mix assistant"
    //    (instead of "Mixed by"). Match by personName since Rudyard is
    //    a person ref, not a free-text name.
    let mixAssistantPatch = newCredits;
    if (id === "release-mwc-self-titled") {
      // Re-fetch credits[] WITH the person reference resolved, so we can
      // match by personName even though it's a ref.
      const withPerson = await client.fetch<{ credits?: (Credit & { person?: { name?: string } })[] }>(
        `*[_id == $id][0]{ credits[]{ _key, role, name, "person": person->{ name } } }`,
        { id },
      );
      const rudyardKey = withPerson.credits?.find((c) => /rudyard.*cullers/i.test(c.person?.name ?? ""))?._key;
      if (rudyardKey) {
        mixAssistantPatch = newCredits.map((c) =>
          c._key === rudyardKey ? { ...c, role: "Mix assistant" } : c,
        );
        console.log(`   · Rudyard Lee Cullers credit (_key=${rudyardKey}): "Mixed by" → "Mix assistant"`);
      } else {
        console.log("   · no Rudyard Lee Cullers credit found");
      }
    }

    await client
      .patch(id)
      .set({
        credits: mixAssistantPatch,
        tracklist: newTracklist,
      })
      .commit();

    const renamedInCredits = newCredits.filter((c) => c.name === NEW_NAME).length;
    const renamedInTracks = newTracklist.reduce(
      (n, t) => n + (t.writerCredits ?? []).filter((w) => w.name === NEW_NAME).length,
      0,
    );
    console.log(`   ✓ renamed ${renamedInCredits} credit row(s) + ${renamedInTracks} track-writer row(s)`);
  }

  console.log("\nVerification:");
  const verify = await client.fetch(
    `*[_id in $ids]{
      _id, title,
      "writerNames": tracklist[].writerCredits[].name,
      "mixCredits": credits[role match "*Mix*"]{ role, "name": coalesce(person->name, name) }
    }`,
    { ids: TARGETS },
  );
  console.log(JSON.stringify(verify, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
