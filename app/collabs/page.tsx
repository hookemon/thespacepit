/**
 * /collabs — the index. A door per collab world. Each subworld (RTJ, MWC,
 * Cubic Zirconia, Gangsta Boo) already has its own deep page; this index
 * exists so /collabs isn't a 404. It also surfaces the network at a glance.
 *
 * Auto-extends: drop a new folder in app/collabs/<slug>/ with a page.tsx and
 * add it to the COLLABS array below. No Sanity coupling — these are
 * editorial subworlds Nick has hand-built, not data-driven.
 */
import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { FOOTER_LINKS } from "../_lib/social-links";
import { STUDIO_CLIENTS } from "../_lib/studio-clients";
import { resolveArtistSlugs } from "../_lib/sanity-queries";
import { sanityFetch, urlFor } from "../_lib/sanity";
import type { SanityImage } from "../_lib/sanity-queries";
import { buildCollectionJsonLd, jsonLdScript } from "../_lib/schema-jsonld";

export const metadata = {
  title: "collabs — nick hook",
  description:
    "the deep collab worlds. RTJ. Men Women + Children. Cubic Zirconia. Gangsta Boo. Each one's a full chapter.",
};

type CollabChapter = {
  slug: string;
  title: string;
  subtitle: string;
  years: string;
  blurb: string;
  accent: string;     // hex
  blockColor: string; // text color when on the accent
  /** Release slugs to render as a curated cover thumbnail strip on the tile.
   *  Order matters — leftmost is the visual lead. */
  featuredCovers: string[];
  /** Substring match against artists[]->name used to count total releases
   *  in this chapter for the live stat under the title. */
  artistMatch: string;
};

const COLLABS: CollabChapter[] = [
  {
    slug: "run-the-jewels",
    title: "Run The Jewels",
    subtitle: "El-P · Killer Mike · Nick Hook (engineer)",
    years: "2013 → today",
    blurb: "Every record, every show, every video. 4 LPs, the Cu4tro Mexico cumbia rework, a documentary, world tours.",
    accent: "#E83A1C",
    blockColor: "#F4EFE6",
    featuredCovers: ["run-the-jewels-2013", "run-the-jewels-4-2020", "rtj-cu4tro-2023"],
    artistMatch: "Run The Jewels",
  },
  {
    slug: "men-women-children",
    title: "Men Women & Children",
    subtitle: "Reprise / Warner — Nick's first band",
    years: "2004 → 2008",
    blurb: "20-year anniversary in 2026. The whole press archive, the videos, the tour history — already documented.",
    accent: "#F2B705",
    blockColor: "#0B0B0B",
    featuredCovers: ["men-women-children-self-titled", "dance-in-my-blood-us-dmd-maxi"],
    artistMatch: "Men Women",
  },
  {
    slug: "cubic-zirconia",
    title: "Cubic Zirconia",
    subtitle: "Tiombe Lockhart × Nick Hook · Brooklyn",
    years: "2009 → 2012",
    blurb: "9 releases (FUCK WORK → Darko), 34 documented shows, club circuit. Sub-imprint with Lockhart Dynasty.",
    accent: "#4B2E83",
    blockColor: "#F2C84B",
    featuredCovers: ["fuck-work", "ldcc001-josephine", "ldcc006-darko"],
    artistMatch: "Cubic Zirconia",
  },
  {
    slug: "gangsta-boo",
    title: "Gangsta Boo",
    subtitle: "Three 6 → Brooklyn — sessions, drops, the August single",
    years: "2010s → 2026",
    blurb: "The whole Boo run — radio drops, unreleased takes, the Qoqeca remix dropping August 2026.",
    accent: "#FF6FB5",
    blockColor: "#0B0B0B",
    featuredCovers: ["cc004-peephole", "cc007-im-fresh"],
    artistMatch: "Gangsta Boo",
  },
];

/** Fetch curated cover images + total release count per chapter. Runs once
 *  per request because the page is a server component; revalidation is
 *  handled by the framework's default RSC cache. */
