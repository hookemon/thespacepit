import { notFound } from "next/navigation";
import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { PortableText } from "../../_components/shared/PortableText";
import { getProjectBySlug, getProjectSlugs, getVideosForEra, getPressForEra } from "../../_lib/sanity-queries";
import { RelatedVideos } from "../../_components/shared/RelatedVideos";
import { PressGrid } from "../../_components/shared/PressGrid";
import { urlFor } from "../../_lib/sanity";
import { FOOTER_LINKS } from "../../_lib/social-links";
import { SHOWS } from "../../_lib/shows";
import { getVideosFromPlaylist } from "../../_lib/youtube";
import { VideoPlaylist } from "../../_components/shared/VideoPlaylist";
import { HorizontalJourney } from "./HorizontalJourney";
import { CollageEra } from "./CollageEra";

// Era slug → curated YouTube playlist on @thespacepit. Renders an embedded
// playlist + thumbnail rail in the era page. Add an entry once Nick
// curates a per-era playlist.
const ERA_SLUG_TO_YT_PLAYLIST: Record<string, string> = {
  "men-women-children": "PLMXEKDUSbulNyFibYJR2I2I0EnPpLp_ts",
};

// Era slug → SHOWS.era pattern (the xlsx-master era label is upper-case
// and doesn't always match the project slug 1:1). Only listed eras get a
// shows section; others fall back to the era's tour-highlights array.
const ERA_SLUG_TO_SHOWS_PATTERN: Record<string, RegExp> = {
  "men-women-children": /MEN WOMEN/i,
  "cubic-zirconia":     /CUBIC ZIRCONIA/i,
  "gangsta-boo-live-studio": /GANGSTA BOO/i,
  "run-the-jewels-tour-2017": /RUN THE JEWELS TOUR/i,
};

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) return { title: "era not found" };
  return { title: `${p.name} — era`, description: p.tagline };
}

const SOCIALS = [
  { key: "bandcampUrl" as const, label: "bandcamp" },
  { key: "spotifyUrl" as const, label: "spotify" },
  { key: "youtubeUrl" as const, label: "youtube" },
  { key: "websiteUrl" as const, label: "website" },
];

// /watch filters by VIDEO TAG, not era slug, and a couple of legacy tags
// don't match their era slug 1:1 (mwc / men-women-children, etc.). Most
// eras line up — cubic-zirconia, spiritual-friendship, rtj, dam-funk all
// share a slug and a tag — so we only override the divergent ones.
const ERA_SLUG_TO_VIDEO_TAG: Record<string, string> = {
  "men-women-children": "mwc",
};

