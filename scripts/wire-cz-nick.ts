/**
 * Wire Nick into the Cubic Zirconia world:
 *  · add him as a project member (shows on his BANDS section)
 *  · credit him on every Cubic Zirconia release as "keys + production"
 *    (so /catalog automatically pulls them into his unified body of work)
 *
 * Idempotent — won't add duplicate credits or member refs.
 */

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

const NICK_ROLE = "keys + production";

type Existing = { _ref?: string };

async function main() {
  const nick = await client.fetch<{ _id: string } | null>(
    `*[_type == "artist" && slug.current == "nick-hook"][0]{ _id }`
  );
  if (!nick) { console.error("nick-hook not found"); process.exit(1); }

  // 1. Add Nick to the Cubic Zirconia PROJECT members
  const cz = await client.fetch<{ _id: string; members?: Existing[] } | null>(
    `*[_type == "project" && slug.current == "cubic-zirconia"][0]{ _id, members }`
  );
  if (cz) {
    const already = (cz.members ?? []).some((m) => m._ref === nick._id);
    if (already) {
      console.log("· Nick already in Cubic Zirconia members");
    } else {
      await client.patch(cz._id).setIfMissing({ members: [] }).append("members", [
        { _type: "reference", _ref: nick._id, _key: `m-nick-${Date.now()}` },
      ]).commit({ autoGenerateArrayKeys: true });
      console.log("+ added Nick to Cubic Zirconia project members");
    }
  }

  // 2. Credit Nick on every release where Cubic Zirconia is a primary artist
  type Rel = {
    _id: string;
    title: string;
    credits?: { person?: { _ref?: string }; role?: string }[];
  };
  const releases = await client.fetch<Rel[]>(`
    *[
      _type == "release"
      && count(artists[@->slug.current == "cubic-zirconia"]) > 0
    ]{
      _id, title,
      "credits": credits[]{ "person": person, role }
    }
  `);

  console.log(`\nCubic Zirconia releases: ${releases.length}`);
  let added = 0;
  for (const r of releases) {
    const has = (r.credits ?? []).some(
      (c) => c.person?._ref === nick._id && c.role?.toLowerCase() === NICK_ROLE.toLowerCase()
    );
    if (has) {
      console.log(`  · ${r.title} (already credited)`);
      continue;
    }
    await client
      .patch(r._id)
      .setIfMissing({ credits: [] })
      .append("credits", [{
        _type: "object",
        _key: `c-nick-cz-${Date.now()}-${added}`,
        role: NICK_ROLE,
        person: { _type: "reference", _ref: nick._id },
      }])
      .commit({ autoGenerateArrayKeys: true });
    console.log(`  ✓ ${r.title} → +Nick "${NICK_ROLE}"`);
    added += 1;
  }

  console.log(`\n✅ ${added} new credits added`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
