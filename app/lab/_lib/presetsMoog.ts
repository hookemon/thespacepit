// Canonical Moog patches. Each tells a story — a record where this sound
// matters. Load one, then dial against it.

import type { MoogParams } from "./engineMoog";

export type MoogPreset = {
  id: string;
  name: string;
  origin: string;
  story: string;
  params: Partial<MoogParams>;
};

export const MOOG_PRESETS: MoogPreset[] = [
  {
    id: "flash-light",
    name: "Flash Light bass",
    origin: "Bernie Worrell · Parliament, 1977",
    story:
      "the line bernie played that turned every other bass player on the planet into a synth bass player overnight. square wave + sub octave, fast filter envelope, no glide. you can hear the envelope opening every note.",
    params: {
      waveform: "square",
      subLevel: 0.7,
      cutoff: 0.28,
      resonance: 0.45,
      envAmount: 0.75,
      fAttack: 0.0,
      fDecay: 0.18,
      fSustain: 0.1,
      fRelease: 0.15,
      aAttack: 0.0,
      aDecay: 0.4,
      aSustain: 0.8,
      aRelease: 0.1,
      glide: 0,
      volume: 0.7,
    },
  },
  {
    id: "lead-saw",
    name: "Lead saw",
    origin: "P-funk / Stevie territory",
    story:
      "single sawtooth, mid cutoff, glide on. the wonder/worrell mid-70s solo voice. drop the cutoff lower for a smoother lead, push resonance for a squelchy one.",
    params: {
      waveform: "sawtooth",
      subLevel: 0.0,
      cutoff: 0.55,
      resonance: 0.25,
      envAmount: 0.3,
      fAttack: 0.1,
      fDecay: 0.4,
      fSustain: 0.5,
      fRelease: 0.4,
      aAttack: 0.05,
      aDecay: 0.5,
      aSustain: 0.8,
      aRelease: 0.3,
      glide: 0.18,
      volume: 0.65,
    },
  },
  {
    id: "stevie-clav",
    name: "Stevie square",
    origin: "Songs in the Key of Life era",
    story:
      "tight square + fast envelope. not the clavinet — that's a different instrument. this is the *synth* sound that sat next to the clav in stevie's rig and got used the same way. very tight envelope, no sustain.",
    params: {
      waveform: "square",
      subLevel: 0.0,
      cutoff: 0.42,
      resonance: 0.15,
      envAmount: 0.4,
      fAttack: 0.0,
      fDecay: 0.15,
      fSustain: 0.0,
      fRelease: 0.1,
      aAttack: 0.0,
      aDecay: 0.2,
      aSustain: 0.4,
      aRelease: 0.08,
      glide: 0,
      volume: 0.7,
    },
  },
  {
    id: "cabaret-drone",
    name: "Cabaret drone",
    origin: "Cabaret Voltaire · Red Mecca, 1981",
    story:
      "sheffield industrial. slow attack, long release, low cutoff, high resonance. drone notes that swell in and rot out. play one note and just let the filter envelope do the work.",
    params: {
      waveform: "sawtooth",
      subLevel: 0.5,
      cutoff: 0.22,
      resonance: 0.7,
      envAmount: 0.55,
      fAttack: 0.6,
      fDecay: 0.8,
      fSustain: 0.6,
      fRelease: 0.7,
      aAttack: 0.45,
      aDecay: 0.6,
      aSustain: 0.7,
      aRelease: 0.8,
      glide: 0.3,
      volume: 0.55,
    },
  },
  {
    id: "acid-bass",
    name: "Acid bass (Moog-style)",
    origin: "out of period — but a useful contrast",
    story:
      "not historically a moog sound — the acid we know was a TB-303. but if you tune a moog this way you can hear how close the architecture is. high resonance, fast envelope, glide. proof that the 303 didn't invent acid, it inherited it.",
    params: {
      waveform: "sawtooth",
      subLevel: 0.0,
      cutoff: 0.3,
      resonance: 0.85,
      envAmount: 0.65,
      fAttack: 0.0,
      fDecay: 0.25,
      fSustain: 0.0,
      fRelease: 0.15,
      aAttack: 0.0,
      aDecay: 0.3,
      aSustain: 0.4,
      aRelease: 0.15,
      glide: 0.4,
      volume: 0.65,
    },
  },
  {
    id: "init",
    name: "Init",
    origin: "yours to build",
    story: "clean patch. dial it in.",
    params: {},
  },
];
