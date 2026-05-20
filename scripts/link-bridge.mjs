#!/usr/bin/env node
// Link-to-WebSocket bridge.
//
// Why: Web browsers cannot do UDP multicast, which is how Ableton Link
// discovers peers on the local network. This script runs Link in node
// (where C++ bindings to libLink work) and exposes a JSON-over-WebSocket
// API to the browser. While this is running on the same WiFi as your
// Move / Live / iPad apps, the /lab/909 page in the browser can join the
// same Link group and sync to its tempo + downbeat.
//
// Two install paths — install ONE:
//
//   A) Direct (preferred):
//        npm install --no-save abletonlink ws
//      Requires Xcode command-line tools (xcode-select --install).
//      First-time build can take 30–60 seconds while node-gyp compiles.
//
//   B) Carabiner fallback (works if abletonlink fails to build):
//        Download a prebuilt binary from
//          https://github.com/Deep-Symmetry/carabiner/releases
//        Run it in another terminal — it speaks Link and exposes a TCP
//        API on localhost:17000. Then set CARABINER=1 below.
//
// Run:    node scripts/link-bridge.mjs
// Stop:   Ctrl-C
//
// Browser connects to ws://localhost:17001 (override with --port).

import { WebSocketServer } from "ws";
import net from "node:net";
import process from "node:process";

const PORT = Number(process.env.PORT ?? 17001);
const USE_CARABINER = process.env.CARABINER === "1";
const CARABINER_HOST = process.env.CARABINER_HOST ?? "127.0.0.1";
const CARABINER_PORT = Number(process.env.CARABINER_PORT ?? 17000);

let link = null;        // abletonlink instance (path A)
let carabinerSock = null; // tcp socket to Carabiner (path B)

// ---- LINK BACKEND ----
async function startBackend() {
  if (USE_CARABINER) {
    return startCarabiner();
  }
  try {
    const mod = await import("abletonlink");
    const AbletonLink = mod.default ?? mod;
    link = new AbletonLink();
    link.bpm = 120;
    link.quantum = 4;
    link.enable();
    link.enableStartStopSync(true);
    console.log(`[link-bridge] abletonlink active. bpm=${link.bpm} quantum=4`);
    // tick at ~60Hz, broadcast state
    return { type: "native", tick: () => broadcastState(getStateFromAbleton()) };
  } catch (err) {
    console.error("[link-bridge] could not load abletonlink:", err.message);
    console.error("[link-bridge] you have two options:");
    console.error("  1) npm install --no-save abletonlink ws    (requires Xcode CLT)");
    console.error("  2) run Carabiner and re-run with CARABINER=1 node scripts/link-bridge.mjs");
    process.exit(1);
  }
}

function getStateFromAbleton() {
  // abletonlink exposes synchronous getters
  const now = link.timeline;
  return {
    bpm: link.bpm,
    beat: typeof now === "object" ? now.beat : (link.beat ?? 0),
    phase: typeof now === "object" ? now.phase : (link.phase ?? 0),
    peers: link.numPeers ?? 0,
    playing: link.isPlaying ?? false,
    quantum: 4,
    backend: "abletonlink",
  };
}

// ---- CARABINER BACKEND ----
function startCarabiner() {
  carabinerSock = new net.Socket();
  let buf = "";
  let last = { bpm: 120, beat: 0, phase: 0, peers: 0, playing: false, quantum: 4, backend: "carabiner" };
  carabinerSock.connect(CARABINER_PORT, CARABINER_HOST, () => {
    console.log(`[link-bridge] connected to Carabiner ${CARABINER_HOST}:${CARABINER_PORT}`);
    // Ask Carabiner to poll status frequently
    carabinerSock.write("status\n");
    setInterval(() => carabinerSock.write("status\n"), 33);
  });
  carabinerSock.on("data", (chunk) => {
    buf += chunk.toString("utf8");
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      // Carabiner responses look like "status { :bpm 120.0 :start ... :beat 2.3 ... :peers 1 ...}"
      const m = line.match(/^(\w+)\s+\{(.+)\}/);
      if (!m) continue;
      const cmd = m[1];
      const body = m[2];
      const out = {};
      const re = /:(\w+)\s+([0-9.\-truefalse]+)/g;
      let mm;
      while ((mm = re.exec(body))) out[mm[1]] = mm[2];
      if (cmd === "status") {
        last = {
          bpm: Number(out.bpm ?? 120),
          beat: Number(out.beat ?? 0),
          phase: 0,
          peers: Number(out.peers ?? 0),
          playing: out.start === "true",
          quantum: 4,
          backend: "carabiner",
        };
        broadcastState(last);
      }
    }
  });
  carabinerSock.on("error", (e) => {
    console.error("[link-bridge] Carabiner connection error:", e.message);
    console.error("[link-bridge] is Carabiner running? download from https://github.com/Deep-Symmetry/carabiner/releases");
    process.exit(1);
  });
  return { type: "carabiner", tick: () => {} };
}

// ---- WEBSOCKET SERVER ----
const wss = new WebSocketServer({ port: PORT });
const clients = new Set();
wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`[link-bridge] client connected (${clients.size} total)`);
  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[link-bridge] client disconnected (${clients.size} total)`);
  });
  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "setBpm" && typeof msg.bpm === "number") {
        if (link) link.bpm = msg.bpm;
        else if (carabinerSock) carabinerSock.write(`bpm ${msg.bpm}\n`);
      }
      if (msg.type === "setPlaying" && typeof msg.playing === "boolean") {
        if (link) {
          if (msg.playing) link.startPlaying?.();
          else link.stopPlaying?.();
        }
      }
    } catch (e) {
      // ignore malformed
    }
  });
});

function broadcastState(state) {
  const json = JSON.stringify({ type: "state", ...state, t: Date.now() });
  for (const ws of clients) {
    try { ws.send(json); } catch (e) { /* socket closed */ }
  }
}

// ---- MAIN ----
const backend = await startBackend();
console.log(`[link-bridge] WebSocket on ws://localhost:${PORT}`);
console.log(`[link-bridge] backend: ${backend.type}`);
console.log(`[link-bridge] open http://localhost:3000/lab/909 and pick "LINK" in the sync toggle`);

if (backend.type === "native") {
  setInterval(backend.tick, 33); // ~30Hz state broadcast
}

process.on("SIGINT", () => {
  console.log("\n[link-bridge] shutting down");
  if (link) try { link.disable(); } catch (e) {}
  if (carabinerSock) try { carabinerSock.end(); } catch (e) {}
  wss.close();
  process.exit(0);
});
