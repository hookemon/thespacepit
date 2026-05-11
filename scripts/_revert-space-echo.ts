import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

async function main() {
  // RE-201 is the tape unit (rack/floor box), not the Boss RE-20 pedal.
  await sanity.patch("gear-roland-space-echo-re-201").set({ category: "outboard" }).commit();
  console.log("✓ Roland Space Echo RE-201 → outboard");
}
main().catch(console.error);
