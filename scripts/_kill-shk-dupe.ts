import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  await c.patch("release-ext-breathe-you-up-breathe-you-in").set({ withdrawn: true }).commit();
  console.log("✓ withdrew release-ext-breathe-you-up-breathe-you-in (dupe of CC022)");
})();
