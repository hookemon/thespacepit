/* eslint-disable no-console */
// Find the Mixcloud URL with the extra "c" in the slug.
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
  // Mixcloud URLs can live on press docs, brand docs, livestreams, videos,
  // or generic url fields. Cast a wide net.
  const results = await client.fetch(`
    *[_type in ["pressQuote", "brand", "video", "livestream", "release", "artist", "project"] && (
      url match "*mixcloud*" || mixcloudUrl match "*mixcloud*" ||
      embedUrl match "*mixcloud*"
    )]{
      _id, _type, _rev, title, name, url, mixcloudUrl, embedUrl, headline
    }
  `);
  console.log(`Found ${results.length} mixcloud-bearing docs`);
  for (const r of results) {
    const candidate = r.url || r.mixcloudUrl || r.embedUrl;
    const hasTypo = candidate && /-20\d{2}c\b|-20\d{2}c[\/?]/.test(candidate);
    const flag = hasTypo ? " ⚠ TYPO" : "";
    console.log(`${r._type} ${r._id} :: ${r.title ?? r.name ?? r.headline ?? "?"} → ${candidate}${flag}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
