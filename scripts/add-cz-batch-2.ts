/**
 * Batch 2 of CZ catalog additions:
 *   1. White label vinyl: Cubic Zirconia / Bok Bok — Hoes (Ikonika Remix) / Reclash
 *      Night Slugs NSWL005, 2010-10-13
 *   2. Brownswood Bubblers Seven (Gilles Peterson comp) — Various artists, CZ on track 14
 *      Brownswood BWOOD075CD, 2011
 *   3. Spoek Mathambo — Gwababa (Cubic Zirconia Remix) — single off Mshini Wam EP
 *      BBE BBE156SDG-1, 2010
 *   4. Greenmoney — Into You (feat. Roses Gabor) [Cubic Zirconia Remix]
 *      Spotify track 3OX5dewQog4enKrDeTZbZx
 *   5. XLR8R "Guest Reviews: Cubic Zirconia" feature press doc (2011-01-20)
 *   6. Patch CZ "Black & Blue" (LDCC002) to add Spoek Mathambo as a vocal credit
 *
 * All 4 new releases follow the existing CZ-remix precedent: original artist
 * primary, CZ in credits as "Remix", Nick in credits as "Produced by" (which
 * is what surfaces the release on /catalog).
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { randomBytes } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const k = () => randomBytes(6).toString("hex");
const UA = "spacepit-web/1.0 +https://thespacepit.com";

// ── helpers ───────────────────────────────────────────────────────────────
async function ensureArtist(id: string, name: string, slug: string) {
  const exists = await sanity.fetch<{ _id: string } | null>(`*[_id == $id][0]{_id}`, { id });
  if (exists) { console.log(`     · artist exists: ${name}`); return; }
  await sanity.createOrReplace({
    _id: id, _type: "artist", name,
    slug: { _type: "slug", current: slug },
  } as any);
  console.log(`     ✓ created artist: ${name}`);
}

async function uploadCoverFromUrl(url: string, slug: string, kind = "cover"): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) { console.log(`     ✗ ${kind} fetch ${r.status}`); return null; }
    const buf = Buffer.from(await r.arrayBuffer());
    const ext = url.match(/\.(jpe?g|png|webp|gif)/i)?.[1] ?? "jpg";
    const asset = await sanity.assets.upload("image", buf, {
      filename: `${slug}-${kind}.${ext.toLowerCase()}`,
      source: { name: "add-cz-batch-2", id: url, url },
    });
    console.log(`     ✓ uploaded ${kind} (${(buf.length / 1024).toFixed(1)}kb)`);
    return asset._id;
  } catch (err) {
    console.log(`     ✗ upload error: ${(err as Error).message}`);
    return null;
  }
}

(async () => {
  console.log("\n💎 CZ BATCH 2 — 4 releases + 1 press doc + 1 Black & Blue patch\n");

  // ── 1. CREATE MISSING ARTISTS ────────────────────────────────────────────
  console.log("── 1. ensure artists ──");
  await ensureArtist("artist-spoek-mathambo", "Spoek Mathambo", "spoek-mathambo");
  await ensureArtist("artist-bok-bok",        "Bok Bok",        "bok-bok");
  await ensureArtist("artist-ikonika",        "Ikonika",        "ikonika");
  await ensureArtist("artist-greenmoney",     "Greenmoney",     "greenmoney");
  await ensureArtist("artist-roses-gabor",    "Roses Gabor",    "roses-gabor");

  // ── 2. WHITE LABEL: Hoes (Ikonika Remix) / Reclash ──────────────────────
  console.log("\n── 2. NSWL005 white label (Hoes/Reclash) ──");
  {
    const id = "release-ext-nswl005-hoes-reclash";
    const slug = "nswl005-hoes-reclash";
    const exists = await sanity.fetch<{ _id: string } | null>(`*[_id == $id][0]{_id}`, { id });
    if (exists) {
      console.log("     · release exists — skipping create");
    } else {
      const coverId = await uploadCoverFromUrl(
        "https://i.discogs.com/utskQ9ZuJ8NvQ5aEfnQMA4cCt4_uwBxbeW2XOCAkisw/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTI0OTI2/MTUtMTMwMDM0Mjk5/MC5qcGVn.jpeg",
        slug
      );
      await sanity.createOrReplace({
        _id: id, _type: "release",
        title: "Hoes Come Out At Night (Ikonika Remix) / Reclash (Give It To Me)",
        slug: { _type: "slug", current: slug },
        artists: [
          { _type: "reference", _ref: "artist-cubic-zirconia", _key: k() },
          { _type: "reference", _ref: "artist-bok-bok", _key: k() },
        ],
        catalogNumber: "NSWL005",
        releaseDate: "2010-10-13",
        year: 2010,
        label: "Other",
        format: "12\" Single",
        status: "out",
        cover: coverId ? { _type: "image", asset: { _type: "reference", _ref: coverId } } : undefined,
        credits: [
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-nick-hook" }, role: "Produced by" },
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-ikonika" }, role: "Remix (A-side)" },
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-cubic-zirconia" }, role: "Production · Remix" },
        ],
        tracklist: [
          { _key: k(), _type: "track", title: "Hoes Come Out At Night (Ikonika Remix)", artists: "Cubic Zirconia · A-side" },
          { _key: k(), _type: "track", title: "Reclash (Give It To Me)", artists: "Bok Bok × Cubic Zirconia · B-side" },
        ],
      } as any);
      console.log("     ✓ created release: Hoes/Reclash white label (NSWL005)");
    }
  }

  // ── 3. BROWNSWOOD BUBBLERS SEVEN (Gilles Peterson comp) ─────────────────
  console.log("\n── 3. Brownswood Bubblers Seven ──");
  {
    const id = "release-ext-brownswood-bubblers-seven";
    const slug = "brownswood-bubblers-seven";
    const exists = await sanity.fetch<{ _id: string } | null>(`*[_id == $id][0]{_id}`, { id });
    if (exists) {
      console.log("     · release exists — skipping create");
    } else {
      await sanity.createOrReplace({
        _id: id, _type: "release",
        title: "Brownswood Bubblers Seven",
        slug: { _type: "slug", current: slug },
        artists: [
          { _type: "reference", _ref: "artist-ext-various", _key: k() },
        ],
        catalogNumber: "BWOOD075CD",
        releaseDate: "2011-10-11",
        year: 2011,
        label: "Other",
        format: "Compilation CD",
        status: "out",
        // No cover in the Discogs primary image — will fall through to placeholder.
        credits: [
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-nick-hook" }, role: "Produced by" },
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-cubic-zirconia" }, role: "Track 14: Night Or Day (w/ Bilal)" },
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-stub-bilal" }, role: "Vocals · Night Or Day" },
        ],
        tracklist: [
          { _key: k(), _type: "track", title: "Night Or Day", artists: "Cubic Zirconia × Bilal · track 14 of 16" },
        ],
      } as any);
      console.log("     ✓ created release: Brownswood Bubblers Seven (BWOOD075CD)");
    }
  }

  // ── 4. SPOEK MATHAMBO — Gwababa (Cubic Zirconia Remix) ──────────────────
  console.log("\n── 4. Spoek Mathambo — Gwababa (CZ Remix) ──");
  {
    const id = "release-ext-gwababa-cz-remix";
    const slug = "gwababa-cubic-zirconia-remix";
    const exists = await sanity.fetch<{ _id: string } | null>(`*[_id == $id][0]{_id}`, { id });
    if (exists) {
      console.log("     · release exists — skipping create");
    } else {
      const coverId = await uploadCoverFromUrl(
        "https://i.discogs.com/B2Hlqwl3yLARx-MQ3MUvCzhpsGlxrz-O5Yam-GYOads/rs:fit/g:sm/q:90/h:300/w:300/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTI0MDYy/NjItMTI4MjI0NDY2/NC5qcGVn.jpeg",
        slug
      );
      await sanity.createOrReplace({
        _id: id, _type: "release",
        title: "Gwababa (Cubic Zirconia Remix)",
        slug: { _type: "slug", current: slug },
        artists: [
          { _type: "reference", _ref: "artist-spoek-mathambo", _key: k() },
        ],
        catalogNumber: "BBE156SDG-1",
        releaseDate: "2010-01-01",
        year: 2010,
        label: "Other",
        format: "Digital Single",
        status: "out",
        cover: coverId ? { _type: "image", asset: { _type: "reference", _ref: coverId } } : undefined,
        credits: [
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-nick-hook" }, role: "Produced by" },
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-cubic-zirconia" }, role: "Remix" },
        ],
        tracklist: [
          { _key: k(), _type: "track", title: "Gwababa (Cubic Zirconia Remix)", artists: "Spoek Mathambo · from Mshini Wam EP · BBE BBE156SDG-1" },
        ],
      } as any);
      console.log("     ✓ created release: Gwababa (CZ Remix)");
    }
  }

  // ── 5. GREENMONEY — Into You (CZ Remix) ─────────────────────────────────
  console.log("\n── 5. Greenmoney — Into You (CZ Remix) ──");
  {
    const id = "release-ext-greenmoney-into-you-cz-remix";
    const slug = "greenmoney-into-you-cubic-zirconia-remix";
    const exists = await sanity.fetch<{ _id: string } | null>(`*[_id == $id][0]{_id}`, { id });
    if (exists) {
      console.log("     · release exists — skipping create");
    } else {
      const coverId = await uploadCoverFromUrl(
        "https://i.scdn.co/image/ab67616d0000b273bfab12e6e8434d0d02cfedb7",
        slug
      );
      await sanity.createOrReplace({
        _id: id, _type: "release",
        title: "Into You (feat. Roses Gabor) [Cubic Zirconia Remix]",
        slug: { _type: "slug", current: slug },
        artists: [
          { _type: "reference", _ref: "artist-greenmoney", _key: k() },
        ],
        releaseDate: "2012-01-01",
        year: 2012,
        label: "Other",
        format: "Digital Single",
        status: "out",
        // DSPs we already know from Songlink
        spotifyUrl: "https://open.spotify.com/track/3OX5dewQog4enKrDeTZbZx",
        tidalUrl: "https://listen.tidal.com/track/6963115",
        cover: coverId ? { _type: "image", asset: { _type: "reference", _ref: coverId } } : undefined,
        credits: [
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-nick-hook" }, role: "Produced by" },
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-roses-gabor" }, role: "Vocals" },
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-cubic-zirconia" }, role: "Remix" },
        ],
        tracklist: [
          { _key: k(), _type: "track", title: "Into You (feat. Roses Gabor) [Cubic Zirconia Remix]", artists: "Greenmoney × Roses Gabor (CZ Remix)" },
        ],
      } as any);
      console.log("     ✓ created release: Greenmoney Into You CZ Remix");
    }
  }

  // ── 6. XLR8R "Guest Reviews: Cubic Zirconia" ────────────────────────────
  console.log("\n── 6. XLR8R Guest Reviews: Cubic Zirconia (press) ──");
  {
    const id = "pressQuote-xlr8r-guest-reviews-cz-2011";
    const url = "https://xlr8r.com/features/guest-reviews-cubic-zirconia/";
    const imageUrl = "https://xlr8r.com/wp-content/uploads/2019/06/cubiczircona_012011.jpg";
    const exists = await sanity.fetch<{ _id: string } | null>(`*[_id == $id || url == $url][0]{_id}`, { id, url });
    if (exists) {
      console.log("     · press doc exists — skipping");
    } else {
      // Try to upload the article image to Sanity so we don't depend on hotlink
      const imgAssetId = await uploadCoverFromUrl(imageUrl, "xlr8r-guest-reviews-cz-2011", "image");
      await sanity.createOrReplace({
        _id: id, _type: "pressQuote",
        kind: "feature",
        headline: "Guest Reviews: Cubic Zirconia",
        quote: "Cubic Zirconia is a motley assemblage of music makers, a group that dabbles in house, disco, electro, R&B, and hip-hop.",
        outlet: "XLR8R",
        author: "XLR8R Staff",
        date: "2011-01-20",
        year: 2011,
        url,
        imageUrl,
        image: imgAssetId ? { _type: "image", asset: { _type: "reference", _ref: imgAssetId } } : undefined,
        relatedEra: { _type: "reference", _ref: "project-cubic-zirconia" },
      } as any);
      console.log("     ✓ created press doc: XLR8R Guest Reviews (CZ)");
    }
  }

  // ── 7. PATCH BLACK & BLUE: add Spoek Mathambo as vocalist ───────────────
  console.log("\n── 7. patch Black & Blue (LDCC002) — add Spoek Mathambo to credits ──");
  {
    const bb = await sanity.fetch<{ _id: string; credits?: any[] }>(
      `*[_id == "release-ldcc002-black-blue"][0]{_id, credits}`
    );
    if (!bb) {
      console.log("     ✗ Black & Blue not found");
    } else {
      const hasSpoek = (bb.credits ?? []).some((c: any) => c.person?._ref === "artist-spoek-mathambo");
      if (hasSpoek) {
        console.log("     · Spoek already in credits");
      } else {
        // Insert Spoek alongside Tiombe in the vocals slot (vocals section
        // sits at the top per the credit-ordering convention).
        const credits = bb.credits ?? [];
        const tiombeIdx = credits.findIndex((c: any) => /vocals/i.test(c.role ?? "") && !/feature/i.test(c.role ?? ""));
        const spoekCredit = {
          _key: k(),
          _type: "object",
          person: { _type: "reference", _ref: "artist-spoek-mathambo" },
          role: "vocals (feature)",
        };
        const next = [...credits];
        if (tiombeIdx >= 0) next.splice(tiombeIdx + 1, 0, spoekCredit);
        else next.unshift(spoekCredit);
        await sanity.patch(bb._id).set({ credits: next }).commit();
        console.log("     ✓ added Spoek Mathambo — vocals (feature) to Black & Blue credits");
      }
    }
  }

  console.log("\n  → next: run fetch-platform-urls for each new release slug to autofill any missing DSP URLs\n");
})();
