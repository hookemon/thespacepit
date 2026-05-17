/**
 * Cubic Zirconia world. Tiombe Lockhart + Nick Hook, Brooklyn 2009–2012.
 *
 * Real data only: 9 releases (FUCK WORK → Darko), 34 documented shows in the
 * xlsx, 8 cubic-zirconia-tagged videos. Story copy is a placeholder block
 * until Nick fills it in his own words — same "no fabrication" policy as the
 * RTJ page after the BPM/Pitchfork mistake.
 */
import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { sanityFetch, urlFor } from "../../_lib/sanity";
import type { ReleaseListItem } from "../../_lib/sanity-queries";
import { CollectionJsonLd } from "../../_components/shared/CollectionJsonLd";
import { getPressForEra } from "../../_lib/sanity-queries";
import { PressGrid } from "../../_components/shared/PressGrid";
import { SHOWS } from "../../_lib/shows";
import { FOOTER_LINKS } from "../../_lib/social-links";
import { groq } from "next-sanity";

export const revalidate = 300;

export const metadata = {
  title: "cubic zirconia — tiombe lockhart × nick hook · 2009–2012",
  description:
    "every record, every show, every video. brooklyn into the global club circuit. SVG003 → LDCC006 darko.",
};

const CZ_ACCENT = "#4B2E83"; // chakra-third purple — matches /tv ch 05 + era page
const CZ_GOLD   = "#F2C84B"; // for legibility on the dark hero

