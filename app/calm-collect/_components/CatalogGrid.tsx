import Link from "next/link";
import { getReleases } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";

const COLS = "56px 100px 1.5fr 1.5fr 90px 60px 100px";

const FALLBACK = [
  { _id: "f1", slug: "la-burbuja", catalogNumber: "C+C–052", title: "LA BURBUJA", artists: [{ name: "Nick Hook · Quazzy", slug: "nick-hook" }], format: '7"', year: 2022, cover: null },
  { _id: "f2", slug: "geraldina", catalogNumber: "C+C–048", title: "GERALDINA", artists: [{ name: "Geraldina", slug: "geraldina" }], format: "LP", year: 2021, cover: null },
  { _id: "f3", slug: "camo-ufos", catalogNumber: "C+C–044", title: "CAMO UFOS", artists: [{ name: "Camo UFOs", slug: "camo-ufos" }], format: "EP", year: 2021, cover: null },
  { _id: "f4", slug: "jungle-juice-v1", catalogNumber: "C+C–040", title: "JUNGLE JUICE V.1", artists: [{ name: "Taso · Nick Hook", slug: "nick-hook" }], format: "EP", year: 2020, cover: null },
];

export async function CCCatalogGrid() {
  const releases = await getReleases(60);
  const list = releases.length > 0 ? releases : FALLBACK;
  const isEmpty = releases.length === 0;

  return (
    <section id="releases" className="px-5 sm:px-8 py-16 bg-paper text-ink">
      <div className="flex justify-between items-end mb-7 border-b-2 border-ink pb-2.5 flex-wrap gap-3">
        <div>
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect">THE CATALOGUE</div>
          <h2
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(44px, 6vw, 72px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
          >
            releases
          </h2>
        </div>
        {isEmpty && (
          <a href="/studio" className="font-mono text-[10px] tracking-[.14em] uppercase text-mute hover:text-ink no-underline">
            ↓ placeholder data — add real releases in /studio
          </a>
        )}
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div
            className="grid gap-3 py-2.5 border-b border-ink font-mono text-[10px] tracking-[.14em] uppercase text-ink-3"
            style={{ gridTemplateColumns: COLS }}
          >
            <span></span><span>CAT #</span><span>TITLE</span><span>ARTIST</span><span>FORMAT</span><span>YEAR</span><span></span>
          </div>
          {list.map((r) => {
            const artistText = r.artists.map((a: { name: string }) => a.name).join(" · ");
            const cover = "cover" in r && r.cover ? urlFor(r.cover).width(120).height(120).fit("crop").url() : null;
            return (
              <Link
                key={r._id}
                href={`/releases/${r.slug}`}
                className="grid gap-3 py-4 border-b border-ink items-center no-underline text-ink hover:bg-paper-2 transition-colors group"
                style={{ gridTemplateColumns: COLS }}
              >
                <span
                  className="block w-12 h-12 border border-ink overflow-hidden"
                  style={{ background: ("coverColor" in r && r.coverColor) ? r.coverColor : "#1C1A17" }}
                >
                  {cover && <img src={cover} alt="" className="w-full h-full object-cover" loading="lazy" />}
                </span>
                <span className="font-mono text-[12px] tracking-[.08em] text-ink-3">{r.catalogNumber ?? "—"}</span>
                <span className="font-display font-semibold text-[22px] tracking-[-0.005em] uppercase leading-none">{r.title}</span>
                <span className="font-sans text-[14px]">{artistText}</span>
                <span className="font-mono text-[11px] tracking-[.1em] uppercase">{r.format ?? "—"}</span>
                <span className="font-mono text-[12px] tabular-nums">{r.year ?? "—"}</span>
                <span className="font-display font-semibold text-[12px] tracking-[.08em] uppercase px-3 py-1.5 border border-ink bg-paper text-ink rounded-none group-hover:bg-ink group-hover:text-paper transition-colors text-center">
                  ▶ listen
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
