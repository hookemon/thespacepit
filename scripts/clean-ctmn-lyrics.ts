/* eslint-disable no-console */
/** One-off: strip Genius "X Contributors / Song Lyrics" preamble from CTMN lyrics. */
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

async function main() {
  const r = await client.fetch<{ tracklist?: { _key: string; title: string; lyrics?: string }[] }>(
    `*[_id == "release-cc016-cant-tell-me-nothing-remixes"][0]{ tracklist[]{ _key, title, lyrics } }`,
  );
  const t = r.tracklist![0];
  // Strip everything before the first verse marker `[` — that's where real lyrics start.
  const cleaned = (t.lyrics ?? "").replace(/^[^\[]*?(?=\[)/, "").trim();
  console.log("BEFORE first 100:", t.lyrics?.slice(0, 100));
  console.log("AFTER first 100: ", cleaned.slice(0, 100));
  console.log("Length:", cleaned.length);
  await client
    .patch("release-cc016-cant-tell-me-nothing-remixes")
    .set({ "tracklist[0].lyrics": cleaned })
    .commit();
  console.log("✓ cleaned");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
