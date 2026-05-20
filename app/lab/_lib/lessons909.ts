// Guided lessons for the 909 room. Each one builds a real pattern from
// scratch. State shape is the same as the live machine: rows[].steps[],
// bpm, swing.

import type { Lesson } from "./lesson-types";
import type { StepRow } from "./sequencer";
import type { Voice } from "./engine909";

export type Lesson909State = {
  rows: StepRow[];
  bpm: number;
  swing: number;
  playing: boolean;
};

const stepsOf = (state: Lesson909State, voice: Voice) =>
  state.rows.find((r) => r.voice === voice)?.steps ?? [];

const countOnSteps = (state: Lesson909State, voice: Voice, indices: number[]) =>
  indices.filter((i) => stepsOf(state, voice)[i]).length;

export const CHICAGO_4X4_LESSON: Lesson<Lesson909State> = {
  id: "chicago-4x4-build",
  title: "Build a Chicago 4×4",
  origin: "Frankie Knuckles at the Warehouse, 1985",
  intro:
    "we're going to build a chicago house pattern from an empty grid — one voice at a time. by the end you'll have the same drum line frankie was looping at the warehouse, made from scratch on the machine that made it. hit start when you're ready.",
  reward:
    "that's the foundation of house. swap the preset to 'detroit drive' and listen for what changes — that's may pushing the kick around and adding a syncopated hit. you just built the easiest one. the hard part is what you do on top.",
  steps: [
    {
      id: "kick-on-1",
      title: "Put a kick on the downbeat",
      body:
        "click step 1 on the BD (kick) row. that's beat one. it's the dance-floor anchor — no kick on 1, no house.",
      hint: "the BD row is the top row, the leftmost column is step 1.",
      check: (s) => stepsOf(s, "BD")[0] === true,
    },
    {
      id: "kick-4on4",
      title: "Now make it 4-on-the-floor",
      body:
        "add a kick on steps 5, 9, and 13 (every quarter note). that's the heartbeat. four kicks per bar — the entire physics of house music.",
      hint: "click steps 5, 9, and 13 on the BD row.",
      check: (s) => countOnSteps(s, "BD", [0, 4, 8, 12]) === 4,
    },
    {
      id: "clap-2-and-4",
      title: "Add the backbeat clap",
      body:
        "place claps on steps 5 and 13 (the 'and' is wrong — the actual hit is on the 2 and the 4 of the bar). this is the same backbeat you'd play on snare in a rock kit. listening to chicago records, you'll hear the clap and the kick land together every other beat.",
      hint: "click steps 5 and 13 on the CP (clap) row.",
      check: (s) => stepsOf(s, "CP")[4] && stepsOf(s, "CP")[12],
    },
    {
      id: "offbeat-open-hat",
      title: "Drop the open hat on the offbeats",
      body:
        "the OH (open hat) on steps 3, 7, 11, 15 is the engine of house. every kick gets answered by an open hat exactly halfway between. that's the call-and-response that makes you move.",
      hint: "click steps 3, 7, 11, 15 on the OH row.",
      check: (s) => countOnSteps(s, "OH", [2, 6, 10, 14]) === 4,
    },
    {
      id: "press-play",
      title: "Press play and listen to what you made",
      body:
        "hit the play button. that's a chicago 4×4 — built from four voices, sixteen steps, and no other information. larry heard would loop this for 8 minutes and let the synths breathe over the top. now you know how.",
      hint: "the play button is in the top-left of the machine, lamp-yellow.",
      check: (s) => s.playing && countOnSteps(s, "BD", [0, 4, 8, 12]) === 4,
    },
  ],
};

export const LESSONS_909: Lesson<Lesson909State>[] = [CHICAGO_4X4_LESSON];
