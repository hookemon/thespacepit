/**
 * Men Women & Children world. Nick's first band (Reprise / Warner, 2004–2008).
 * 183 documented shows in your xlsx master, 2 known releases. The road years.
 *
 * Same template as RTJ + CZ + Boo worlds — real data only, story copy left
 * as a `[YOUR WORDS HERE]` placeholder.
 */
import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { sanityFetch, urlFor } from "../../_lib/sanity";
import type { ReleaseListItem } from "../../_lib/sanity-queries";
import { getPressForEra } from "../../_lib/sanity-queries";
import { PressGrid } from "../../_components/shared/PressGrid";
import { SHOWS } from "../../_lib/shows";
import { FOOTER_LINKS } from "../../_lib/social-links";
import { groq } from "next-sanity";

export const revalidate = 300;

export const metadata = {
  title: "men women & children — nick hook's first band · 2004–2008",
  description:
    "every show, every tour, every credit. reprise / warner / nettwerk. brooklyn into 183 documented dates. nightmare of you, panic! at the disco, lostprophets, gang of four, de la soul, bamboozle, the road.",
};

// MWC identity — chakra-sacral, that early-2000s rock-band orange
const MWC_ACCENT = "#E2651A";
const MWC_GOLD   = "#F2C84B";

export default async function MWCWorldPage() {
  const releases = await sanityFetch<ReleaseListItem[]>(groq`
    *[_type == "release" && (
      title match "*Men Women*" ||
      references(*[_type == "artist" && slug.current match "men-women*"]._id)
    )] | order(year asc) {
      _id, title, "slug": slug.current, year, catalogNumber, format, cover, coverColor,
      "artists": artists[]->{ name, "slug": slug.current }
    }
  `);

  // 183 shows in the xlsx, era === "MEN WOMEN & CHILDREN"
  const shows = SHOWS.filter((sh) => /MEN WOMEN/i.test(sh.era ?? ""));
  const byYear = new Map<number, typeof shows>();
  for (const sh of shows) {
    const y = sh.year ?? 0;
    const arr = byYear.get(y) ?? [];
    arr.push(sh);
    byYear.set(y, arr);
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);

  // Press tagged to the MWC era.
  const press = await getPressForEra("men-women-children");

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="nick" />
      <main className="flex-1">
        {/* === HERO === */}
        <section className="relative overflow-hidden border-b border-paper/15">
          <div className="absolute inset-0" aria-hidden style={{ background: `radial-gradient(circle at 30% 30%, ${MWC_ACCENT}44 0%, transparent 60%)` }} />
          <div className="absolute inset-0 bg-ink/40" aria-hidden />
          <div className="relative px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-[1180px] mx-auto">
            <Link
              href="/nick-hook"
              className="font-mono text-[11px] tracking-[.14em] uppercase no-underline"
              style={{ color: MWC_GOLD }}
            >
              ← nick hook
            </Link>

            <div className="mt-16 sm:mt-24">
              <div
                className="font-mono text-[11px] tracking-[.36em] uppercase mb-4"
                style={{ color: MWC_GOLD }}
              >
                NICK HOOK'S FIRST BAND · REPRISE / WARNER · 2004–2008
              </div>
              <h1
                className="font-display font-bold uppercase m-0 leading-[0.86]"
                style={{ fontSize: "clamp(48px, 10vw, 160px)", letterSpacing: "-0.025em", color: MWC_ACCENT }}
              >
                men women
                <br />
                & children
              </h1>
              <p
                className="font-serif italic mt-8 text-[18px] sm:text-[22px] max-w-[660px] leading-snug"
                style={{ color: "#F4EFE6" }}
              >
                the road years. {releases.length} records · {shows.length} documented shows · {years[0]}–{years[years.length - 1]}.  twenty-year anniversary in 2026.
              </p>
            </div>
          </div>
        </section>

        {/* === THE STORY === placeholder, your words */}
        <section className="px-5 sm:px-8 py-16 max-w-[760px] mx-auto">
          <div
            className="font-mono text-[11px] tracking-[.18em] uppercase mb-4"
            style={{ color: MWC_GOLD }}
          >
            THE STORY
          </div>
          <div className="border-l-2 py-3 pl-5" style={{ borderColor: MWC_GOLD }}>
            <p className="font-mono text-[11px] tracking-[.14em] uppercase mb-2" style={{ color: MWC_GOLD }}>
              [ NICK — YOUR WORDS HERE · START FROM THE BEGINNING ]
            </p>
            <p className="font-serif italic text-[16px] text-paper-2 leading-snug">
              how MWC started · the Reprise / Warner deal · Nettwerk era · the Nightmare of You summer co-headlines · MTV2 $2 Bill tour · UK arena run with Panic! · Gang of Four · the van getting stolen in Detroit · the Bamboozle slot · the final show. None of this gets ai-generated.
            </p>
          </div>
        </section>

        {/* === THE RECORDS === */}
        {releases.length > 0 && (
          <section className="px-5 sm:px-8 py-12 border-t border-paper/15 max-w-[1180px] mx-auto">
            <div
              className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
              style={{ color: MWC_GOLD }}
            >
              THE RECORDS · {releases.length}
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-8"
              style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
            >
              on reprise / warner
            </h2>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
            >
              {releases.map((r) => {
                const cover = r.cover ? urlFor(r.cover).width(560).height(560).fit("crop").url() : null;
                return (
                  <Link
                    key={r._id}
                    href={`/releases/${r.slug}`}
                    className="group block border border-paper transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] no-underline text-paper overflow-hidden"
                  >
                    <div className="aspect-square border-b border-paper overflow-hidden relative" style={{ background: r.coverColor ?? "#1C1A17" }}>
                      {cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt={r.title}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                      )}
                    </div>
                    <div className="p-3">
                      <div className="font-mono text-[10px] tracking-[.14em] uppercase" style={{ color: MWC_GOLD }}>
                        {r.year ?? "—"}{r.catalogNumber ? `  ·  ${r.catalogNumber}` : ""}
                      </div>
                      <div className="font-display font-semibold text-[15px] uppercase tracking-[-0.005em] leading-tight mt-1 line-clamp-2">
                        {r.title}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* === EVERY SHOW BY YEAR === xlsx sourced */}
        {shows.length > 0 && (
          <section className="px-5 sm:px-8 py-12 border-t border-paper/15 max-w-[1180px] mx-auto">
            <div
              className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
              style={{ color: MWC_GOLD }}
            >
              EVERY DOCUMENTED SHOW · {shows.length}
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-3"
              style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
            >
              183 dates · 5 years
            </h2>
            <p className="font-serif italic text-[15px] text-paper-2 mb-10 max-w-[640px]">
              pulled from your xlsx master. every entry sourced (Nettwerk routing emails, agency advancing, Bandsintown). no invented dates.
            </p>
            {years.map((y) => {
              const list = byYear.get(y)!;
              return (
                <section key={y} className="mb-10">
                  <h3
                    className="font-display font-bold uppercase m-0 mb-3 pb-2 border-b-2"
                    style={{ fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.02em", borderColor: MWC_ACCENT }}
                  >
                    {y > 0 ? y : "—"}  ·  <span className="text-paper-2 font-mono text-[14px] tracking-[.14em] tabular-nums">{list.length} shows</span>
                  </h3>
                  <ol className="list-none p-0 m-0 grid gap-0">
                    {list.map((sh, i) => (
                      <li key={`${sh.date}-${sh.venue}-${i}`}>
                        <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[120px_1fr] items-baseline gap-3 sm:gap-5 py-2.5 border-b border-paper/10">
                          <div className="font-mono text-[10px] sm:text-[11px] tracking-[.06em] text-paper-2 tabular-nums shrink-0">
                            {sh.date ?? "—"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-display font-semibold text-[15px] sm:text-[17px] uppercase tracking-[-0.005em] leading-tight">
                              {sh.city}{sh.country ? `, ${sh.country.replace(/, USA$/, "")}` : ""}
                            </div>
                            <div className="font-mono text-[10px] sm:text-[11px] tracking-[.04em] text-paper-2 mt-0.5 line-clamp-1">
                              {sh.venue ?? "—"}
                              {sh.support && <span className="text-paper-2/70"> · {sh.support}</span>}
                            </div>
                            {sh.notes && (
                              <div className="font-serif italic text-[12px] text-paper-2 mt-1 leading-snug max-w-[560px] opacity-80 line-clamp-2">
                                {sh.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </section>
        )}

        {/* === GALLERY PLACEHOLDER === */}
        <section className="px-5 sm:px-8 py-12 border-t border-paper/15 max-w-[1180px] mx-auto">
          <div
            className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
            style={{ color: MWC_GOLD }}
          >
            THE GALLERY
          </div>
          <div className="border-2 border-dashed border-paper/25 rounded-md p-10 text-center">
            <p className="font-mono text-[11px] tracking-[.14em] uppercase text-paper-2 mb-2">
              [ NICK — DROP MWC TOUR PHOTOS HERE ]
            </p>
            <p className="font-serif italic text-[15px] text-paper-2 max-w-[520px] mx-auto">
              flyers from those tours, polaroids from the van, the day-sheets, the stage shots — point me at the folder.
            </p>
          </div>
        </section>

        {/* === PRESS — alt-weekly + magazine writeups from the band years === */}
        <PressGrid
          items={press}
          accent={MWC_GOLD}
          eyebrow="PRESS · WHAT THEY WROTE"
          heading="press"
          subhead="alt-weeklies, magazines, and reviews from the band years. click any card to read."
        />
      </main>
      <Footer
        theme="dark"
        signoff="see u in the pit 🌱"
        meta="booking · coleman@smooth-loop.com"
        links={[...FOOTER_LINKS.nick]}
      />
    </div>
  );
}
