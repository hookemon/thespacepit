/**
 * Press → era backfill.
 *
 * For any press piece with `relatedRelease` set but `relatedEra` empty,
 * look up which era project lists that release in its `releases[]` array
 * and set `relatedEra` to that project. This means era-filtered press
 * views (e.g. /press?era=cubic-zirconia) light up automatically with
 * every press piece tied to a release in that era.
 *
 * Idempotent. Use --dry to preview.
 */
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

const DRY = process.argv.includes("--dry");

(async () => {
  // Build release-id → era-project-id map
  type Era = { _id: string; name: string; slug: string; releaseIds: string[] };
  const eras = await c.fetch<Era[]>(
    `*[_type == "project" && defined(slug.current)] {
      _id, name, "slug": slug.current,
      "releaseIds": releases[]._ref
    }`
  );
  const releaseToEra = new Map<string, Era>();
  for (const era of eras) {
    for (const rid of (era.releaseIds ?? [])) {
      // First era wins on collision (rare — most releases in one era)
      if (!releaseToEra.has(rid)) releaseToEra.set(rid, era);
    }
  }
  console.log(`built release→era map: ${releaseToEra.size} releases mapped across ${eras.length} eras\n`);

  // Find press pieces with release set but era empty
  type Press = { _id: string; outlet?: string; headline?: string; relRel: { _ref: string }; relEra?: { _ref: string } };
  const press = await c.fetch<Press[]>(
    `*[_type == "pressQuote" && defined(relatedRelease) && !defined(relatedEra)] {
      _id, outlet, headline,
      "relRel": relatedRelease,
      "relEra": relatedEra
    }`
  );
  console.log(`scanning ${press.length} press pieces with release-but-no-era${DRY ? " (DRY)" : ""}\n`);

  let linked = 0, noMap = 0;
  for (const p of press) {
    const era = releaseToEra.get(p.relRel._ref);
    if (!era) {
      noMap += 1;
      continue;
    }
    const lbl = `${(p.outlet ?? "?").padEnd(22)}  →  ${era.name.padEnd(34)}  ·  "${(p.headline ?? "").slice(0, 50)}"`;
    if (DRY) {
      console.log(`would link: ${lbl}`);
      continue;
    }
    try {
      await c.patch(p._id).set({ relatedEra: { _type: "reference", _ref: era._id } }).commit();
      linked += 1;
      console.log(`+ linked   : ${lbl}`);
    } catch (err) {
      console.log(`✗ failed   : ${lbl} — ${(err as Error).message}`);
    }
  }
  console.log(`\n done. linked=${linked}  no-era-mapping=${noMap}\n`);
})();
