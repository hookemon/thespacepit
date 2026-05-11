import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });

(async () => {
  // 1. Create Blaqstarr artist
  await c.createIfNotExists({
    _id: "artist-ext-blaqstarr",
    _type: "artist",
    name: "Blaqstarr",
    slug: { _type: "slug", current: "blaqstarr" },
    onLabel: false,
    tagline: "baltimore club originator. m.i.a. collaborator. feature on like water — hum bhu.",
  });
  console.log("✓ artist-ext-blaqstarr created");

  // 2. Add feature credit to Like Water (CC002)
  const id = "release-cc002-like-water";
  const doc: any = await c.fetch(`*[_id == $id][0]`, { id });
  if (!doc) { console.log("⚠ couldn't find Like Water"); return; }
  const credits = doc.credits ?? [];
  if (!credits.some((c: any) => c.person?._ref === "artist-ext-blaqstarr")) {
    credits.push({
      _key: `cr-blaq-${Date.now()}`,
      role: "feature",
      person: { _type: "reference", _ref: "artist-ext-blaqstarr" },
    });
    await c.patch(id).set({ credits }).commit();
    console.log("✓ Like Water → Blaqstarr as feature");
  } else {
    console.log("⏭  Like Water already has Blaqstarr");
  }
})();
