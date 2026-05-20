// Browser-side client for the Link-to-WebSocket bridge (see
// scripts/link-bridge.mjs). The bridge runs locally, talks Link over the
// network, and forwards state to the browser via WS. We subscribe and
// derive sequencer ticks from beat/phase updates.
//
// Status:
//   "disconnected" — bridge not reachable (or not started)
//   "connecting"   — opened socket, waiting for first message
//   "connected"    — receiving state
//
// The client is tolerant of the bridge not running — it just stays in
// disconnected and retries with backoff. No crash, no noisy errors.

export type LinkState = {
  bpm: number;
  beat: number;       // continuous beat position from Link
  phase: number;      // [0, quantum) — position within the bar
  peers: number;
  playing: boolean;
  quantum: number;
  backend?: string;
};

export type LinkStatus = "disconnected" | "connecting" | "connected";

export type LinkClientEvents = {
  onStatus?: (status: LinkStatus) => void;
  onState?: (state: LinkState) => void;
};

const DEFAULT_PORT = 17001;

export class LinkClient {
  private ws: WebSocket | null = null;
  private url: string;
  private status: LinkStatus = "disconnected";
  private events: LinkClientEvents;
  private retryDelay = 1000;
  private retryHandle: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  constructor(events: LinkClientEvents = {}, port = DEFAULT_PORT) {
    this.url = `ws://localhost:${port}`;
    this.events = events;
  }

  connect() {
    if (this.closed) return;
    if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) return;
    this.setStatus("connecting");
    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      this.scheduleRetry();
      return;
    }
    this.ws.onopen = () => {
      this.retryDelay = 1000;
    };
    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(typeof e.data === "string" ? e.data : "");
        if (msg.type === "state") {
          if (this.status !== "connected") this.setStatus("connected");
          this.events.onState?.({
            bpm: msg.bpm,
            beat: msg.beat,
            phase: msg.phase,
            peers: msg.peers,
            playing: msg.playing,
            quantum: msg.quantum,
            backend: msg.backend,
          });
        }
      } catch (e) { /* ignore */ }
    };
    this.ws.onclose = () => {
      this.setStatus("disconnected");
      this.scheduleRetry();
    };
    this.ws.onerror = () => {
      // onclose will run after this; let it handle reconnect
    };
  }

  close() {
    this.closed = true;
    if (this.retryHandle) clearTimeout(this.retryHandle);
    this.retryHandle = null;
    try { this.ws?.close(); } catch (e) {}
    this.ws = null;
  }

  setBpm(bpm: number) {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify({ type: "setBpm", bpm }));
    }
  }
  setPlaying(playing: boolean) {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify({ type: "setPlaying", playing }));
    }
  }

  private setStatus(status: LinkStatus) {
    if (status === this.status) return;
    this.status = status;
    this.events.onStatus?.(status);
  }

  private scheduleRetry() {
    if (this.closed) return;
    if (this.retryHandle) return;
    const delay = this.retryDelay;
    this.retryHandle = setTimeout(() => {
      this.retryHandle = null;
      this.retryDelay = Math.min(this.retryDelay * 1.6, 8000);
      this.connect();
    }, delay);
  }
}

// Convert a stream of Link beat positions into discrete 16th-note step
// triggers. Each call to update() looks at the current beat, computes which
// 16th-note slot we're in (relative to the start of a 4-beat bar), and fires
// the callback whenever that slot changes.
//
// This is the core bridge between Link's continuous timeline and our
// sequencer's discrete 16-step grid.
export class LinkStepDriver {
  private lastSlot = -1;
  private onStep: (step: number) => void;
  private startOffset = 0;

  constructor(onStep: (step: number) => void) {
    this.onStep = onStep;
  }

  reset(currentBeat: number) {
    // align so the next downbeat == step 0
    this.startOffset = Math.ceil(currentBeat);
    this.lastSlot = -1;
  }

  // beat = continuous beat position from Link (1 unit = quarter note).
  // quantum = bar length in beats (typically 4).
  update(beat: number, quantum: number) {
    // 4 sixteenths per beat → 16 sixteenths per bar (when quantum=4)
    const sixteenthsPerBar = quantum * 4;
    const elapsed = beat - this.startOffset;
    const slot = ((Math.floor(elapsed * 4) % sixteenthsPerBar) + sixteenthsPerBar) % sixteenthsPerBar;
    if (slot !== this.lastSlot) {
      this.lastSlot = slot;
      this.onStep(slot);
    }
  }
}
