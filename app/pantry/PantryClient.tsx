"use client";

import { useEffect, useState } from "react";
import type { Item, Snapshot, Source } from "./_lib/types";
import { SEED_ITEMS } from "./_lib/seed";
import { buildMotoMessage, buildWhatsAppHref, neededFromSource } from "./_lib/whatsapp";
import { clearSnapshots, loadSnapshots, saveSnapshot } from "./_lib/snapshots";

const ITEMS_KEY = "pantry:items:v3";
const PHONE_KEY = "pantry:phone:v1";

export function PantryClient() {
  const [items, setItems] = useState<Item[]>(SEED_ITEMS);
  const [phone, setPhone] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recent, setRecent] = useState<Snapshot[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ITEMS_KEY);
      if (raw) setItems(JSON.parse(raw) as Item[]);
      setPhone(localStorage.getItem(PHONE_KEY) ?? "");
      setRecent(loadSnapshots().slice(0, 10));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(PHONE_KEY, phone);
  }, [phone, hydrated]);

  // Auto-snapshot the stock check 5s after the last item change.
  // Send + copy clicks log their own explicit snapshots below.
  useEffect(() => {
    if (!hydrated) return;
    const handle = setTimeout(() => {
      saveSnapshot(items, "check");
      setRecent(loadSnapshots().slice(0, 10));
    }, 5000);
    return () => clearTimeout(handle);
  }, [items, hydrated]);

  const setCurrent = (id: string, val: number) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, current: Math.max(0, val) } : i)));

  const setPar = (id: string, val: number) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, par: Math.max(0, val) } : i)));

  const setSource = (id: string, src: Source) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, source: src } : i)));

  const removeItem = (id: string) =>
    setItems(prev => prev.filter(i => i.id !== id));

  const addItem = (n_es: string, n_en: string, emoji: string, par: number, unit: string, source: Source) => {
    const base = n_es.toLowerCase().replace(/[^a-záéíóúñ ]/g, "").trim().replace(/\s+/g, "-");
    const id = `${base || "item"}-${Math.random().toString(36).slice(2, 6)}`;
    setItems(prev => [...prev, { id, emoji: emoji || undefined, name_es: n_es, name_en: n_en, par, current: par, unit, source }]);
  };

  const resetAll = () => {
    if (confirm("reset everything to defaults? this wipes your saved list.")) {
      setItems(SEED_ITEMS);
    }
  };

  const motoMessage = buildMotoMessage(items);
  const sendHref = buildWhatsAppHref(phone, motoMessage);
  const motoNeeded = neededFromSource(items, "moto");
  const storeNeeded = neededFromSource(items, "store");
  const totalNeeded = motoNeeded.length + storeNeeded.length;

  return (
    <div className="bg-paper text-ink min-h-screen">
      <header className="px-5 sm:px-8 pt-12 pb-8 border-b-2 border-ink">
        <div className="font-mono text-[11px] tracking-[.14em] uppercase text-ink-3 mb-2">
          la despensa · thespacepit
        </div>
        <h1
          className="font-display font-bold uppercase m-0"
          style={{ fontSize: "clamp(56px, 11vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
        >
          what we got
        </h1>
        <p className="font-serif italic text-[20px] mt-3 max-w-[680px] text-ink-3">
          tap through and update what&apos;s running low. when you&apos;re done, one tap sends the moto.
        </p>
        {hydrated && (
          <div className="mt-5 inline-flex items-center gap-3 font-mono text-[11px] tracking-[.14em] uppercase">
            <span className="bg-ink text-paper px-2 py-1">{totalNeeded} need restock</span>
            <span className="text-ink-3">/ {items.length} items tracked</span>
          </div>
        )}
      </header>

      <main className="px-5 sm:px-8 py-10 max-w-[1400px] mx-auto">
        <div className="font-mono text-[11px] tracking-[.14em] uppercase text-ink-3 mb-4">
          stock check
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onSetCurrent={(v) => setCurrent(item.id, v)}
            />
          ))}
        </div>

        <section className="mt-16 pt-10 border-t-2 border-ink">
          <h2 className="font-display font-bold uppercase text-4xl sm:text-5xl mb-1 leading-none">
            shopping lists
          </h2>
          <p className="font-serif italic text-[18px] text-ink-3 mt-2 mb-8">
            auto-generated from whatever&apos;s below par above.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* MOTO */}
            <div
              className="border-2 border-ink p-5 bg-paper"
              style={{ boxShadow: "6px 6px 0 var(--color-ink)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase">
                  moto · whatsapp
                </div>
                <span className="font-mono text-[11px] tracking-[.14em] uppercase bg-collect text-paper px-2 py-1">
                  {motoNeeded.length}
                </span>
              </div>
              <pre className="font-mono text-[14px] whitespace-pre-wrap leading-relaxed bg-paper-2 p-4 border border-ink/30 min-h-[160px]">
                {motoMessage}
              </pre>
              <div className="mt-5 flex flex-wrap gap-3">
                {sendHref ? (
                  <a
                    href={sendHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      saveSnapshot(items, "moto_sent");
                      setRecent(loadSnapshots().slice(0, 10));
                    }}
                    className="inline-flex items-center justify-center bg-ink text-paper px-5 py-3 font-mono text-[12px] tracking-[.14em] uppercase hover:bg-collect transition-colors"
                    style={{ boxShadow: "3px 3px 0 var(--color-lamp)" }}
                  >
                    send to mercado →
                  </a>
                ) : (
                  <button
                    onClick={() => setShowSettings(true)}
                    className="inline-flex items-center justify-center border-2 border-ink/40 text-ink-3 px-5 py-3 font-mono text-[12px] tracking-[.14em] uppercase hover:border-ink hover:text-ink transition-colors"
                  >
                    add mercado phone →
                  </button>
                )}
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(motoMessage);
                    saveSnapshot(items, "moto_copied");
                    setRecent(loadSnapshots().slice(0, 10));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="inline-flex items-center justify-center border-2 border-ink px-5 py-3 font-mono text-[12px] tracking-[.14em] uppercase hover:bg-ink hover:text-paper transition-colors"
                >
                  {copied ? "copied ✓" : "copy"}
                </button>
              </div>
            </div>

            {/* STORE */}
            <div
              className="border-2 border-ink p-5 bg-paper-2"
              style={{ boxShadow: "6px 6px 0 var(--color-ink)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase">
                  store · take this with you
                </div>
                <span className="font-mono text-[11px] tracking-[.14em] uppercase bg-ink text-paper px-2 py-1">
                  {storeNeeded.length}
                </span>
              </div>
              {storeNeeded.length === 0 ? (
                <p className="font-serif italic text-[18px] text-ink-3 min-h-[160px] flex items-center">
                  nothing to grab this run.
                </p>
              ) : (
                <ul className="space-y-2 min-h-[160px]">
                  {storeNeeded.map(i => (
                    <li key={i.id} className="font-mono text-[14px] flex justify-between border-b border-ink/15 pb-2">
                      <span>
                        {i.name_es} <span className="text-ink-3">/ {i.name_en}</span>
                      </span>
                      <span className="text-ink-3 tabular-nums">
                        {i.par - i.current} {i.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="mt-16 pt-8 border-t-2 border-ink">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="font-mono text-[11px] tracking-[.14em] uppercase text-ink-3 hover:text-ink transition-colors"
          >
            {showSettings ? "▼" : "▶"} settings · manage par levels
          </button>

          {showSettings && (
            <div className="mt-6 space-y-10">
              <div>
                <label className="block font-mono text-[11px] tracking-[.14em] uppercase mb-2">
                  mercado whatsapp number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+57 300 000 0000"
                  className="w-full max-w-md border-2 border-ink px-3 py-2 font-mono bg-paper focus:outline-none focus:bg-lamp/10"
                />
                <p className="font-mono text-[11px] text-ink-3 mt-2 max-w-md">
                  international format. saved in your browser only — never leaves the device.
                </p>
              </div>

              <div>
                <div className="font-mono text-[11px] tracking-[.14em] uppercase mb-3">
                  par levels — what we want on hand
                </div>
                <div className="space-y-2">
                  {items.map(item => (
                    <ParRow
                      key={item.id}
                      item={item}
                      onSetPar={(v) => setPar(item.id, v)}
                      onSetSource={(s) => setSource(item.id, s)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ))}
                </div>
                <AddItemForm onAdd={addItem} />
              </div>

              <div>
                <div className="font-mono text-[11px] tracking-[.14em] uppercase mb-3">
                  recent activity
                </div>
                {recent.length === 0 ? (
                  <p className="font-mono text-[11px] text-ink-3">
                    no activity yet. logs start once you tap +/− on an item.
                  </p>
                ) : (
                  <ul className="space-y-1 max-w-md">
                    {recent.map((s) => (
                      <li
                        key={s.id}
                        className="font-mono text-[11px] text-ink-3 flex justify-between border-b border-ink/10 pb-1.5"
                      >
                        <span>{formatRelativeTime(s.at)}</span>
                        <span className="uppercase tracking-[.1em]">
                          {s.action.replace("_", " ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {recent.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("clear all activity history?")) {
                        clearSnapshots();
                        setRecent([]);
                      }
                    }}
                    className="mt-3 font-mono text-[10px] tracking-[.14em] uppercase text-redline hover:underline"
                  >
                    clear history
                  </button>
                )}
              </div>

              <div>
                <button
                  onClick={resetAll}
                  className="font-mono text-[11px] tracking-[.14em] uppercase text-redline hover:underline"
                >
                  reset list to defaults
                </button>
              </div>
            </div>
          )}
        </section>

        <footer className="mt-16 pt-8 pb-12 border-t border-ink/20 font-mono text-[11px] tracking-[.14em] uppercase text-ink-3">
          thespacepit · la despensa · v0
        </footer>
      </main>
    </div>
  );
}

function ItemCard({ item, onSetCurrent }: { item: Item; onSetCurrent: (v: number) => void }) {
  const needed = item.current < item.par;
  const empty = item.current === 0;
  return (
    <div
      className={`border-2 border-ink p-4 transition-colors ${empty ? "bg-lamp/40" : needed ? "bg-lamp/15" : "bg-paper-2"}`}
      style={{ boxShadow: "3px 3px 0 var(--color-ink)" }}
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {item.emoji && (
            <div className="text-[40px] leading-none shrink-0 select-none">
              {item.emoji}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div
              className="font-display font-semibold uppercase leading-tight truncate"
              style={{ fontSize: "26px", letterSpacing: "-0.01em" }}
            >
              {item.name_es}
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[.1em] text-ink-3 mt-0.5 truncate">
              {item.name_en}
            </div>
          </div>
        </div>
        <span
          className={`font-mono text-[10px] tracking-[.14em] uppercase px-2 py-1 border border-ink shrink-0 ${
            item.source === "moto" ? "bg-collect text-paper" : "bg-paper"
          }`}
        >
          {item.source}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSetCurrent(item.current - 1)}
            className="w-11 h-11 border-2 border-ink font-display font-bold text-2xl hover:bg-ink hover:text-paper transition-colors active:scale-95"
            aria-label="decrease"
          >
            −
          </button>
          <div
            className="font-display font-bold tabular-nums min-w-[2ch] text-center"
            style={{ fontSize: "42px", lineHeight: 1 }}
          >
            {item.current}
          </div>
          <button
            onClick={() => onSetCurrent(item.current + 1)}
            className="w-11 h-11 border-2 border-ink font-display font-bold text-2xl hover:bg-ink hover:text-paper transition-colors active:scale-95"
            aria-label="increase"
          >
            +
          </button>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-[.1em] text-ink-3">par</div>
          <div className="font-mono text-[13px] text-ink-3 tabular-nums">
            {item.par} {item.unit}
          </div>
        </div>
      </div>

      {needed && (
        <div className="mt-3 pt-3 border-t border-ink/20 font-mono text-[11px] uppercase tracking-[.1em] text-ink-3">
          need {item.par - item.current} {item.unit}
        </div>
      )}
    </div>
  );
}

function ParRow({
  item,
  onSetPar,
  onSetSource,
  onRemove,
}: {
  item: Item;
  onSetPar: (v: number) => void;
  onSetSource: (s: Source) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 border border-ink/30 p-3 bg-paper flex-wrap">
      <div className="flex-1 min-w-[140px] flex items-center gap-2">
        {item.emoji && (
          <span className="text-[20px] leading-none shrink-0 select-none">
            {item.emoji}
          </span>
        )}
        <div className="font-mono text-[14px] truncate min-w-0">
          {item.name_es} <span className="text-ink-3">/ {item.name_en}</span>
        </div>
      </div>
      <input
        type="number"
        value={item.par}
        onChange={(e) => onSetPar(Number(e.target.value) || 0)}
        className="w-16 border border-ink px-2 py-1 font-mono text-right bg-paper"
        min={0}
        aria-label="par"
      />
      <span className="font-mono text-[11px] text-ink-3 w-14 shrink-0">{item.unit}</span>
      <select
        value={item.source}
        onChange={(e) => onSetSource(e.target.value as Source)}
        className="border border-ink px-2 py-1 font-mono text-[11px] uppercase tracking-[.1em] bg-paper"
      >
        <option value="moto">moto</option>
        <option value="store">store</option>
      </select>
      <button
        onClick={onRemove}
        className="border border-redline text-redline px-2 py-1 font-mono text-[11px] uppercase tracking-[.1em] hover:bg-redline hover:text-paper transition-colors"
        aria-label="remove"
      >
        ×
      </button>
    </div>
  );
}

function AddItemForm({
  onAdd,
}: {
  onAdd: (n_es: string, n_en: string, emoji: string, par: number, unit: string, source: Source) => void;
}) {
  const [emoji, setEmoji] = useState("");
  const [name_es, setNameEs] = useState("");
  const [name_en, setNameEn] = useState("");
  const [par, setPar] = useState(1);
  const [unit, setUnit] = useState("u");
  const [source, setSource] = useState<Source>("moto");

  const submit = () => {
    if (!name_es.trim() || !name_en.trim()) return;
    onAdd(name_es.trim(), name_en.trim(), emoji.trim(), par, unit.trim() || "u", source);
    setEmoji("");
    setNameEs("");
    setNameEn("");
    setPar(1);
    setUnit("u");
    setSource("moto");
  };

  return (
    <div className="mt-4 p-4 border-2 border-dashed border-ink/40 bg-paper-2/40">
      <div className="font-mono text-[11px] tracking-[.14em] uppercase mb-3 text-ink-3">
        add item
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="🥑"
          className="w-14 border border-ink px-2 py-1 font-mono bg-paper text-center"
          aria-label="emoji"
        />
        <input
          value={name_es}
          onChange={(e) => setNameEs(e.target.value)}
          placeholder="español"
          className="flex-1 min-w-[120px] border border-ink px-2 py-1 font-mono bg-paper"
        />
        <input
          value={name_en}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder="english"
          className="flex-1 min-w-[120px] border border-ink px-2 py-1 font-mono bg-paper"
        />
        <input
          type="number"
          value={par}
          onChange={(e) => setPar(Number(e.target.value) || 0)}
          className="w-16 border border-ink px-2 py-1 font-mono text-right bg-paper"
          min={0}
          aria-label="par"
        />
        <input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="u"
          className="w-16 border border-ink px-2 py-1 font-mono bg-paper"
          aria-label="unit"
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as Source)}
          className="border border-ink px-2 py-1 font-mono text-[11px] uppercase bg-paper"
        >
          <option value="moto">moto</option>
          <option value="store">store</option>
        </select>
        <button
          onClick={submit}
          className="border-2 border-ink bg-ink text-paper px-3 py-1 font-mono text-[11px] uppercase tracking-[.14em] hover:bg-collect transition-colors"
        >
          add
        </button>
      </div>
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
