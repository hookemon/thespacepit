// SP-1200 step sequencer — parallel to the 909 one but typed to PadId.
// Duplication is intentional: keeps the 909 path stable while we iterate
// on the SP-1200 room. If a third sample-based room shows up we'll
// generalize.

import type { EngineSP1200, PadId } from "./engineSP1200";

export type StepRowSP = { pad: PadId; steps: boolean[] };

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.1;
const VELOCITY_DEFAULT = 0.9;
const VELOCITY_ACCENT = 1;
const VELOCITY_GHOST = 0.55;

export class SequencerSP {
  engine: EngineSP1200;
  rows: StepRowSP[] = [];
  state = {
    bpm: 92,         // SP-1200 default is golden-era hip-hop tempo
    swing: 0.18,     // SP swing is a lot of the magic
    playing: false,
    currentStep: 0,
    numSteps: 16,
  };
  private nextNoteTime = 0;
  private pumpHandle: ReturnType<typeof setInterval> | null = null;
  private uiTimers: ReturnType<typeof setTimeout>[] = [];
  private onStep?: (step: number) => void;

  constructor(engine: EngineSP1200) { this.engine = engine; }

  setRows(rows: StepRowSP[]) { this.rows = rows; }
  setBpm(bpm: number) { this.state.bpm = Math.max(40, Math.min(200, bpm)); }
  setSwing(swing: number) { this.state.swing = Math.max(0, Math.min(0.5, swing)); }
  onStepChange(cb: (step: number) => void) { this.onStep = cb; }

  start() {
    if (this.state.playing) return;
    this.state.playing = true;
    this.state.currentStep = 0;
    this.nextNoteTime = this.engine.ctx.currentTime + 0.05;
    this.pump();
    this.pumpHandle = setInterval(() => this.pump(), LOOKAHEAD_MS);
  }

  stop() {
    this.state.playing = false;
    if (this.pumpHandle) { clearInterval(this.pumpHandle); this.pumpHandle = null; }
    this.uiTimers.forEach((t) => clearTimeout(t));
    this.uiTimers = [];
    this.state.currentStep = 0;
    this.onStep?.(-1);
  }

  private stepDuration(step: number) {
    const sixteenth = 60 / this.state.bpm / 4;
    const isOff = step % 2 === 1;
    return isOff ? sixteenth * (1 + this.state.swing) : sixteenth * (1 - this.state.swing);
  }

  private pump() {
    if (!this.state.playing) return;
    const ctxTime = this.engine.ctx.currentTime;
    while (this.nextNoteTime < ctxTime + SCHEDULE_AHEAD) {
      const step = this.state.currentStep;
      for (const row of this.rows) {
        if (row.steps[step]) {
          const vel = step % 4 === 0 ? VELOCITY_ACCENT
                    : step === 7 || step === 15 ? VELOCITY_GHOST
                    : VELOCITY_DEFAULT;
          this.engine.trigger(row.pad, this.nextNoteTime, vel);
        }
      }
      const stepToFire = step;
      const fireAt = this.nextNoteTime - ctxTime;
      const h = setTimeout(() => {
        if (this.state.playing) this.onStep?.(stepToFire);
      }, Math.max(0, fireAt * 1000));
      this.uiTimers.push(h);

      this.nextNoteTime += this.stepDuration(step);
      this.state.currentStep = (step + 1) % this.state.numSteps;
    }
  }
}
