/**
 * Per-release credit enrichment from the hand-curated `01-discog.txt`
 * narrative file.
 *
 * The discog has per-release notes Nick wrote himself describing his role
 * + collaborators on each record. This script translates those notes into
 * `credits[]` entries on the matching Sanity release docs.
 *
 * Conservative: only adds credits that aren't already present (dedupe by
 * role + person/name signature). Doesn't remove or alter existing credits.
 *
 * Run: npx tsx scripts/import-discog-credits.ts
 * Dry: npx tsx scripts/import-discog-credits.ts --dry
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

type RawCredit = {
  releaseSlug: string;
  role: string;
  /** Plain name OR an artist slug to ref. */
  name?: string;
  artistSlug?: string;
  /** Track-scoped credits (e.g. vocal engineering on 3 specific tracks). */
  tracks?: string[];
};

// Hand-curated from 01-discog.txt — the notes Nick wrote describing each
// release's collaborators and his role. Roles normalized to standard schema
// values; names normalized to match existing artist docs where possible.
const ENRICHMENT: RawCredit[] = [
  // === MWC Self-Titled (2006) — keys/programming/songwriter + the producers ===
  { releaseSlug: "men-women-children-self-titled", role: "Producer",  name: "Mike Mogis" },
  { releaseSlug: "men-women-children-self-titled", role: "Producer",  name: "Gareth Jones" },
  { releaseSlug: "men-women-children-self-titled", role: "Producer",  name: "Raine Maida" },
  { releaseSlug: "men-women-children-self-titled", role: "Producer",  name: "Howard Benson" },
  { releaseSlug: "men-women-children-self-titled", role: "Producer",  name: "Jason Lader" },

  // === Azealia Banks · 1991 EP (2012) — Nick mixed + engineered ===
  { releaseSlug: "1991", role: "Mixed by",   artistSlug: "nick-hook" },
  { releaseSlug: "1991", role: "Engineer",   artistSlug: "nick-hook" },

  // === Shuttle · Halo EP (2012) — Additional production / Co Mix ===
  { releaseSlug: "halo-2012", role: "Additional Production", artistSlug: "nick-hook" },
  { releaseSlug: "halo-2012", role: "Co-Mix",                artistSlug: "nick-hook" },
  { releaseSlug: "halo-2012", role: "Drums",                 name: "Nate Donmoyer (Passion Pit)" },

  // === Nick Hook · Without You (2012) — collaborators on the debut EP ===
  // The discog calls these out as the features. Schema-wise this is more
  // properly a per-track feature than an album credit, but in the meantime
  // mirror them as "Featured Artist" album credits so they show up.
  { releaseSlug: "hookemon001-without-you", role: "Featured Artist", artistSlug: "el-p" },
  { releaseSlug: "hookemon001-without-you", role: "Featured Artist", name: "Daryl Palumbo" },
  { releaseSlug: "hookemon001-without-you", role: "Featured Artist", artistSlug: "machinedrum" },
  { releaseSlug: "hookemon001-without-you", role: "Featured Artist", name: "Surkin" },
  { releaseSlug: "hookemon001-without-you", role: "Featured Artist", artistSlug: "l-vis-1990" },

  // === CZ · Follow Your Heart LP (2011) — collaborators per the discog ===
  // Slug: ldcc004-follow-your-heart. Nick's role already in album credits;
  // add the named guests so the people block fills out.
  { releaseSlug: "ldcc004-follow-your-heart", role: "Guest",       artistSlug: "drop-the-lime" },
  { releaseSlug: "ldcc004-follow-your-heart", role: "Guest",       artistSlug: "dam-funk" },
  { releaseSlug: "ldcc004-follow-your-heart", role: "Vocals",      artistSlug: "bilal" },
  { releaseSlug: "ldcc004-follow-your-heart", role: "Drums",       name: "Jamire Williams" },

  // === L-Vis 1990 · Neon Dreams LP (2011) — co-produced/co-wrote/engineered
  //     w/ Para One, Teki Latex, Javeon McCarthy. Nick's roles + the guests.
  { releaseSlug: "ext-l-vis-1990-neon-dreams", role: "Co-Producer", artistSlug: "nick-hook" },
  { releaseSlug: "ext-l-vis-1990-neon-dreams", role: "Co-Writer",   artistSlug: "nick-hook" },
  { releaseSlug: "ext-l-vis-1990-neon-dreams", role: "Engineer",    artistSlug: "nick-hook" },
  { releaseSlug: "ext-l-vis-1990-neon-dreams", role: "Co-Producer", name: "Para One" },
  { releaseSlug: "ext-l-vis-1990-neon-dreams", role: "Co-Producer", name: "Teki Latex" },
  { releaseSlug: "ext-l-vis-1990-neon-dreams", role: "Vocals",      name: "Javeon McCarthy" },
];

