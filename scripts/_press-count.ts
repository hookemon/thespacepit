import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  const total = await c.fetch(`count(*[_type == "pressQuote"])`);
  const byOutlet = await c.fetch(`*[_type == "pressQuote"]{outlet, source}`);
  console.log("total:", total);
  const counts: Record<string, number> = {};
  for (const x of byOutlet) {
    const o = x.outlet || x.source || "(no outlet)";
    counts[o] = (counts[o] ?? 0) + 1;
  }
  for (const [k, v] of Object.entries(counts).sort((a,b) => b[1]-a[1])) console.log(`  ${v}  ${k}`);
})();
