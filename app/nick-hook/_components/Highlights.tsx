import { getHighlights, type HighlightItem } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";

/**
 * Career highlights — three columns (performances · tours · experiences),
 * each card pulled from a `highlight` doc in Sanity. Cards BLOOM as more
 * fields get filled out:
 *
 *   · just a name  → minimal text row (matches the old EPK look)
 *   · + year(s)    → year stamp under the name
 *   · + city       → city line
 *   · + photo      → 1:1 image hero on the card
 *   · + note       → 2-line story below
 *   · + url        → whole card becomes clickable
 *
 * To edit: open Sanity Studio · "Career highlight" · pick one · fill in
 * what you want. New highlights show up automatically. Hide one without
 * deleting via the "Hide from page" toggle.
 */

export async function NHHighlights() {
  const items = await getHighlights();
  const performances = items.filter((i) => i.kind === "performance");
  const tours        = items.filter((i) => i.kind === "tour");
  const experiences  = items.filter((i) => i.kind === "experience");

  return (
    <section id="highlights" className="px-5 sm:px-8 py-16 bg-ink text-paper border-y border-paper/20">
      <div className="font-mono text-[11px] tracking-[.12em] uppercase text-redline mb-2">CAREER · HIGHLIGHTS</div>
      <h2
        className="font-display font-bold uppercase m-0 mb-10"
        style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
      >
        highlights
      </h2>
      <div className="grid gap-10 md:grid-cols-3">
        <Column label="performances" items={performances} />
        <Column label="tours"        items={tours} />
        <Column label="experiences"  items={experiences} />
      </div>
    </section>
  );
}

function Column({ label, items }: { label: string; items: HighlightItem[] }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[.16em] uppercase text-redline border-b border-paper pb-2 mb-3">
        {label}
      </div>
      <ul className="grid gap-3 list-none p-0 m-0">
        {items.map((it) => (
          <li key={it._id}>
            <HighlightCard it={it} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatYears(it: HighlightItem): string | null {
  if (it.years && it.years.length > 0) {
    // "2012 · 2014 · 2018" — or short "12 · 14 · 18" when 4+ entries
    return it.years.length >= 4
      ? it.years.map((y) => String(y).slice(2)).join(" · ")
      : it.years.join(" · ");
  }
  if (it.yearStart && it.yearEnd && it.yearStart !== it.yearEnd) return `${it.yearStart}–${it.yearEnd}`;
  if (it.yearStart) return String(it.yearStart);
  return null;
}

function HighlightCard({ it }: { it: HighlightItem }) {
  const yearLabel = formatYears(it);
  const hasMedia  = !!it.image;
  const hasStory  = !!it.note;
  const cityLine  = [it.venue, it.city].filter(Boolean).join(" · ");
  const imgUrl    = it.image ? urlFor(it.image).width(640).height(640).fit("crop").url() : null;

  const inner = (
    <div className={`grid gap-3 ${hasMedia ? "" : ""}`}>
      {imgUrl && (
        <div className="aspect-square border border-paper overflow-hidden bg-ink-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt={it.name} loading="lazy" className="w-full h-full object-cover" />
        </div>
      )}
      <div>
        <div
          className="font-display font-semibold uppercase tracking-[-0.005em] leading-tight"
          style={{ fontSize: "clamp(18px, 2vw, 22px)" }}
        >
          {it.name}
        </div>
        {(yearLabel || cityLine) && (
          <div className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 mt-1.5 flex flex-wrap gap-x-2">
            {yearLabel && <span>{yearLabel}</span>}
            {yearLabel && cityLine && <span aria-hidden>·</span>}
            {cityLine && <span>{cityLine.toLowerCase()}</span>}
          </div>
        )}
        {hasStory && (
          <p className="font-serif italic text-[14px] leading-snug text-paper-2 mt-2 line-clamp-3">
            {it.note}
          </p>
        )}
        {it.url && (
          <div className="font-mono text-[10px] tracking-[.14em] uppercase text-redline mt-2">
            read more ↗
          </div>
        )}
      </div>
    </div>
  );

  if (it.url) {
    return (
      <a
        href={it.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline text-paper p-3 -mx-3 hover:bg-paper/5 transition-colors"
      >
        {inner}
      </a>
    );
  }
  return <div className={hasMedia || hasStory ? "p-3 -mx-3" : ""}>{inner}</div>;
}
