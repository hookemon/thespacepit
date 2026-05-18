/**
 * Patch LDCC004 Follow Your Heart credits per Nick's spec (2026-05-17).
 *
 * Album-wide:
 *   Produced by Cubic Zirconia + John Kuker
 *   Written by  Cubic Zirconia
 *   Performed by Cubic Zirconia
 *   Drums       Jamire Williams (on every track)
 *   Engineering Cubic Zirconia + John Kuker
 *   Mixed by    Cubic Zirconia + John Kuker
 *   Mastered by Emily Lazar + Joe LaPorta @ The Lodge
 *   Recorded at Seedy Underbelly
 *
 * Per-track:
 *   Percussion (Lenny Castro) — every track EXCEPT tracks 8-13 minus 11
 *   Additional writer (Saadiq) — Yellow Spaceships
 *   Additional vocals — Coltrane (Cherry Nights), Drop The Lime (Runnin),
 *                       Dam Funk (I Got What You Need), Bilal (Night Or Day)
 *   Bass (Rick Penzone) — Runnin
 *   Mixed by Danny Kalb — Runnin
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { randomUUID } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

(async () => {
  // 1. Fetch current track titles (Sanity is the source of truth — preserves
  //    whatever the public titles look like with FT./feat./caps).
  const doc = await c.fetch<{ tracklist: Array<{ title: string }> }>(
    `*[_id == "release-ldcc004-follow-your-heart"][0]{ tracklist[]{ title } }`
  );
  const titles = doc.tracklist.map((t) => t.title);
  console.log("Track titles in Sanity:");
  titles.forEach((t, i) => console.log(`  ${String(i+1).padStart(2,"0")}  ${t}`));

  // Find titles by partial match — safer than typing them out verbatim.
  const find = (frag: string): string => {
    const m = titles.find((t) => t.toLowerCase().includes(frag.toLowerCase()));
    if (!m) throw new Error(`No track matches "${frag}"`);
    return m;
  };

  // 2. Resolve artist references where possible.
  const NAMES = [
    "Cubic Zirconia", "John Kuker", "Jamire Williams", "Lenny Castro",
    "Saadiq", "Coltrane", "Drop The Lime", "Dam Funk", "Bilal",
    "Rick Penzone", "Danny Kalb", "Emily Lazar", "Joe LaPorta",
  ];
  const artists = await c.fetch<Array<{ _id: string; name: string }>>(
    `*[_type == "artist" && name in $names]{ _id, name }`, { names: NAMES }
  );
  const byName = new Map(artists.map((a) => [a.name, a._id]));
  console.log(`\nArtist docs found: ${[...byName.keys()].join(", ")}`);
  console.log(`Missing (will use free-text): ${NAMES.filter(n => !byName.has(n)).join(", ") || "none"}`);

  // 3. Builder helpers.
  type Credit = {
    _key: string; _type: "object"; role: string;
    name?: string;
    person?: { _type: "reference"; _ref: string };
    instrument?: string;
    tracks?: string[];
  };
  function credit(role: string, name: string, opts: { instrument?: string; tracks?: string[] } = {}): Credit {
    const id = byName.get(name);
    const c: Credit = { _key: randomUUID(), _type: "object", role };
    if (id) c.person = { _type: "reference", _ref: id }; else c.name = name;
    if (opts.instrument) c.instrument = opts.instrument;
    if (opts.tracks) c.tracks = opts.tracks;
    return c;
  }

  // 4. Build the new credits list.
  const t = {
    yellow: find("yellow"), darko: find("darko"), blackHole: find("black hole"),
    summer: find("summertime"), treats: find("treats"), takeHigh: find("take me high"),
    freebase: find("freebase"), follow: find("follow your heart"),
    cherry: find("cherry"), runnin: find("runnin"), dontScared: find("don't be scared"),
    iGot: find("i got what"), nightDay: find("night or day"),
  };
  // Tracks where Lenny Castro played percussion (1-7 + 11; Follow Your Heart,
  // Cherry, Runnin, I Got, Night Or Day omit him per Nick).
  const lennyTracks = [t.yellow, t.darko, t.blackHole, t.summer, t.treats, t.takeHigh, t.freebase, t.dontScared];

  const credits: Credit[] = [
    // Album-wide production
    credit("Produced by", "Cubic Zirconia"),
    credit("Produced by", "John Kuker"),
    // Written + Performed (Cubic Zirconia performed + wrote the album collectively)
    credit("Written by", "Cubic Zirconia"),
    credit("Additional writer", "Saadiq", { tracks: [t.yellow] }),
    credit("Performed by", "Cubic Zirconia"),

    // Vocals — features land here as "Additional vocals" per-track.
    credit("Additional vocals", "Coltrane", { tracks: [t.cherry] }),
    credit("Additional vocals", "Drop The Lime", { tracks: [t.runnin] }),
    credit("Additional vocals", "Dam Funk", { tracks: [t.iGot] }),
    credit("Additional vocals", "Bilal", { tracks: [t.nightDay] }),

    // Instrumentalists
    credit("Drums", "Jamire Williams"),                              // album-wide
    credit("Percussion", "Lenny Castro", { tracks: lennyTracks }),  // tracks 1-7 + 11
    credit("Bass", "Rick Penzone", { tracks: [t.runnin] }),         // Runnin only

    // Engineering + Mix + Master
    credit("Engineering by", "Cubic Zirconia"),
    credit("Engineering by", "John Kuker"),
    credit("Mixed by", "Cubic Zirconia"),
    credit("Mixed by", "John Kuker"),
    credit("Mixed by", "Danny Kalb", { tracks: [t.runnin] }),       // override on Runnin
    credit("Mastered by", "Emily Lazar", { instrument: "@ The Lodge" }),
    credit("Mastered by", "Joe LaPorta",  { instrument: "@ The Lodge" }),

    // Studio location (footer block)
    { _key: randomUUID(), _type: "object", role: "Recorded at", name: "Seedy Underbelly" },
  ];

  await c.patch("release-ldcc004-follow-your-heart").set({ credits }).commit();
  console.log(`\n✓ Patched ${credits.length} credit entries.`);
})().catch((err) => { console.error(err); process.exit(1); });
