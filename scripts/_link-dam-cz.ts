import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });

const TARGETS = [
  { releaseId: "release-ext-fuck-work", role: "remix", note: "DāM-FunK Remix on the SVG003 12\"" },
  { releaseId: "release-ext-follow-your-heart", role: "feature", note: "I Got What You Need feat. DāM-FunK" },
];

(async () => {
  for (const t of TARGETS) {
    const doc: any = await c.fetch(`*[_id == $id][0]`, { id: t.releaseId });
    if (!doc) { console.log(`  ⚠ no doc ${t.releaseId}`); continue; }
    const credits = doc.credits ?? [];
    // Skip if already linked
    if (credits.some((c: any) => c.person?._ref === "artist-dam-funk" && c.role === t.role)) {
      console.log(`  ⏭  ${doc.title} — already has dam-funk ${t.role}`);
      continue;
    }
    credits.push({
      _key: `cr-dam-${Date.now()}`,
      role: t.role,
      person: { _type: "reference", _ref: "artist-dam-funk" },
    });
    await c.patch(t.releaseId).set({ credits }).commit();
    console.log(`  ✓ ${doc.title} → DāM-FunK as ${t.role}`);
  }
})();
