// Offline render + WAV encode for the 909. Mirrors the live sequencer's
// timing, but instead of pumping notes on an interval we pre-schedule every
// step into an OfflineAudioContext. Apply the current per-voice params so
// what you hear in the live machine matches what you get in the file.
//
// Three export modes:
//   - mix  — single WAV of the full pattern (everything mixed together)
//   - stems — ZIP of per-voice WAV files, each playing only that voice's
//             part of the pattern (DAW workflow)
//   - kit  — ZIP of per-voice ONE-SHOTS (single hit each) + a loop WAV +
//             README. Optimized for loading onto Ableton Move + Teenage
//             Engineering KO II / EP-133 pads.

import { zipSync, strToU8 } from "fflate";

import { Engine909, type Voice, type VoiceParams } from "./engine909";
import type { StepRow } from "./sequencer";

export type RenderOptions = {
  rows: StepRow[];
  params: Record<Voice, VoiceParams>;
  bpm: number;
  swing: number;       // 0..0.5
  bars?: number;       // default 2
  sampleRate?: number; // default 44100
};

const VELOCITY_DEFAULT = 0.9;
const VELOCITY_ACCENT = 1;
const VELOCITY_GHOST = 0.55;

export async function renderPatternToBuffer(opts: RenderOptions): Promise<AudioBuffer> {
  const bars = opts.bars ?? 2;
  const sampleRate = opts.sampleRate ?? 44100;
  const stepsPerBar = 16;
  const sixteenth = 60 / opts.bpm / 4;
  // total length: bars * stepsPerBar * sixteenth, plus a 1s decay tail
  const beats = bars * stepsPerBar;
  const totalSeconds = beats * sixteenth + 1;
  const length = Math.ceil(sampleRate * totalSeconds);

  const offline = new OfflineAudioContext({ numberOfChannels: 2, length, sampleRate });
  const engine = new Engine909(offline);
  // Apply current params
  (Object.keys(opts.params) as Voice[]).forEach((v) => {
    const p = opts.params[v];
    (Object.keys(p) as (keyof VoiceParams)[]).forEach((k) => {
      const val = p[k];
      if (val !== undefined) engine.setParam(v, k, val);
    });
  });

  // Pre-schedule all notes
  let t = 0;
  for (let i = 0; i < beats; i++) {
    const step = i % stepsPerBar;
    for (const row of opts.rows) {
      if (row.steps[step]) {
        const vel = step % 4 === 0 ? VELOCITY_ACCENT
                  : step === 7 || step === 15 ? VELOCITY_GHOST
                  : VELOCITY_DEFAULT;
        engine.trigger(row.voice, t, vel);
      }
    }
    // advance with swing applied on off-steps
    const isOff = step % 2 === 1;
    t += isOff ? sixteenth * (1 + opts.swing) : sixteenth * (1 - opts.swing);
  }

  return await offline.startRendering();
}

// Encode an AudioBuffer (mono or stereo) into a 16-bit PCM WAV blob.
export function bufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(buffer.numberOfChannels, 2);
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;
  const bufferSize = 44 + dataSize;
  const ab = new ArrayBuffer(bufferSize);
  const view = new DataView(ab);

  // RIFF header
  writeStr(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(view, 8, "WAVE");
  // fmt chunk
  writeStr(view, 12, "fmt ");
  view.setUint32(16, 16, true);             // fmt chunk size
  view.setUint16(20, 1, true);              // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);             // bits per sample
  // data chunk
  writeStr(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // interleave + clamp
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([ab], { type: "audio/wav" });
}

function writeStr(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================================================================
// PER-VOICE RENDERING
// ============================================================================

// Render a single voice as a stem: same pattern, but only this voice plays.
// Useful for stems → DAW workflow.
export async function renderVoiceStem(
  voice: Voice,
  opts: RenderOptions
): Promise<AudioBuffer> {
  const onlyVoice: StepRow[] = opts.rows.map((r) =>
    r.voice === voice ? r : { ...r, steps: new Array(16).fill(false) }
  );
  return renderPatternToBuffer({ ...opts, rows: onlyVoice });
}

// Render a single one-shot hit of a voice. Useful for Move kit pads,
// KO II sample slots, anywhere you want a single drum hit at velocity 1.0.
// Duration sized to the longest natural decay for that voice — ~2 seconds is
// plenty for any 909 voice.
export async function renderVoiceOneshot(
  voice: Voice,
  params: Record<Voice, VoiceParams>,
  sampleRate = 44100
): Promise<AudioBuffer> {
  const length = Math.ceil(sampleRate * 2.0);
  const offline = new OfflineAudioContext({ numberOfChannels: 2, length, sampleRate });
  const engine = new Engine909(offline);
  (Object.keys(params) as Voice[]).forEach((v) => {
    const p = params[v];
    (Object.keys(p) as (keyof VoiceParams)[]).forEach((k) => {
      const val = p[k];
      if (val !== undefined) engine.setParam(v, k, val);
    });
  });
  engine.trigger(voice, 0.01, 1.0);
  return await offline.startRendering();
}

// ============================================================================
// ZIP PACKAGING
// ============================================================================

const VOICE_ORDER: Voice[] = ["BD", "SD", "LT", "MT", "HT", "RS", "CP", "CH", "OH"];

const VOICE_LABEL: Record<Voice, string> = {
  BD: "kick",
  SD: "snare",
  LT: "low-tom",
  MT: "mid-tom",
  HT: "hi-tom",
  RS: "rim",
  CP: "clap",
  CH: "closed-hat",
  OH: "open-hat",
};

async function abToBytesAsync(buf: AudioBuffer): Promise<Uint8Array> {
  const blob = bufferToWavBlob(buf);
  return new Uint8Array(await blob.arrayBuffer());
}

export type ExportMeta = {
  presetId: string;
  bpm: number;
  swing: number;
  bars: number;
};

// STEMS — per-voice patterns + a mix loop
export async function buildStemsZip(
  opts: RenderOptions,
  meta: ExportMeta
): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};
  // mix
  const mix = await renderPatternToBuffer(opts);
  files["loop.wav"] = await abToBytesAsync(mix);
  // per-voice stems
  for (let i = 0; i < VOICE_ORDER.length; i++) {
    const v = VOICE_ORDER[i];
    const hasAny = opts.rows.find((r) => r.voice === v)?.steps.some(Boolean);
    if (!hasAny) continue;
    const buf = await renderVoiceStem(v, opts);
    const num = String(i + 1).padStart(2, "0");
    files[`stems/${num}-${v}-${VOICE_LABEL[v]}.wav`] = await abToBytesAsync(buf);
  }
  files["README.txt"] = strToU8(buildStemsReadme(meta));
  const zipped = zipSync(files, { level: 0 }); // WAVs don't compress
  return new Blob([new Uint8Array(zipped)], { type: "application/zip" });
}

