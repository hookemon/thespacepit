/**
 * Men Women & Children world. The band — TJ Penzone, Todd Weinstock, Rick
 * Penzone, Skully Sullivan-Kaplan, Jason Giummule, Nick Hook. Reprise /
 * Warner Bros. 2003 → ∞ (back working on new music after a 20-year break).
 *
 * 183 documented shows in the xlsx master, 2 known releases on Warner.
 * Band-perspective framing site-wide — this is the band's page, not Nick's.
 */
import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { sanityFetch, urlFor } from "../../_lib/sanity";
import type { ReleaseListItem } from "../../_lib/sanity-queries";
import { getPressForEra } from "../../_lib/sanity-queries";
import { PressGrid } from "../../_components/shared/PressGrid";
import { CollectionJsonLd } from "../../_components/shared/CollectionJsonLd";
import { VideoPlaylist } from "../../_components/shared/VideoPlaylist";
import { SHOWS } from "../../_lib/shows";
import { FOOTER_LINKS } from "../../_lib/social-links";
import { getVideosFromPlaylist } from "../../_lib/youtube";
import { groq } from "next-sanity";

// MWC catalog playlist on @thespacepit — every official track + live clip
// Nick has curated for the band's YouTube archive.
const MWC_YT_PLAYLIST = "PLMXEKDUSbulNyFibYJR2I2I0EnPpLp_ts";

export const revalidate = 300;

export const metadata = {
  title: "men women & children",
  description:
    "every show, every tour, every credit. reprise / warner / nettwerk. brooklyn into 183 documented dates. nightmare of you, panic! at the disco, lostprophets, gang of four, de la soul, bamboozle, the road. currently working on new music.",
};

// MWC identity — chakra-sacral, that early-2000s rock-band orange
const MWC_ACCENT = "#E2651A";
const MWC_GOLD   = "#F2C84B";

