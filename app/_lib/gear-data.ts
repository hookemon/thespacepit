// Display metadata for the gear page — labels, blurbs, category order. The
// actual gear inventory lives in Sanity (one `gear` doc per piece). This file
// is just the visual taxonomy and remains the source of truth for category
// order and labels.

export type GearCategory =
  | "drum-machine"
  | "synth"
  | "sampler"
  | "modular"
  | "outboard"      // rack fx / comp / eq / preamp / reverb
  | "pedal"         // stompboxes, multi-fx pedals
  | "mic"
  | "controller"    // midi controllers, performance keys-as-controllers
  | "monitor"       // speakers + headphones
  | "dj"            // cdjs, turntables, dj mixers
  | "software"
  | "sequencer"     // dedicated hardware sequencers (cirklon class)
  | "interface"     // audio interfaces, soundcards, midi i/o, midi↔cv
  | "guitar"        // guitars + basses
  | "amp"           // guitar/bass amps
  | "piano";        // electric / acoustic pianos

export type GearStatus = "active" | "shelf" | "travel" | "wishlist" | "retired";

// Display order + label + blurb + signature accent for each category.
// Accent maps to a brand color token; tint is its translucent twin used for
// card backgrounds when there's no photo, so each category reads at a glance.
export type CategoryMeta = {
  key: GearCategory;
  label: string;
  blurb?: string;
  accent: string;     // hex token from globals.css
  tint: string;       // rgba shade of accent
};

export const CATEGORIES: CategoryMeta[] = [
  { key: "drum-machine", label: "drum machines", blurb: "the bones.",                accent: "#E83A1C", tint: "rgba(232, 58, 28, 0.10)" },  // redline
  { key: "synth",        label: "synths",         blurb: "voices.",                   accent: "#2F6FB3", tint: "rgba(47, 111, 179, 0.12)" }, // chakra-throat
  { key: "sampler",      label: "samplers",       blurb: "the crate.",                accent: "#F2B705", tint: "rgba(242, 183, 5, 0.10)" },  // lamp
  { key: "modular",      label: "modular",        blurb: "patch chaos.",              accent: "#4B2E83", tint: "rgba(75, 46, 131, 0.18)" },  // chakra-third
  { key: "sequencer",    label: "sequencers",     blurb: "the brain.",                accent: "#9B1B1B", tint: "rgba(155, 27, 27, 0.12)" },  // chakra-root
  { key: "outboard",     label: "outboard",       blurb: "fx, comp, eq, reverb.",     accent: "#E2651A", tint: "rgba(226, 101, 26, 0.10)" }, // chakra-sacral
  { key: "pedal",        label: "pedals",         blurb: "stompboxes.",               accent: "#FFB347", tint: "rgba(255, 179, 71, 0.10)" }, // peach
  { key: "mic",          label: "mics",           blurb: "vocal chain.",              accent: "#E3D4F2", tint: "rgba(227, 212, 242, 0.12)" },// chakra-crown
  { key: "controller",   label: "controllers",    blurb: "fingers on the grid.",      accent: "#F2C84B", tint: "rgba(242, 200, 75, 0.10)" }, // chakra-solar
  { key: "interface",    label: "interfaces",     blurb: "i/o · sound in, sound out.",accent: "#90E0EF", tint: "rgba(144, 224, 239, 0.10)" },// ice blue
  { key: "monitor",      label: "monitoring",     blurb: "what we hear.",             accent: "#3E8E5A", tint: "rgba(62, 142, 90, 0.12)" },  // chakra-heart
  { key: "guitar",       label: "guitars + bass", blurb: "six strings & four.",       accent: "#A0522D", tint: "rgba(160, 82, 45, 0.12)" },  // wood brown
  { key: "amp",          label: "amps",           blurb: "loud.",                     accent: "#7A2F00", tint: "rgba(122, 47, 0, 0.14)" },   // deep ember
  { key: "piano",        label: "pianos",         blurb: "felt + wood.",              accent: "#C8A2C8", tint: "rgba(200, 162, 200, 0.10)" },// lilac
  { key: "dj",           label: "dj",             blurb: "the booth.",                accent: "#0E4B3A", tint: "rgba(14, 75, 58, 0.18)" },   // collect
  { key: "software",     label: "software",       blurb: "in the box.",               accent: "#E8E2D4", tint: "rgba(232, 226, 212, 0.08)" },// paper-2
];
