/**
 * Boo + Hook — a dedicated page. Built as a tribute and an archive, not just
 * another artist page. Pulls from the BOO VAULT in Nick's Dropbox (assets
 * copied into /public/boo/) + her existing /artists/gangsta-boo Sanity doc
 * for releases + bio.
 *
 * Visual identity: ink-black background with her BOO logo's yellow as the
 * single accent color. Memorial-quiet typography.
 */
import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { sanityFetch } from "../../_lib/sanity";
import { urlFor } from "../../_lib/sanity";
import type { ReleaseListItem } from "../../_lib/sanity-queries";
import { getPressForEra } from "../../_lib/sanity-queries";
import { PressGrid } from "../../_components/shared/PressGrid";
import { SHOWS } from "../../_lib/shows";
import { FOOTER_LINKS } from "../../_lib/social-links";
import { groq } from "next-sanity";

export const revalidate = 300;

export const metadata = {
  title: "boo + hook — gangsta boo × nick hook",
  description:
    "the spacepit's permanent record of every session, every track, every photo of Gangsta Boo with Nick Hook. 2017–2023.",
};

// Her color signature — pulled from the BOO logo
const BOO_YELLOW = "#F2C84B";
const BOO_PURPLE = "#3A1E5C";

// Every project folder in the vault, turned into a session entry. Hand-curated.
// Dates inferred from filenames where present.
type Session = {
  title: string;
  date?: string;
  year?: number;
  note?: string;
  /** If this session produced a released record, link it. */
  releaseSlug?: string;
  /** Folder name in the vault — for Nick's reference */
  folder: string;
};

const SESSIONS: Session[] = [
  {
    title: "The Lot Radio · Brooklyn",
    date: "September 11, 2017",
    year: 2017,
    note: "Nick Hook, Gangsta Boo & Mike Bloom — live at The Lot. Video in the vault.",
    folder: "(vault root)",
  },
  {
    title: "GB · Dec 13",
    date: "December 13, 2019",
    year: 2019,
    note: "first archived session — early stems.",
    folder: "GB_12.13.19",
  },
  {
    title: "Peephole",
    date: "2020",
    year: 2020,
    note: "the record. CC004. official release.",
    releaseSlug: "cc004-peephole",
    folder: "CC004 NICK HOOK FT. GANGSTA BOO-PEEPHOLE",
  },
  {
    title: "I'm Fresh",
    date: "2020",
    year: 2020,
    note: "CC007. with Gangsta Boo as the voice.",
    releaseSlug: "cc007-im-fresh",
    folder: "IM FRESH 2020 Project",
  },
  {
    title: "Lola",
    date: "September 2020",
    year: 2020,
    folder: "LOLA PROJECT FILE",
  },
  {
    title: "Halloween · Nick Hook + Friends",
    date: "October 31, 2020",
    year: 2020,
    note: "the Halloween show. flyer in the gallery.",
    folder: "BOO HALLOWEEN",
  },
  {
    title: "Material Girl",
    year: 2020,
    folder: "MATERIAL GIRL",
  },
  {
    title: "Champion Waller",
    year: 2020,
    note: "the long session — 925 files deep.",
    folder: "BOO SESSION CHAMPION WALLER",
  },
  {
    title: "Isaac Day · 2",
    year: 2020,
    note: "the Isaac Day follow-up.",
    folder: "HOOK BOO ISAAC DAY 2",
  },
  {
    title: "Cop Show P",
    year: 2020,
    folder: "COP SHOW P",
  },
  {
    title: "Suicide 1.3",
    year: 2020,
    folder: "Nick Hook : BOO Suicide 1.3",
  },
  {
    title: "Suicide 1.4",
    year: 2020,
    note: "the missing files — what we kept of it.",
    folder: "hook x boo suicde 1.4 - missing files",
  },
  {
    title: "Pawmps",
    year: 2021,
    note: "single + QOQEQA hyper-merengue remix (160 BPM).",
    folder: "PAWMPS SINGLE",
  },
  {
    title: "Fuck It · for Travis",
    year: 2021,
    folder: "FUCK IT FOR TRAVIS",
  },
  {
    title: "12vy · Ran Boo",
    folder: "12vy ran boo",
  },
  {
    title: "89",
    folder: "89 TRACK",
  },
  {
    title: "Zokhuma · Boo · JP",
    folder: "ZOKHUMA BOO JP",
  },
  {
    title: "Rolling Stone",
    folder: "ROLLING STONE PROJECT FILE",
  },
  {
    title: "Boo Show Tracks",
    folder: "GANSTA BOO SHOW TRACKS",
  },
];