type Member = { name: string; slug: string };

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

  // The band — pulled from the MWC era project doc so renames flow through.
  const members = await sanityFetch<Member[]>(groq`
    *[_id == "project-men-women-children"][0].members[]->{ name, "slug": slug.current }
  `);

  // Pull the MWC catalog playlist live from YouTube. Curated by Nick on
  // @thespacepit — official singles, b-sides, label uploads, fan-shot live
  // clips. Same pattern as release pages: read-through, cached for an hour.
  const playlistVideos = await getVideosFromPlaylist(MWC_YT_PLAYLIST, 50);

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
      <CollectionJsonLd
        path="/bands/men-women-children"
        name="Men Women & Children"
        description="Reprise / Warner Bros. 2003 → ∞. Press archive, videos, tour history. Currently working on new music for the first time in 20 years."
        items={releases.map((r) => ({ slug: r.slug, title: r.title }))}
      />
      <TopNav current="nick" />
      <main className="flex-1">
        {/* === HERO === */}
        <section className="relative overflow-hidden border-b border-paper/15">
          <div className="absolute inset-0" aria-hidden style={{ background: `radial-gradient(circle at 30% 30%, ${MWC_ACCENT}44 0%, transparent 60%)` }} />
          <div className="absolute inset-0 bg-ink/40" aria-hidden />
          <div className="relative px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-[1180px] mx-auto">
            <Link
              href="/bands"
              className="font-mono text-[11px] tracking-[.14em] uppercase no-underline"
              style={{ color: MWC_GOLD }}
            >
              ← back
            </Link>

            <div className="mt-16 sm:mt-24">
              <div
                className="font-mono text-[11px] tracking-[.36em] uppercase mb-4"
                style={{ color: MWC_GOLD }}
              >
                REPRISE / WARNER · 2003 → ∞
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
                {releases.length} records · {shows.length} documented shows · currently working on new music for the first time in 20 years.
              </p>

              {/* === MEMBERS === buttons jump to each player's artist page. */}
              {members && members.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {members.map((m) => (
                    <Link
                      key={m.slug}
                      href={`/artists/${m.slug}`}
                      className="font-mono text-[11px] tracking-[.1em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline text-paper"
                    >
                      {m.name} →
                    </Link>
                  ))}
                </div>
              )}

              {/* In-page anchor jumps — match the era page convention. */}
              <div className="mt-6 flex flex-wrap gap-2.5">
                {playlistVideos.length > 0 && (
                  <a
                    href="#videos"
                    className="font-mono text-[11px] tracking-[.14em] uppercase px-4 py-2 border border-paper hover:bg-paper hover:text-ink transition-colors no-underline text-paper"
                  >
                    videos ↓
                  </a>
                )}
                {shows.length > 0 && (
                  <a
                    href="#shows"
                    className="font-mono text-[11px] tracking-[.14em] uppercase px-4 py-2 border border-paper hover:bg-paper hover:text-ink transition-colors no-underline text-paper"
                  >
                    shows ↓
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* (Full bio lives on the era page at /eras/men-women-children —
            single source of truth. This page is the visual archive: records,
            videos, shows, press.) */}

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

        {/* === THE VIDEOS === pulled live from the MWC YouTube playlist.
            Official singles, label uploads, and fan-shot live clips, in
            the order curated on the @thespacepit channel. */}
        {playlistVideos.length > 0 && (
          <section id="videos" className="px-5 sm:px-8 py-12 border-t border-paper/15 max-w-[1180px] mx-auto scroll-mt-12">
            <div
              className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
              style={{ color: MWC_GOLD }}
            >
              ON THE SCREEN · {playlistVideos.length} VIDEOS
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-6"
              style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
            >
              the videos
            </h2>
            <p className="font-serif italic text-[15px] text-paper-2 mb-8 max-w-[640px]">
              the singles, the label uploads, the fan-shot bootlegs. curated on the @thespacepit channel.
            </p>
            <VideoPlaylist
              items={playlistVideos.map((v) => ({
                url: `https://www.youtube.com/watch?v=${v.id}`,
                title: v.title,
              }))}
              accent={MWC_ACCENT}
              eyebrow={`PLAYLIST · ${playlistVideos.length} VIDEOS`}
            />
          </section>
        )}

        {/* === EVERY SHOW BY YEAR === xlsx sourced. Folded by year so 183
            shows don't dominate the scroll — click any year to expand. */}
        {shows.length > 0 && (
          <section id="shows" className="px-5 sm:px-8 py-12 border-t border-paper/15 max-w-[1180px] mx-auto scroll-mt-12">
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
              {shows.length} dates · {years[years.length - 1] - years[0] + 1} years
            </h2>
            <p className="font-serif italic text-[15px] text-paper-2 mb-8 max-w-[640px]">
              every entry sourced (Nettwerk routing emails, agency advancing, Bandsintown). click any year to expand.
            </p>
            <div className="space-y-2">
              {years.map((y) => {
                const list = byYear.get(y)!;
                return (
                  <details key={y} className="group border-b border-paper/15 last:border-b-0">
                    <summary
                      className="list-none cursor-pointer flex items-baseline justify-between gap-4 py-3 px-1 hover:bg-paper/5 transition-colors"
                    >
                      <span
                        className="font-display font-bold uppercase"
                        style={{ fontSize: "clamp(22px, 2.6vw, 30px)", letterSpacing: "-0.02em" }}
                      >
                        {y > 0 ? y : "—"}
                      </span>
                      <span className="font-mono text-[11px] tracking-[.16em] uppercase text-paper-2 tabular-nums">
                        {list.length} shows
                        <span aria-hidden className="inline-block ml-3 transition-transform group-open:rotate-90" style={{ color: MWC_ACCENT }}>▸</span>
                      </span>
                    </summary>
                    <ol className="list-none p-0 m-0 pb-6 pt-2">
                      {list.map((sh, i) => (
                        <li key={`${sh.date}-${sh.venue}-${i}`}>
                          <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[120px_1fr] items-baseline gap-3 sm:gap-5 py-2 border-b border-paper/10 last:border-b-0">
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
                  </details>
                );
              })}
            </div>
          </section>
        )}

        {/* (Gallery placeholder removed — drop flyers / tour photos into the
            `gallery` field on the era project doc and the era page picks them
            up automatically.) */}

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
