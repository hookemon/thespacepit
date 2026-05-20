// Minimal Web MIDI helpers. Browsers that don't support Web MIDI (Safari
// without a flag) just get a "not supported" state — no crash.

export type MidiDevice = { id: string; name: string };

export type MidiMessage =
  | { type: "noteon"; note: number; velocity: number }
  | { type: "noteoff"; note: number; velocity: number }
  | { type: "clock" }       // 0xF8 — 24 ppq
  | { type: "start" }       // 0xFA
  | { type: "continue" }    // 0xFB
  | { type: "stop" };       // 0xFC

export type MidiNoteHandler = (msg: MidiMessage) => void;

export async function listInputs(): Promise<MidiDevice[]> {
  const access = await requestAccess();
  if (!access) return [];
  return Array.from(access.inputs.values()).map((p) => ({ id: p.id, name: p.name ?? "Unknown" }));
}

export async function listOutputs(): Promise<MidiDevice[]> {
  const access = await requestAccess();
  if (!access) return [];
  return Array.from(access.outputs.values()).map((p) => ({ id: p.id, name: p.name ?? "Unknown" }));
}

export async function bindInput(id: string, onMessage: MidiNoteHandler): Promise<() => void> {
  const access = await requestAccess();
  if (!access) return () => {};
  const input = Array.from(access.inputs.values()).find((p) => p.id === id);
  if (!input) return () => {};
  const handler = (e: WebMidi.MIDIMessageEvent) => {
    const [statusByte, noteByte, velByte] = e.data;
    // System realtime messages live in the 0xF8–0xFF range and have no
    // channel — handle them first so they pass through regardless of channel.
    if (statusByte === 0xf8) return onMessage({ type: "clock" });
    if (statusByte === 0xfa) return onMessage({ type: "start" });
    if (statusByte === 0xfb) return onMessage({ type: "continue" });
    if (statusByte === 0xfc) return onMessage({ type: "stop" });
    const command = statusByte & 0xf0;
    if (command === 0x90 && velByte > 0) {
      onMessage({ type: "noteon", note: noteByte, velocity: velByte / 127 });
    } else if (command === 0x80 || (command === 0x90 && velByte === 0)) {
      onMessage({ type: "noteoff", note: noteByte, velocity: velByte / 127 });
    }
  };
  input.addEventListener("midimessage", handler as EventListener);
  return () => input.removeEventListener("midimessage", handler as EventListener);
}

export async function sendNoteOn(outputId: string, note: number, velocity = 100, channel = 9) {
  const access = await requestAccess();
  if (!access) return;
  const out = Array.from(access.outputs.values()).find((p) => p.id === outputId);
  out?.send?.([0x90 | (channel & 0x0f), note & 0x7f, Math.max(1, Math.min(127, velocity))]);
}

export async function sendNoteOff(outputId: string, note: number, channel = 9) {
  const access = await requestAccess();
  if (!access) return;
  const out = Array.from(access.outputs.values()).find((p) => p.id === outputId);
  out?.send?.([0x80 | (channel & 0x0f), note & 0x7f, 0]);
}

// --- Transport + clock out ---
// We cache the resolved port so the per-tick send doesn't pay the async
// requestAccess cost 24 times per quarter note.
const portCache = new Map<string, MIDIPort | null>();
async function getOutputPort(id: string): Promise<MIDIPort | null> {
  if (portCache.has(id)) return portCache.get(id) ?? null;
  const access = await requestAccess();
  if (!access) return null;
  const out = Array.from(access.outputs.values()).find((p) => p.id === id) ?? null;
  portCache.set(id, out);
  return out;
}

export function sendClockTickSync(outputId: string) {
  const out = portCache.get(outputId);
  out?.send?.([0xf8]);
}
export function sendStartSync(outputId: string) {
  portCache.get(outputId)?.send?.([0xfa]);
}
export function sendStopSync(outputId: string) {
  portCache.get(outputId)?.send?.([0xfc]);
}
export function sendContinueSync(outputId: string) {
  portCache.get(outputId)?.send?.([0xfb]);
}
// Async warm-up so the cache is populated before the sync sends fire.
export async function warmOutput(outputId: string) {
  await getOutputPort(outputId);
}

// Standard 909 GM mapping for MIDI in/out (matches what most external boxes
// — including Move's kit pads on default kits — send on channel 10):
//   BD=36, SD=38, LT=43, MT=47, HT=50, RS=37, CP=39, CH=42, OH=46
export const VOICE_TO_MIDI_NOTE: Record<string, number> = {
  BD: 36, SD: 38, LT: 43, MT: 47, HT: 50, RS: 37, CP: 39, CH: 42, OH: 46,
};

// Inverse — incoming MIDI note → voice. Also accept a few common neighbors
// so Move kit variants (which sometimes shift things by a semitone) still hit
// the right voice.
export const MIDI_NOTE_TO_VOICE: Record<number, string> = {
  35: "BD", 36: "BD",
  37: "RS",
  38: "SD", 40: "SD",
  39: "CP",
  41: "LT", 43: "LT", 45: "LT",
  47: "MT", 48: "MT",
  50: "HT", 49: "HT",
  42: "CH", 44: "CH",
  46: "OH",
};

// Cache the WebMIDI access promise so we don't request it multiple times.
let accessPromise: Promise<MIDIAccess | null> | null = null;

async function requestAccess(): Promise<MIDIAccess | null> {
  if (typeof navigator === "undefined") return null;
  if (!("requestMIDIAccess" in navigator)) return null;
  if (!accessPromise) {
    accessPromise = (navigator as Navigator & { requestMIDIAccess: () => Promise<MIDIAccess> })
      .requestMIDIAccess()
      .catch(() => null);
  }
  return accessPromise;
}

// Subscribe to state changes (device plug/unplug). Returns an unsubscriber.
export async function onMidiStateChange(cb: () => void): Promise<() => void> {
  const access = await requestAccess();
  if (!access) return () => {};
  const handler = () => cb();
  access.addEventListener("statechange", handler as EventListener);
  return () => access.removeEventListener("statechange", handler as EventListener);
}

export function isMidiSupported() {
  return typeof navigator !== "undefined" && "requestMIDIAccess" in navigator;
}

// --- Minimal types (browser ambient types aren't always present) ---
type MIDIAccess = {
  inputs: Map<string, MIDIPort>;
  outputs: Map<string, MIDIPort>;
  addEventListener: EventTarget["addEventListener"];
  removeEventListener: EventTarget["removeEventListener"];
};
type MIDIPort = {
  id: string;
  name: string | null;
  send?: (data: number[]) => void;
  addEventListener: EventTarget["addEventListener"];
  removeEventListener: EventTarget["removeEventListener"];
};
declare namespace WebMidi {
  type MIDIMessageEvent = { data: Uint8Array };
}