export default async function EraPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) notFound();
  const videos = await getVideosForEra(slug);
  // Era-tagged press (richer + more complete than the project's inline
  // pressQuotes array). Renders below the inline-quote highlights when
  // there are items.
  const eraPress = await getPressForEra(slug);
  // Curated YouTube playlist for the era (when Nick has one). Pulled live
  // from YT, cached for an hour by the helper.
  const eraPlaylistId = ERA_SLUG_TO_YT_PLAYLIST[slug];
  const eraVideos = eraPlaylistId ? await getVideosFromPlaylist(eraPlaylistId, 50) : [];
  // Full xlsx-sourced show history for eras that have one (MWC, CZ, etc.)
  const showPattern = ERA_SLUG_TO_SHOWS_PATTERN[slug];
  const eraShows = showPattern ? SHOWS.filter((sh) => showPattern.test(sh.era ?? "")) : [];
  const showsByYear = new Map<number, typeof eraShows>();
  for (const sh of eraShows) {
    const y = sh.year ?? 0;
    const arr = showsByYear.get(y) ?? [];
    arr.push(sh);
    showsByYear.set(y, arr);
  }
  const showYears = [...showsByYear.keys()].sort((a, b) => a - b);

  // Branch on layoutVariant — most eras render with the default vertical
  // page below; CZ + Boo (set in their project doc) get bespoke layouts.
  if (p.layoutVariant === "horizontal-journey") {
    return (
      <div className="bg-ink text-paper min-h-screen">
        <TopNav current="nick" />
        <HorizontalJourney
          era={{ ...p, slug }}
          eraPhotos={p.eraPhotos}
          ariaLabel={`${p.name} — left-to-right journey`}
        />
      </div>
    );
  }
  if (p.layoutVariant === "collage") {
    return (
      <div className="bg-ink text-paper min-h-screen flex flex-col">
        <TopNav current="nick" />
        <main className="flex-1">
          <CollageEra era={p} eraPhotos={p.eraPhotos} videos={videos} />
        </main>
        <Footer
          theme="dark"
          signoff="rip gangsta boo 🌹"
          meta="memorial vault · jan 2023"
          links={[...FOOTER_LINKS.nick]}
        />
      </div>
    );
  }

  const cover = p.cover ? urlFor(p.cover).width(1200).height(800).fit("crop").url() : null;
  const years = p.yearStart ? (p.yearEnd ? `${p.yearStart}–${p.yearEnd}` : `${p.yearStart} → ∞`) : "";

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="nick" />
      <main className="flex-1">
        <article>
          <header className="relative px-6 sm:px-8 py-16 border-b border-paper overflow-hidden min-h-[560px] flex items-center" style={{ background: p.color ?? "#1C1A17" }}>
            {/* MOSAIC BACKGROUND — when this era has 5+ photos tagged to it,
                the hero becomes a wall of context: every photo from the era
                tiled at varying sizes with a duotone treatment matching the
                era color. The text content sits inside a translucent panel
                so it stays readable. When < 5 photos, falls back to the
                single cover image (or color block) as before. */}
            {(() => {
              const photos = p.eraPhotos ?? [];
              if (photos.length >= 5) {
                // Take up to 24 photos, varying sizes for a flyer-wall feel.
                // Slight rotation per tile to read as taped-up artifacts.
                const tiles = photos.slice(0, 24);
                return (
                  <>
                    <div
                      aria-hidden
                      className="absolute inset-0 grid gap-1 opacity-90"
                      style={{
                        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                        gridAutoRows: "180px",
                      }}
                    >
                      {tiles.map((ph, i) => {
                        const src = urlFor(ph.image).width(440).height(440).fit("crop").url();
                        // Every 3rd tile spans 2 cells for visual rhythm
                        const span2 = i % 5 === 2;
                        const rot = ((i * 37) % 7) - 3; // -3..+3 deg
                        return (
                          <div
                            key={ph._id}
                            className="overflow-hidden"
                            style={{
                              gridColumn: span2 ? "span 2" : undefined,
                              gridRow: span2 ? "span 2" : undefined,
                              transform: `rotate(${rot * 0.4}deg)`,
                            }}
                          >
                            <img
                              src={src}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover"
                              style={{
                                // Duotone-ish: grayscale + slight contrast +
                                // hue shift toward the era color via mix.
                                filter: "grayscale(100%) contrast(1.1) brightness(0.7)",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {/* Color wash matching the era palette so the mosaic
                        reads as one cohesive surface instead of a chaotic
                        photo grid. */}
                    <div
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(180deg, ${p.color ?? "#1C1A17"}cc 0%, ${p.color ?? "#1C1A17"}ee 100%)`,
                        mixBlendMode: "multiply",
                      }}
                    />
                    <div aria-hidden className="absolute inset-0 bg-ink/30" />
                  </>
                );
              }
              // Fallback — original single-cover hero for eras with < 5 photos
              if (cover) {
                return (
                  <>
                    <img src={cover} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-ink/55" />
                  </>
                );
              }
              return null;
            })()}
            <div className="relative max-w-[1180px] mx-auto">
              <Link href="/eras" className="font-mono text-[11px] tracking-[.14em] uppercase text-paper hover:opacity-70 no-underline">
                ← back to eras
              </Link>
              <div className="font-mono text-[11px] tracking-[.14em] uppercase text-paper mt-6 mb-2">
                {years}{p.kind && years ? " · " : ""}{p.kind}
              </div>
              {p.wordmark ? (
                // Wordmark image takes precedence over the text headline.
                // Used for projects with a distinctive logotype (Cubic Zirconia's
                // geometric wordmark from the Josephine cover). Sized by
                // viewport width so it scales like the H1 would. Alt is the
                // project name so screen readers still get the semantic title.
                <h1 className="m-0 mt-2">
                  <img
                    src={urlFor(p.wordmark).width(1600).fit("max").url()}
                    alt={p.name}
                    className="block max-w-full h-auto"
                    style={{ width: "min(900px, 88vw)" }}
                  />
                </h1>
              ) : (
                <h1
                  className="font-display font-bold uppercase m-0 text-paper"
                  style={{ fontSize: "clamp(48px, 10vw, 160px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
                >
                  {p.name}
                </h1>
              )}
              {p.tagline && <p className="font-serif italic text-[22px] mt-4 max-w-[720px] text-paper-2">{p.tagline}</p>}

              <div className="flex flex-wrap gap-2 mt-6">
                {SOCIALS.map((s) => {
                  const url = p[s.key];
                  if (!url) return null;
                  return (
                    <a
                      key={s.key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] tracking-[.1em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline"
                    >
                      {s.label} →
                    </a>
                  );
                })}
              </div>

              {/* Portal nav — every era is its own world. These three pills jump
                  you into the master rooms (catalog / press / videos) pre-filtered
                  to just this era. Treated as bigger / more prominent than the
                  external social links above so the era reads as a destination,
                  not a dead end. */}
              <div className="mt-7 flex flex-wrap gap-2.5">
                <Link
                  href={`/catalog?era=${slug}`}
                  className="font-mono text-[11px] tracking-[.14em] uppercase px-4 py-2 bg-redline text-paper border border-paper hover:bg-paper hover:text-ink transition-colors no-underline"
                >
                  catalog →
                </Link>
                <Link
                  href={`/press?era=${slug}`}
                  className="font-mono text-[11px] tracking-[.14em] uppercase px-4 py-2 bg-collect text-paper border border-paper hover:bg-paper hover:text-ink transition-colors no-underline"
                >
                  press →
                </Link>
                <Link
                  href={`/watch?filter=${ERA_SLUG_TO_VIDEO_TAG[slug] ?? slug}`}
                  className="font-mono text-[11px] tracking-[.14em] uppercase px-4 py-2 bg-ink text-paper border border-paper hover:bg-paper hover:text-ink transition-colors no-underline"
                >
                  videos →
                </Link>
                {eraShows.length > 0 && (
                  <a
                    href="#shows"
                    className="font-mono text-[11px] tracking-[.14em] uppercase px-4 py-2 bg-ink text-paper border border-paper hover:bg-paper hover:text-ink transition-colors no-underline"
                  >
                    shows ↓
                  </a>
                )}
              </div>
            </div>
          </header>

          <div className="px-6 sm:px-8 py-12 max-w-[1180px] mx-auto">
            {/* === CURRENT STATUS BANNER === MWC-specific for now: announce
                that the band is active again after a 20-year break. Hardcoded
                because no other era has this need yet — extract to a Sanity
                field if a second era needs it. */}
            {slug === "men-women-children" && (
              <section className="mb-12 border-2 border-redline px-5 sm:px-7 py-5 sm:py-6">
                <div className="font-mono text-[10px] sm:text-[11px] tracking-[.18em] uppercase text-redline mb-2">
                  NEW MUSIC · INCOMING
                </div>
                <p
                  className="font-display font-bold uppercase leading-[0.95] m-0"
                  style={{ fontSize: "clamp(22px, 3.4vw, 36px)", letterSpacing: "-0.01em" }}
                >
                  currently working on new music for the first time in 20 years. we will be current again soon.
                </p>
              </section>
            )}

            {p.story && Array.isArray(p.story) && p.story.length > 0 && (
              <section className="max-w-[720px]">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-3">THE STORY</div>
                <PortableText value={p.story} />
              </section>
            )}

            {p.members && p.members.length > 0 && (
              <section className="mt-12 max-w-[720px]">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-4">MEMBERS</div>
                <div className="flex flex-wrap gap-2">
                  {p.members.map((m) => (
                    <Link
                      key={m.slug}
                      href={`/artists/${m.slug}`}
                      className="font-mono text-[11px] tracking-[.1em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline"
                    >
                      {m.name} →
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {p.pressQuotes && p.pressQuotes.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-6">PRESS</div>
                <div className="grid gap-6 md:grid-cols-2">
                  {p.pressQuotes.map((q) => {
                    const inner = (
                      <>
                        <div
                          className="font-serif italic text-paper leading-snug"
                          style={{ fontSize: "clamp(20px, 2.4vw, 28px)", letterSpacing: "-0.005em" }}
                        >
                          &ldquo;{q.quote}&rdquo;
                        </div>
                        <div className="font-mono text-[11px] tracking-[.14em] uppercase text-on-dark mt-4">
                          — {q.source}{q.year ? ` · ${q.year}` : ""}
                        </div>
                      </>
                    );
                    return q.url ? (
                      <a
                        key={q._id}
                        href={q.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border border-paper p-6 transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#E83A1C] no-underline"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div key={q._id} className="border border-paper p-6">
                        {inner}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {p.tourHighlights && p.tourHighlights.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-6">TOUR HIGHLIGHTS</div>
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                  {p.tourHighlights.map((t, i) => (
                    <div key={i} className="border border-paper p-5">
                      <div className="font-mono text-[10px] tracking-[.16em] uppercase text-on-dark mb-2">
                        {[t.year, t.kind].filter(Boolean).join(" · ")}
                      </div>
                      <div
                        className="font-display font-semibold uppercase leading-tight"
                        style={{ fontSize: "clamp(18px, 2vw, 22px)", letterSpacing: "-0.005em" }}
                      >
                        {t.title}
                      </div>
                      {t.note && (
                        <div className="font-serif italic text-[14px] text-paper-2 mt-2 leading-snug">
                          {t.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {p.releases && p.releases.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-4">RELEASES</div>
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                  {p.releases.map((r) => {
                    const cv = r.cover ? urlFor(r.cover).width(440).height(440).fit("crop").url() : null;
                    // Build the platform-link row from whatever this release has
                    // populated. Each link is its own clickable target so the
                    // visitor can listen straight from the era page without
                    // clicking through to the release detail. Surfaces only
                    // platforms that actually have a URL on this release.
                    const platforms: { href: string; label: string }[] = [];
                    if (r.spotifyUrl)      platforms.push({ href: r.spotifyUrl,      label: "spotify" });
                    if (r.appleMusicUrl)   platforms.push({ href: r.appleMusicUrl,   label: "apple" });
                    if (r.youtubeMusicUrl) platforms.push({ href: r.youtubeMusicUrl, label: "yt music" });
                    if (r.tidalUrl)        platforms.push({ href: r.tidalUrl,        label: "tidal" });
                    if (r.deezerUrl)       platforms.push({ href: r.deezerUrl,       label: "deezer" });
                    if (r.amazonMusicUrl)  platforms.push({ href: r.amazonMusicUrl,  label: "amazon" });
                    if (r.bandcampUrl)     platforms.push({ href: r.bandcampUrl,     label: "bandcamp" });
                    return (
                      <div
                        key={r._id}
                        className="border border-paper p-3.5 transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#E83A1C]"
                      >
                        <Link
                          href={`/releases/${r.slug}`}
                          className="block no-underline text-paper"
                        >
                          <div className="aspect-square border border-paper mb-3 overflow-hidden" style={{ background: r.coverColor ?? "#1C1A17" }}>
                            {cv && <img src={cv} alt={r.title} className="w-full h-full object-cover" />}
                          </div>
                          <div className="font-display font-bold text-[18px] uppercase leading-none">{r.title}</div>
                          {r.year && <div className="font-mono text-[10px] tracking-[.1em] uppercase text-on-dark mt-1.5">{r.year}</div>}
                        </Link>
                        {platforms.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {platforms.map((pl) => (
                              <a
                                key={pl.label}
                                href={pl.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[9px] tracking-[.14em] uppercase px-2 py-0.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline"
                              >
                                {pl.label} ↗
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {p.mixes && p.mixes.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-4">MIXES</div>
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                  {p.mixes.map((m) => {
                    const cv = m.cover ? urlFor(m.cover).width(440).height(440).fit("crop").url() : null;
                    return (
                      <Link
                        key={m._id}
                        href={`/mixes/${m.slug}`}
                        className="block border border-paper transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#E83A1C] no-underline text-paper"
                      >
                        <div className="aspect-square overflow-hidden bg-ink-2">
                          {cv && <img src={cv} alt={m.title} className="w-full h-full object-cover" />}
                        </div>
                        <div className="p-3">
                          <div className="font-display font-bold text-[16px] uppercase leading-none">{m.title}</div>
                          {m.date && <div className="font-mono text-[10px] tracking-[.1em] uppercase text-on-dark mt-1.5">{m.date}</div>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {p.timeline && p.timeline.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-6">TIMELINE</div>
                <ol className="border-l border-paper/40 pl-6 space-y-6">
                  {p.timeline.map((m, i) => (
                    <li key={i} className="relative">
                      <span
                        aria-hidden
                        className="absolute -left-[31px] top-2 w-3 h-3 bg-redline border border-paper"
                      />
                      <div className="font-mono text-[11px] tracking-[.16em] uppercase text-on-dark">
                        {[m.month, m.year].filter(Boolean).join(" ")}
                      </div>
                      <div
                        className="font-display font-semibold uppercase leading-tight mt-1"
                        style={{ fontSize: "clamp(18px, 2.2vw, 24px)", letterSpacing: "-0.005em" }}
                      >
                        {m.milestone}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* === EVERY DOCUMENTED SHOW === xlsx-sourced. Only renders for
                eras with show data mapped at the top of the file. Each year
                is a <details> — folded by default so 183 shows don't infinite-
                scroll. Visitors see year totals + can expand whichever year
                interests them. */}
            {eraShows.length > 0 && (
              <section id="shows" className="mt-16 scroll-mt-12">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-3">
                  EVERY DOCUMENTED SHOW · {eraShows.length}
                </div>
                <h2
                  className="font-display font-bold uppercase m-0 mb-3"
                  style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
                >
                  {eraShows.length} dates · {showYears[showYears.length - 1] - showYears[0] + 1} years
                </h2>
                <p className="font-serif italic text-[14px] text-paper-2 mb-8 max-w-[640px]">
                  click any year to expand the full date list.
                </p>
                <div className="space-y-2">
                  {showYears.map((y) => {
                    const list = showsByYear.get(y)!;
                    return (
                      <details key={y} className="group border-b border-paper/15 last:border-b-0">
                        <summary
                          className="list-none cursor-pointer flex items-baseline justify-between gap-4 py-3 hover:bg-paper/5 transition-colors px-1"
                        >
                          <span
                            className="font-display font-bold uppercase"
                            style={{ fontSize: "clamp(22px, 2.6vw, 30px)", letterSpacing: "-0.02em" }}
                          >
                            {y > 0 ? y : "—"}
                          </span>
                          <span className="font-mono text-[11px] tracking-[.16em] uppercase text-paper-2 tabular-nums">
                            {list.length} shows
                            <span aria-hidden className="inline-block ml-3 text-redline transition-transform group-open:rotate-90">▸</span>
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

            {/* === THE VIDEOS === curated YouTube playlist for the era, pulled
                live. Only renders when ERA_SLUG_TO_YT_PLAYLIST has an entry. */}
            {eraVideos.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-3">
                  ON THE SCREEN · {eraVideos.length} VIDEOS
                </div>
                <h2
                  className="font-display font-bold uppercase m-0 mb-6"
                  style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
                >
                  the videos
                </h2>
                <VideoPlaylist
                  items={eraVideos.map((v) => ({
                    url: `https://www.youtube.com/watch?v=${v.id}`,
                    title: v.title,
                  }))}
                  accent={p.color ?? "#E83A1C"}
                  eyebrow={`PLAYLIST · ${eraVideos.length} VIDEOS`}
                />
              </section>
            )}

            {/* === PRESS ARCHIVE === every press piece tagged to this era.
                The inline pressQuotes block above is a curated quote-pulls
                view; this is the full archive of articles you can click
                through. Falls silent when no era-tagged press exists. */}
            {eraPress.length > 0 && (
              <div className="mt-16">
                <PressGrid
                  items={eraPress}
                  accent="#E83A1C"
                  eyebrow={`PRESS ARCHIVE · ${eraPress.length}`}
                  heading="press archive"
                  subhead="every outlet that covered this era. click any card to read."
                />
              </div>
            )}

            {p.gallery && p.gallery.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-4">GALLERY</div>
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                  {p.gallery.map((img, i) => {
                    const src = urlFor(img).width(800).url();
                    return (
                      <div key={i} className="border border-paper overflow-hidden aspect-square">
                        <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <RelatedVideos videos={videos} eyebrow={`FROM THE CHANNEL · ${videos.length}`} title="videos" theme="dark" />
          </div>
        </article>
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
