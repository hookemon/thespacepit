import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });

(async () => {
  // 1. Delete the broken-screen PO inventory entry (it's a non-functional placeholder)
  const brokenId = "gear-teenage-engineering-6-broken-screen-po-s-all-work-except-scr";
  try {
    await c.delete(brokenId);
    console.log(`✓ deleted ${brokenId}`);
  } catch (e: any) {
    console.log(`⚠ ${brokenId}: ${e.message?.slice(0, 100)}`);
  }

  // 2. Create Damian Hagglund artist
  await c.createIfNotExists({
    _id: "artist-ext-damian-hagglund",
    _type: "artist",
    name: "Damian Hagglund",
    slug: { _type: "slug", current: "damian-hagglund" },
    onLabel: false,
    tagline: "came in and recorded with a-trak. on hum bhu (like water cc002).",
  });
  console.log("✓ artist-ext-damian-hagglund created");

  // 3. Wire as feature credit on Like Water (sat alongside Blaqstarr on HUM BHU)
  const id = "release-cc002-like-water";
  const doc: any = await c.fetch(`*[_id == $id][0]`, { id });
  const credits = doc.credits ?? [];
  if (!credits.some((c: any) => c.person?._ref === "artist-ext-damian-hagglund")) {
    credits.push({
      _key: `cr-damian-${Date.now()}`,
      role: "feature",
      person: { _type: "reference", _ref: "artist-ext-damian-hagglund" },
    });
    await c.patch(id).set({ credits }).commit();
    console.log("✓ Like Water → Damian as feature");
  }
})();