export default async function CubicZirconiaWorldPage() {
  // Real releases — CZ-credited or Lockhart Dynasty × C+C catalog
  const releases = await sanityFetch<ReleaseListItem[]>(groq`
    *[_type == "release" && (
      label match "*Lockhart*" || references("artist-cubic-zirconia") ||
      title match "*FUCK WORK*" || title match "*Night Slugs*"
    )] | order(year asc, catalogNumber asc) {
      _id, title, "slug": slug.current, year, catalogNumber, format, cover, coverColor,
      "artists": artists[]->{ name, "slug": slug.current }
    }
  `);

  // Real shows tagged CZ in shows.ts (xlsx-derived)
  const shows = SHOWS.filter((sh) => /CUBIC|^CZ$/i.test(sh.era));

  // Every piece of press tagged to the CZ era (~16 pieces as of last audit).
  const press = await getPressForEra("cubic-zirconia");
  // Group by year for the chronological wall
  const byYear = new Map<number, typeof shows>();
  for (const sh of shows) {
    const y = sh.year ?? 0;
    const arr = byYear.get(y) ?? [];
    arr.push(sh);
    byYear.set(y, arr);
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <CollectionJsonLd
        path="/collabs/cubic-zirconia"
        name="Cubic Zirconia — Tiombe Lockhart × Nick Hook"
        description="Brooklyn 2009–2012. 9 releases (FUCK WORK → Darko), 34 documented shows, the Lockhart Dynasty × Calm + Collect sub-imprint."
        items={releases.map((r) => ({ slug: r.slug, title: r.title }))}
      />
      <TopNav current="nick" />
      <main className="flex-1">
        {/* === HERO === */}
        <section className="relative overflow-hidden border-b border-paper/15">
          <div className="absolute inset-0" aria-hidden style={{ background: `radial-gradient(circle at 70% 30%, ${CZ_ACCENT}55 0%, transparent 60%)` }} />
          <div className="absolute inset-0 bg-ink/40" aria-hidden />
          <div className="relative px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-[1180px] mx-auto">
            <Link
              href="/nick-hook"
              className="font-mono text-[11px] tracking-[.14em] uppercase no-underline"
              style={{ color: CZ_GOLD }}
            >
              ← nick hook
            </Link>

            <div className="mt-16 sm:mt-24">
              <div
                className="font-mono text-[11px] tracking-[.36em] uppercase mb-4"
                style={{ color: CZ_GOLD }}
              >
                TIOMBE LOCKHART × NICK HOOK · 2009–2012
              </div>
              <h1
                className="font-display font-bold uppercase m-0 leading-[0.86]"
                style={{ fontSize: "clamp(56px, 12vw, 180px)", letterSpacing: "-0.025em", color: CZ_ACCENT }}
              >
                cubic
                <br />
                zirconia
              </h1>
              <p
                className="font-serif italic mt-8 text-[18px] sm:text-[22px] max-w-[640px] leading-snug"
                style={{ color: "#F4EFE6" }}
              >
                the grimy techno-soul of brooklyn. {releases.length} records · {shows.length} documented shows · {years[0] ?? "—"}–{years[years.length - 1] ?? "—"}.
              </p>
            </div>
          </div>
        </section>

        {/* === THE STORY === placeholder ONLY. start from the beginning. */}
        <section className="px-5 sm:px-8 py-16 max-w-[760px] mx-auto">
          <div
            className="font-mono text-[11px] tracking-[.18em] uppercase mb-4"
            style={{ color: CZ_GOLD }}
          >
            THE STORY
          </div>
          <div className="border-l-2 py-3 pl-5" style={{ borderColor: CZ_GOLD }}>
            <p className="font-mono text-[11px] tracking-[.14em] uppercase mb-2" style={{ color: CZ_GOLD }}>
              [ NICK — YOUR WORDS HERE · START FROM THE BEGINNING ]
            </p>
            <p className="font-serif italic text-[16px] text-paper-2 leading-snug">
              the meeting with Tiombe · the first session · FUCK WORK landing on SVG003 in April 2009 · the LA-via-Brooklyn club run · how Lockhart Dynasty × Calm + Collect became the joint imprint · the Darko arc · the moments worth telling. None of this gets generated — only your words go here.
            </p>
          </div>
        </section>

        {/* === THE RECORDS === */}
        {releases.length > 0 && (
          <section className="px-5 sm:px-8 py-12 border-t border-paper/15 max-w-[1180px] mx-auto">
            <div
              className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
              style={{ color: CZ_GOLD }}
            >
              THE RECORDS · {releases.length}
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-8"
              style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
            >
              FUCK WORK → darko
            </h2>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
            >
              {releases.map((r) => {
                const cover = r.cover ? urlFor(r.cover).width(560).height(560).fit("crop").url() : null;
                return (
                  <Link
                    key={r._id}
                    href={`/releases/${r.slug}`}
                    className="group block border border-paper transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] no-underline text-paper overflow-hidden"
                  >
                    <div
                      className="aspect-square border-b border-paper overflow-hidden relative"
                      style={{ background: r.coverColor ?? "#1C1A17" }}
                    >
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
                      <div className="font-mono text-[10px] tracking-[.14em] uppercase" style={{ color: CZ_GOLD }}>
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

        {/* === THE VIDEOS === pointers, no embedded video clutter */}
        <section className="px-5 sm:px-8 py-12 border-t border-paper/15 max-w-[1180px] mx-auto">
          <div
            className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
            style={{ color: CZ_GOLD }}
          >
            ON THE SCREEN · 8 CUBIC ZIRCONIA VIDEOS
          </div>
          <h2
            className="font-display font-bold uppercase m-0 mb-6"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
          >
            the videos
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/watch?filter=cubic-zirconia"
              className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[.14em] uppercase px-4 py-2.5 border-2 rounded-full no-underline transition-colors"
              style={{ borderColor: CZ_ACCENT, color: "#fff", background: CZ_ACCENT }}
            >
              ▶  watch all 8 →
            </Link>
            <Link
              href="/tv"
              className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[.14em] uppercase px-4 py-2.5 border-2 rounded-full no-underline transition-colors text-paper border-paper hover:bg-paper hover:text-ink"
            >
              📺  CH 05 CZ on /tv
            </Link>
          </div>
        </section>

        {/* === THE MAIDA VALE SESSION === BBC Radio 1 live recording.
            The legitimacy moment. 4 tracks recorded live in the same room
            Bowie + The Beatles + every BBC session ever was tracked. CD
            cover art extracted from Nick's vault. */}
        <section className="px-5 sm:px-8 py-16 border-t border-paper/15 max-w-[1180px] mx-auto">
          <div
            className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
            style={{ color: CZ_GOLD }}
          >
            THE BBC SESSION · MAIDA VALE STUDIOS · LONDON
          </div>
          <h2
            className="font-display font-bold uppercase m-0 mb-3"
            style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
          >
            live at maida vale
          </h2>
          <p className="font-serif italic text-[16px] text-paper-2 mb-8 max-w-[680px] leading-snug">
            recorded at the BBC&apos;s legendary maida vale studios — the same rooms tracked bowie, the beatles, every peel session. 4 tracks live to tape.
          </p>
          <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6 sm:gap-10 items-start">
            <div className="border border-paper bg-ink-2 overflow-hidden max-w-[420px]">
              <img
                src="/cz/maida-vale.jpg"
                alt="Cubic Zirconia — Live at Maida Vale CD cover"
                className="w-full h-auto block"
              />
              <div className="px-3 py-2 font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 border-t border-paper/15">
                CUBIC ZIRCONIA · LIVE AT MAIDA VALE
              </div>
            </div>
            <ol className="list-none p-0 m-0 grid gap-0">
              {[
                { n: "01", title: "Black + Blue", note: "live · maida vale" },
                { n: "02", title: "Take Me High", note: "live · maida vale" },
                { n: "03", title: "Night Or Day", note: "ft. Bilal · live · maida vale" },
                { n: "04", title: "Josephine", note: "live · maida vale" },
              ].map((t) => (
                <li key={t.n} className="py-3 border-b border-paper/15">
                  <div className="flex items-baseline gap-4">
                    <span
                      className="font-mono text-[12px] tracking-[.06em] tabular-nums shrink-0 w-[28px]"
                      style={{ color: CZ_GOLD }}
                    >
                      {t.n}
                    </span>
                    <div className="flex-1">
                      <div className="font-display font-semibold text-[20px] sm:text-[24px] uppercase tracking-[-0.005em] leading-tight">
                        {t.title}
                      </div>
                      <div className="font-mono text-[10px] tracking-[.1em] text-paper-2 mt-1">
                        {t.note}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* (Sync section removed — Lucid In The Sky / Toyota Scion TVC
            content moved out per Nick's call.) */}

        {/* === THE GALLERY === real tour photos from the dropbox folder.
            12 hand-picked from the 67-photo "Cubic Zirconia Tour" archive. */}
        <section className="px-5 sm:px-8 py-12 border-t border-paper/15 max-w-[1180px] mx-auto">
          <div
            className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
            style={{ color: CZ_GOLD }}
          >
            THE GALLERY · 12 FROM THE TOUR ARCHIVE
          </div>
          <h2
            className="font-display font-bold uppercase m-0 mb-6"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
          >
            on the road
          </h2>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <div key={n} className="border border-paper bg-ink-2 overflow-hidden aspect-square">
                <img
                  src={`/cz/tour-${String(n).padStart(2, "0")}.jpg`}
                  alt={`Cubic Zirconia tour photo ${n}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2/60 mt-4">
            55 more shots in the vault. captions coming when Nick walks me through them.
          </p>
        </section>

        {/* === ON THE ROAD === horizontal show chips per year so years
            occupy 1-2 lines each instead of N rows. Drastically less
            vertical scroll than the old layout while still surfacing
            every documented gig. */}
        {shows.length > 0 && (
          <section className="px-5 sm:px-8 py-12 border-t border-paper/15 max-w-[1180px] mx-auto">
            <div
              className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
              style={{ color: CZ_GOLD }}
            >
              EVERY DOCUMENTED SHOW · {shows.length}
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-3"
              style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
            >
              on the road
            </h2>
            <p className="font-serif italic text-[15px] text-paper-2 mb-10 max-w-[640px]">
              pulled from your xlsx master. every entry sourced (gmail / artist / web). no invented gigs.
            </p>
            {years.map((y) => {
              const list = byYear.get(y)!;
              return (
                <section key={y} className="mb-7">
                  <h3
                    className="font-display font-bold uppercase m-0 mb-3 pb-1.5 border-b"
                    style={{ fontSize: "clamp(22px, 2.6vw, 30px)", letterSpacing: "-0.015em", borderColor: `${CZ_ACCENT}66` }}
                  >
                    {y > 0 ? y : "—"}
                    <span className="text-paper-2 font-mono text-[12px] tracking-[.14em] tabular-nums ml-3">
                      {list.length} {list.length === 1 ? "show" : "shows"}
                    </span>
                  </h3>
                  {/* Horizontal flow — chips wrap to new lines on overflow.
                      Each chip: date · city · venue (one line). */}
                  <div className="flex flex-wrap gap-1.5">
                    {list.map((sh, i) => {
                      const where = sh.city
                        ? `${sh.city}${sh.country ? `, ${sh.country.replace(/, USA$/, "")}` : ""}`
                        : sh.venue ?? "—";
                      const date = sh.date ?? "—";
                      // Pretty short date like "Mar 14" if it parses, else raw
                      const prettyDate = (() => {
                        if (!date || date === "—") return "—";
                        const d = new Date(date);
                        if (isNaN(d.getTime())) return date;
                        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      })();
                      return (
                        <span
                          key={`${date}-${sh.venue ?? "?"}-${i}`}
                          className="inline-flex items-baseline gap-2 px-2.5 py-1 border border-paper/30 rounded-full font-mono text-[11px] tracking-[.04em]"
                          title={sh.notes ? `${sh.venue ?? ""}${sh.support ? ` · with ${sh.support}` : ""}${sh.notes ? ` · ${sh.notes}` : ""}` : `${sh.venue ?? ""}${sh.support ? ` · with ${sh.support}` : ""}`}
                        >
                          <span className="tabular-nums text-paper-2 shrink-0">{prettyDate}</span>
                          <span className="text-paper truncate">{where}</span>
                          {sh.venue && (
                            <span className="text-paper-2/70 hidden sm:inline truncate max-w-[180px]">· {sh.venue}</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </section>
        )}

        {/* === PRESS — what they wrote about CZ === */}
        <PressGrid
          items={press.slice(0, 12)}
          accent={CZ_GOLD}
          eyebrow={`PRESS · ${press.length} ${press.length === 1 ? "PIECE" : "PIECES"}`}
          heading="press"
          subhead={
            press.length > 12
              ? `the top 12 reviews, premieres, and features on cubic zirconia. ${press.length - 12} more in the vault.`
              : "every review, premiere, and feature on cubic zirconia. click any card to read it."
          }
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
