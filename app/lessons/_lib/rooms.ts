// Catalogue of rooms in the lab. Each room is a synthesis paradigm tied to
// a scene/era. The 909 room is live; everything else is staged as "next up"
// so visitors can see the shape of the world before it's all built.

export type RoomStatus = "live" | "next" | "soon";

export type Room = {
  slug: string;
  title: string;
  era: string;
  scene: string;
  paradigm: string;
  hero: string;
  blurb: string;
  accent: string;
  status: RoomStatus;
  records: string[];
};

export const ROOMS: Room[] = [
  {
    slug: "909",
    title: "TR-909",
    era: "1983 →",
    scene: "Chicago + Detroit",
    paradigm: "analog/digital hybrid drum machine",
    hero: "the kick that built house",
    blurb:
      "frankie at the warehouse. derrick in detroit. the 909 was the second-life drum machine — flopped on release, got fished out of pawn shops by chicago kids and turned into the heart of house. every kick, snare, hat is a circuit you can dial.",
    accent: "#E83A1C",
    status: "live",
    records: [
      "Phuture — Acid Tracks (1987)",
      "Mr. Fingers — Mystery of Love (1985)",
      "Rhythim Is Rhythim — Strings of Life (1987)",
    ],
  },
  {
    slug: "moog",
    title: "Moog",
    era: "1971 →",
    scene: "Detroit + Sheffield",
    paradigm: "subtractive synthesis",
    hero: "the bass that bernie built",
    blurb:
      "bernie worrell teaches subtractive 101 from inside flashlight. one oscillator, one filter, one envelope — and an entire vocabulary of P-funk leads, stevie wonder textures, and the cabaret voltaire/sheffield industrial lineage.",
    accent: "#F2B705",
    status: "live",
    records: [
      "Parliament — Flash Light (1977)",
      "Stevie Wonder — Songs in the Key of Life",
      "Cabaret Voltaire — Red Mecca (1981)",
    ],
  },
  {
    slug: "sp1200",
    title: "SP-1200",
    era: "1987 →",
    scene: "NYC golden age",
    paradigm: "12-bit sampler / sequencer",
    hero: "the grit of the golden era",
    blurb:
      "12-bit 26.04kHz with the pitch trick. premier, large pro, rza, pete rock all sat at this box. ties straight into your sample bank — chop, tune, swing, and learn why this exact machine sounds like new york in 1992.",
    accent: "#7AFB0D",
    status: "live",
    records: [
      "Pete Rock & CL Smooth — Mecca and the Soul Brother",
      "Gang Starr — Daily Operation",
      "Mobb Deep — The Infamous",
    ],
  },
  {
    slug: "dx7",
    title: "DX7",
    era: "1983 →",
    scene: "80s pop + new jack",
    paradigm: "frequency modulation (FM)",
    hero: "every bell on every radio",
    blurb:
      "FM theory taught by the way it actually entered the world: the DX7 was the default keyboard for half a decade. the bell on whitney's greatest love. the slap bass on every 80s ballad. the bright lead that came back as vaporwave.",
    accent: "#C9B9E8",
    status: "live",
    records: [
      "Whitney Houston — Greatest Love of All",
      "Brian Eno — Apollo: Atmospheres and Soundtracks",
      "Kenny G — anywhere",
    ],
  },
  {
    slug: "sid",
    title: "SID 6581",
    era: "1982 →",
    scene: "C64 demoscene",
    paradigm: "3-voice chip music",
    hero: "the chip that was a band",
    blurb:
      "three oscillators, one filter, a chip designed by an analog engineer who didn't know he was making the most expressive video game sound chip ever shipped. rob hubbard, martin galway, the demoscene tradition that still echoes in chiptune today.",
    accent: "#65C7F7",
    status: "live",
    records: [
      "Rob Hubbard — Monty on the Run (1985)",
      "Martin Galway — Wizball (1987)",
      "everyone in the demoscene since",
    ],
  },
  {
    slug: "buchla",
    title: "Buchla",
    era: "1965 →",
    scene: "Berkeley + Mills College",
    paradigm: "west coast / no-keyboard",
    hero: "the synth that refused the piano",
    blurb:
      "the moog had a keyboard. don buchla refused — touch plates, source-of-uncertainty, complex oscillators. subotnick made silver apples on a 100-series. suzanne ciani made an entire commercial sound language. this is synthesis as a philosophy.",
    accent: "#F4EFE6",
    status: "live",
    records: [
      "Morton Subotnick — Silver Apples of the Moon (1967)",
      "Suzanne Ciani — Buchla Concerts 1975",
      "Kaitlyn Aurelia Smith — Ears (2016)",
    ],
  },
  {
    slug: "modular",
    title: "Modular",
    era: "ongoing",
    scene: "patching as practice",
    paradigm: "patch programming",
    hero: "earn the patch cable",
    blurb:
      "modular last. once you've earned the other rooms — once subtractive, FM, west coast all live in your hands — the patch bay opens up. cv, gate, attenuation, modulation matrices. eurorack, serge, suit yourself.",
    accent: "#E83A1C",
    status: "live",
    records: ["yours, eventually"],
  },
];