async function loadChapterData(): Promise<
  Record<
    string,
    { covers: { slug: string; title: string; cover: SanityImage | null }[]; count: number }
  >
> {
  const slugs = COLLABS.flatMap((c) => c.featuredCovers);
  const matches = COLLABS.map((c) => c.artistMatch);
  const data = await sanityFetch<{
    covers: { slug: string; title: string; cover: SanityImage | null }[];
    counts: { match: string; count: number }[];
  }>(
    `{
      "covers": *[_type == "release" && slug.current in $slugs]{
        title, "slug": slug.current, cover
      },
      "counts": [
        ${matches
          .map(
            (m, i) =>
              `{ "match": $m${i}, "count": count(*[_type == "release" && artists[]->name match ("*" + $m${i} + "*")]) }`,
          )
          .join(",")}
      ]
    }`,
    {
      slugs,
      ...Object.fromEntries(matches.map((m, i) => [`m${i}`, m])),
    },
  );
  const result: Record<string, { covers: typeof data.covers; count: number }> = {};
  for (const c of COLLABS) {
    const matchCount = data.counts.find((x) => x.match === c.artistMatch)?.count ?? 0;
    const covers = c.featuredCovers
      .map((s) => data.covers.find((x) => x.slug === s))
      .filter((x): x is NonNullable<typeof x> => !!x);
    result[c.slug] = { covers, count: matchCount };
  }
  return result;
}