// KIT — per-voice ONE-SHOTS + loop + manifest. Sized for Move + KO II.
export async function buildKitZip(
  opts: RenderOptions,
  meta: ExportMeta
): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};
  // numbered one-shots (one per pad slot)
  for (let i = 0; i < VOICE_ORDER.length; i++) {
    const v = VOICE_ORDER[i];
    const buf = await renderVoiceOneshot(v, opts.params);
    const num = String(i + 1).padStart(2, "0");
    files[`samples/${num}-${v}-${VOICE_LABEL[v]}.wav`] = await abToBytesAsync(buf);
  }
  // pattern loop for resampling / KO II resample slot
  const mix = await renderPatternToBuffer(opts);
  files[`loop-${meta.bpm}bpm.wav`] = await abToBytesAsync(mix);
  // human-readable manifest
  files["kit.json"] = strToU8(JSON.stringify(buildKitManifest(meta), null, 2));
  files["README.txt"] = strToU8(buildKitReadme(meta));
  const zipped = zipSync(files, { level: 0 });
  return new Blob([new Uint8Array(zipped)], { type: "application/zip" });
}

function buildKitManifest(meta: ExportMeta) {
  // Shape echoes Nick's sample-bank manifest template (slot for ableton_move
  // + ep_133). Concrete file format for either device evolves; this manifest
  // is the source of truth either way.
  return {
    slug: `lab-909-${meta.presetId}`,
    name: `Lab 909 · ${meta.presetId}`,
    category: "drum-machine",
    bpm: meta.bpm,
    swing: meta.swing,
    pads: VOICE_ORDER.map((v, i) => ({
      slot: i + 1,
      voice: v,
      label: VOICE_LABEL[v],
      file: `samples/${String(i + 1).padStart(2, "0")}-${v}-${VOICE_LABEL[v]}.wav`,
      midiNote: { BD: 36, SD: 38, LT: 43, MT: 47, HT: 50, RS: 37, CP: 39, CH: 42, OH: 46 }[v],
    })),
    loop: `loop-${meta.bpm}bpm.wav`,
    source: "thespacepit.com/lessons/909",
    exportedAt: new Date().toISOString(),
  };
}

function buildKitReadme(meta: ExportMeta): string {
  return `LAB 909 · ${meta.presetId.toUpperCase()} KIT
${meta.bpm} bpm · swing ${Math.round(meta.swing * 100)}%
Exported from thespacepit.com/lessons/909

What's inside
-------------
samples/        — 9 one-shot WAVs, one per 909 voice (BD/SD/toms/RS/CP/CH/OH)
loop-${meta.bpm}bpm.wav  — the full pattern as a single audio file (resample fodder)
kit.json        — machine-readable manifest

How to load this on Move
------------------------
1. Plug Move into your computer, open https://move.ableton.com
2. Drag the 'samples/' folder onto Move Manager
3. Each pad on a kit gets one voice — they'll come up in numerical order

How to load this on KO II / EP-133
----------------------------------
1. Plug KO II via USB, hold REC + power on to enter USB drive mode
2. Drag the WAVs from 'samples/' into the SAMPLES folder
3. They'll show up sorted alphabetically — assign to pads in your project

How to use the loop
-------------------
The loop.wav is the full pattern at ${meta.bpm} bpm. Drop it on a Move pad to
resample/chop, or on the KO II to time-stretch + chop into a new beat. Standard
hip-hop "sample your own kit" move.
`;
}

function buildStemsReadme(meta: ExportMeta): string {
  return `LAB 909 · ${meta.presetId.toUpperCase()} STEMS
${meta.bpm} bpm · swing ${Math.round(meta.swing * 100)}%
Exported from thespacepit.com/lessons/909

stems/      — per-voice WAVs (each voice plays its part of the pattern in isolation)
loop.wav    — the full mix

Drop these into any DAW. They're all aligned to bar 1 + same length.
`;
}

// Convenience: download with sensible filename
export function downloadKit(blob: Blob, meta: ExportMeta) {
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `lab-909-${meta.presetId}-kit-${meta.bpm}bpm-${stamp}.zip`);
}
export function downloadStems(blob: Blob, meta: ExportMeta) {
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `lab-909-${meta.presetId}-stems-${meta.bpm}bpm-${stamp}.zip`);
}
