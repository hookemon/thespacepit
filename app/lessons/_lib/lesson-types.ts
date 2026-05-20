// Shared lesson types. A lesson is a sequence of small steps, each with a
// check function that introspects machine state. When check() returns true,
// the step is complete and the panel auto-advances.
//
// The state type is opaque — each room passes its own shape (909 row state,
// moog params, etc). Keep it loose so we don't have to drag types across
// rooms.

export type LessonStep<S = unknown> = {
  id: string;
  title: string;
  body: string;
  // Optional second sentence — shown when the step has been on screen for a
  // moment without progress (a soft nudge).
  hint?: string;
  // Returns true when this step is satisfied by the current state.
  check: (state: S) => boolean;
  // Optional one-off setup applied when the step is entered.
  // Receives the current state, returns a "patch" the runner merges.
  setup?: (state: S) => Partial<S> | void;
  // Optional UI element to spotlight (pulse + glow) while this step is
  // active. Read by the LessonSpotlight context — see
  // _components/LessonSpotlight.tsx for the identifier convention.
  target?: string;
};

export type Lesson<S = unknown> = {
  id: string;
  title: string;
  origin: string;          // who/where this lesson is rooted in
  intro: string;           // shown before step 1
  reward: string;          // shown after the last step
  steps: LessonStep<S>[];
};