export default async function CollabsIndex() {
  // Resolve which of the alphabetical roster names have artist docs in
  // Sanity so we can link them. Same source/query the homepage "IN THE
  // ROOM" wall uses — single source of truth for the collaborator list.
  const [artistLinks, chapterData] = await Promise.all([
    resolveArtistSlugs(STUDIO_CLIENTS),
    loadChapterData(),
  ]);

  // CollectionPage JSON-LD — tells Google this is an editorial collection
  // of multiple collaboration worlds. ItemList carries the 4 chapter slugs
  // so Google can build a carousel-style rich result.
  const jsonLd = buildCollectionJsonLd({
    url: "https://thespacepit.com/collabs",
    name: "collabs — nick hook",
    description:
      "the deep collab worlds. RTJ. Men Women + Children. Cubic Zirconia. Gangsta Boo. Each one's a full chapter.",
    items: COLLABS.map((c) => ({
      url: `https://thespacepit.com/collabs/${c.slug}`,
      name: c.title,
    })),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <TopNav current="nick" />
      <main className="flex-1 bg-ink text-paper">
        <header className="px-5 sm:px-8 pt-16 pb-10 border-b-2 border-paper">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase text-redline mb-2">
            THE WHOLE NETWORK · LONG-FORM CHAPTERS
          </div>
          <h1
            className="font-display font-bold uppercase m-0 text-paper"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            collabs
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[680px] text-paper-2">
            the deep worlds. each one a chapter — its own page with every record, every show, every video,
            every press piece. drop in.
          </p>
        </header>

        <section className="px-5 sm:px-8 py-14">
          <div
            className="grid gap-6 md:gap-8"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))" }}
          >
            {COLLABS.map((c) => {
              const chap = chapterData[c.slug] ?? { covers: [], count: 0 };
              return (
              <Link
                key={c.slug}
                href={`/collabs/${c.slug}`}
                className="group block no-underline text-paper border-2 border-paper relative overflow-hidden transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px]"
                style={{
                  background: c.accent,
                  color: c.blockColor,
                  minHeight: 380,
                  boxShadow: "0 0 0 transparent",
                }}
              >
                <div
                  className="absolute inset-0 transition-shadow duration-150 group-hover:[box-shadow:6px_6px_0_var(--color-paper)]"
                  aria-hidden
                />
                <div className="relative p-7 flex flex-col h-full justify-between" style={{ minHeight: 380 }}>
                  <div>
                    <div
                      className="font-mono text-[10px] tracking-[.18em] uppercase mb-2"
                      style={{ opacity: 0.7 }}
                    >
                      {c.years}
                      {chap.count > 0 && (
                        <>
                          {" · "}
                          {chap.count} {chap.count === 1 ? "RECORD" : "RECORDS"}
                        </>
                      )}
                    </div>
                    <div
                      className="font-display font-bold uppercase leading-[0.95]"
                      style={{
                        fontSize: "clamp(36px, 5vw, 64px)",
                        letterSpacing: "-0.015em",
                        color: c.blockColor,
                      }}
                    >
                      {c.title}
                    </div>
                    <div
                      className="font-mono text-[12px] tracking-[.1em] uppercase mt-2"
                      style={{ opacity: 0.85 }}
                    >
                      {c.subtitle}
                    </div>
                  </div>

                  {/* Curated cover thumbnails — visual hook so each chapter
                      reads at a glance instead of being a wall of color. */}
                  {chap.covers.length > 0 && (
                    <div className="flex gap-2 mt-4" aria-hidden>
                      {chap.covers.map((rel) => (
                        <div
                          key={rel.slug}
                          className="aspect-square w-1/3 max-w-[110px] border-2 overflow-hidden"
                          style={{ borderColor: c.blockColor, background: "rgba(0,0,0,0.15)" }}
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
                    {c.blurb}
                  </div>
                  <div
                    className="font-mono text-[10px] tracking-[.18em] uppercase mt-5 inline-flex items-center gap-2 group-hover:underline underline-offset-4"
                  >
                    enter the world →
                  </div>
                </div>
              </Link>
              );
            })}
          </div>

          <p className="font-serif italic text-[15px] text-paper-2 mt-12 max-w-[640px]">
            more chapters coming — Boys Noize · Drop The Lime · Spiritual Friendship · SPORTS · the Trouble & Bass run.
            email <a href="mailto:coleman@smooth-loop.com" className="text-paper underline">coleman@smooth-loop.com</a> if you want first look.
          </p>
        </section>

        {/* === THE WHOLE NETWORK · A → Z ===
            Every artist Nick has worked with, produced for, played with, or
            had in the room. Linked names get a portal to their /artists/[slug]
            page; unlinked names render as plain text. Source: STUDIO_CLIENTS
            (same list the homepage "IN THE ROOM" wall uses). */}
        <section className="px-5 sm:px-8 py-16 border-t-2 border-paper">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase mb-2" style={{ color: "var(--color-slime)" }}>
            THE WHOLE NETWORK · A → Z · {STUDIO_CLIENTS.length} NAMES
          </div>
          <h2
            className="font-display font-bold uppercase m-0 mb-3 text-paper"
            style={{ fontSize: "clamp(40px, 7vw, 88px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
          >
            in the room
          </h2>
          <p className="font-serif italic text-[18px] text-paper-2 leading-snug max-w-[680px] mb-9">
            every artist who&apos;s been in the room with Nick — performers, producers, MCs, vocalists, drummers,
            DJs, friends-of-the-house. {artistLinks.size} of them have their own world on the site.
            tap any name to enter.
          </p>
          <div
            className="flex flex-wrap gap-x-5 gap-y-2 font-display uppercase font-semibold leading-none text-paper"
            style={{ fontSize: "clamp(18px, 2.2vw, 30px)", letterSpacing: "-0.005em" }}
          >
            {STUDIO_CLIENTS.map((name, i) => {
              const link = artistLinks.get(name);
              return (
                <span key={`${name}-${i}`} className="whitespace-nowrap">
                  {link?.slug ? (
                    <Link
                      href={`/artists/${link.slug}`}
                      className="text-paper no-underline hover:underline underline-offset-4 transition-colors hover:text-slime"
                      style={{ color: "var(--color-paper)" }}
                    >
                      {name}
                    </Link>
                  ) : (
                    <span className="text-paper-2">{name}</span>
                  )}
                </span>
              );
            })}
          </div>
          <div className="mt-10 font-mono text-[10px] tracking-[.14em] uppercase text-paper-2">
            missing someone? email coleman@smooth-loop.com
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
