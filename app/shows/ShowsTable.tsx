"use client";

import { useMemo, useState } from "react";
import { SHOWS, type Show } from "../_lib/shows";

const ERAS = Array.from(new Set(SHOWS.map((s) => s.era))).sort();

function fmtDate(d: string | null, year: number | null): string {
  if (!d) return year ? String(year) : "—";
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[2]}.${m[3]}.${m[1].slice(2)}`;
  const ym = d.match(/^(\d{4})-(\d{2})$/);
  if (ym) return `${ym[2]}.${ym[1].slice(2)}`;
  return d;
}

export function ShowsTable() {
  const [filterEra, setFilterEra] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SHOWS.filter((s) => {
      if (filterEra !== "all" && s.era !== filterEra) return false;
      if (!q) return true;
      const hay = `${s.venue ?? ""} ${s.city ?? ""} ${s.country ?? ""} ${s.support ?? ""} ${s.notes ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [filterEra, search]);

  return (
    <>
      <div className="px-8 py-6 border-b border-paper/30 sticky top-0 z-[5] bg-ink/85 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="search venue · city · support…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border border-paper text-paper px-3 py-2 font-mono text-[12px] tracking-[.05em] placeholder:text-on-dark/60 focus:outline-none focus:border-redline focus:bg-ink-2 min-w-[220px]"
          />
          <button
            onClick={() => setFilterEra("all")}
            className={`font-mono text-[10px] tracking-[.12em] uppercase px-3 py-1.5 border border-paper rounded-full transition-colors ${filterEra === "all" ? "bg-paper text-ink" : "hover:bg-paper hover:text-ink"}`}
          >
            all
          </button>
          {ERAS.map((era) => (
            <button
              key={era}
              onClick={() => setFilterEra(era)}
              className={`font-mono text-[10px] tracking-[.12em] uppercase px-3 py-1.5 border border-paper rounded-full transition-colors ${filterEra === era ? "bg-paper text-ink" : "hover:bg-paper hover:text-ink"}`}
            >
              {era.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <section className="px-8 py-8">
        {filtered.length === 0 ? (
          <p className="font-mono text-[12px] tracking-[.08em] uppercase text-on-dark">no shows match that filter.</p>
        ) : (
          <div className="grid gap-0 font-mono text-[12px]">
            {filtered.map((s, i) => (
              <ShowRow key={i} show={s} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ShowRow({ show }: { show: Show }) {
  return (
    <div
      className="grid gap-3 py-3 border-b border-ink-3 items-baseline"
      style={{ gridTemplateColumns: "90px 1fr 1.4fr 1fr 1.6fr" }}
    >
      <span className="tabular-nums text-on-dark">{fmtDate(show.date, show.year)}</span>
      <span className="font-display text-[16px] uppercase font-semibold tracking-[-0.005em] text-paper">
        {show.city ?? "—"}
        {show.country && (
          <span className="text-on-dark text-[10px] tracking-[.1em] ml-2">{show.country}</span>
        )}
      </span>
      <span className="text-paper">{show.venue ?? ""}</span>
      <span className="text-on-dark text-[11px] uppercase tracking-[.06em] truncate" title={show.support ?? ""}>{show.support ?? ""}</span>
      <span className="text-on-dark text-[11px] truncate" title={show.notes ?? ""}>{show.notes ?? ""}</span>
    </div>
  );
}
