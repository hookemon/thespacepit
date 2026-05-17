/**
 * Quick read-only check: does the original Relationships LP already
 * exist in Sanity, and is there anything resembling a "10 Year Deluxe"
 * stub yet? Used to figure out what (if anything) to seed.
 *
 * Run: npx tsx scripts/_check-relationships.ts
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

async function main() {
  const matches = await client.fetch(
    `*[_type == "release" && (slug.current match "*relationship*" || title match "*Relationship*")]{
      _id, title, "slug": slug.current, catalogNumber, year, releaseDate, status, label, format,
      "artistCount": count(artists), "trackCount": count(tracklist),
      upc, genre, language, "hasWriterCredits": count(tracklist[defined(writerCredits)])
    }`
  );
  console.log(JSON.stringify(matches, null, 2));

  const nickHook = await client.fetch(
    `*[_type == "artist" && name == "Nick Hook"][0]{ _id, name, "slug": slug.current }`
  );
  console.log("\nNick Hook artist doc:", JSON.stringify(nickHook, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
