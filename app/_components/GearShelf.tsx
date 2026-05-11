import Link from "next/link";
import { CATEGORIES } from "../_lib/gear-data";
import { getGear } from "../_lib/sanity-queries";

// Homepage teaser — short list of categories with counts, click through to the
// full /gear page. Reads live from Sanity.
export async function GearShelf() {
  const items = await getGear();

  // Counts by category.
  const counts = new Map<string, number>();
  for (const g of items) counts.set(g.category, (counts.get(g.category) ?? 0) + 1);
  const populated = CATEGORIES.filter((c) => (counts.get(c.key) ?? 0) > 0);

  return (
    <section id="gear" className="px-5 sm:px-8 py-16 bg-ink text-paper">
      <div className="flex items-end justify-between mb-7 border-b-2 border-paper pb-2.5 flex-wrap gap-3">
        <div>
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp">
            THE SHELF
          </div>
          <h2
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(44px, 6vw, 72px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
          >
            the gear log
          </h2>
        </div>
        <Link
          href="/gear"
          className="group block text-right no-underline text-paper hover:text-lamp transition-colors"
        >
          <div className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 group-hover:text-lamp transition-colors">
            pick a category to drill in
          </div>
          <div
            className="font-display font-bold uppercase mt-1 leading-none flex items-center justify-end gap-2"
            style={{ fontSize: "clamp(18px, 2vw, 26px)", letterSpacing: "-0.01em" }}
          >
            see the full shelf
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1.5">→</span>
          </div>
        </Link>
      </div>

      <p className="font-serif italic text-[20px] max-w-[640px] mb-8">
        never turn anything off. if you pull up and something isn&apos;t patched in, patch it in.
      </p>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {populated.map((c) => {
          const n = counts.get(c.key) ?? 0;
          return (
            <Link
              key={c.key}
              href={`/gear?cat=${c.key}`}
              className="group block border border-paper p-4 bg-ink-2 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0_#F2B705] transition-transform duration-150 no-underline text-paper"
            >
              <div className="font-mono text-[10px] tracking-[.14em] uppercase text-lamp">
                {n} unit{n === 1 ? "" : "s"}
              </div>
              <div className="font-display font-semibold text-[22px] uppercase tracking-[-0.005em] leading-tight mt-1">
                {c.label}
              </div>
              {c.blurb && (
                <div className="font-serif italic text-[14px] text-paper-2 mt-1">{c.blurb}</div>
              )}
              <div className="font-mono text-[10px] tracking-[.12em] uppercase mt-3 text-paper-2 group-hover:text-lamp transition-colors flex items-center gap-1">
                browse <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
