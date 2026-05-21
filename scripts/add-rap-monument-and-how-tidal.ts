/**
 * Two big additions:
 *
 * 1. EGYPTRIXX — "How Tidal" (2025-11-14)
 *    Egyptrixx's new album. Track 4 is "Josephine (Egyptrixx remix)" — an
 *    Egyptrixx remix of Cubic Zirconia's "Josephine" (LDCC001). This is
 *    REVERSE direction from the existing CZ × Egyptrixx remixes — here
 *    Egyptrixx is remixing CZ. Available on Bandcamp / Spotify / Tidal /
 *    Amazon Music / Pandora.
 *
 * 2. THE RAP MONUMENT (2014-12-18)
 *    The 42-minute, 36-rapper Noisey × Hennessy posse cut Nick co-produced
 *    with Hudson Mohawke + S-Type. Confirmed across NEST HQ, Stereogum,
 *    Fader, Complex, Okayplayer, Pitchfork. Massive Nick Hook production
 *    credit that was completely missing from the catalog.
 *
 *    Also seeds 6 press docs from the major outlets that covered it.
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

async function ensureArtist(id: string, name: string, slug: string) {
  const exists = await sanity.fetch<{ _id: string } | null>(`*[_id == $id][0]{_id}`, { id });
  if (exists) { console.log(`     · artist exists: ${name}`); return; }
  await sanity.createOrReplace({
    _id: id, _type: "artist", name,
    slug: { _type: "slug", current: slug },
  } as any);
  console.log(`     ✓ created artist: ${name}`);
}

async function uploadCover(url: string, slug: string, kind = "cover"): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) { console.log(`     ✗ ${kind} fetch ${r.status}`); return null; }
    const buf = Buffer.from(await r.arrayBuffer());
    const ext = url.match(/\.(jpe?g|png|webp|gif)/i)?.[1] ?? "jpg";
    const asset = await sanity.assets.upload("image", buf, {
      filename: `${slug}-${kind}.${ext.toLowerCase()}`,
      source: { name: "add-rap-monument-and-how-tidal", id: url, url },
    });
    console.log(`     ✓ uploaded ${kind} (${(buf.length / 1024).toFixed(1)}kb)`);
    return asset._id;
  } catch (err) {
    console.log(`     ✗ ${kind} upload error: ${(err as Error).message}`);
    return null;
  }
}

(async () => {
  console.log("\n🪞 ADDING: How Tidal (2025) + The Rap Monument (2014)\n");

  // ═══════════════════════════════════════════════════════════════════════
  // 1. ENSURE NEW ARTISTS
  // ═══════════════════════════════════════════════════════════════════════
  console.log("── 1. ensure artists ──");
  await ensureArtist("artist-hudson-mohawke", "Hudson Mohawke", "hudson-mohawke");
  await ensureArtist("artist-s-type",         "S-Type",         "s-type");

  // ═══════════════════════════════════════════════════════════════════════
  // 2. EGYPTRIXX — HOW TIDAL (2025)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n── 2. Egyptrixx — How Tidal (2025) ──");
  {
    const id = "release-ext-egyptrixx-how-tidal";
    const slug = "egyptrixx-how-tidal";
    const exists = await sanity.fetch<{ _id: string } | null>(`*[_id == $id][0]{_id}`, { id });
    if (exists) {
      console.log("     · release exists — skipping create");
    } else {
      // Bandcamp's high-res cover URL — _5 suffix is the largest size.
      const coverId = await uploadCover("https://f4.bcbits.com/img/a2646898165_5.jpg", slug);
      await sanity.createOrReplace({
        _id: id, _type: "release",
        title: "How Tidal",
        slug: { _type: "slug", current: slug },
        artists: [{ _type: "reference", _ref: "artist-egyptrixx", _key: k() }],
        releaseDate: "2025-11-14",
        year: 2025,
        label: "Other",
        format: "Album",
        status: "out",
        spotifyUrl: "https://open.spotify.com/album/27mehJNoblqU9mNa8La9xm",
        bandcampUrl: "https://egyptrixx.bandcamp.com/album/how-tidal",
        tidalUrl: "https://listen.tidal.com/album/464242871",
        amazonMusicUrl: "https://music.amazon.com/albums/B0FTHRDWSK",
        cover: coverId ? { _type: "image", asset: { _type: "reference", _ref: coverId } } : undefined,
        // Nick + the CZ vocalists/composers as credits — Josephine is theirs.
        credits: [
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-nick-hook" }, role: "Original composer · Josephine (track 4)" },
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-cubic-zirconia" }, role: "Original artist · Josephine" },
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-egyptrixx" }, role: "Remix · Josephine" },
        ],
        tracklist: [
          { _key: k(), _type: "track", title: "Rooks Theme", artists: "Egyptrixx" },
          { _key: k(), _type: "track", title: "Chrysalis Records (feat. Robin Dann + Carlyn Bezic)", artists: "Egyptrixx" },
          { _key: k(), _type: "track", title: "Dynachord", artists: "Egyptrixx" },
          { _key: k(), _type: "track", title: "Josephine (Egyptrixx remix)", artists: "Egyptrixx — remix of Cubic Zirconia · LDCC001" },
          { _key: k(), _type: "track", title: "Disorbital", artists: "Egyptrixx" },
          { _key: k(), _type: "track", title: "Bible Eyes", artists: "Egyptrixx" },
          { _key: k(), _type: "track", title: "Dre", artists: "Egyptrixx" },
        ],
      } as any);
      console.log("     ✓ created release: Egyptrixx — How Tidal");
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. THE RAP MONUMENT (2014)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n── 3. The Rap Monument (2014) ──");
  const RAP_MON_ID = "release-ext-the-rap-monument";
  {
    const slug = "the-rap-monument";
    const exists = await sanity.fetch<{ _id: string } | null>(`*[_id == $id][0]{_id}`, { id: RAP_MON_ID });
    if (exists) {
      console.log("     · release exists — skipping create");
    } else {
      // Stereogum og:image is the cleanest known archived cover for this.
      const coverId = await uploadCover(
        "https://lede-admin.stereogum.com/wp-content/uploads/sites/64/2014/12/RM-FULL-CLEAN_vice_669x375.jpg",
        slug
      );
      const rappersList = [
        "Action Bronson", "Alexander Spit", "A$ton Matthews", "Bobby Creekwater",
        "Bodega Bamz", "Bryant Dope", "CUZ Lightyear", "CyHi The Prynce",
        "Danny Brown", "Da$H", "Del Harris", "Flatbush Zombies", "Heems",
        "Killer Mike", "Kilo Kish", "Meyhem Lauren", "Mike G", "Nigel Nasty",
        "Nipsey Hussle", "Pill", "Pregnant Boy", "Problem", "Prodigy (Mobb Deep)",
        "Pusha T", "Raekwon", "Remy Banks", "Renegade El Rey", "RetcH",
        "Rockie Fresh", "Scotty ATL", "Two-9", "Vado", "Yak Ballz",
        "YG", "Young Thug", "Zebra Katz",
      ];
      await sanity.createOrReplace({
        _id: RAP_MON_ID, _type: "release",
        title: "The Rap Monument",
        slug: { _type: "slug", current: slug },
        // Three producers in artists[] — surfaces on /catalog for any of them.
        artists: [
          { _type: "reference", _ref: "artist-nick-hook",      _key: k() },
          { _type: "reference", _ref: "artist-hudson-mohawke", _key: k() },
          { _type: "reference", _ref: "artist-s-type",         _key: k() },
        ],
        releaseDate: "2014-12-18",
        year: 2014,
        label: "Other",
        format: "Single",
        status: "out",
        // Noisey URL is canonical; Vice mirror is the surviving one.
        bandcampUrl: undefined,
        // Just a YouTube reference — there's no central streaming destination
        // because Noisey/Hennessy hosted it as a video, not as a DSP release.
        youtubeUrl: "https://www.youtube.com/watch?v=h3JEEjF6tWE",
        cover: coverId ? { _type: "image", asset: { _type: "reference", _ref: coverId } } : undefined,
        credits: [
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-hudson-mohawke" }, role: "Produced by" },
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-nick-hook" },      role: "Produced by" },
          { _key: k(), _type: "object", person: { _type: "reference", _ref: "artist-s-type" },         role: "Produced by" },
        ],
        tracklist: [
          {
            _key: k(),
            _type: "track",
            title: "The Rap Monument",
            artists: `Hudson Mohawke × Nick Hook × S-Type · 42:00 · feat. ${rappersList.join(", ")}`,
          },
        ],
      } as any);
      console.log(`     ✓ created release: The Rap Monument (36 rappers, 42 min)`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. PRESS DOCS — 6 outlets covered The Rap Monument
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n── 4. The Rap Monument press hits ──");
  const PRESS: Array<{
    id: string; outlet: string; headline: string; url: string;
    date: string; author?: string; imageUrl?: string; quote: string;
  }> = [
    {
      id: "pressQuote-pitchfork-rap-monument-2014",
      outlet: "Pitchfork",
      headline: "Danny Brown, Pusha T, Killer Mike, Action Bronson, Young Thug, More on 36-Rapper, 40-Minute Posse Cut 'The Rap Monument'",
      url: "https://pitchfork.com/news/57576-danny-brown-pusha-t-killer-mike-action-bronson-young-thug-more-on-36-rapper-40-minute-posse-cut-the-rap-monument/",
      date: "2014-12-18",
      quote: "Pitchfork announces the 36-rapper, 40-minute posse cut produced by Hudson Mohawke, Nick Hook, and S-Type for Noisey.",
    },
    {
      id: "pressQuote-stereogum-rap-monument-2014",
      outlet: "Stereogum",
      author: "Tom Breihan",
      headline: "Watch Young Thug, Killer Mike, Danny Brown, Pusha T, & Dozens More On 42-Minute Posse Cut 'The Rap Monument'",
      url: "https://www.stereogum.com/1725726/watch-young-thug-killer-mike-danny-brown-pusha-t-others-rap-on-42-minute-posse-cut/news/",
      date: "2014-12-18",
      imageUrl: "https://lede-admin.stereogum.com/wp-content/uploads/sites/64/2014/12/RM-FULL-CLEAN_vice_669x375.jpg",
      quote: "Up until today, the Game's 13-minute, 25-rapper 'One Blood' remix has been the final word in absurd, overlong rap posse cuts.",
    },
    {
      id: "pressQuote-fader-rap-monument-2014",
      outlet: "The FADER",
      author: "Patrick D. McDermott",
      headline: "Listen To All 42 Minutes Of Hudson Mohawke's 'The Rap Monument'",
      url: "https://www.thefader.com/2014/12/18/listen-to-all-42-minutes-of-the-rap-monument-with-young-thug-yg-way-more",
      date: "2014-12-18",
      quote: "All 42 minutes of the Hudson Mohawke / Nick Hook / S-Type posse cut, with Young Thug, YG, and way more.",
    },
    {
      id: "pressQuote-complex-rap-monument-2014",
      outlet: "Complex",
      author: "Zach Frydenlund",
      headline: "Listen to the 42-Minute 'Rap Monument' With Pusha T, Young Thug, and More Rapping Over Hudson Mohawke Production",
      url: "https://www.complex.com/music/2014/12/rap-monument-full-version-f-pusha-t-young-thug-and-more",
      date: "2014-12-18",
      quote: "The track is literally the ultimate posse cut with features from some of rap's biggest heavyweights.",
    },
    {
      id: "pressQuote-okayplayer-rap-monument-2014",
      outlet: "Okayplayer",
      author: "Karas Lamb",
      headline: "Pusha T, Danny Brown, Action Bronson, Flatbush Zombies & More Black Out On 'The Rap Monument'",
      url: "https://www.okayplayer.com/news/pusha-t-danny-brown-bronson-zombies-the-rap-monument-mp3.html",
      date: "2014-12-18",
      imageUrl: "https://image.okayplayer.com/645910.webp?imageId=645910&width=960&height=870&format=jpg",
      quote: "Pusha T, Danny Brown, Action Bronson, Flatbush Zombies, and more black out on the 42-minute posse cut.",
    },
    {
      id: "pressQuote-nesthq-rap-monument-2014",
      outlet: "NEST HQ",
      headline: "HudMo, Nick Hook, & S-Type Produce 42-Minute Project 'The Rap Monument'",
      url: "https://nesthq.com/the-rap-monument/",
      date: "2014-12-18",
      quote: "HudMo, Nick Hook, and S-Type produce the 42-minute project that became the most ambitious posse cut of the year.",
    },
  ];

  for (const p of PRESS) {
    const exists = await sanity.fetch<{ _id: string } | null>(`*[_id == $id || url == $url][0]{_id}`, { id: p.id, url: p.url });
    if (exists) { console.log(`     · ${p.outlet}: exists — skipping`); continue; }
    let imageAssetId: string | undefined;
    if (p.imageUrl) {
      const aid = await uploadCover(p.imageUrl, p.id.replace("pressQuote-", ""), "image");
      if (aid) imageAssetId = aid;
    }
    await sanity.createOrReplace({
      _id: p.id, _type: "pressQuote",
      kind: "feature",
      headline: p.headline,
      quote: p.quote,
      outlet: p.outlet,
      author: p.author,
      date: p.date,
      year: 2014,
      url: p.url,
      imageUrl: p.imageUrl,
      image: imageAssetId ? { _type: "image", asset: { _type: "reference", _ref: imageAssetId } } : undefined,
      relatedRelease: { _type: "reference", _ref: RAP_MON_ID },
    } as any);
    console.log(`     ✓ ${p.outlet}: created`);
  }

  console.log("\n  → next: fetch-platform-urls.ts --slug=egyptrixx-how-tidal --slug=the-rap-monument\n");
})();
