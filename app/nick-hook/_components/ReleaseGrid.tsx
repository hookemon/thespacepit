import Link from "next/link";
import { getCatalogForArtist, type CatalogItem } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";

const ROLE_COLORS: Record<CatalogItem["roleSet"], string> = {
  label:      "#0E4B3A",
  production: "#E83A1C",
  mix:        "#F2B705",
  remix:      "#C9B9E8",
  appearance: "#F4EFE6",
  djmix:      "#65C7F7",
};

// Cleanup gate — drop any entry with an invalid/blank title before render.
function isValidTitle(t: string | undefined): t is string {
  if (!t) return false;
  const cleaned = t.trim().replace(/[^A-Za-z0-9]/g, "");
  return cleaned.length >= 2;
}

export async function NHReleaseGrid() {
  const all = await getCatalogForArtist("nick-hook");

  // Sort newest first; drop garbage titles entirely.
  const sorted = all
    .filter((r) => isValidTitle(r.title))
    .sort((a, b) => {
      const ad = a.releaseDate ?? "";
      const bd = b.releaseDate ?? "";
      const ya = a.year ?? 0;
      const yb = b.year ?? 0;
      if (yb !== ya) return yb - ya;
      if (ad && bd) return bd.localeCompare(ad);
      return (b.catalogNumber ?? "").localeCompare(a.catalogNumber ?? "");
    });

  if (sorted.length === 0) {
    return (
      <section id="music" className="px-5 sm:px-8 py-16 bg-ink text-paper">
        <div className="font-mono text-[11px] tracking-[.12em] uppercase text-on-dark">
          PLACEHOLDER · POPULATE IN /STUDIO →
        </div>
      </section>
    );
  }

  return (
    <section id="music" className="px-5 sm:px-8 py-16 bg-ink text-paper">
      <div className="flex justify-between items-end mb-8 border-b-2 border-paper pb-3 flex-wrap gap-6">
        <div>
          <div className="font-mono text-[11px] tracking-[.12em] uppercase text-redline">
            THE CATALOG · CHRONOLOGICAL
          </div>
          <h2
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
          >
            everything
          </h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link
            href="/catalog"
            className="group block text-right no-underline text-paper hover:text-redline transition-colors"
          >
            <div className="font-mono text-[10px] tracking-[.16em] uppercase text-on-dark group-hover:text-redline transition-colors">
              calm + collect · other roles
            </div>
            <div
              className="font-display font-bold uppercase mt-1 leading-none flex items-center justify-end gap-2"
              style={{ fontSize: "clamp(18px, 2vw, 24px)", letterSpacing: "-0.01em" }}
            >
              the full catalog (filterable)
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1.5">→</span>
            </div>
          </Link>
          <Link
            href="/releases"
            className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark hover:text-redline transition-colors"
          >
            or just see the label catalogue →
          </Link>
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
        {sorted.map((r) => {
          const cover = r.cover ? urlFor(r.cover).width(420).height(420).fit("crop").url() : null;
          const artistText = r.artists.map((a) => a.name).join(" · ");
          const color = ROLE_COLORS[r.roleSet];
          const dateLabel = r.releaseDate
            ? new Date(r.releaseDate + "T00:00:00").getFullYear()
            : r.year ?? "";
          return (
            <Link
              key={r._id}
              href={`/releases/${r.slug}`}
              className="group bg-ink border border-paper p-2.5 transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0_#E83A1C] no-underline text-paper"
            >
              <div
                className="aspect-square border border-paper mb-2 flex items-center justify-center relative overflow-hidden"
                style={{ background: r.coverColor ?? "#1C1A17" }}
              >
                {cover ? (
                  <img src={cover} alt={r.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span
                    className="font-display font-bold uppercase text-center px-2"
                    style={{ fontSize: 18, transform: "rotate(-4deg)", letterSpacing: "-0.02em", color: r.coverColor === "#F4EFE6" || r.coverColor === "#F2B705" ? "#0B0B0B" : "#F4EFE6" }}
                  >
                    {r.title}
                  </span>
                )}
              </div>
              <div className="font-display font-semibold text-[15px] uppercase tracking-[-0.005em] leading-tight line-clamp-2">{r.title}</div>
              <div className="font-mono text-[9px] tracking-[.08em] uppercase text-on-dark mt-1 line-clamp-1">{artistText}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-[9px] tracking-[.14em] uppercase line-clamp-1 flex-1" style={{ color }}>
                  {r.roleLabel}
                </span>
                {dateLabel && <span className="font-mono text-[9px] text-on-dark tabular-nums shrink-0">{dateLabel}</span>}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-7 flex justify-end">
        <Link
          href="/catalog"
          className="font-display font-semibold text-[15px] tracking-[.04em] uppercase px-5 py-3 border border-paper bg-transparent text-paper hover:bg-paper hover:text-ink transition-colors no-underline"
        >
          filter / sort in the full catalog →
        </Link>
      </div>
    </section>
  );
}
