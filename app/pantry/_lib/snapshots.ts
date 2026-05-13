import type { Item, Snapshot, SnapshotAction } from "./types";

const SNAPSHOTS_KEY = "pantry:snapshots:v1";
const MAX_SNAPSHOTS = 100;

export function loadSnapshots(): Snapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Snapshot[];
  } catch {
    return [];
  }
}

export function saveSnapshot(items: Item[], action: SnapshotAction): Snapshot {
  const snap: Snapshot = {
    id: `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    action,
    items: items.map(i => ({
      id: i.id,
      current: i.current,
      par: i.par,
      source: i.source,
    })),
  };
  const all = loadSnapshots();
  const updated = [snap, ...all].slice(0, MAX_SNAPSHOTS);
  try {
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
  } catch {}
  return snap;
}

export function clearSnapshots(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SNAPSHOTS_KEY);
  } catch {}
}
