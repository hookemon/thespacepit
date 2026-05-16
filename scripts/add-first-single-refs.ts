/**
 * Wire the "first single off X" connections per Nick:
 *   - Old English Remix is the first single off CC Remix Compilation
 *   - If The Glove Don't Fit is the first single off Just Nico
 *
 * Surfaces in the bio (already extended) AND as a per-track recording
 * credit for Pawmps on Tonala on both Glove + Just Nico.
 *
 * Also extends Just Nico bio to lead with "If The Glove Don't Fit is the
 * first single" + Old English bio to mention it's the first single from
 * the Remix Comp.
 *
 * Run: npx tsx scripts/add-first-single-refs.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

type Block = { text: string; style: "normal" | "blockquote" };
function blocks(b: Block[]) {
  return b.map((x) => ({
    _key: randomUUID(),
    _type: "block",
    style: x.style,
    markDefs: [],
    children: [{ _key: randomUUID(), _type: "span", text: x.text, marks: [] }],
  }));
}

// ── Just Nico bio: prepend the "Glove is the first single" framing ──────
const JUST_NICO_BIO: Block[] = [
  {
    text: "The second album. Working title: Just Nico.",
    style: "normal",
  },
  {
    text: "Ten years after Relationships (CC015 · 2017), Nick Hook's second solo LP. Brooklyn + Medellín built into one record.",
    style: "normal",
  },
  {
    text: "If The Glove Don't Fit is the first single — dropping August 7, 2026 (Boo's birthday).",
    style: "blockquote",
  },
  {
    text: "Ten tracks. Andres Belloso + Felisa Tambor open the record. Pawmps + Gangsta Boo on track 2 (the album version of 'If The Glove Don't Fit'). Ghetto Living, Apache, La Pardo + Pezcatore, Metricas Frias + Guadalupe, Tulliz + SIIDS + Lrel, Lido Pimienta + Liliana Romero Música, Fatboi Sharif + Cassie Watson Francillon close it out.",
    style: "normal",
  },
  {
    text: "Producer rolodex: Brodinski. Doug Surreal. Kid Kreep. MadStarBase. Chad Hugo. Taso. Spiritual Friendship. Nick Hook across all ten.",
    style: "normal",
  },
  {
    text: "Players: Liliana Romero Música on flute, ocarina, shells, percussion. Adrian Terrazas González on sax. Henry D'Arthenay on guitar. Cassie Watson Francillon on harp. Rubén Jaramillo on tumbadoras, triángulo, guacharaca, castañuelas. Yulian Percs. Eva Peroni on bass. Chucho Llano on keys. Electrogenetic + Byron The Aquarius on synth.",
    style: "normal",
  },
  {
    text: "Mixed by Gareth Jones @ The artLab. Mastered by Joe Laporta @ Sterling Sound.",
    style: "normal",
  },
  {
    text: "Recorded across thespacepit (Brooklyn), Tonala, Medellin Studios, TSP Medellín (Coolto), The links (New Delhi), Pinche Hype, The artLapi, Rio Claro, Hellywood Studio, and IME Escuelas Técnicas.",
    style: "normal",
  },
  {
    text: "Every collaborator. Every era. The masterpiece phase.",
    style: "blockquote",
  },
];

// ── Old English bio extension: add first-single-of framing ─────────────
const OLD_ENGLISH_PREPEND: Block = {
  text: "First single off the Calm + Collect Remix Compilation (2026).",
  style: "blockquote",
};

async function appendBioBlockToTop(releaseId: string, block: Block) {
  // Fetch existing, prepend the new block, write back.
  const existing = await client.fetch<{ notes?: unknown[] }>(
    `*[_id == $id][0]{ notes }`,
    { id: releaseId },
  );
  const current = (existing.notes ?? []) as Array<Record<string, unknown>>;
  // Skip if a near-identical line is already at the top.
  if (
    current[0] &&
    (current[0].children as Array<{ text?: string }> | undefined)?.[0]?.text?.toLowerCase().includes("first single")
  ) {
    console.log(`  ↳ ${releaseId}: first-single line already present, skipping`);
    return;
  }
  const newBlocks = [...blocks([block]), ...current];
  await client.patch(releaseId).set({ notes: newBlocks }).commit();
  console.log(`✓ ${releaseId}: prepended "${block.text}"`);
}

async function main() {
  // 1. Just Nico full bio rewrite (with Glove-as-first-single)
  await client
    .patch("release-nick-hook-album-ii")
    .set({ notes: blocks(JUST_NICO_BIO) })
    .commit();
  console.log(`✓ release-nick-hook-album-ii: bio rewritten (${JUST_NICO_BIO.length} blocks)`);

  // 2. Old English: prepend "First single off CC Remix Comp"
  await appendBioBlockToTop("release-old-english-spinn-hook-remix", OLD_ENGLISH_PREPEND);

  // 3. Glove: Add per-track "Recorded at Tonala" credit for Pawmps' vocals.
  //    Vocals were tracked there per Nick. Scoped to the original track
  //    title; the QOQEQA remix is the same vocals (no separate session).
  const glove = await client.fetch<{
    credits?: Array<{ _key?: string; role?: string; name?: string; instrument?: string }>;
  }>(`*[_id == "release-nick-hook-boo-pawmps-glove"][0]{ credits }`);
  const gloveAlready = (glove.credits ?? []).some(
    (c) => c.role === "Recorded at" && (c.name ?? "").toLowerCase() === "tonala",
  );
  if (!gloveAlready) {
    await client
      .patch("release-nick-hook-boo-pawmps-glove")
      .setIfMissing({ credits: [] })
      .append("credits", [
        {
          _key: randomUUID(),
          _type: "object",
          role: "Recorded at",
          name: "Tonala",
          instrument: "Pawmps vocals",
        },
      ])
      .commit();
    console.log(`✓ release-nick-hook-boo-pawmps-glove: added Recorded at Tonala (Pawmps vocals)`);
  } else {
    console.log(`  ↳ Glove already has Tonala recording credit, skipping`);
  }

  // 4. Just Nico: per-track "Recorded at Tonala" for Pawmps on track 2.
  const justNico = await client.fetch<{
    credits?: Array<{ _key?: string; role?: string; name?: string; tracks?: string[] }>;
  }>(`*[_id == "release-nick-hook-album-ii"][0]{ credits }`);
  const t2 = "If The Glove Don't Fit Ft. Pawmps + Gangsta Boo";
  const jnAlready = (justNico.credits ?? []).some(
    (c) =>
      c.role === "Recorded at" &&
      (c.name ?? "").toLowerCase() === "tonala" &&
      (c.tracks ?? []).includes(t2),
  );
  if (!jnAlready) {
    await client
      .patch("release-nick-hook-album-ii")
      .setIfMissing({ credits: [] })
      .append("credits", [
        {
          _key: randomUUID(),
          _type: "object",
          role: "Recorded at",
          name: "Tonala",
          instrument: "Pawmps vocals",
          tracks: [t2],
        },
      ])
      .commit();
    console.log(`✓ release-nick-hook-album-ii: added per-track Tonala for Pawmps on '${t2}'`);
  } else {
    console.log(`  ↳ Just Nico already has scoped Tonala/Pawmps credit, skipping`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
