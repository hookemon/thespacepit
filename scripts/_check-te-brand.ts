import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  const te = await c.fetch(`*[_type == "brand" && (name match "*Teenage*" || slug.current match "*teenage*")]{_id, name, "slug": slug.current, tagline, relationship}`);
  console.log("TE brand docs:", JSON.stringify(te, null, 2));
  const sample = await c.fetch(`*[_type == "video" && hidden != true && (title match "*OP-?*" || title match "*OP1*" || title match "*op-1*" || title match "*sidekick*" || title match "*ep-133*" || title match "*choir*" || title match "*teenage*" || title match "*EP133*" || title match "*KO*II*")][0...30]{_id, title, "tags": tags}`);
  console.log(`\\nlikely-TE videos by title: ${sample.length}`);
  for (const v of sample.slice(0, 10)) console.log(`  - ${v.title}  tags=${v.tags?.join(',') ?? '—'}`);
})();
