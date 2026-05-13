import Link from "next/link";
import type { ProjectDetail, SanityImage } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";
import { PortableText } from "../../_components/shared/PortableText";
import { MediaEmbed } from "../../_components/shared/MediaEmbed";

/**
 * Collage / scrapbook era page. Used for Gangsta Boo (set via project.layoutVariant).
 *
 * Layout: full-bleed photo wall hero with overlapping rotated tiles (the
 * vault energy Nick described — "a million pictures from the vault"). Below
 * the hero: the released anchors (Peephole, I'm Fresh), then the unreleased
 * cuts placeholder ("the unreleased — vault unlock pending"), then the
 * "Fresh videos" grid placeholder, then press, then the band's story.
 *
 * Why this exists: Gangsta Boo passed in 2023. The page should read as
 * preservation, not promotion. Memorial-vault energy. Tiles overlap and
 * tilt like real flyers/photos taped to a studio wall.
 *
 * Photo + audio + video ingestion: this page is built to LIGHT UP as content
 * lands. Right now it surfaces whatever boo-tagged photos already exist + the
 * existing release / press relations. The "unreleased audio" + "Fresh videos"
 * blocks are placeholder rooms ready to fill once we ingest the BOO VAULT
 * folder + the FRESH PREMIER folder respectively.
 */

type EraPhoto = { _id: string; image: SanityImage; caption?: string };
type VideoClip = { _id?: string; youtubeId?: string; title?: string; thumbnailUrl?: string; url?: string };

