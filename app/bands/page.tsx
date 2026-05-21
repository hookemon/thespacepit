/**
 * /bands — the index. The bands Nick has been IN, not produced for. Two
 * entries: Men Women & Children (Reprise / Warner, 2003 → ∞) and Cubic
 * Zirconia (Brooklyn, 2009 → 2012). Each links to its own deep page.
 *
 * Same visual language as /collabs, separate concept: this is band
 * perspective. Records where Nick was a member of an actual band, not
 * the engineer or producer in the room.
 */
import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { FOOTER_LINKS } from "../_lib/social-links";
import { sanityFetch, urlFor } from "../_lib/sanity";
import type { SanityImage } from "../_lib/sanity-queries";
import { buildCollectionJsonLd, jsonLdScript } from "../_lib/schema-jsonld";

export const metadata = {
  title: "bands — thespacepit",
  description:
    "The two bands. Men Women & Children (Reprise / Warner Bros., 2003 → ∞ — currently working on new music). Cubic Zirconia (Brooklyn, 2009–2012).",
};

type BandChapter = {
  slug: string;
  title: string;
  subtitle: string;
  years: string;
  blurb: string;
  accent: string;
  blockColor: string;
  featuredCovers: string[];
  artistMatch: string;
};

const BANDS: BandChapter[] = [
  {
    slug: "men-women-children",
    title: "Men Women & Children",
    subtitle: "TJ Penzone · Todd Weinstock · Rick Penzone · Skully Sullivan-Kaplan · Jason Giummule · Nick Hook",
    years: "2003 → ∞",
    blurb: "One full-length on Reprise / Warner Bros., 183 documented shows, MTV2 tours, Brixton Academy support runs. Currently working on new music for the first time in 20 years.",
    accent: "#E2651A",
    blockColor: "#F4EFE6",
    featuredCovers: ["men-women-children-self-titled", "dance-in-my-blood-us-dmd-maxi"],
    artistMatch: "Men Women",
  },
  {
    slug: "cubic-zirconia",
    title: "Cubic Zirconia",
    subtitle: "Tiombe Lockhart · Nick Hook · Todd Weinstock · Daud Sturdivant",
    years: "2009 → 2012",
    blurb: "9 releases (FUCK WORK → Darko), 34 documented shows, the BBC Maida Vale session, club circuits across two continents. Sub-imprint with Lockhart Dynasty.",
    accent: "#4B2E83",
    blockColor: "#F2C84B",
    featuredCovers: ["fuck-work", "ldcc001-josephine", "ldcc006-darko"],
    artistMatch: "Cubic Zirconia",
  },
];

async function loadChapterData(): Promise<
  Record<string, { covers: { slug: string; title: string; cover: SanityImage | null }[]; count: number }>
> {
  const slugs = BANDS.flatMap((b) => b.featuredCovers);
  const matches = BANDS.map((b) => b.artistMatch);
  const data = await sanityFetch<{
    covers: { slug: string; title: string; cover: SanityImage | null }[];
    counts: { match: string; count: number }[];
  }>(
    `{
      "covers": *[_type == "release" && slug.current in $slugs]{ title, "slug": slug.current, cover },
      "counts": [
        ${matches
          .map(
            (_, i) =>
              `{ "match": $m${i}, "count": count(*[_type == "release" && artists[]->name match ("*" + $m${i} + "*")]) }`,
          )
          .join(",")}
      ]
    }`,
    { slugs, ...Object.fromEntries(matches.map((m, i) => [`m${i}`, m])) },
  );
  const result: Record<string, { covers: typeof data.covers; count: number }> = {};
  for (const b of BANDS) {
    const matchCount = data.counts.find((x) => x.match === b.artistMatch)?.count ?? 0;
    const orderedCovers = b.featuredCovers
      .map((cv) => data.covers.find((c) => c.slug === cv))
      .filter((c): c is { slug: string; title: string; cover: SanityImage | null } => Boolean(c));
    result[b.slug] = { covers: orderedCovers, count: matchCount };
  }
  return result;
}

export default async function BandsIndex() {
  const chapterData = await loadChapterData();

  const jsonLd = buildCollectionJsonLd({
    url: "https://thespacepit.com/bands",
    name: "bands — thespacepit",
    description:
      "The bands. Men Women & Children + Cubic Zirconia. Records, shows, videos, press archive for each.",
    items: BANDS.map((b) => ({ url: `https://thespacepit.com/bands/${b.slug}`, name: b.title })),
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <TopNav current="nick" />
      <main className="flex-1 bg-ink text-paper">
        <header className="px-5 sm:px-8 pt-16 pb-10 border-b-2 border-paper">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase text-redline mb-2">
            THE BANDS · IN THE ROOM AS A MEMBER
          </div>
          <h1
            className="font-display font-bold uppercase m-0 text-paper"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            bands
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[680px] text-paper-2">
            two bands. Reprise / Warner into Brooklyn into the global club circuit. each one's a chapter with every record, every show, every video, every press piece.
          </p>
        </header>

        <section className="px-5 sm:px-8 py-14">
          <div className="grid gap-6 md:gap-8" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))" }}>
            {BANDS.map((b) => {
              const chap = chapterData[b.slug] ?? { covers: [], count: 0 };
              return (
                <Link
                  key={b.slug}
                  href={`/bands/${b.slug}`}
                  className="group block no-underline text-paper border-2 border-paper relative overflow-hidden transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px]"
                  style={{ background: b.accent, color: b.blockColor, minHeight: 380, boxShadow: "0 0 0 transparent" }}
                >
                  <div className="absolute inset-0 transition-shadow duration-150 group-hover:[box-shadow:6px_6px_0_var(--color-paper)]" aria-hidden />
                  <div className="relative p-7 flex flex-col h-full justify-between" style={{ minHeight: 380 }}>
                    <div>
                      <div className="font-mono text-[10px] tracking-[.18em] uppercase mb-2" style={{ opacity: 0.7 }}>
                        {b.years}
                        {chap.count > 0 && (
                          <>
                            {" · "}
                            {chap.count} {chap.count === 1 ? "RECORD" : "RECORDS"}
                          </>
                        )}
                      </div>
                      <div
                        className="font-display font-bold uppercase leading-[0.95]"
                        style={{ fontSize: "clamp(36px, 5vw, 64px)", letterSpacing: "-0.015em", color: b.blockColor }}
                      >
                        {b.title}
                      </div>
                      <div className="font-mono text-[12px] tracking-[.1em] uppercase mt-2" style={{ opacity: 0.85 }}>
                        {b.subtitle}
                      </div>
                    </div>

                    {chap.covers.length > 0 && (
                      <div className="flex gap-2 mt-4" aria-hidden>
                        {chap.covers.map((rel) => (
                          <div
                            key={rel.slug}
                            className="aspect-square w-1/3 max-w-[110px] border-2 overflow-hidden"
                            style={{ borderColor: b.blockColor, background: "rgba(0,0,0,0.15)" }}
                          >
                            {rel.cover && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={urlFor(rel.cover).width(220).height(220).fit("crop").url()}
                                alt={rel.title}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="font-serif italic text-[15px] mt-4 leading-snug" style={{ opacity: 0.95 }}>
                      {b.blurb}
                    </div>
                    <div className="font-mono text-[10px] tracking-[.18em] uppercase mt-5 inline-flex items-center gap-2 group-hover:underline underline-offset-4">
                      enter the band →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer
        theme="dark"
        signoff="see u in the pit 🌱"
        meta="booking · coleman@smooth-loop.com"
        links={[...FOOTER_LINKS.nick]}
      />
    </>
  );
}
