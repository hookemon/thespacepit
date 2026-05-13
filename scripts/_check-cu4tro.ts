import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});
(async () => {
  const rel = await c.fetch(`*[_type == "release" && (title match "*u4tro*" || title match "*uatro*")] { _id, title, "slug": slug.current, year, label }`);
  console.log("RELEASES:", JSON.stringify(rel, null, 2));
  const press = await c.fetch(`*[_type == "pressQuote" && (
    references(*[_type == "release" && (title match "*u4tro*" || title match "*uatro*")]._id)
    || quote match "*u4tro*"
    || quote match "*uatro*"
    || headline match "*u4tro*"
    || headline match "*uatro*"
  )] { _id, headline, outlet, kind, year, date, url, "image": image.asset._ref, "release": relatedRelease->slug.current, "era": relatedEra->slug.current }`);
  console.log("\nEXISTING CU4TRO PRESS:", JSON.stringify(press, null, 2));
  // Stats: how many press pieces total, how many have an image, how many have a URL but no image, etc.
  const stats = await c.fetch(`{
    "total": count(*[_type == "pressQuote"]),
    "withImage": count(*[_type == "pressQuote" && defined(image)]),
    "withUrl": count(*[_type == "pressQuote" && defined(url)]),
    "withUrlNoImg": count(*[_type == "pressQuote" && defined(url) && !defined(image)]),
    "withRelRel": count(*[_type == "pressQuote" && defined(relatedRelease)])
  }`);
  console.log("\nPRESS STATS:", stats);
})();
