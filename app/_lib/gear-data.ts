// Display metadata for the gear page — labels, blurbs, category order. The
// actual gear inventory lives in Sanity (one `gear` doc per piece). This file
// is just the visual taxonomy and remains the source of truth for category
// order and labels.

export type GearCategory =
  | "drum-machine"
  | "synth"
  | "sampler"
  | "outboard"
  | "mic"
  | "controller"
  | "monitor"
  | "modular"
  | "dj"
  | "software";

export type GearStatus = "active" | "shelf" | "travel" | "wishlist" | "retired";

// Display order + label + blurb for category filters.
export const CATEGORIES: { key: GearCategory; label: string; blurb?: string }[] = [
  { key: "drum-machine", label: "drum machines", blurb: "the bones." },
  { key: "synth",        label: "synths",         blurb: "voices." },
  { key: "sampler",      label: "samplers",       blurb: "the crate." },
  { key: "modular",      label: "modular",        blurb: "patch chaos." },
  { key: "outboard",     label: "outboard",       blurb: "fx, comp, eq, reverb." },
  { key: "mic",          label: "mics",           blurb: "vocal chain." },
  { key: "controller",   label: "controllers",    blurb: "fingers on the grid." },
  { key: "monitor",      label: "monitoring",     blurb: "what we hear." },
  { key: "dj",           label: "dj",             blurb: "the booth." },
  { key: "software",     label: "software",       blurb: "in the box." },
];