// Stable key for dedupe — role + (artistSlug || name) + tracks joined
function creditKey(cr: { role: string; name?: string; artistSlug?: string; person?: { slug?: string }; tracks?: string[] }): string {
  const ident = cr.artistSlug ?? cr.person?.slug ?? cr.name ?? "";
  const t = (cr.tracks ?? []).slice().sort().join("|");
  return `${cr.role.toLowerCase()}|${ident.toLowerCase()}|${t.toLowerCase()}`;
}

(async () => {
  // Pre-resolve artist slug → _id map for the slugs referenced
  const wanted = Array.from(new Set(ENRICHMENT.map((c) => c.artistSlug).filter(Boolean) as string[]));
  const artistMap: Record<string, string> = {};
  for (const slug of wanted) {
    const a = await c.fetch<{ _id: string } | null>(`*[_type == "artist" && slug.current == $s][0]{ _id }`, { s: slug });
    if (a) artistMap[slug] = a._id;
    else console.log(`⚠ no artist doc for slug "${slug}" (will fall back to name string)`);
  }

  // Group enrichment by release slug
  const byRelease: Record<string, RawCredit[]> = {};
  for (const cr of ENRICHMENT) (byRelease[cr.releaseSlug] ??= []).push(cr);

  let releasesUpdated = 0, creditsAdded = 0, releasesNotFound = 0;
  for (const [slug, items] of Object.entries(byRelease)) {
    const rel = await c.fetch<{
      _id: string;
      title: string;
      credits?: { role?: string; name?: string; tracks?: string[]; person?: { _ref?: string } }[];
    } | null>(
      `*[_type == "release" && slug.current == $s][0]{
        _id, title,
        "credits": credits[]{ role, name, tracks, "person": person->{ "slug": slug.current } }
      }`,
      { s: slug }
    );
    if (!rel) {
      releasesNotFound += 1;
      console.log(`✗ no release with slug "${slug}"`);
      continue;
    }

    // Existing credit signature set
    const existing = new Set((rel.credits ?? []).map((cr) => creditKey({ ...cr, role: cr.role ?? "", artistSlug: undefined })));
    // Also key by name-based existing
    const fullCredits = await c.fetch<{
      credits?: { role?: string; name?: string; tracks?: string[]; person?: { _ref?: string } }[];
    } | null>(`*[_id == $id][0]{ "credits": credits[]{ role, name, tracks, person } }`, { id: rel._id });
    // Rebuild existing using person _ref
    const existingKeys = new Set(
      (fullCredits?.credits ?? []).map((cr) => {
        const slug = cr.person?._ref?.replace(/^artist-(ext-)?/, "");
        return creditKey({ role: cr.role ?? "", name: cr.name, artistSlug: slug, tracks: cr.tracks });
      })
    );

    const newEntries: Array<Record<string, unknown>> = [];
    for (const cr of items) {
      const k = creditKey({ role: cr.role, name: cr.name, artistSlug: cr.artistSlug, tracks: cr.tracks });
      // Loose dedupe — also check just role+name match without tracks
      const looseK = creditKey({ role: cr.role, name: cr.name, artistSlug: cr.artistSlug });
      if (existingKeys.has(k) || existingKeys.has(looseK)) continue;
      existingKeys.add(k);

      const entry: Record<string, unknown> = {
        _type: "object",
        _key: `discog-${slug}-${creditsAdded}-${cr.role.replace(/\s+/g, "_").toLowerCase()}-${(cr.artistSlug ?? cr.name ?? "x").replace(/\s+/g, "_").toLowerCase()}`,
        role: cr.role,
      };
      if (cr.artistSlug && artistMap[cr.artistSlug]) {
        entry.person = { _type: "reference", _ref: artistMap[cr.artistSlug] };
      } else if (cr.name) {
        entry.name = cr.name;
      } else if (cr.artistSlug) {
        // artist doc missing — fallback to name from the slug
        entry.name = cr.artistSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      }
      if (cr.tracks && cr.tracks.length > 0) entry.tracks = cr.tracks;
      newEntries.push(entry);
      creditsAdded += 1;
    }

    if (newEntries.length === 0) {
      console.log(`↻ ${slug.padEnd(36)}  (no new credits to add)`);
      continue;
    }

    if (DRY) {
      console.log(`+ ${slug.padEnd(36)}  would add ${newEntries.length} credit(s)`);
      for (const e of newEntries) console.log(`     · ${(e as any).role}  →  ${(e as any).name ?? "→ " + (e as any).person?._ref}${(e as any).tracks ? " · tracks:" + (e as any).tracks.join("|") : ""}`);
      continue;
    }

    try {
      await c.patch(rel._id)
        .setIfMissing({ credits: [] })
        .append("credits", newEntries)
        .commit();
      releasesUpdated += 1;
      console.log(`+ ${slug.padEnd(36)}  added ${newEntries.length}`);
    } catch (err) {
      console.log(`⚠ ${slug.padEnd(36)}  patch failed: ${(err as Error).message}`);
    }
  }

  console.log(`\n done. releases updated: ${releasesUpdated} · credits added: ${creditsAdded} · releases not found: ${releasesNotFound}`);
})();
