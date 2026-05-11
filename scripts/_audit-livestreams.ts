import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  // Videos with "stream" / "live" / "twitch" in title
  const liveLike = await c.fetch(`*[_type == "video" && (
    title match "*tream*" || title match "*ive*" || title match "*ive @*" ||
    title match "*twitch*" || title match "*set*" || title match "*sesh*"
  )]{ _id, title, duration, tags } | order(title)`);
  console.log(`Found ${liveLike.length} stream/live-like videos\n`);
  for (const v of liveLike.slice(0, 25)) {
    const tags = (v.tags || []).join(",") || "—";
    console.log(`  [${v.duration?.padStart(7) || '   ?  '}]  ${v.title.slice(0, 80).padEnd(80)}  tags=${tags}`);
  }
  console.log(`\n... showing 25 of ${liveLike.length}\n`);

  // Long videos (>30 min) — likely streams or sets
  const long = await c.fetch(`*[_type == "video" && defined(duration) && duration match "*:*:*"]{ _id, title, duration, tags } | order(duration desc) [0...20]`);
  console.log(`\nLong videos (multi-hour, likely streams):`);
  for (const v of long) {
    const tags = (v.tags || []).join(",") || "—";
    console.log(`  [${v.duration}]  ${v.title.slice(0, 80).padEnd(80)}  tags=${tags}`);
  }
})();
