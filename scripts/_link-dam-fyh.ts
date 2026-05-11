import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  const id = "release-ldcc004-follow-your-heart";
  const doc: any = await c.fetch(`*[_id == $id][0]`, { id });
  const credits = doc.credits ?? [];
  if (!credits.some((c: any) => c.person?._ref === "artist-dam-funk")) {
    credits.push({
      _key: `cr-dam-${Date.now()}`,
      role: "feature",
      person: { _type: "reference", _ref: "artist-dam-funk" },
    });
    await c.patch(id).set({ credits }).commit();
    console.log(`  ✓ Follow Your Heart → DāM-FunK as feature`);
  } else {
    console.log(`  ⏭  already linked`);
  }
})();
