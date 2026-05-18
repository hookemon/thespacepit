/**
 * Add the missing 4 tracks to LDCC001 Josephine — the Sanity tracklist had
 * only the Waajeed remix, but the source folder has 5 tracks total: original,
 * Greenmoney Trancestep, Waajeed, DJ Sega Philly Club, Egyptrixx Dub.
 *
 * Preserves the existing Waajeed entry (with its _key + uploaded audio).
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

(async () => {
  const existing = await c.fetch<{ tracklist: Array<{ _key: string; title: string }> }>(
    `*[_id == "release-ldcc001-josephine"][0]{ tracklist }`
  );
  const waajeed = existing.tracklist[0];
  if (!waajeed || !/waajeed/i.test(waajeed.title)) {
    console.error("Unexpected existing track:", existing.tracklist);
    process.exit(1);
  }
  const NEW_TRACKLIST = [
    { _key: randomUUID(), _type: "object", title: "Josephine" },
    { _key: randomUUID(), _type: "object", title: "Josephine (Greenmoney's Trancestep Remix)" },
    waajeed, // preserve existing — keeps _key + audio asset reference
    { _key: randomUUID(), _type: "object", title: "Josephine (DJ Sega's Philly Club Remix)" },
    { _key: randomUUID(), _type: "object", title: "Josephine (Egyptrixx Dub)" },
  ];
  console.log("New tracklist:");
  for (const t of NEW_TRACKLIST) console.log(`  · ${t.title} ${t._key === waajeed._key ? "(existing — preserves audio)" : "(NEW)"}`);
  await c.patch("release-ldcc001-josephine").set({ tracklist: NEW_TRACKLIST }).commit();
  console.log("✓ Patched");
})().catch((err) => { console.error(err); process.exit(1); });
