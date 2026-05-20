// Lookahead step sequencer for the 909. Uses the AudioContext clock for
// timing (sample-accurate) with a setInterval pump that schedules any
// upcoming notes in a short lookahead window. Standard pattern.

import type { Engine909, Voice } from "./engine909";

export type StepRow = { voice: Voice; steps: boolean[] };

export type SequencerState = {
  bpm: number;
  swing: number;     // 0..0.5 — 50% would be triplet
  playing: boolean;
  currentStep: number;
  numSteps: number;  // 16
};

const LOOKAHEAD_MS = 25;          // pump interval
const SCHEDULE_AHEAD = 0.1;        // seconds to schedule ahead
const VELOCITY_DEFAULT = 0.9;
const VELOCITY_ACCENT = 1;
const VELOCITY_GHOST = 0.55;

export class Sequencer {
  engine: Engine909;
  rows: StepRow[] = [];
  state: SequencerState = {
    bpm: 124,
    swing: 0,
    playing: false,
    currentStep: 0,
    numSteps: 16,
  };
  private nextNoteTime = 0;
  private pumpHandle: ReturnType<typeof setInterval> | null = null;
  private uiTimers: ReturnType<typeof setTimeout>[] = [];
  private onStep?: (step: number) => void;
  private onTrigger?: (voice: Voice, velocity: number, audioTime: number) => void;
  // External-sync state
  private externalSync = false;
  private extTickCount = 0;          // 24 ppq, 6 = one 16th note step
  private extLastTickAt = 0;         // performance.now() of previous tick
  private extBpmEMA = 0;             // exponential moving average of detected BPM
  private onBpmDetected?: (bpm: number) => void;

  constructor(engine: Engine909) {
    this.engine = engine;
  }

  setRows(rows: StepRow[]) {
    this.rows = rows;
  }

  setStep(voice: Voice, step: number, value: boolean) {
    const row = this.rows.find((r) => r.voice === voice);
    if (!row) return;
    row.steps[step] = value;
  }

  setBpm(bpm: number) {
    this.state.bpm = Math.max(40, Math.min(220, bpm));
  }

  setSwing(swing: number) {
    this.state.swing = Math.max(0, Math.min(0.5, swing));
  }

  onStepChange(cb: (step: number) => void) {
    this.onStep = cb;
  }

  onTriggerOut(cb: (voice: Voice, velocity: number, audioTime: number) => void) {
    this.onTrigger = cb;
  }

  onBpmDetectedFromClock(cb: (bpm: number) => void) {
    this.onBpmDetected = cb;
  }

  setExternalSync(enabled: boolean) {
    if (enabled === this.externalSync) return;
    this.externalSync = enabled;
    // Switching sync mode mid-play: stop cleanly so we don't have two clocks.
    if (this.state.playing) this.stop();
    this.extTickCount = 0;
    this.extLastTickAt = 0;
    this.extBpmEMA = 0;
  }

  isExternal() {
    return this.externalSync;
  }

  start() {
    if (this.state.playing) return;
    this.state.playing = true;
    this.state.currentStep = 0;
    // In external mode we don't drive the pump — ticks come from outside.
    if (this.externalSync) return;
    this.nextNoteTime = this.engine.ctx.currentTime + 0.05;
    this.pump();
    this.pumpHandle = setInterval(() => this.pump(), LOOKAHEAD_MS);
  }

  stop() {
    this.state.playing = false;
    if (this.pumpHandle) {
      clearInterval(this.pumpHandle);
      this.pumpHandle = null;
    }
    // Cancel any pending UI step-change callbacks so the playhead actually
    // clears instead of getting overwritten by a stale timer.
    this.uiTimers.forEach((t) => clearTimeout(t));
    this.uiTimers = [];
    this.state.currentStep = 0;
    this.extTickCount = 0;
    this.onStep?.(-1);
  }

  // ---- external-clock API ----
  // Called on each incoming 0xF8 MIDI clock pulse (24 per quarter note).
  externalTick() {
    if (!this.externalSync || !this.state.playing) {
      // Still update BPM estimate for display even when not playing
      this.updateBpmFromTick();
      return;
    }
    this.updateBpmFromTick();
    // 24 ppq → 6 ticks per 16th note
    if (this.extTickCount % 6 === 0) {
      this.fireStep(this.state.currentStep);
      this.state.currentStep = (this.state.currentStep + 1) % this.state.numSteps;
    }
    this.extTickCount++;
  }

  externalStart() {
    this.state.playing = true;
    this.state.currentStep = 0;
    this.extTickCount = 0;
  }

  // Used by the Link backend, which provides a continuous beat timeline.
  // We compute the 16th-note slot externally and just feed step indices.
  setStepFromExternal(step: number) {
    if (!this.externalSync) return;
    if (!this.state.playing) return;
    this.state.currentStep = step;
    this.fireStep(step);
  }
  externalContinue() {
    this.state.playing = true;
  }
  externalStop() {
    this.state.playing = false;
    this.state.currentStep = 0;
    this.extTickCount = 0;
    this.uiTimers.forEach((t) => clearTimeout(t));
    this.uiTimers = [];
    this.onStep?.(-1);
  }

  private updateBpmFromTick() {
    const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
    if (this.extLastTickAt > 0) {
      const dtMs = now - this.extLastTickAt;
      if (dtMs > 1 && dtMs < 200) {
        // 24 ppq → one quarter = 24 ticks; bpm = 60_000 / (dtMs * 24)
        const inst = 60000 / (dtMs * 24);
        this.extBpmEMA = this.extBpmEMA === 0 ? inst : (this.extBpmEMA * 0.85 + inst * 0.15);
        const rounded = Math.round(this.extBpmEMA);
        if (this.state.bpm !== rounded) {
          this.state.bpm = rounded;
          this.onBpmDetected?.(rounded);
        }
      }
    }
    this.extLastTickAt = now;
  }

  // Trigger every active voice on a given step (used by both internal pump
  // and external tick paths).
  private fireStep(step: number) {
    for (const row of this.rows) {
      if (row.steps[step]) {
        const vel = step % 4 === 0 ? VELOCITY_ACCENT
                  : step === 7 || step === 15 ? VELOCITY_GHOST
                  : VELOCITY_DEFAULT;
        this.engine.trigger(row.voice, this.engine.ctx.currentTime, vel);
        this.onTrigger?.(row.voice, vel, this.engine.ctx.currentTime);
      }
    }
    this.onStep?.(step);
  }

  // Calculate the time gap between two 16th notes, applying swing on
  // the off-beats (steps 1,3,5,... within each pair).
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
      // schedule all active rows on this step
      for (const row of this.rows) {
        if (row.steps[step]) {
          // accents on beats 1,5,9,13 (downbeats); ghost on 7,15 (e of 2/4)
          const vel = step % 4 === 0 ? VELOCITY_ACCENT
                    : step === 7 || step === 15 ? VELOCITY_GHOST
                    : VELOCITY_DEFAULT;
          this.engine.trigger(row.voice, this.nextNoteTime, vel);
          this.onTrigger?.(row.voice, vel, this.nextNoteTime);
        }
      }
      // notify UI shortly before the step actually plays. Track the timer so
      // stop() can cancel pending callbacks (otherwise the playhead lingers
      // because a late setTimeout fires after we've already stopped).
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
