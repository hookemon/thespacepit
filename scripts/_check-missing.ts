import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

async function main() {
  const rows = await client.fetch<{ _id: string; title: string; year?: number; artistNames: string[] }[]>(`
    *[_type == "release" && (withdrawn != true) && !defined(cover) && length(title) >= 2]
      | order(year desc) {
      _id, title, year,
      "artistNames": artists[]->name
    }
  `);
  console.log(`${rows.length} still missing\n`);
  for (const r of rows) {
    console.log(`  ${r._id}  · ${(r.artistNames ?? []).join(", ")} — ${r.title} (${r.year ?? "—"})`);
  }
}
main().catch(console.error);
