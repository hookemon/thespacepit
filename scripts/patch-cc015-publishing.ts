/**
 * Patch CC015 Relationships with the full publishing payload from the
 * Master Discography 2.0 + the dedicated Relationships grid in Drive:
 *
 *   - Album-level: upc = 852878007014
 *   - Per track: writerCredits[] (PRIVATE — name + share % + PRO + IPI/CAE
 *     + publisher), keyed by Sanity's existing track _keys
 *
 * Mapping is keyed by the existing _key values queried via the read-only
 * `_check-cc015-tracklist.ts` so we don't disturb track order or other
 * fields (features, lyrics, ISRC, etc.) that are already correct.
 *
 * Nick = SESAC writer IPI 00467494116, Hookemon Songs = BMI publisher
 * IPI 00657625710 (confirmed across discog sheets). Co-writer IPIs left
 * blank when not on the source sheet — fillable later from PRO lookups.
 *
 * Run: npx tsx scripts/patch-cc015-publishing.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

type WriterCredit = {
  _key: string;
  name: string;
  share?: number;
  pro?: string;
  ipiCae?: string;
  publisher?: string;
  publisherPro?: string;
  publisherIpiCae?: string;
};

// Helper to build the Nick row — same for every track he wrote on.
const nick = (share: number): WriterCredit => ({
  _key: `wc-nick-${share}`,
  name: "Nicholas Conceller",
  share,
  pro: "SESAC",
  ipiCae: "00467494116",
  publisher: "Hookemon Songs",
  publisherPro: "BMI",
  publisherIpiCae: "00657625710",
});

// One entry per existing Sanity track _key. Splits taken from the
// "Splits" column on the Drive grid; Pub Info parsed for co-writer names
// and publishers. Where the grid shows "100" with two writers listed
// (e.g. Bhu Hum), the intent is the co-writer is uncredited on splits —
// kept as 100 Nick, co-writer at 0 with a note in the publisher field.
const TRACK_WRITER_CREDITS: Array<{ key: string; title: string; credits: WriterCredit[] }> = [
  {
    key: "vVaFl7ADmGgQzf5cZ9Eeib",
    title: "+3 feat. DJ Rashad, DJ Paypal & Nasty Nigel",
    credits: [
      nick(30),
      { _key: "wc-rashad", name: "Rashad Hanif Harden", share: 30, pro: "SESAC", publisher: "Domino US Publishing Company", publisherPro: "SESAC" },
      { _key: "wc-paypal", name: "DJ Paypal", share: 30, publisher: "Copyright Control" },
      { _key: "wc-nigel-1", name: "Joshua Reynoso", share: 10, publisher: "Copyright Control" },
    ],
  },
  {
    key: "vVaFl7ADmGgQzf5cZ9EenB",
    title: "Pro-Choice feat. Black Kray, Father, Michael Christmas & KCSB",
    credits: [
      nick(20),
      { _key: "wc-father", name: "Mangum Centel Orlando", share: 20, pro: "BMI" },
      { _key: "wc-mc", name: "Lindsey Michael", share: 20, pro: "ASCAP" },
      { _key: "wc-kray", name: "Black Kray", share: 20, publisher: "Copyright Control" },
      { _key: "wc-kcsb", name: "Keith Charles", share: 20, pro: "BMI", publisher: "KeithCharles", publisherPro: "BMI" },
    ],
  },
  {
    key: "vVaFl7ADmGgQzf5cZ9Eerl",
    title: "Gucci's feat. 24hrs",
    credits: [
      nick(50),
      { _key: "wc-24hrs", name: "Davis Robert", share: 50, publisher: "Copyright Control" },
    ],
  },
  {
    key: "vVaFl7ADmGgQzf5cZ9EewL",
    title: "Evolisontherise feat. Hudson Mohawke",
    credits: [
      nick(50),
      { _key: "wc-hudmo", name: "Birchard Ross Matthew", share: 50, pro: "ASCAP" },
    ],
  },
  {
    key: "vVaFl7ADmGgQzf5cZ9Ef0v",
    title: "Another Way feat. Spank Rock",
    credits: [
      nick(50),
      { _key: "wc-spank", name: "Hanks Naeem Juwan", share: 50, pro: "ASCAP", publisher: "Juwan Productions Inc", publisherPro: "ASCAP" },
    ],
  },
  {
    key: "vVaFl7ADmGgQzf5cZ9Ef5V",
    title: "Forever",
    credits: [nick(100)],
  },
  {
    key: "vVaFl7ADmGgQzf5cZ9EfA5",
    title: "Dive for You feat. Junglepussy & Prefuse 73",
    credits: [
      nick(33),
      { _key: "wc-junglepussy", name: "Mchayle Shayna", share: 33, pro: "BMI" },
      { _key: "wc-prefuse", name: "Herron Scott", share: 33, pro: "ASCAP" },
    ],
  },
  {
    key: "vVaFl7ADmGgQzf5cZ9EfEf",
    title: "Can't Tell Me Nothing feat. Novelist",
    credits: [
      nick(45),
      { _key: "wc-novelist", name: "Kojo Kankam", share: 45, publisher: "SONY / ATV" },
      { _key: "wc-gabe", name: "Gabe", share: 10 },
    ],
  },
  {
    key: "vVaFl7ADmGgQzf5cZ9EfJF",
    title: "All Alone feat. iLoveMakonnen",
    credits: [
      nick(50),
      { _key: "wc-makonnen", name: "Sheran Makonnen", share: 50, pro: "BMI" },
    ],
  },
  {
    key: "vVaFl7ADmGgQzf5cZ9EfNp",
    title: "Bhu Hum feat. Damien Hagglund",
    credits: [
      nick(100),
      { _key: "wc-hagglund", name: "Damien Hagglund", share: 0 },
    ],
  },
  {
    key: "vVaFl7ADmGgQzf5cZ9EfSP",
    title: "Live While I'm Livin' feat. Meyhem Lauren & Superhero Killer",
    credits: [
      nick(33),
      { _key: "wc-meyhem", name: "Williams Donald Darion", share: 33, pro: "ASCAP" },
      { _key: "wc-superhero", name: "Superhero Killer", share: 33 },
    ],
  },
  {
    key: "vVaFl7ADmGgQzf5cZ9EfWz",
    title: "Silk Pants",
    credits: [
      nick(50),
      { _key: "wc-iggy", name: "Ariyan Arslani", share: 50, publisher: "Songs of Universal, Inc.", publisherPro: "BMI" },
    ],
  },
  {
    key: "vVaFl7ADmGgQzf5cZ9EfbZ",
    title: "Head feat. 21 Savage & Bulletproof Dolphin",
    credits: [
      nick(33),
      { _key: "wc-21", name: "Shayaa Joseph", share: 33, publisher: "Copyright Control" },
      { _key: "wc-bullet", name: "Bulletproof Dolphin", share: 33, publisher: "Copyright Control" },
    ],
  },
  {
    key: "vVaFl7ADmGgQzf5cZ9Efg9",
    title: "Need 2 B feat. Rahel",
    credits: [
      nick(50),
      { _key: "wc-rahel", name: "Debere-Dessalegne Rahel", share: 50, publisher: "Copyright Control" },
    ],
  },
  {
    key: "vVaFl7ADmGgQzf5cZ9Efkj",
    title: "Lovesong feat. Nasty Nigel (Cure cover)",
    credits: [
      nick(50),
      { _key: "wc-nigel-2", name: "Joshua Reynoso", share: 50, publisher: "Copyright Control" },
    ],
  },
  {
    key: "vVaFl7ADmGgQzf5cZ9EfpJ",
    title: "The Infinite Loop feat. DJ Rashad, Chino Moreno & Nasty Nigel",
    credits: [
      nick(30),
      { _key: "wc-nigel-3", name: "Joshua Reynoso", share: 30, publisher: "Copyright Control" },
      { _key: "wc-rashad-2", name: "Rashad Hanif Harden", share: 30, pro: "SESAC", publisher: "Domino US Publishing Company", publisherPro: "SESAC" },
      { _key: "wc-chino", name: "Chino Moreno", share: 10 },
    ],
  },
];

async function main() {
  console.log("→ fetching current tracklist…");
  const release = await client.fetch<{ tracklist: Array<{ _key: string; [k: string]: unknown }> }>(
    `*[_id == "release-cc015-relationships"][0]{ tracklist }`,
  );
  if (!release?.tracklist) throw new Error("No tracklist found on CC015");

  // Map keys to writerCredits.
  const wcByKey = new Map(TRACK_WRITER_CREDITS.map((t) => [t.key, t.credits]));

  // Merge: keep every existing track, add writerCredits where we have it.
  const newTracklist = release.tracklist.map((t) => {
    const wc = wcByKey.get(t._key);
    if (!wc) return t;
    return { ...t, writerCredits: wc };
  });

  const matched = release.tracklist.filter((t) => wcByKey.has(t._key)).length;
  console.log(`   matched ${matched}/${release.tracklist.length} tracks`);
  if (matched !== TRACK_WRITER_CREDITS.length) {
    console.warn(`   WARNING: have credits for ${TRACK_WRITER_CREDITS.length} tracks but only matched ${matched} _keys`);
  }

  console.log("\n→ committing patch (UPC + writerCredits on 16 tracks)…");
  await client
    .patch("release-cc015-relationships")
    .set({
      upc: "852878007014",
      tracklist: newTracklist,
    })
    .commit();
  console.log("   ✓ patched");

  console.log("\n→ read back: spot-check a few tracks…");
  const after = await client.fetch(
    `*[_id == "release-cc015-relationships"][0]{
      upc,
      "spotCheck": tracklist[_key in ["vVaFl7ADmGgQzf5cZ9Eeib", "vVaFl7ADmGgQzf5cZ9Ef5V", "vVaFl7ADmGgQzf5cZ9EfbZ"]]{
        title, isrc, "credits": writerCredits[]{ name, share, pro, ipiCae, publisher, publisherPro }
      }
    }`,
  );
  console.log(JSON.stringify(after, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