export function CollageEra({
  era,
  eraPhotos = [],
  videos = [],
  knownVideoUrls = [],
}: {
  era: ProjectDetail;
  eraPhotos?: EraPhoto[];
  /** Era-tagged videos pulled live from /watch */
  videos?: VideoClip[];
  /** Hardcoded known video URLs (e.g. the FRESH unreleased edits living
   *  on YouTube unlisted, hand-curated) to mix into the wall. */
  knownVideoUrls?: { url: string; title: string }[];
}) {
  const releases = era.releases ?? [];
  const press = (era.pressQuotes ?? []).slice(0, 6);
  const members = era.members ?? [];
  const heroTiles = eraPhotos.slice(0, 24);

  // Combine known videos into a normalized list for the video grid section
  const allVideos = [
    ...videos.map((v) => ({
      url: v.url ?? (v.youtubeId ? `https://www.youtube.com/watch?v=${v.youtubeId}` : ""),
      title: v.title ?? "",
      thumb: v.thumbnailUrl ?? null,
    })),
    ...knownVideoUrls.map((v) => ({ url: v.url, title: v.title, thumb: null as string | null })),
  ].filter((v) => v.url);

  return (
    <div className="bg-ink text-paper">
      {/* HERO — full-bleed scrapbook wall of every boo-tagged photo. Each
          tile slightly rotated, faintly overlapping, taped-up energy. The
          title "GANGSTA BOO" sits over the wall in big paper-stamp serif. */}
      <header className="relative px-5 sm:px-8 pt-12 pb-16 border-b-2 border-paper overflow-hidden min-h-[80vh]">
        {heroTiles.length > 0 ? (
          <div
            aria-hidden
            className="absolute inset-0 grid gap-1.5"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gridAutoRows: "200px",
              opacity: 0.85,
            }}
          >
            {heroTiles.map((p, i) => {
              const src = urlFor(p.image).width(600).fit("max").url();
              const span2 = i % 4 === 0;
              const rot = ((i * 41) % 11 - 5) * 0.6;
              return (
                <div
                  key={p._id}
                  className="overflow-hidden"
                  style={{
                    gridColumn: span2 ? "span 2" : undefined,
                    gridRow: span2 ? "span 2" : undefined,
                    transform: `rotate(${rot}deg)`,
                  }}
                >
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                    style={{ filter: "grayscale(40%) contrast(1.05) brightness(0.85)" }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div aria-hidden className="absolute inset-0 bg-ink-2" />
        )}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(11,11,11,0.5) 0%, rgba(11,11,11,0.85) 100%)",
            mixBlendMode: "multiply",
          }}
        />
        <div className="relative max-w-[1180px] mx-auto pt-20">
          <div className="font-mono text-[11px] tracking-[.2em] uppercase text-paper-2 mb-3">
            QUEEN OF MEMPHIS · 1979–2023 · IN MEMORIAM
          </div>
          <h1
            className="font-display font-black uppercase m-0 text-paper"
            style={{ fontSize: "clamp(60px, 13vw, 200px)", lineHeight: 0.84, letterSpacing: "-0.025em" }}
          >
            {era.name}
          </h1>
          {era.tagline && (
            <p className="font-serif italic text-[20px] sm:text-[26px] mt-6 max-w-[820px] text-paper-2 leading-snug">
              {era.tagline}
            </p>
          )}
        </div>
      </header>

      <main className="px-5 sm:px-8 py-12 max-w-[1180px] mx-auto">
        {/* THE STORY */}
        {era.story && Array.isArray(era.story) && era.story.length > 0 && (
          <section className="max-w-[760px] mb-16">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase text-redline mb-3">THE STORY</div>
            <div className="font-serif text-[18px] leading-relaxed">
              <PortableText value={era.story} />
            </div>
          </section>
        )}

        {/* THE UNRELEASED — placeholder room. Ready to fill from BOO VAULT
            ingest: Suicide 1.3 + 1.4, BOO 10, Hook Boo 2018, Hook Boo Isaac,
            Boo Pawmps Vocal, Boo 8, etc. Will be sequenced as a discreet
            "posthumous mixtape" with the global ListeningProvider playing
            them back to back. */}
        <section className="mb-16 border border-paper/40 p-6 sm:p-8">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase text-collect mb-3">THE UNRELEASED · COMING</div>
          <h2
            className="font-display font-bold uppercase m-0 mb-3"
            style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 0.95, letterSpacing: "-0.015em" }}
          >
            the boo vault
          </h2>
          <p className="font-serif italic text-[16px] text-paper-2 max-w-[640px] leading-snug mb-6">
            unreleased cuts from the BOO VAULT — Suicide 1.3 + 1.4, BOO 10, Hook Boo 2018, Hook Boo Isaac, Boo Pawmps Vocal, Boo 8. ingestion in progress; will play in order like a posthumous mixtape once uploaded.
          </p>
          <ul className="grid gap-2 max-w-[640px] font-mono text-[11px] tracking-[.06em] uppercase text-paper-2">
            {[
              "01  ·  Suicide (v1.3)",
              "02  ·  Suicide (v1.4)",
              "03  ·  BOO 10",
              "04  ·  Hook Boo 2018",
              "05  ·  Hook Boo Isaac",
              "06  ·  Boo Pawmps Vocal",
              "07  ·  Boo 8 (with Donald)",
              "08  ·  Champion Waller session",
            ].map((t) => (
              <li key={t} className="flex items-baseline gap-3 border-b border-paper/15 py-2">
                <span className="opacity-50">▸</span>
                <span>{t}</span>
                <span className="ml-auto text-paper-2/60 text-[9px]">vault — pending</span>
              </li>
            ))}
          </ul>
        </section>

        {/* RELEASED — Peephole, I'm Fresh, anything else with Gangsta Boo as
            featured artist or relatedRelease scoped to this era. Pulls live
            from era.releases[]. */}
        {releases.length > 0 && (
          <section className="mb-16">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase text-redline mb-3">THE RELEASED</div>
            <h2
              className="font-display font-bold uppercase m-0 mb-6"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.95, letterSpacing: "-0.015em" }}
            >
              what made it out
            </h2>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {releases.map((r) => {
                const cv = r.cover ? urlFor(r.cover).width(440).height(440).fit("crop").url() : null;
                return (
                  <Link
                    key={r._id}
                    href={`/releases/${r.slug}`}
                    className="block border border-paper p-3.5 no-underline text-paper transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#E83A1C]"
                  >
                    <div className="aspect-square border border-paper mb-3 overflow-hidden" style={{ background: r.coverColor ?? "#1C1A17" }}>
                      {cv && <img src={cv} alt={r.title} className="w-full h-full object-cover" />}
                    </div>
                    <div className="font-display font-bold text-[16px] uppercase leading-tight">{r.title}</div>
                    {r.year && <div className="font-mono text-[10px] tracking-[.1em] uppercase text-paper-2 mt-1">{r.year}</div>}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* THE VIDEOS — actual tiles you can play. Pulls every boo-related
            video we have in Sanity (YouTube etc.) plus any hand-curated
            known URLs. Each tile is a clickable thumbnail that opens the
            inline embed. Mixes with the photo wall energy — chaotic
            scrapbook of moving + still frames side by side. */}
        {allVideos.length > 0 && (
          <section className="mb-16">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase text-collect mb-3">EVERY VIDEO · BOO</div>
            <h2
              className="font-display font-bold uppercase m-0 mb-6"
              style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 0.95, letterSpacing: "-0.015em" }}
            >
              the boo tape
            </h2>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))" }}>
              {allVideos.map((v, i) => (
                <div key={`${v.url}-${i}`} className="border border-paper/40 overflow-hidden">
                  <MediaEmbed url={v.url} title={v.title || `Boo video ${i + 1}`} />
                  {v.title && (
                    <div className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 px-3 py-2 bg-ink">
                      {v.title}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* THE PRESS — pulls from era.pressQuotes */}
        {press.length > 0 && (
          <section className="mb-16">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase text-redline mb-3">PRESS</div>
            <div className="grid gap-6 md:grid-cols-2">
              {press.map((q) => (
                <div key={q._id} className="border border-paper p-6">
                  <div className="font-serif italic text-[20px] leading-snug">&ldquo;{q.quote}&rdquo;</div>
                  <div className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 mt-4">
                    — {q.source}{q.year ? ` · ${q.year}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* THE PEOPLE — members of this era (Gangsta Boo herself, Nick, anyone tagged) */}
        {members.length > 0 && (
          <section className="mb-16">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase text-redline mb-3">THE PEOPLE</div>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <Link
                  key={m.slug}
                  href={`/artists/${m.slug}`}
                  className="font-mono text-[11px] tracking-[.14em] uppercase px-3 py-1.5 border border-paper text-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline"
                >
                  {m.name} →
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* OUTRO — memorial closing */}
        <section className="mt-20 border-t border-paper/30 pt-12 text-center">
          <div className="font-mono text-[11px] tracking-[.2em] uppercase text-paper-2 mb-4">RIP GANGSTA BOO</div>
          <p
            className="font-serif italic text-paper max-w-[640px] mx-auto leading-snug"
            style={{ fontSize: "clamp(20px, 2.4vw, 28px)" }}
          >
            &ldquo;she loved it so much, it was such a great experience.&rdquo;
            <span className="block font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 mt-3 not-italic">
              — Nick, writing to Razzmatazz Barcelona, Jan 2023
            </span>
          </p>
        </section>
      </main>
    </div>
  );
}
