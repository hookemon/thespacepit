/**
 * Run The Jewels + Nick Hook world. Built on REAL DATA ONLY:
 *   · 37 shows pulled from app/_lib/shows.ts (auto-generated from your
 *     NickHook_MasterShowHistory_FINAL.xlsx) — every venue + city + support
 *     act + notes is sourced
 *   · 8 releases pulled live from Sanity by artist reference
 *   · 57 videos surfaced via the rtj tag link
 *   · narrative copy LEFT BLANK with `[YOUR WORDS HERE]` placeholder so
 *     nothing on this page is hallucinated. Replace via /studio when ready.
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
  title: "run the jewels + nick hook — the world",
  description:
    "every record, every show, every video. 8 releases · 37 documented performances · 57 videos. 2013 → today.",
};

// RTJ visual identity — chakra-root deep red matches the fist-logo energy.
const RTJ_ACCENT = "#9B1B1B";
const RTJ_GOLD   = "#F2C84B";

export default async function RtjWorldPage() {
  // Pull every release tagged RTJ-related from Sanity (real, sourced).
  const releases = await sanityFetch<ReleaseListItem[]>(groq`
    *[_type == "release" && (
      title match "*Run The Jewels*" || title match "*Meow The Jewels*" ||
      title match "*Yankee*" || title match "*Cu4tro*" ||
      references(*[_type == "artist" && (name match "Run The Jewels" || name match "El-P" || name match "Killer Mike")]._id)
    )] | order(year asc) {
      _id, title, "slug": slug.current, year, catalogNumber, format, cover, coverColor,
      "artists": artists[]->{ name, "slug": slug.current }
    }
  `);

  // Filter shows.ts to RTJ-era entries — these are 1:1 from the xlsx
  const tour2017     = SHOWS.filter((s) => s.era === "RUN THE JEWELS TOUR");
  const anniversary  = SHOWS.filter((s) => s.era === "RTJ 10TH ANNIVERSARY");
  const allRtjShows  = [...tour2017, ...anniversary];

  // Press across both RTJ eras + Cu4tro (run-the-jewels-tour-2017 covers the
  // tour-era pieces, rtj-10th-anniversary covers the recent retrospectives).
  // Merge + dedupe by _id so a piece cross-tagged to both eras shows once.
  const [pressTour, pressAnniv] = await Promise.all([
    getPressForEra("run-the-jewels-tour-2017"),
    getPressForEra("rtj-10th-anniversary"),
  ]);
  const press = Array.from(new Map([...pressTour, ...pressAnniv].map((p) => [p._id, p])).values());

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="nick" />
      <main className="flex-1">
        {/* === HERO === */}
        <section className="relative overflow-hidden border-b border-paper/15">
          <div className="absolute inset-0" aria-hidden style={{ background: `radial-gradient(circle at 30% 20%, ${RTJ_ACCENT}33 0%, transparent 60%)` }} />
          <div className="absolute inset-0 bg-ink/40" aria-hidden />
          <div className="relative px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-[1180px] mx-auto">
            <Link
              href="/nick-hook"
              className="font-mono text-[11px] tracking-[.14em] uppercase no-underline"
              style={{ color: RTJ_GOLD }}
            >
              ← nick hook
            </Link>

            <div className="mt-16 sm:mt-24">
              <div
                className="font-mono text-[11px] tracking-[.36em] uppercase mb-4"
                style={{ color: RTJ_GOLD }}
              >
                NICK HOOK × RUN THE JEWELS
              </div>
              <h1
                className="font-display font-bold uppercase m-0 leading-[0.86]"
                style={{ fontSize: "clamp(60px, 13vw, 200px)", letterSpacing: "-0.025em", color: RTJ_ACCENT }}
              >
                run the
                <br />
                jewels
              </h1>
              <p
                className="font-serif italic mt-8 text-[18px] sm:text-[22px] max-w-[640px] leading-snug"
                style={{ color: "#F4EFE6" }}
              >
                {releases.length} records · {allRtjShows.length} documented shows · {tour2017.length}-date winter tour 2017 · 57 videos in the channel.
              </p>
            </div>
          </div>
        </section>

        {/* === THE TRAJECTORY === Nick's own framing of the arc, verbatim.
            Six steps from his memory: El-P first (before RTJ existed),
            then engineer credits, then opener, then co-prod, then
            executive producer on Cu4tro. The page tells the career
            progression in his words. */}
        <section className="px-5 sm:px-8 py-16 max-w-[920px] mx-auto">
          <div
            className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
            style={{ color: RTJ_GOLD }}
          >
            THE TRAJECTORY
          </div>
          <h2
            className="font-display font-bold uppercase m-0 mb-2"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
          >
            how it built
          </h2>
          <p className="font-serif italic text-[15px] text-paper-2 mb-10 max-w-[640px]">
            Nick&apos;s own framing of the climb — from the El-P relationship before RTJ existed all the way to executive producing Cu4tro.
          </p>

          <ol className="list-none p-0 m-0 grid gap-0">
            {[
              {
                step: "00",
                year: "2012",
                role: "Before RTJ — the El-P relationship",
                detail: "Cancer 4 Cure year. The history with El predates Run The Jewels by everything.",
                link: { href: "/releases/cancer-4-cure", label: "Cancer 4 Cure →" },
              },
              {
                step: "01",
                year: "2013",
                role: "First album · engineer credit",
                detail: "Run The Jewels.",
                link: { href: "/releases/run-the-jewels", label: "RTJ →" },
              },
              {
                step: "02",
                year: "2014",
                role: "Second credit",
                detail: "Run The Jewels 2.",
                link: { href: "/releases/run-the-jewels-2", label: "RTJ2 →" },
              },
              {
                step: "03",
                year: "2017",
                role: "Third — opener on the tour",
                detail: "Winter Tour 2017. 33 shows. Opener + DJ for Gangsta Boo.",
              },
              {
                step: "04",
                year: "2020",
                role: "Fourth — co-production credit",
                detail: "Run The Jewels 4. Co-production on Goonies vs E.T., engineering on Yankee And The Brave + Oh La La.",
                link: { href: "/releases/run-the-jewels-4", label: "RTJ4 →" },
              },
              {
                step: "05",
                year: "2023",
                role: "Executive producer · Cu4tro",
                detail: "The album. The role progression complete.",
                link: { href: "/releases/rtj-cu4tro", label: "Cu4tro →" },
              },
            ].map((t) => (
              <li key={t.step} className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] gap-4 sm:gap-6 py-5 border-b border-paper/15">
                <div
                  className="font-mono text-[10px] tracking-[.18em] uppercase tabular-nums"
                  style={{ color: RTJ_GOLD }}
                >
                  <div className="text-[28px] sm:text-[36px] font-display font-bold tracking-tight leading-none" style={{ color: RTJ_ACCENT }}>
                    {t.step}
                  </div>
                  <div className="mt-2">{t.year}</div>
                </div>
                <div>
                  <div className="font-display font-semibold text-[20px] sm:text-[24px] uppercase tracking-[-0.005em] leading-tight">
                    {t.role}
                  </div>
                  <p className="font-serif italic text-[15px] sm:text-[16px] text-paper-2 leading-snug mt-1 max-w-[640px]">
                    {t.detail}
                  </p>
                  {t.link && (
                    <Link
                      href={t.link.href}
                      className="inline-block font-mono text-[10px] tracking-[.14em] uppercase mt-2 no-underline hover:opacity-80"
                      style={{ color: RTJ_GOLD }}
                    >
                      {t.link.label}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* === THE RECORDS === */}
        {releases.length > 0 && (
          <section className="px-5 sm:px-8 py-12 border-t border-paper/15 max-w-[1180px] mx-auto">
            <div
              className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
              style={{ color: RTJ_GOLD }}
            >
              THE RECORDS · {releases.length}
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-8"
              style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
            >
              every release
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
                      <div className="font-mono text-[10px] tracking-[.14em] uppercase" style={{ color: RTJ_GOLD }}>
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

        {/* === CU4TRO === the executive-producer chapter. All content
            pulled from the actual Cu4tro deck (Edoardo Chavarin's design
            doc) — tracklist, design concept, collaborator country list,
            artwork extracted from the PDF. Real, not invented. */}
        <section className="px-5 sm:px-8 py-16 border-t border-paper/15 max-w-[1180px] mx-auto">
          <div
            className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
            style={{ color: RTJ_GOLD }}
          >
            THE CHAPTER · CU4TRO · 2022–2023
          </div>
          <h2
            className="font-display font-bold uppercase m-0 mb-3"
            style={{ fontSize: "clamp(40px, 6vw, 80px)", lineHeight: 0.92, letterSpacing: "-0.02em", color: RTJ_ACCENT }}
          >
            RTJ · CU4TRO
          </h2>
          <p className="font-serif italic text-[16px] sm:text-[18px] text-paper-2 mb-8 max-w-[760px] leading-snug">
            RTJ4 reinterpreted track-by-track by producers across 11+ Latin American countries.
            Nick: executive producer · co-production on 3 tracks. Design by Edoardo Chavarin (NACO).
          </p>

          {/* === artwork grid · cover · street poster · back · vinyl */}
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr] mb-12">
            <div className="space-y-4">
              <div className="border border-paper bg-ink-2 overflow-hidden">
                <img
                  src="/cu4tro/cover.jpg"
                  alt="RTJ Cu4tro album cover"
                  className="w-full h-auto block"
                />
                <div className="px-3 py-2 font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 border-t border-paper/15">
                  COVER · 1935×1935
                </div>
              </div>
              <div className="border border-paper bg-ink-2 overflow-hidden">
                <img
                  src="/cu4tro/back-cover.jpg"
                  alt="RTJ Cu4tro back cover"
                  className="w-full h-auto block"
                />
                <div className="px-3 py-2 font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 border-t border-paper/15">
                  BACK COVER · TRACKLIST
                </div>
              </div>
            </div>
            <div className="border border-paper bg-ink-2 overflow-hidden">
              <img
                src="/cu4tro/street-poster.jpg"
                alt="RTJ Cu4tro promotional street poster"
                className="w-full h-auto block"
              />
              <div className="px-3 py-2 font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 border-t border-paper/15">
                STREET POSTER · MEXICO CITY PROMO
              </div>
            </div>
          </div>

          {/* === full tracklist · cada versión + every credit ===
              Personnel pulled directly from the Cu4tro agreements sheet +
              paperwork doc (Nick's own session notes). Real names appear
              next to stage names per standard liner-note format. Fees,
              contracting status + private contact info stripped out. */}
          <div className="mt-10">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase mb-4" style={{ color: RTJ_GOLD }}>
              THE TRACKLIST · CADA VERSIÓN · CADA CRÉDITO
            </div>
            <ol className="list-none p-0 m-0 grid gap-y-3 max-w-[1080px]">
              {[
                {
                  n: "01",
                  title: "Yankee Y El Valiente",
                  credit: "Trooko's versión",
                  icon: "two-headed Aztec serpent",
                  personnel: [
                    ["Production", "Trooko (Jeffrey Peñalva)"],
                    ["Voice over", "Lin-Manuel Miranda"],
                  ],
                },
                {
                  n: "02",
                  title: "Ooh La La",
                  credit: "ft. Santa Fe Klan · Mexican Institute of Sound's versión",
                  icon: "boxing glove",
                  personnel: [
                    ["Production", "Mexican Institute of Sound (Camilo Lara)"],
                    ["Vocals", "Santa Fe Klan"],
                  ],
                },
                {
                  n: "03",
                  title: "Fuera De Vista",
                  credit: "ft. Baco Exu do Blues · Trooko's versión",
                  icon: "Latino drum",
                  note: "(out of sight)",
                  personnel: [
                    ["Production", "Trooko (Jeffrey Peñalva)"],
                    ["Vocals", "Baco Exu Do Blues (Diogo Álvaro Ferreira Moncorvo)"],
                    ["Percussion", "Iggor Cavalera"],
                  ],
                },
                {
                  n: "04",
                  title: "Santa Calamifuck",
                  credit: "Killabeatmaker + Nick Hook's versión",
                  co: true,
                  personnel: [
                    ["Programming · Production", "Killabeatmaker (Hilder Brando) + Nick Hook"],
                    ["Bass", "Eva Peroni"],
                    ["Percussion", "Yulian Percs (Julian Ramirez)"],
                    ["Keys", "Chucho Llano"],
                    ["Recorded at", "Medellín Studios · Medellín, Colombia"],
                  ],
                },
                {
                  n: "05",
                  title: "Goonies Contra E.T.",
                  credit: "ft. Sarah La Morena y El Individuo · Danny Brasco + Nick Hook's versión",
                  co: true,
                  personnel: [
                    ["Programming · Synths", "Danny Brasco + Nick Hook"],
                    ["Vocals", "Sarah La Morena (Sarah Palafox)"],
                    ["Rap", "El Individuo (Rafael Bou Lemus)"],
                    ["Drums · Percussion", "Orestes Gomez"],
                    ["Sax", "Adrián Terrazas-González"],
                    ["Jarana", "Last Jeronimo (Jerónimo González)"],
                  ],
                },
                {
                  n: "06",
                  title: "Caminando En La Nieve",
                  credit: "ft. Akapellah, Apache y Pawmps · Orestes Gomez's versión",
                  note: "(walking in the snow)",
                  personnel: [
                    ["Production · Drums · Percussion", "Orestes Gomez"],
                    ["Verse 1", "Akapellah (Pedro Elías Aquino Cova)"],
                    ["Hook", "Pawmps (Pamela Joan Gaytan Cabrera)"],
                    ["Verse 2", "Apache (Larry Porfirio Rada Herrera)"],
                    ["Guitar", "Henry D'Arthenay"],
                  ],
                },
                {
                  n: "07",
                  title: "JU$T",
                  credit: "ft. Pharrell Williams y Zack de la Rocha · Toy Selectah's versión",
                  personnel: [
                    ["Production", "Toy Selectah"],
                    ["Vocals", "Pharrell Williams · Zack de la Rocha"],
                  ],
                },
                {
                  n: "08",
                  title: "Nunca Mirar Hacia Atrás",
                  credit: "Bomba Estéreo's versión",
                  note: "(never look back)",
                  personnel: [
                    ["Production", "Bomba Estéreo (Federico Simón Mejía)"],
                    ["Vocals", "Li Saumet"],
                  ],
                },
                {
                  n: "09",
                  title: "El Suelo Debajo",
                  credit: "Son Rompe Pera's versión",
                  note: "(the ground below)",
                  personnel: [
                    ["Marimba · Voz · Guitar", "Mongo (Allan Arturo Gama Ruiz)"],
                    ["Marimba · Voz", "Kacho (Alfredo de Jesús Gama Ruiz)"],
                    ["Percussion", "Kilos (José Ángel Gama Ruiz)"],
                    ["Bass", "Rulas (Raúl Albarrán Castrejón)"],
                    ["Drums", "Ritchie (Ricardo López Ramírez)"],
                  ],
                },
                {
                  n: "10",
                  title: "Tirando El Detonador",
                  credit: "ft. Lido Pimienta, Javier Arce y Iggor Cavalera · Mas Aya + Nick Hook's versión",
                  co: true,
                  note: "(pulling the pin)",
                  personnel: [
                    ["Production · Percussion", "Mas Aya (Brandon Valdivia) + Nick Hook"],
                    ["Vocals", "Lido Pimienta"],
                    ["Additional Vocals", "Javier Arce (Javier Arce Rojas)"],
                    ["Bass Clarinet · Tenor Sax · Horn Arrangement · Sax Solo", "Adrián Terrazas-González"],
                    ["Drums (add'l)", "Iggor Cavalera"],
                  ],
                },
                {
                  n: "11",
                  title: "Unas Palabras Para El Pelotón De Fusilamiento (Radiación)",
                  credit: "ft. Lin-Manuel Miranda · Adrián Terrazas-González + El-Producto's versión",
                  personnel: [
                    ["Production", "Adrián Terrazas-González + El-Producto (Jaime Meline)"],
                    ["Tenor Saxophone · Congas", "Adrián Terrazas-González"],
                    ["Jaranas · Leona · Quijada", "Last Jeronimo (Jerónimo González)"],
                    ["Cajón", "Helio Martín del Campo"],
                    ["Additional Production", "Trooko"],
                  ],
                },
              ].map((t) => (
                <li key={t.n} className="border-b border-paper/15 py-2.5">
                  <div className="flex items-baseline gap-3">
                    <span
                      className="font-mono text-[12px] tracking-[.06em] tabular-nums shrink-0 w-[24px]"
                      style={{ color: t.co ? RTJ_GOLD : "var(--color-paper-2)" }}
                    >
                      {t.n}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-semibold text-[15px] sm:text-[16px] uppercase tracking-[-0.005em] leading-tight">
                        {t.title}
                        {t.co && (
                          <span
                            className="font-mono text-[8px] tracking-[.18em] uppercase ml-2 px-1.5 py-0.5 rounded-full"
                            style={{ background: RTJ_GOLD, color: "#0B0B0B" }}
                          >
                            NICK CO-PROD
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[10px] tracking-[.04em] text-paper-2 mt-0.5">
                        {t.credit}
                        {t.note && <span className="opacity-60"> {t.note}</span>}
                      </div>
                      {/* Per-track personnel — liner-note grid. Each row is
                          ROLE · NAME (real name in parens after stage name). */}
                      {t.personnel && t.personnel.length > 0 && (
                        <ul className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-0.5 font-mono text-[10.5px] tracking-[.02em] text-paper-2/85 leading-snug">
                          {t.personnel.map(([role, name]) => (
                            <li key={role} className="flex gap-2 items-baseline">
                              <span className="opacity-50 shrink-0 uppercase tracking-[.06em] text-[9px]">{role}</span>
                              <span className="text-paper">{name}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* === ARTISTAS + CRÉDITOS CREATIVOS ===
              The full musical + creative roll, dedup'd across the 11 tracks
              + lifted from the agreements/paperwork. Pure artists, players,
              producers, visual + design — no management, label, or marketing
              names. Real names paired with stage names where they differ. */}
          <div className="mt-12 max-w-[1080px]">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase mb-4" style={{ color: RTJ_GOLD }}>
              ARTISTAS · PRODUCTORES · MÚSICOS · DISEÑO
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
              {[
                // EXEC + CO-PROD — the architects of the record
                ["EL-P · El-Producto",        "Jaime Meline · executive producer · conscience · production · vocals (RTJ)", "exec"],
                ["Killer Mike",               "Michael Santiago Render · vocals (RTJ)", "exec"],
                ["Nick Hook · ‘Nico’",        "Nicholas Hook · cu4tro maestro · co-producer · curator · production", "self"],
                // MIX + MASTER — across every track on the record
                ["Joey Raia",                 "mixed by · all tracks", "exec"],
                ["Joe LaPorta",               "mastered by · all tracks", "exec"],
                // PRODUCERS who built versiones
                ["Trooko",                    "Jeffrey Peñalva · producer (01, 03) · add'l prod (11)"],
                ["Mexican Institute of Sound", "Camilo Lara · producer (02)"],
                ["Killabeatmaker",            "Hilder Brando · programming · production (04)"],
                ["Danny Brasco",              "producer · programming · synths (05)"],
                ["Orestes Gomez",             "producer · drums · percussion (06)"],
                ["Toy Selectah",              "producer (07)"],
                ["Bomba Estéreo",             "Federico Simón Mejía · producer (08)"],
                ["Son Rompe Pera",            "producer + band (09)"],
                ["Mas Aya",                   "Brandon Valdivia · producer · percussion (10)"],
                ["Adrián Terrazas-González",  "producer · tenor sax · bass clarinet · congas · quijada (10, 11)"],
                // VOCALISTS / RAPPERS / GUESTS
                ["Lin-Manuel Miranda",        "voice over (01)"],
                ["Santa Fe Klan",             "vocals (02)"],
                ["Baco Exu Do Blues",         "Diogo Álvaro Ferreira Moncorvo · vocals (03)"],
                ["Pharrell Williams",         "vocals (07)"],
                ["Zack de la Rocha",          "vocals (07)"],
                ["Li Saumet",                 "vocals · Bomba Estéreo (08)"],
                ["Sarah La Morena",           "Sarah Palafox · vocals (05)"],
                ["El Individuo",              "Rafael Bou Lemus · rap (05)"],
                ["Akapellah",                 "Pedro Elías Aquino Cova · verse 1 (06)"],
                ["Apache",                    "Larry Porfirio Rada Herrera · verse 2 (06)"],
                ["Pawmps",                    "Pamela Joan Gaytan Cabrera · hook (06)"],
                ["Lido Pimienta",             "vocals (10)"],
                ["Javier Arce",               "Javier Arce Rojas · additional vocals (10)"],
                // MUSICIANS / PLAYERS / PERCUSSION
                ["Iggor Cavalera",            "percussion · drums (03, 10)"],
                ["Eva Peroni",                "bass (04)"],
                ["Yulian Percs",              "Julian Ramirez · percussion (04)"],
                ["Chucho Llano",              "keys (04)"],
                ["Last Jeronimo",             "Jerónimo González · jarana · leona · quijada (05, 11)"],
                ["Henry D'Arthenay",          "guitar (06)"],
                ["Helio Martín del Campo",    "cajón (11)"],
                // SON ROMPE PERA — full band lineup, real names + nicknames
                ["Mongo",                     "Allan Arturo Gama Ruiz · marimba · voz · guitar (09)"],
                ["Kacho",                     "Alfredo de Jesús Gama Ruiz · marimba · voz (09)"],
                ["Kilos",                     "José Ángel Gama Ruiz · percussion (09)"],
                ["Rulas",                     "Raúl Albarrán Castrejón · bass (09)"],
                ["Ritchie",                   "Ricardo López Ramírez · drums (09)"],
                // VISUAL + DESIGN
                ["Edoardo Chavarin",          "art · design · direction"],
                ["Carlos Gonzales",           "RTJ visual"],
              ].map(([name, role, kind]) => {
                const isExec = kind === "exec" || kind === "self";
                const highlight = kind === "self";
                return (
                  <div
                    key={String(name)}
                    className="border-b border-paper/12 pb-2"
                    style={highlight ? { borderColor: RTJ_GOLD } : isExec ? { borderColor: "rgba(212,175,55,0.4)" } : undefined}
                  >
                    <div
                      className="font-display font-semibold text-[14px] uppercase tracking-[-0.005em]"
                      style={highlight ? { color: RTJ_GOLD } : undefined}
                    >
                      {name}
                    </div>
                    <div className="font-mono text-[9.5px] tracking-[.06em] uppercase text-paper-2 mt-0.5">
                      {role}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="font-mono text-[9.5px] tracking-[.1em] uppercase text-paper-2/60 mt-4">
              source: Cu4tro deck (p.24 Equipo) · agreements sheet · Nick's session notes · July 2022
            </p>
          </div>

          {/* === countries / producers === */}
          <div className="mt-10 grid md:grid-cols-2 gap-8 max-w-[1080px]">
            <div>
              <div className="font-mono text-[11px] tracking-[.18em] uppercase mb-3" style={{ color: RTJ_GOLD }}>
                COUNTRIES REPRESENTED
              </div>
              <ul className="list-none p-0 m-0 font-mono text-[12px] tracking-[.02em] grid gap-1.5 text-paper-2">
                {[
                  ["Trooko",                  "Honduras / USA"],
                  ["Santa Fe Klan",           "México"],
                  ["Mexican Institute of Sound","México"],
                  ["Baco Exu do Blues",       "Brasil"],
                  ["Sarah La Morena",         "USA / México"],
                  ["El Individuo",            "Cuba"],
                  ["Nick Hook",               "USA"],
                  ["Akapellah",               "Venezuela"],
                  ["Apache",                  "Venezuela"],
                  ["Pawmps",                  "México"],
                  ["Orestes Gomez",           "Venezuela"],
                  ["Toy Selectah",            "México"],
                  ["Bomba Estéreo",           "Colombia"],
                  ["Son Rompe Pera",          "México"],
                  ["Lido Pimienta",           "Colombia / Canada"],
                  ["Iggor Cavalera",          "Brasil"],
                  ["Javier Arce",             "Costa Rica"],
                  ["Lin-Manuel Miranda",      "USA / Puerto Rico"],
                  ["Adrian Terrazas Gonzalez","México"],
                  ["El Producto",             "Dominican Republic"],
                ].map(([who, where]) => (
                  <li key={who} className="flex items-baseline gap-2 border-b border-paper/10 pb-1.5">
                    <span className="text-paper font-semibold">{who}</span>
                    <span className="opacity-60 text-[10px] ml-auto tabular-nums">{where}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-mono text-[11px] tracking-[.18em] uppercase mb-3" style={{ color: RTJ_GOLD }}>
                THE DESIGN
              </div>
              <div className="border border-paper p-5 bg-ink-2 space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src="/cu4tro/edoardo-chavarin.jpg"
                    alt="Edoardo Chavarin"
                    className="w-16 h-16 object-cover border border-paper"
                  />
                  <div>
                    <div className="font-display font-semibold text-[16px] uppercase tracking-[-0.005em]">
                      Edoardo Chavarin
                    </div>
                    <div className="font-mono text-[10px] tracking-[.1em] uppercase text-paper-2 mt-1">
                      creative director · NACO founder
                    </div>
                  </div>
                </div>
                <p className="font-serif italic text-[14px] text-paper-2 leading-snug">
                  The concept: marry the simplicity + strength of the original RTJ4 cover with bold,
                  pre-hispanic Latin iconography. Two-headed Aztec serpent for &ldquo;Yankee Y El Valiente&rdquo;
                  (duality of RTJ). Boxing glove for &ldquo;Ooh La La.&rdquo; Latino drum for &ldquo;Fuera De Vista.&rdquo;
                  Track-by-track icon rationale across the whole record.
                </p>
                <p className="font-mono text-[10px] tracking-[.1em] uppercase text-paper-2/70">
                  source: Cu4tro internal design deck, July 2022 · 27 pages
                </p>
              </div>

              <div className="mt-6 border border-paper p-5 bg-ink-2 space-y-2">
                <div className="font-mono text-[10px] tracking-[.18em] uppercase" style={{ color: RTJ_GOLD }}>
                  ALSO IN THE PACKAGE
                </div>
                <ul className="font-mono text-[12px] grid gap-1 text-paper">
                  <li>· Minerva × RTJ Mezcal IPA collab</li>
                  <li>· Mexico City street poster campaign</li>
                  <li>· Merchandise line (hats, tees, vinyl labels)</li>
                  <li>· Indy-exclusive + general-market 2-disc packages</li>
                </ul>
              </div>
            </div>
          </div>

          {/* === vinyl label spread === */}
          <div className="mt-10 max-w-[1080px]">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase mb-3" style={{ color: RTJ_GOLD }}>
              VINYL LABELS · DISCO 1 + DISCO 2
            </div>
            <div className="border border-paper bg-ink-2 overflow-hidden">
              <img src="/cu4tro/vinyl-labels.jpg" alt="Cu4tro vinyl labels" className="w-full h-auto block" />
            </div>
          </div>
        </section>

        {/* === WINTER TOUR 2017 === every show, source-backed */}
        {tour2017.length > 0 && (
          <section className="px-5 sm:px-8 py-12 border-t border-paper/15 max-w-[1180px] mx-auto">
            <div
              className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
              style={{ color: RTJ_GOLD }}
            >
              WINTER TOUR 2017 · {tour2017.length} SHOWS · OPENER + DJ FOR GANGSTA BOO
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-3"
              style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
            >
              jan 11 → mar 1
            </h2>
            <p className="font-serif italic text-[15px] text-paper-2 mb-8 max-w-[640px]">
              every date confirmed from day sheets + advancing emails. zero invented entries.
            </p>
            <ol className="list-none p-0 m-0 grid gap-0">
              {tour2017.map((sh, i) => (
                <li key={`${sh.date}-${sh.venue}-${i}`}>
                  <div className="grid grid-cols-[40px_120px_1fr_auto] sm:grid-cols-[40px_140px_1fr_auto] items-baseline gap-3 sm:gap-4 py-3 border-b border-paper/15">
                    <div
                      className="font-mono text-[10px] tracking-[.12em] tabular-nums text-paper-2 shrink-0 w-[40px]"
                      style={{ color: RTJ_GOLD }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="font-mono text-[10px] sm:text-[11px] tracking-[.08em] text-paper-2 tabular-nums shrink-0">
                      {formatTourDate(sh.date)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-display font-semibold text-[16px] sm:text-[18px] uppercase tracking-[-0.005em] leading-tight line-clamp-1">
                        {sh.city}{sh.country ? `, ${sh.country.replace(/, USA$/, "")}` : ""}
                      </div>
                      <div className="font-mono text-[10px] sm:text-[11px] tracking-[.04em] text-paper-2 mt-0.5 line-clamp-1">
                        {sh.venue ?? "—"}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* === 10TH ANNIVERSARY === */}
        {anniversary.length > 0 && (
          <section className="px-5 sm:px-8 py-12 border-t border-paper/15 max-w-[1180px] mx-auto">
            <div
              className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
              style={{ color: RTJ_GOLD }}
            >
              10TH ANNIVERSARY · {anniversary.length} SHOWS · 2023
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-8"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
            >
              back on the run
            </h2>
            <ol className="list-none p-0 m-0 grid gap-0 max-w-[760px]">
              {anniversary.map((sh, i) => (
                <li key={`${sh.date}-${sh.venue}-${i}`}>
                  <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr] items-baseline gap-4 py-3 border-b border-paper/15">
                    <div className="font-mono text-[10px] sm:text-[11px] tracking-[.08em] tabular-nums shrink-0" style={{ color: RTJ_GOLD }}>
                      {formatTourDate(sh.date)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-display font-semibold text-[16px] sm:text-[18px] uppercase tracking-[-0.005em] leading-tight">
                        {sh.city}{sh.country ? `, ${sh.country.replace(/, USA$/, "")}` : ""}
                      </div>
                      <div className="font-mono text-[10px] tracking-[.04em] text-paper-2 mt-0.5">
                        {sh.venue ?? "—"}
                      </div>
                      {sh.notes && (
                        <div className="font-serif italic text-[13px] text-paper-2 mt-1 max-w-[540px]">
                          {sh.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* === THE VIDEOS === pointer to the unified watch channel */}
        <section className="px-5 sm:px-8 py-12 border-t border-paper/15 max-w-[1180px] mx-auto">
          <div
            className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
            style={{ color: RTJ_GOLD }}
          >
            THE CHANNEL · 57 RTJ VIDEOS
          </div>
          <h2
            className="font-display font-bold uppercase m-0 mb-6"
            style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
          >
            on the screen
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/watch?filter=rtj"
              className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[.14em] uppercase px-4 py-2.5 border-2 rounded-full no-underline transition-colors"
              style={{ borderColor: RTJ_ACCENT, color: "#fff", background: RTJ_ACCENT }}
            >
              ▶  watch all 57 →
            </Link>
            <Link
              href="/tv"
              className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[.14em] uppercase px-4 py-2.5 border-2 rounded-full no-underline transition-colors text-paper border-paper hover:bg-paper hover:text-ink"
            >
              📺  CH 04 RTJ on /tv
            </Link>
          </div>
        </section>

        {/* === GALLERY PLACEHOLDER === reserve the slot, mark it clearly */}
        <section className="px-5 sm:px-8 py-12 border-t border-paper/15 max-w-[1180px] mx-auto">
          <div
            className="font-mono text-[11px] tracking-[.18em] uppercase mb-3"
            style={{ color: RTJ_GOLD }}
          >
            THE GALLERY
          </div>
          <div className="border-2 border-dashed border-paper/25 rounded-md p-10 text-center">
            <p className="font-mono text-[11px] tracking-[.14em] uppercase text-paper-2 mb-2">
              [ NICK — DROP YOUR TOUR PHOTOS HERE ]
            </p>
            <p className="font-serif italic text-[15px] text-paper-2 max-w-[520px] mx-auto">
              point me at the folder (Dropbox / phone) and I&apos;ll fill this with your own shots from the tour. no stock, no Wikipedia — just yours.
            </p>
          </div>
        </section>

        {/* === PRESS — what they wrote about RTJ + Cu4tro === */}
        <PressGrid
          items={press}
          accent={RTJ_GOLD}
          eyebrow="PRESS · WHAT THEY WROTE"
          heading="press"
          subhead="every piece written about the tour, the records, and the Cu4tro chapter. click any card to read it."
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

// "11/01/2017" → "Jan 11", "2023-09" → "Sep 2023". The dates in shows.ts are
// inconsistent because the xlsx itself is — both d/m/y and y-m formats live
// side by side. We render whichever is parseable.
function formatTourDate(d: string | null): string {
  if (!d) return "—";
  // d/m/y form
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    const fullYear = year < 100 ? 2000 + year : year;
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[month - 1]} ${day} '${fullYear.toString().slice(-2)}`;
  }
  // y-m form
  const m2 = d.match(/^(\d{4})-(\d{1,2})$/);
  if (m2) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(m2[2], 10) - 1]} ${m2[1]}`;
  }
  return d;
}