export default async function BooHookPage() {
  // Pull her artist doc for bio + the official releases we have on Sanity
  const artist = await sanityFetch<{
    _id: string;
    name: string;
    bio?: unknown[];
    tagline?: string;
  } | null>(groq`*[_type == "artist" && slug.current == "gangsta-boo"][0]{ _id, name, bio, tagline }`);

  const releases = await sanityFetch<ReleaseListItem[]>(groq`
    *[_type == "release" && (references("artist-gangsta-boo") || references("artist-ext-gangsta-boo"))]
      | order(year asc, catalogNumber asc) {
      _id, title, "slug": slug.current, year, catalogNumber, format, cover,
      "artists": artists[]->{ name, "slug": slug.current }
    }
  `);

  // Press tagged to the Boo era. Currently sparse — the backfill should
  // populate this with the Output 2017 + Halloween 2022 writeups + tributes.
  const press = await getPressForEra("gangsta-boo-live-studio");

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="nick" />
      <main className="flex-1">
        {/* === HERO === big BOO logo on the ink ground, dedication subtitle */}
        <section className="relative overflow-hidden">
          {/* Soft halloween-flyer wash, very low opacity, just for texture */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "url(/boo/halloween-flyer.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(8px) saturate(1.3)",
            }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/85 to-ink" aria-hidden />

          <div className="relative px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-[1180px] mx-auto">
            <Link
              href="/artists/gangsta-boo"
              className="font-mono text-[11px] tracking-[.14em] uppercase text-paper-2 hover:text-paper no-underline"
              style={{ color: BOO_YELLOW }}
            >
              ← back to artist
            </Link>

            <div className="mt-20 sm:mt-28 flex flex-col items-center text-center">
              {/* THE LOGO */}
              <img
                src="/boo/boo-logo-purple.png"
                alt="Gangsta Boo"
                className="max-w-[640px] w-[88%] h-auto drop-shadow-[0_4px_28px_rgba(0,0,0,0.7)]"
              />
              {/* Sub-headline — quiet, dedicated */}
              <div
                className="mt-12 font-mono text-[12px] tracking-[.36em] uppercase"
                style={{ color: BOO_YELLOW }}
              >
                BOO + HOOK
              </div>
              <h1 className="sr-only">{artist?.name ?? "Gangsta Boo"} × Nick Hook</h1>
              <p
                className="font-serif italic mt-4 text-[18px] sm:text-[22px] max-w-[520px] leading-snug"
                style={{ color: "#F4EFE6" }}
              >
                two records on the label. dozens of sessions in the vault. one
                page that holds it all.
              </p>
              <p
                className="font-mono text-[10px] tracking-[.32em] uppercase mt-6"
                style={{ color: BOO_YELLOW, opacity: 0.8 }}
              >
                · in memoriam · 1979 — 2023 ·
              </p>
            </div>
          </div>
        </section>

        {/* === THE NEW ONE === the unreleased Boo + Hook track, dropping on
            her birthday. Front + center. */}
        <section className="px-5 sm:px-8 pt-12 pb-4 max-w-[1080px] mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: BOO_YELLOW }} />
            <div
              className="font-mono text-[11px] tracking-[.32em] uppercase"
              style={{ color: BOO_YELLOW }}
            >
              ▶ FOR BOO · DROPPING ON HER BIRTHDAY · AUG 7
            </div>
          </div>
          <h2
            className="font-display font-bold uppercase m-0 mb-6"
            style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
          >
            the new one
          </h2>
          <div className="relative border-2 overflow-hidden" style={{ aspectRatio: "16/9", borderColor: BOO_YELLOW }}>
            <iframe
              src="https://www.youtube-nocookie.com/embed/eA0fnHTi-No?rel=0"
              title="Nick Hook × Gangsta Boo — new release"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
          <p className="font-serif italic text-[14px] text-paper-2 mt-3 text-center max-w-[640px] mx-auto">
            for Lola. dropping on her birthday — the only annual date worth marking.
          </p>
        </section>

        {/* === THE STORY === narrative intro */}
        <section className="px-5 sm:px-8 py-16 max-w-[760px] mx-auto">
          <div
            className="font-mono text-[11px] tracking-[.18em] uppercase mb-4"
            style={{ color: BOO_YELLOW }}
          >
            THE STORY
          </div>
          <div className="font-serif text-[18px] sm:text-[19px] leading-[1.65] text-paper space-y-4">
            <p>
              Lola Mitchell — Gangsta Boo — was a producer&apos;s rapper. Three Six Mafia&apos;s
              first lady, the voice on countless underground classics, the Memphis blueprint.
              When she started coming to the spacepit, she was already that legend.
            </p>
            <p>
              We made <Link href="/releases/cc004-peephole" className="underline decoration-1 underline-offset-4 hover:text-paper-2" style={{ color: BOO_YELLOW }}>Peephole</Link> in
              2020 — CC004 on Calm + Collect, the first time our names appeared together
              on a sleeve. Then <Link href="/releases/cc007-im-fresh" className="underline decoration-1 underline-offset-4 hover:text-paper-2" style={{ color: BOO_YELLOW }}>I&apos;m Fresh</Link> later
              that year. But the released records are a fraction of what we made. The vault
              is the truth. Every session, every late-night cut, every demo with
              the project file still open from the last time she sat at the desk.
            </p>
            <p>
              This page exists because somebody needs to hold this. For her family.
              For the people who never knew this side of her work. For my kid.
              And for me, when I need to remember what it felt like to make
              records with one of the greatest.
            </p>
          </div>
        </section>

        {/* === THE RELEASES === records on the label */}
        {releases.length > 0 && (
          <section className="px-5 sm:px-8 py-12 border-t border-paper/15 max-w-[1180px] mx-auto">
            <div
              className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
              style={{ color: BOO_YELLOW }}
            >
              THE RECORDS · ON CALM + COLLECT
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-8"
              style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
            >
              two on the label
            </h2>
            <div
              className="grid gap-5"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
            >
              {releases.map((r) => {
                const cover = r.cover ? urlFor(r.cover).width(720).height(720).fit("crop").url() : null;
                return (
                  <Link
                    key={r._id}
                    href={`/releases/${r.slug}`}
                    className="group block border border-paper transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] no-underline text-paper overflow-hidden"
                    style={{
                      ["--accent" as string]: BOO_YELLOW,
                    }}
                  >
                    <div className="aspect-square border-b border-paper bg-ink-2 overflow-hidden relative">
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
                    <div className="p-4">
                      <div className="font-mono text-[10px] tracking-[.14em] uppercase" style={{ color: BOO_YELLOW }}>
                        {r.catalogNumber ?? ""}  ·  {r.year ?? "—"}
                      </div>
                      <div className="font-display font-bold text-[22px] uppercase tracking-[-0.005em] leading-tight mt-1">
                        {r.title}
                      </div>
                      <div className="font-mono text-[10px] tracking-[.12em] uppercase text-paper-2 mt-2">
                        open the room →
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* === THE SESSIONS === every project in the vault PLUS the whole
            RTJ 3 winter tour 2017 (33 dates Nick was Boo's opener + DJ).
            Every time they sat down OR stood together on stage. The vault
            sessions are hand-curated; the tour dates come straight from the
            xlsx master so nothing's invented. */}
        <section className="px-5 sm:px-8 py-16 border-t border-paper/15 max-w-[1180px] mx-auto">
          <div
            className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
            style={{ color: BOO_YELLOW }}
          >
            THE SESSIONS + THE ROAD
          </div>
          <h2
            className="font-display font-bold uppercase m-0 mb-8"
            style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
          >
            every time we sat down
          </h2>
          {(() => {
            // Every show in the xlsx where Boo is mentioned anywhere
            // (era / support / notes / venue). Catches: the 33-date RTJ 3
            // winter tour 2017, the 6 standalone Gangsta Boo shows in 2019
            // (Brooklyn / Razzmatazz Barcelona Oct 18 2019), the Output NYC
            // 2017 night, the Halloween 2022 show, etc.
            const booShows = SHOWS.filter((sh) => {
              const hay = `${sh.era ?? ""} ${sh.support ?? ""} ${sh.notes ?? ""} ${sh.venue ?? ""}`.toLowerCase();
              return /\bboo\b|gangsta boo|lola mitchell/.test(hay);
            });

            // Build session-shaped rows. Title varies by context:
            //   RUN THE JEWELS TOUR → "RTJ 3 Tour · City"
            //   GANGSTA BOO         → "Boo Live · City" (her billed shows)
            //   ARTIST-REPORTED     → use the venue note
            //   anything else       → "Boo + Hook · City"
            const roadRows: Session[] = booShows.map((sh): Session => {
              const place = `${sh.city ?? "?"}${sh.country ? `, ${sh.country.replace(/, USA$/, "")}` : ""}`;
              let title: string;
              if (sh.era === "RUN THE JEWELS TOUR")     title = `RTJ 3 Tour · ${place}`;
              else if (sh.era === "GANGSTA BOO")        title = `Boo Live · ${place}`;
              else if (sh.era === "ARTIST-REPORTED")    title = `Boo Halloween · ${place}`;
              else                                       title = `Boo + Hook · ${place}`;

              const venueLine = sh.venue ? `${sh.venue}` : "venue tbc";
              const supportLine = sh.support && !/^Run The Jewels,?\s*Gangsta Boo$/i.test(sh.support)
                ? ` · with ${sh.support}` : "";
              const noteSuffix = sh.notes && sh.notes.length < 130 ? ` · ${sh.notes}` : "";

              return {
                title,
                date: sh.date ? formatTourDateBoo(sh.date) : (sh.year ? `${sh.year}` : "—"),
                year: sh.year ?? undefined,
                note: `${venueLine}${supportLine} · opener + DJ for Boo${noteSuffix}`,
                folder: `boo-show-${sh.date ?? sh.venue ?? Math.random()}`,
              };
            });

            // Combine hand-curated vault sessions with all the documented
            // shows, then sort chronologically (year asc, date string sub-sort).
            const combined: Session[] = [...SESSIONS, ...roadRows].sort((a, b) => {
              const yearDiff = (a.year ?? 0) - (b.year ?? 0);
              if (yearDiff !== 0) return yearDiff;
              return (a.date ?? "").localeCompare(b.date ?? "");
            });

            return (
              <>
                <p className="font-serif italic text-[16px] text-paper-2 mb-10 max-w-[700px]">
                  {SESSIONS.length} project folders from the vault · {roadRows.length} documented shows together (Brooklyn, LA, Barcelona, the RTJ 3 winter tour, every Boo-billed run) ·
                  every studio session preserved, every road night documented.
                </p>
                <ol className="list-none p-0 m-0 grid gap-3">
                  {combined.map((s, i) => {
              const inner = (
                <div className="flex items-baseline gap-4 sm:gap-6 py-4 border-b border-paper/15">
                  <div
                    className="font-mono text-[11px] tracking-[.12em] tabular-nums shrink-0 w-[14ch] sm:w-[18ch]"
                    style={{ color: BOO_YELLOW }}
                  >
                    {s.date ?? (s.year ? `${s.year}` : "—")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-[20px] sm:text-[24px] uppercase tracking-[-0.005em] leading-tight">
                      {s.title}
                    </div>
                    {s.note && (
                      <div className="font-serif italic text-[14px] sm:text-[15px] text-paper-2 mt-1 leading-snug">
                        {s.note}
                      </div>
                    )}
                  </div>
                  {s.releaseSlug && (
                    <span
                      className="font-mono text-[10px] tracking-[.14em] uppercase shrink-0"
                      style={{ color: BOO_YELLOW }}
                    >
                      open →
                    </span>
                  )}
                </div>
              );
              return (
                <li key={s.folder}>
                  {s.releaseSlug ? (
                    <Link href={`/releases/${s.releaseSlug}`} className="block group no-underline text-paper hover:bg-paper/5 transition-colors -mx-2 px-2">
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
                </ol>
              </>
            );
          })()}
        </section>

        {/* === DEDICATION === closing */}
        <section className="px-5 sm:px-8 py-20 border-t border-paper/15 max-w-[720px] mx-auto text-center">
          <div
            className="font-mono text-[10px] tracking-[.32em] uppercase mb-6"
            style={{ color: BOO_YELLOW }}
          >
            FOR LOLA
          </div>
          <p className="font-serif italic text-[18px] sm:text-[20px] leading-relaxed text-paper-2">
            &ldquo;Brooklyn-based producer Nick Hook&hellip; the studio works best when it&apos;s
            full of people.&rdquo; She made the room better every time she walked in.
            <br />— the spacepit
          </p>
          <p
            className="font-mono text-[10px] tracking-[.18em] uppercase mt-10"
            style={{ color: BOO_YELLOW, opacity: 0.75 }}
          >
            1979 — 2023
          </p>
        </section>

        {/* === PRESS — what they wrote about Boo + the work === */}
        <PressGrid
          items={press}
          accent={BOO_YELLOW}
          eyebrow="PRESS · WHAT THEY WROTE"
          heading="press"
          subhead="features, premieres, tributes. click any card to read."
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

// Parse the xlsx's mixed date formats into a tidy display string for the
// session list. Handles "11/01/2017" (d/m/y) and falls back to passthrough.
function formatTourDateBoo(d: string): string {
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    const fullYear = year < 100 ? 2000 + year : year;
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return `${months[month - 1]} ${day}, ${fullYear}`;
  }
  return d;
}
