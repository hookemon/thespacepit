/**
 * Fill bio + tagline on the most-credited collaborators across the catalog.
 * Conservative — only adds bios where I can write something accurate based
 * on widely-known facts. Skips niche/uncertain artists (Nick can fill those
 * in Studio).
 *
 * For each artist:
 *   - tagline: one-line italic note (for the roster card)
 *   - bio: 2-3 PortableText blocks (renders on /artists/<slug>)
 *
 * Idempotent — only patches artists with no bio yet (or tagline missing).
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

function block(text: string) {
  return {
    _key: randomUUID(), _type: "block", style: "normal", markDefs: [],
    children: [{ _key: randomUUID(), _type: "span", text, marks: [] }],
  };
}

// Bios written from widely-known facts. Each is intentionally brief — the
// artist page can grow with more detail later. Anything uncertain I left
// out of this script entirely (Trooko, Saadiq, Lexo, Hooke, Coltrane, Rood
// etc. — Nick to fill those in Studio when he has the bandwidth).
const BIOS: Record<string, { tagline: string; city?: string; bio: string[] }> = {
  "Joe LaPorta": {
    tagline: "mastering engineer at Sterling Sound, NYC.",
    city: "New York, NY",
    bio: [
      "Joe LaPorta is a GRAMMY-winning mastering engineer based at Sterling Sound in New York. His credits run from David Bowie's Blackstar to Foo Fighters, The Killers, Imagine Dragons, Vampire Weekend, and a long roll of contemporary R&B, hip-hop, and rock records.",
      "Mastered most of Calm + Collect's catalog — Peephole, Drums, Like Water, and the Cubic Zirconia LDCC singles — anchoring the C+C house sound at the cutting stage.",
    ],
  },
  "Jamire Williams": {
    tagline: "drummer's drummer. jazz roots, beat-music range.",
    city: "Los Angeles, CA",
    bio: [
      "Jamire Williams is a drummer and producer from Houston, now based in LA. Cut his teeth in the modern jazz lineage playing with Robert Glasper, Christian Scott aTunde Adjuah, José James, Bilal, Charles Lloyd, and more.",
      "Brought the live drum DNA to Cubic Zirconia — every track on Follow Your Heart, plus Darko and Take Me High, has Jamire on the kit.",
    ],
  },
  "Lenny Castro": {
    tagline: "legendary session percussionist.",
    city: "Los Angeles, CA",
    bio: [
      "Lenny Castro is one of the most-recorded percussionists in modern music — his congas, shakers, and hand drums anchor records by Toto (including \"Africa\"), Stevie Wonder, Boz Scaggs, Diana Ross, and decades of LA session work.",
      "Added the percussion layer across Cubic Zirconia's Follow Your Heart — Yellow Spaceships through Don't Be Scared Of My Love.",
    ],
  },
  "Gaslamp Killer": {
    tagline: "low-end weirdo. brainfeeder DNA.",
    city: "Los Angeles, CA",
    bio: [
      "William Bensussen, aka The Gaslamp Killer, is a producer and DJ tied to LA's Brainfeeder scene. Known for his Sunday-night Low End Theory residencies and a singular bass-heavy, psychedelic sound that bridged the LA beat scene to hip-hop, jazz, and global music.",
      "Co-produced Fish Food on Nick Hook's Without You alongside Computer Jay.",
    ],
  },
  "Computer Jay": {
    tagline: "synth wizard out of LA.",
    city: "Los Angeles, CA",
    bio: [
      "Computer Jay is an LA-based producer and keyboardist who came up through the Stones Throw / Brainfeeder orbit. Synth-heavy productions and a deep crate-digger's ear.",
      "Co-produced Fish Food on Without You with Gaslamp Killer.",
    ],
  },
  "Adam Garcia": {
    tagline: "designer + cover artist. a.k.a. the pressure.",
    city: "New York, NY",
    bio: [
      "Adam Garcia is a designer and illustrator who operates under the studio name The Pressure. His work draws on early-2000s NYC graphic culture, with a hand for hip-hop and electronic record packaging.",
      "Designed the cover for Nick Hook's Like Water and the chrome-distorted artwork for Spiritual Friendship Drums.",
    ],
  },
  "Dust La Rock": {
    tagline: "designer + co-founder of fool's gold records.",
    city: "Brooklyn, NY",
    bio: [
      "Anthony Hughes — better known as Dust La Rock — co-founded Fool's Gold Records with A-Trak and Nick Catchdubs in 2007 and ran the label's art direction through its peak era of NY/club crossover releases. A graphic designer's graphic designer; his pulled-from-the-archive collage style defined a decade of party flyers, record sleeves, and merch.",
      "Designed the cover for Cubic Zirconia's Follow Your Heart on LDCC.",
    ],
  },
  "Mike 2600": {
    tagline: "screenprinter + illustrator.",
    bio: [
      "Mike 2600 is an illustrator and screen printer with a heavy line — his work has appeared on tour posters, record sleeves, and editorial across the underground hip-hop and electronic music worlds.",
      "Designed the neon-line Peephole cover featuring Nick Hook + Gangsta Boo.",
    ],
  },
  "Daryl Palumbo": {
    tagline: "frontman of glassjaw, head automatica, color film, sports.",
    city: "Long Island, NY",
    bio: [
      "Daryl Palumbo is a singer and songwriter from Long Island, known as the frontman of post-hardcore band Glassjaw, electro-pop project Head Automatica, and synth-pop outfit Color Film with Rick Penzone. Most recently in the band Sports.",
      "Brought vocals to It's A Sin on Nick Hook's Without You via Color Film.",
    ],
  },
  "Rick Penzone": {
    tagline: "bassist + co-founder of color film.",
    city: "Long Island, NY",
    bio: [
      "Rick Penzone plays bass in Color Film (with Daryl Palumbo) and a long list of NY indie/post-hardcore projects.",
      "Played bass on Cubic Zirconia's \"Runnin In And Out Of Love\" (Follow Your Heart) and contributed to It's A Sin on Nick Hook's Without You.",
    ],
  },
  "Brian Iele": {
    tagline: "mastering engineer at santa cecilia sound.",
    bio: [
      "Brian Iele is a mastering engineer working out of Santa Cecilia Sound. Quietly responsible for the final pass on a lot of records that punch above their weight.",
      "Mastered Spiritual Friendship Drums.",
    ],
  },
  "John Kuker": {
    tagline: "engineer + co-producer. cubic zirconia's right hand at seedy underbelly.",
    bio: [
      "John Kuker is an engineer and producer who runs Seedy Underbelly Studios. Co-produced, engineered, and mixed all of Cubic Zirconia's Lockhart Dynasty / Calm + Collect records alongside the band.",
    ],
  },
  "Bilal": {
    tagline: "soulquarian. one of the great singers of his generation.",
    city: "Philadelphia, PA / New York, NY",
    bio: [
      "Bilal Sayeed Oliver — singer, songwriter, multi-instrumentalist. A core member of the Soulquarians collective in the late '90s/early 2000s alongside D'Angelo, Erykah Badu, Common, Q-Tip, and J Dilla. His voice has shaped records by Robert Glasper, Common, Kendrick Lamar, and dozens more.",
      "Featured on Cubic Zirconia's \"Night Or Day\" (Follow Your Heart).",
    ],
  },
  "Drop The Lime": {
    tagline: "bass / rockabilly bandleader.",
    city: "New York, NY",
    bio: [
      "Luca Venezia — Drop The Lime — is a Brooklyn producer/DJ who came up through the bass / dubstep era running Trouble & Bass, then pivoted into rockabilly-meets-electronic territory in the 2010s.",
      "Featured on Cubic Zirconia's \"Runnin In And Out Of Love\" (Follow Your Heart).",
    ],
  },
  "Andrea Balency": {
    tagline: "singer + keyboardist. mt. wolf.",
    bio: [
      "Andrea Balency is a French-Mexican singer and keyboardist, best known for her work in the UK band Mt. Wolf and as a guest vocalist across the European indie/electronic scene.",
      "Featured on \"4XS\" from Nick Hook's Without You.",
    ],
  },
  "Dam Funk": {
    tagline: "modern-funk evangelist.",
    city: "Los Angeles, CA",
    bio: [
      "Damon Riddick — Dâm-Funk — is a Pasadena-bred producer, vocalist, and keyboardist who's spent the last two decades pulling early-'80s funk forward into the present. Stones Throw records, prolific solo work, collabs with Snoop and others.",
      "Featured on Cubic Zirconia's \"I Got What You Need\" (Follow Your Heart).",
    ],
  },
  "Seven Davis Jr": {
    tagline: "house + r&b futurist.",
    city: "Los Angeles, CA",
    bio: [
      "Seven Davis Jr is a vocalist and producer whose work sits at the intersection of house, R&B, and gospel-rooted soul. Records on Ninja Tune and Apron Records, a long live performance lineage.",
      "Featured on \"Gaslight\" from Nick Hook's Like Water.",
    ],
  },
  "Nadus": {
    tagline: "club music / jersey roots.",
    city: "New Jersey",
    bio: [
      "Nadus is a New Jersey producer with deep ties to Jersey club, ballroom, and the experimental edge of contemporary dance music.",
      "Featured on \"Magic Carpet Ride\" from Nick Hook's Like Water.",
    ],
  },
  "Thee Mike B": {
    tagline: "dj + producer. la party history.",
    city: "Los Angeles, CA",
    bio: [
      "Thee Mike B is an LA DJ and producer with deep roots in the city's mash-up and Cinespace party era.",
      "Featured on \"Halcyon Monday\" from Nick Hook's Like Water.",
    ],
  },
};

(async () => {
  const NAMES = Object.keys(BIOS);
  const rows = await c.fetch<Array<{ _id: string; name: string; tagline?: string; city?: string; bioBlocks: number }>>(
    `*[_type == "artist" && name in $names]{ _id, name, tagline, city, "bioBlocks": count(bio) }`,
    { names: NAMES }
  );
  console.log(`${rows.length} artist docs to consider…\n`);
  let touched = 0, skipped = 0;
  for (const r of rows) {
    const data = BIOS[r.name];
    if (!data) continue;
    if (r.bioBlocks > 0) { console.log(`· ${r.name}: already has bio (${r.bioBlocks} blocks), skip`); skipped++; continue; }
    const patch: Record<string, unknown> = { bio: data.bio.map(block) };
    if (!r.tagline) patch.tagline = data.tagline;
    if (!r.city && data.city) patch.city = data.city;
    await c.patch(r._id).set(patch).commit();
    console.log(`✓ ${r.name}: bio (${data.bio.length} blocks)${!r.tagline ? " + tagline" : ""}${!r.city && data.city ? ` + city (${data.city})` : ""}`);
    touched++;
  }
  console.log(`\n${touched} artists got bios · ${skipped} already had bios`);
})().catch((err) => { console.error(err); process.exit(1); });
