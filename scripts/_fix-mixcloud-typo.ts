/* eslint-disable no-console */
// Fix the Mixcloud URL typo on the Dec 2020 Lot Radio press doc.
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

const ID = "pressQuote-radio-the-lot-radio-2020-12-28";
const FIXED =
  "https://www.mixcloud.com/thelotradio/calm-collect-radio-with-nick-hook-the-lot-radio-12-28-2020";

async function main() {
  await client.patch(ID).set({ url: FIXED }).commit();
  console.log(`→ patched ${ID} → ${FIXED}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
