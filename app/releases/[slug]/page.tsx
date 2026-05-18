import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactElement } from "react";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { PortableText } from "../../_components/shared/PortableText";
import { BandcampEmbed } from "../../_components/shared/BandcampEmbed";
import { MediaEmbed } from "../../_components/shared/MediaEmbed";
import { PadGrid } from "../../_components/shared/PadGrid";
import { StemPlayer } from "../../_components/shared/StemPlayer";
import { TracklistAndCover } from "./TracklistAndCover";
import { CoverPlayBadge } from "./CoverPlayBadge";
import { Room } from "../../_components/shared/Room";
import { PhotoGallery } from "../../_components/shared/PhotoGallery";
import { getReleaseBySlug, getReleaseSlugs, getPacksForRelease, getVideosForRelease, getPressForRelease } from "../../_lib/sanity-queries";
import { RelatedVideos } from "../../_components/shared/RelatedVideos";
import { PressGrid } from "../../_components/shared/PressGrid";
import { VideoPlaylist } from "../../_components/shared/VideoPlaylist";
import { IntiCover06, IntiCover07 } from "../../_components/releases/IntiCover06";
import { OldEnglishCover } from "../../_components/releases/OldEnglishCover";
import { PromoPlayer } from "../../_components/releases/PromoPlayer";
import { urlFor, sanityFetch } from "../../_lib/sanity";
import { buildMusicAlbumJsonLd, jsonLdScript } from "../../_lib/schema-jsonld";
import { rankRole, isLocationRole, isFilteredRole } from "../../_lib/credit-order";

// Per-release custom cover components — when a release has a fully
// designed live cover (React handoffs from the design package), it slots in here in place
// of the standard <img> path. Keyed by slug for now; promote to a Sanity
// `coverComponent` field if this grows past a few entries.
const LIVE_COVERS: Record<string, () => ReactElement> = {
  "cc029-kusa": () => <IntiCover06 />,
  // old-english-spinn-hook-remix uses the uploaded "A FINAL" yellow-bottle
  // JPG (C+C version of the original 2014 Mass Appeal cover) — visual
  // continuity with the original release's press archive.
};
import { getVideosFromPlaylist } from "../../_lib/youtube";
import { FOOTER_LINKS } from "../../_lib/social-links";

// During the catalog build-out, keep revalidate short so Sanity edits
// propagate to production within a minute. Bump back up to 3600 once
// the catalog is stable.
export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getReleaseSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const release = await getReleaseBySlug(slug);
  if (!release) return { title: "release not found" };
  const artistNames = release.artists.map((a) => a.name).join(", ");
  const title = `${release.title} — ${artistNames || "calm + collect"}`;
  // Keyword-rich description that helps long-tail Google searches find the
  // page. Includes the format, label, year, and what's available — stems,
  // sample pack, music video — when those are populated. Truncated to
  // ~155 chars (Google's search-snippet cap) so nothing gets clipped.
  const richBits: string[] = [];
  if (release.format) richBits.push(release.format.toLowerCase());
  if (release.year) richBits.push(String(release.year));
  if (release.label && release.label !== "Other") richBits.push(release.label.toLowerCase());
  const richMeta = richBits.length > 0 ? ` · ${richBits.join(" · ")}` : "";
  const richDescBase = release.tagline ?? `${release.title} by ${artistNames || "nick hook"}${richMeta}.`;
  const description = (richDescBase + " music video, stems, sample pack, full credits on thespacepit.").slice(0, 220);
  // Share-card image. Uses the release cover at 1200×1200 (square fits great
  // in iMessage / Discord / X large-card and Slack/IG previews). Falls back to
  // the default site OG (heptagon) when a release has no cover uploaded yet.
  const shareImage = release.cover
    ? urlFor(release.cover).width(1200).height(1200).fit("crop").url()
    : undefined;
  return {
    title,
    description,
    openGraph: shareImage
      ? {
          title,
          description,
          type: "music.song",
          images: [{ url: shareImage, width: 1200, height: 1200, alt: release.title }],
        }
      : undefined,
    twitter: shareImage
      ? {
          card: "summary_large_image",
          title,
          description,
          images: [shareImage],
        }
      : undefined,
  };
}

// Stream-out chips: brand-colored CTAs so the per-DSP "listen here" choice
// reads at a glance. Order = priority: DSPs that PAY first (Spotify, Apple,
// YT Music), then Bandcamp (buy direct), then SoundCloud (preview-only).
const STREAM_LINK_LABELS: {
  key:
    | "spotifyUrl"
    | "appleMusicUrl"
    | "youtubeUrl"
    | "youtubeMusicUrl"
    | "tidalUrl"
    | "deezerUrl"
    | "amazonMusicUrl"
    | "bandcampUrl"
    | "soundcloudUrl";
  label: string;
  color: string;
  paid: boolean; // tells our brain "this one earns a stream"
}[] = [
  { key: "spotifyUrl",      label: "spotify",       color: "#1DB954", paid: true },
  { key: "appleMusicUrl",   label: "apple music",   color: "#FA243C", paid: true },
  { key: "youtubeMusicUrl", label: "yt music",      color: "#FF0033", paid: true },
  { key: "youtubeUrl",      label: "youtube",       color: "#FF0000", paid: true },
  { key: "tidalUrl",        label: "tidal",         color: "#000000", paid: true },
  { key: "amazonMusicUrl",  label: "amazon music",  color: "#00A8E1", paid: true },
  { key: "deezerUrl",       label: "deezer",        color: "#A238FF", paid: true },
  { key: "bandcampUrl",     label: "bandcamp",      color: "#629AA9", paid: false },
  { key: "soundcloudUrl",   label: "soundcloud",    color: "#FF5500", paid: false },
];

export default async function ReleasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const release = await getReleaseBySlug(slug);
  if (!release) notFound();

  const coverUrl = release.cover ? urlFor(release.cover).width(1200).height(1200).fit("crop").url() : null;
  const artistNames = release.artists.map((a) => a.name).join(" · ");

  // Pitch-mode: release is in the distro one-sheet phase. Page renders a
  // DROPPING stamp on the cover + a "not for public release" eyebrow.
  // Stream chips already self-hide when no DSP urls are populated.
  const isDropping = release.status === "dropping";
  const droppingDateLabel = release.releaseDate
    ? new Date(release.releaseDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "date TBD";

  // Pick a "music video" — the first track that has a videoUrl is the lead.
  const leadVideoTrack = release.tracklist?.find((t) => t.videoUrl);
  const leadVideoUrl = leadVideoTrack?.videoUrl ?? null;

  // Combine playlist videos + manual one-offs (IG reels, etc.) — same pattern
  // we use on brands and studios.
  const playlistVideos = release.youtubePlaylistId
    ? await getVideosFromPlaylist(release.youtubePlaylistId, 50)
    : [];
  const manualClips = (release.videos ?? []).map((v) => ({ url: v.youtubeUrl, title: v.title }));
  const playlistClips = playlistVideos.map((v) => ({
    url: `https://www.youtube.com/watch?v=${v.id}`,
    title: v.title,
  }));
  const seenUrls = new Set(manualClips.map((c) => c.url));
  // De-dupe playlist against manual, then strip the hero video from the
  // WATCH playlist — it's already playing in the header embed, no reason
  // to show it twice.
  const heroUrl = release.youtubeUrl;
  const allClips = [...manualClips, ...playlistClips.filter((c) => !seenUrls.has(c.url))]
    .filter((c) => !heroUrl || c.url !== heroUrl);

  // Packs that target this release (e.g. WYGD sample pack on the CC027 page).
  const releasePacks = await getPacksForRelease(slug);

  // Videos auto-attached to this release (set via /studio → video.relatedRelease).
  const releaseVideos = await getVideosForRelease(slug);

  // (The per-artist crosslink chips used to live here — "Nick Hook also on
  // Just Nico", "Pawmps also on CU4TRO", etc. Removed per Nick's call:
  // those connections live in the BIO/liner-notes now, narratively, not
  // as decontextualized chips. Bios tell the story; chips were noise.)

  // Press attached to this release — historical write-ups, premieres, reviews.
  // Renders as a slim "what they said" rail near the bottom of the page.
  const releasePress = await getPressForRelease(slug);

  // ── SAMPLE PACK ROOM ─────────────────────────────────────────────────────
  // The pack section is the page's primary lead-gen surface — every visitor
  // who clicks through ends up on Gumroad with their email captured. So
  // we render packs HUGE: hero card per pack (single-column at desktop,
  // big square cover, loud CTA button). Renders ONCE, slotted into the
  // KUSA-elevated position OR the default post-WATCH position via slug
  // check in the JSX below.
  //
  // When zero packs exist, the const is null and the slot collapses.
  const samplePackRoom: React.ReactNode = releasePacks.length > 0 ? (
    <Room number="01b" title="the sample pack" kicker="all the sounds from the record" accent="lamp">
      <p className="font-serif italic text-[18px] text-ink-3 max-w-[680px] mb-7 leading-snug">
        every drum, loop, and one-shot that built {release.title}. drop it in your DAW. flip it any way you want.
      </p>
      <div className="grid gap-6" style={{ gridTemplateColumns: releasePacks.length === 1 ? "1fr" : "repeat(auto-fill, minmax(420px, 1fr))" }}>
        {releasePacks.map((p) => {
          const cover = p.cover ? urlFor(p.cover).width(880).height(880).fit("crop").url() : null;
          const cta = p.price && /free/i.test(p.price) ? "free download →" : "grab the pack →";
          return (
            <a
              key={p._id}
              href={p.downloadUrl ?? "#"}
              target={p.downloadUrl ? "_blank" : undefined}
              rel={p.downloadUrl ? "noopener noreferrer" : undefined}
              className="group block border-2 border-ink bg-paper transition-all duration-150 hover:-translate-x-[4px] hover:-translate-y-[4px] hover:shadow-[6px_6px_0_#F2B705] no-underline text-ink overflow-hidden"
            >
              {/* Big square cover — the visual lead */}
              <div className="aspect-square border-b-2 border-ink bg-ink-2 overflow-hidden relative">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display uppercase text-[28px] text-paper text-center p-6 bg-ink">
                    {p.name}
                  </div>
                )}
                {/* Price chip — top right, lamp amber */}
                {p.price && (
                  <div className="absolute top-3 right-3 font-mono text-[10px] tracking-[.14em] uppercase px-2.5 py-1 bg-lamp text-ink border border-ink">
                    {p.price}
                  </div>
                )}
              </div>
              {/* Body — eyebrow + name + tagline + LOUD CTA button */}
              <div className="p-5 sm:p-6">
                <div className="font-mono text-[10px] tracking-[.18em] uppercase text-lamp-deep">
                  {p.kind.replace("-", " ")}
                </div>
                <div
                  className="font-display font-bold uppercase tracking-[-0.015em] leading-[1.02] mt-1"
                  style={{ fontSize: "clamp(24px, 2.6vw, 32px)" }}
                >
                  {p.name}
                </div>
                {p.tagline && (
                  <p className="font-serif italic text-[15px] text-ink-3 leading-snug mt-2.5">
                    {p.tagline}
                  </p>
                )}
                {/* CTA — full-width pill, lamp-amber, can't miss it */}
                <div className="mt-5 font-mono text-[12px] tracking-[.2em] uppercase px-5 py-3 bg-ink text-paper text-center group-hover:bg-lamp group-hover:text-ink transition-colors">
                  {cta}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </Room>
  ) : null;

  // Build MusicAlbum structured data — gives Google a rich snippet
  // (album art, artist, label) when this release appears in search.
  const albumJsonLd = jsonLdScript(buildMusicAlbumJsonLd(release, { coverUrl }));

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: albumJsonLd }}
      />
      <TopNav current="label" />
      <main className="relative flex-1 text-ink overflow-hidden">
        {/* Layered page background:
             1. Solid coverColor (or paper) as the back wash
             2. Optional pageBackgroundImage tile, overlaid at ~50% opacity
                so the photo's wall + scrawl actually read
             3. Cover-color tint on top so the photo gets pulled into the
                release's palette
            All three stack as absolutely-positioned siblings BEFORE the
            <article> so we don't fight CSS's "negative z-index goes
            behind the parent's background" rule. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: release.coverColor ?? "var(--color-paper)" }}
          aria-hidden
        />
        {release.pageBackgroundImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urlFor(release.pageBackgroundImage).width(2400).fit("max").url()}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.55 }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: release.coverColor ?? "transparent",
                opacity: 0.4,
              }}
              aria-hidden
            />
          </>
        )}
        <article className="relative px-6 sm:px-8 py-12">
          <div className="max-w-[1180px] mx-auto">
            <Link
              href="/calm-collect#releases"
              className="font-mono text-[11px] tracking-[.14em] uppercase text-collect hover:opacity-70 no-underline"
            >
              ← back to catalogue
            </Link>

            <div className={`grid gap-10 mt-6 items-start ${LIVE_COVERS[release.slug] ? "md:grid-cols-[minmax(320px,560px)_1fr]" : "md:grid-cols-[minmax(280px,420px)_1fr]"}`}>
              {/* LEFT COLUMN: cover + (if MP3 uploaded) the player stacked
                  right under it, matching the cover's column width. */}
              <div className="flex flex-col gap-4">
              <div
                className="aspect-square border border-ink relative overflow-hidden flex items-center justify-center"
                style={{ background: release.coverColor ?? "#1C1A17", color: "#F4EFE6" }}
              >
                {LIVE_COVERS[release.slug] ? (
                  <div className="absolute inset-0">{LIVE_COVERS[release.slug]()}</div>
                ) : coverUrl ? (
                  <img src={coverUrl} alt={release.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <span
                    className="font-display font-bold uppercase text-center px-6"
                    style={{ fontSize: 48, transform: "rotate(-4deg)", letterSpacing: "-0.02em", color: release.coverColor ? "#0B0B0B" : "#F4EFE6" }}
                  >
                    {release.title}
                  </span>
                )}
                {leadVideoUrl && (
                  <CoverPlayBadge url={leadVideoUrl} releaseTitle={release.title} />
                )}
                {isDropping && (
                  <div
                    className="absolute top-3 right-3 z-20 select-none pointer-events-none"
                    style={{ transform: "rotate(-6deg)" }}
                  >
                    <div
                      className="bg-paper border-2 border-ink px-3.5 py-2 inline-block text-center"
                      style={{ boxShadow: "4px 4px 0 var(--color-redline)" }}
                    >
                      <div
                        className="font-display font-bold uppercase text-ink leading-none"
                        style={{ fontSize: 30, letterSpacing: "-0.02em" }}
                      >
                        Dropping
                      </div>
                      <div className="font-mono text-[9px] tracking-[.18em] uppercase text-ink-3 mt-1">
                        {droppingDateLabel}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PROMO PLAYER — sits RIGHT UNDER the cover, matching its
                  column width. Renders only when promoAudio is set on the
                  release doc. The hero cover + this player are the visual
                  pair: see + hear, no scrolling, no click-outs. */}
              {release.promoAudio && (
                <PromoPlayer
                  src={release.promoAudio}
                  title={release.title}
                  artist={artistNames}
                  isPrivate={isDropping}
                  compact
                  altSrc={release.promoAudioAlt}
                  altLabel={release.promoAudioAltLabel ?? "instrumental"}
                />
              )}

              </div> {/* end LEFT COLUMN */}

              <div>
                {isDropping && (
                  <div className="font-mono text-[11px] tracking-[.18em] uppercase text-redline mb-2 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-redline sp-pulse" />
                    distro one-sheet · not for public release
                  </div>
                )}
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect mb-3 flex flex-wrap gap-2.5">
                  {release.catalogNumber && <span>{release.catalogNumber}</span>}
                  {(release.releaseDate || release.year) && (
                    <>
                      <span>·</span>
                      <span>
                        {release.releaseDate
                          ? new Date(release.releaseDate + "T00:00:00").toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : release.year}
                      </span>
                    </>
                  )}
                  {release.format && (<><span>·</span><span>{release.format}</span></>)}
                </div>
                <h1
                  className="font-display font-bold uppercase m-0"
                  style={{ fontSize: "clamp(40px, 6vw, 80px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
                >
                  {release.title}
                </h1>
                {release.artists.length > 0 && (
                  <div className="font-sans text-[18px] mt-2">
                    {release.artists.map((a, i) => (
                      <span key={a.slug}>
                        <Link href={`/artists/${a.slug}`} className="underline underline-offset-4 hover:opacity-70">
                          {a.name}
                        </Link>
                        {i < release.artists.length - 1 ? " · " : ""}
                      </span>
                    ))}
                  </div>
                )}

                {/* People tag strip — primary artists + credited persons, all clickable. */}
                {(() => {
                  // Build a deduped list keyed by slug. Primary artists go first
                  // (no role label), then credited persons (with their role).
                  const tags = new Map<string, { name: string; slug: string; role?: string }>();
                  for (const a of release.artists) tags.set(a.slug, { name: a.name, slug: a.slug });
                  for (const c of release.credits ?? []) {
                    if (c.person && !tags.has(c.person.slug)) {
                      tags.set(c.person.slug, { name: c.person.name, slug: c.person.slug, role: c.role });
                    }
                  }
                  if (tags.size === 0) return null;
                  return (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {[...tags.values()].map((t) => (
                        <Link
                          key={t.slug}
                          href={`/artists/${t.slug}`}
                          className="inline-flex items-baseline gap-1.5 font-mono text-[10px] tracking-[.1em] uppercase px-2.5 py-1 border border-ink rounded-full hover:bg-ink hover:text-paper transition-colors no-underline"
                        >
                          <span>{t.name}</span>
                          {t.role && <span className="opacity-60">· {t.role}</span>}
                        </Link>
                      ))}
                    </div>
                  );
                })()}

                {release.tagline && (
                  <p className="font-serif italic text-[20px] mt-4 max-w-[560px]">{release.tagline}</p>
                )}

                {/* Embed priority: YOUTUBE first if present (auto-plays full
                    album, no click required) — otherwise Bandcamp embed.
                    Bandcamp keeps a button in the LISTEN ON footer for
                    save-to-library. Was Bandcamp-first; flipped because
                    bandcamp embeds are 30s-preview only on auto-load. */}
                {release.youtubeUrl ? (
                  <div className="mt-7">
                    <MediaEmbed url={release.youtubeUrl} title={`${release.title} — ${artistNames}`} />
                  </div>
                ) : (release.bandcampAlbumId || release.bandcampTrackId || release.bandcampUrl) ? (
                  <div className="mt-7">
                    <BandcampEmbed
                      albumId={release.bandcampAlbumId}
                      trackId={release.bandcampTrackId}
                      bandcampUrl={release.bandcampUrl}
                      title={`${release.title} — ${artistNames}`}
                      size="large"
                    />
                  </div>
                ) : null}

                {/* === LISTEN ON ===
                    Loud platform CTAs. Each chip uses the DSP's brand color
                    via CSS custom property (--c). Tailwind arbitrary
                    properties pick it up for hover state. The release-page
                    audio + global mini-player are the TEASE; these chips
                    are the conversion — clicking spotify/apple counts as
                    a paid stream. */}
                {(() => {
                  const visible = STREAM_LINK_LABELS.filter((link) => release[link.key]);
                  if (visible.length === 0) return null;
                  return (
                    <div className="mt-6">
                      <div className="font-mono text-[10px] tracking-[.18em] uppercase text-ink-3 mb-2">
                        ▶ LISTEN ON
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {visible.map((link) => {
                          const url = release[link.key]!;
                          return (
                            <a
                              key={link.key}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="stream-chip group inline-flex items-center gap-2 font-mono text-[11px] tracking-[.12em] uppercase px-3.5 py-2 border border-ink rounded-full no-underline text-ink transition-all hover:-translate-x-[1px] hover:-translate-y-[1px]"
                              style={{ ["--c" as string]: link.color }}
                            >
                              <span
                                className="inline-block w-2 h-2 rounded-full shrink-0"
                                style={{ background: link.color }}
                              />
                              <span>{link.label}</span>
                              <span className="opacity-60 group-hover:opacity-100">↗</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Re-release note — surfaces the original label/year when this
                    is a reissue from Nick's reclaimed catalog. */}
                {(release.originalLabel || release.originalReleaseNote) && (
                  <div className="mt-6 border-l-2 border-collect pl-3 max-w-[560px]">
                    <div className="font-mono text-[10px] tracking-[.14em] uppercase text-collect mb-0.5">
                      original release
                    </div>
                    <div className="font-mono text-[12px] text-ink-3">
                      {release.originalReleaseNote ??
                        `originally on ${release.originalLabel}`}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* === THE BIO === Standalone full-width section. Nick's locked
                order is hero → bandcamp/listen-on → bio → tracks → credits →
                videos → press → physical. The bio used to live inside the
                hero right-column; promoted to its own room so it gets the
                editorial breathing room a record's story deserves. */}
            {release.notes && Array.isArray(release.notes) && release.notes.length > 0 && (
              <Room number="02" title="the words" kicker="liner notes">
                <div className="max-w-[680px] prose-bio">
                  <PortableText value={release.notes} />
                </div>
              </Room>
            )}

            {/* === THE AUDIO === Bandcamp player fallback. Skipped when ANY
                other audio surface is already on the page: a release-level
                promoAudio mp3, per-track audio in the tracklist (the new
                full-stream pattern), or the hero already rendering a
                Bandcamp embed from bandcampUrl. Avoids stacking two
                identical iframes. */}
            {!release.promoAudio &&
              !release.tracklist?.some((t) => t.audioUrl) &&
              !release.bandcampUrl &&
              (release.bandcampAlbumId || release.bandcampTrackId) && (
              <Room
                number="01"
                title="the audio"
                kicker={isDropping ? "private listening · pre-release" : "stream + buy"}
                accent="lamp"
              >
                <div className="max-w-[760px]">
                  <BandcampEmbed
                    albumId={release.bandcampAlbumId}
                    trackId={release.bandcampTrackId}
                    bandcampUrl={release.bandcampUrl}
                    title={`${release.title} — ${artistNames}`}
                    size="large"
                  />
                  {isDropping && (
                    <p className="font-mono text-[10px] tracking-[.14em] uppercase text-ink-3 mt-3">
                      ↑ private bandcamp · do not redistribute the link
                    </p>
                  )}
                </div>
              </Room>
            )}

            {/* KUSA-elevated: the sample pack room renders here, right after
                the listen surface. For every other release it renders after
                THE WATCH (see further down). Both positions render the same
                `samplePackRoom` JSX, declared once below. */}
            {release.slug === "cc029-kusa" && samplePackRoom}

            {/* === THE PHYSICAL === vinyl jackets, test pressings, J-cards,
                liner-note scans. Hoisted up here (between the bio/audio and
                the watch room) per Nick's call — the jacket is the artifact
                you want to see when you're DECIDING to listen, not buried
                past 16 tracks of credits. Goes unrendered when both arrays
                are empty. */}
            {(() => {
              const liners = release.linerNotes ?? [];
              const artifacts = release.physicalArtifacts ?? [];
              if (liners.length === 0 && artifacts.length === 0) return null;
              const linerPhotos = liners.map((p) => ({
                src: urlFor(p.image).width(2000).url(),
                alt: p.caption ?? "",
              }));
              return (
                <Room
                  number="01b"
                  title="the physical"
                  kicker={[
                    artifacts.length > 0 ? `${artifacts.length} artifact${artifacts.length === 1 ? "" : "s"}` : null,
                    liners.length > 0 ? `${liners.length} liner page${liners.length === 1 ? "" : "s"}` : null,
                  ].filter(Boolean).join(" · ")}
                >
                  {artifacts.length > 0 && (
                    <div className={liners.length > 0 ? "mb-8" : ""}>
                      <div className="font-mono text-[10px] tracking-[.18em] uppercase text-ink-3 mb-3">ARTIFACTS</div>
                      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                        {artifacts.map((a, i) => {
                          const src = urlFor(a.image).width(800).fit("max").url();
                          return (
                            <figure key={i} className="border border-ink p-3">
                              <div className="aspect-square overflow-hidden bg-ink-2 mb-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt={a.title ?? ""} loading="lazy" className="w-full h-full object-cover" />
                              </div>
                              <figcaption>
                                {a.kind && <div className="font-mono text-[9px] tracking-[.14em] uppercase text-ink-3">{a.kind.replace(/-/g, " ")}</div>}
                                {a.title && <div className="font-display font-semibold text-[15px] uppercase tracking-[-0.005em] leading-tight mt-0.5">{a.title}</div>}
                                {a.note && <div className="font-serif italic text-[13px] text-ink-3 mt-1 leading-snug">{a.note}</div>}
                              </figcaption>
                            </figure>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {liners.length > 0 && (
                    <div>
                      <div className="font-mono text-[10px] tracking-[.18em] uppercase text-ink-3 mb-3">LINER NOTES</div>
                      <PhotoGallery photos={linerPhotos} />
                    </div>
                  )}
                </Room>
              );
            })()}

            {/* (THE WATCH moved down — Nick's locked order is hero → bandcamp
                → bio → tracks → credits → watch → press → physical. New home
                is after the credits room below.) */}

            {/* Default position for the sample pack room — every release
                that isn't KUSA renders it here. */}
            {release.slug !== "cc029-kusa" && samplePackRoom}

            {/* === PLAY WITH IT === per-stem mixer + FX machine. Renders only
                when stems are uploaded. Each channel has its own waveform,
                mute/solo, gain, and four FX (filter · drive · delay · reverb)
                that wire into the Web Audio chain live. Sample packs live in
                `samplePackRoom` above. */}
            {/* Stem player + FX room. Hidden on KUSA per Nick — we'll
                bring it back when the moment's right. Add the slug to
                STEMS_HIDDEN if you want to silence the player on a
                release without clearing its uploaded stems[] data. */}
            {release.stems &&
              release.stems.length > 0 &&
              !["cc029-kusa"].includes(release.slug) && (
              <Room number="02a" title="play with it" kicker="stems · live fx" accent="lamp">
                <p className="font-serif italic text-[16px] text-ink-3 max-w-[640px] mb-5">
                  every stem of the record, in your hands. mute or solo each part. turn the knobs
                  — filter, drive, delay, reverb — they apply live to the channel you twist.
                </p>
                <StemPlayer stems={release.stems} trackTitle={release.stemsTrackTitle ?? release.title} />
              </Room>
            )}

            {/* Pads-only room. Sample packs live in `samplePackRoom` above. */}
            {release.oneshots && release.oneshots.length > 0 && (
              <Room number="02b" title="pads" kicker="tap the rack" accent="lamp">
                <p className="font-serif italic text-[16px] text-ink-3 max-w-[640px] mb-5">
                  one-shots from this release. click or use the keys to fire them.
                </p>
                <PadGrid pads={release.oneshots} />
              </Room>
            )}

            {/* (RelatedVideos moved DOWN — Nick's locked order puts videos
                after the credits room, not before the tracklist. New home is
                just after THE CREDITS below.) */}

            {/* === THE TRACKS === tracklist */}
            {release.tracklist && release.tracklist.length > 0 && (
              <Room
                number="03"
                title={`the tracks${leadVideoTrack ? " · ▶ has video" : ""}`}
                kicker="tracklist"
              >
                <div className="max-w-[760px]">
                  <TracklistAndCover
                    tracklist={release.tracklist}
                    releaseArtistText={artistNames}
                    releaseTitle={release.title}
                    releaseSlug={release.slug}
                    releaseCoverUrl={coverUrl}
                    fallbackYouTubeUrl={release.youtubeUrl}
                    credits={release.credits}
                  />
                </div>
              </Room>
            )}

            {/* === THE CREDITS === Sits AFTER the tracklist per Nick's locked
                order — listener has just heard the songs, now reads who made
                them. Grouped by role, one line per role, names joined with
                " + ". Ordering from `_lib/credit-order.ts`: Vocals → Produced
                by → Co-prod/Remix → Instrumentalists → Mixed → Mastered.
                "Recorded at" splits out into the location footer below. */}
            {release.credits && release.credits.length > 0 && (() => {
              // Filter out programming, keys, "recorded by" per Nick's spec.
              // Bucket remaining credits by role.
              const visibleCredits = release.credits.filter((c) => !isFilteredRole(c.role ?? ""));
              if (visibleCredits.length === 0) return null;
              const byRole = new Map<string, typeof release.credits>();
              for (const c of visibleCredits) {
                const k = c.role ?? "—";
                if (!byRole.has(k)) byRole.set(k, []);
                byRole.get(k)!.push(c);
              }
              const sortRoles = (rs: string[]) =>
                rs.sort((a, b) => {
                  const d = rankRole(a) - rankRole(b);
                  return d !== 0 ? d : a.localeCompare(b);
                });
              const peopleRoles = sortRoles([...byRole.keys()].filter((r) => !isLocationRole(r)));
              const locationRoles = [...byRole.keys()].filter((r) => isLocationRole(r));

              return (
                <Room number="04" title="the credits" kicker="vinyl jacket">
                  <div className="max-w-[720px] mx-auto">
                    <ul className="grid gap-0">
                      {peopleRoles.map((role) => {
                        const cs = byRole.get(role)!;
                        return (
                          <li
                            key={role}
                            className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-ink/15 py-3.5"
                          >
                            <span className="font-mono text-[10px] tracking-[.18em] uppercase text-ink-3 shrink-0 w-[120px]">
                              {role}
                            </span>
                            <span className="flex-1 font-display font-semibold text-[20px] uppercase tracking-[-0.005em] leading-tight">
                              {cs.map((c, i) => (
                                <span key={i}>
                                  {c.person ? (
                                    <Link
                                      href={`/artists/${c.person.slug}`}
                                      className="text-ink hover:text-collect underline-offset-4 decoration-1 hover:underline transition-colors no-underline"
                                    >
                                      {c.person.name}
                                    </Link>
                                  ) : (
                                    c.name ?? "—"
                                  )}
                                  {i < cs.length - 1 ? <span className="text-ink-3"> + </span> : null}
                                </span>
                              ))}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    {locationRoles.length > 0 && (() => {
                      const locs = locationRoles.flatMap((role) => byRole.get(role)!);
                      return (
                        <div className="mt-8 pt-6 border-t border-ink/30 text-center">
                          <div className="font-mono text-[10px] tracking-[.18em] uppercase text-ink-3 mb-2">
                            {locationRoles.map((r) => r.toLowerCase()).join(" · ")}
                          </div>
                          <div className="font-display text-[18px] uppercase tracking-[-0.005em] flex flex-wrap justify-center items-baseline gap-x-2 gap-y-1">
                            {locs.map((c, i) => {
                              const display = c.name ?? c.person?.name ?? "—";
                              const city = c.instrument;
                              const linkHref = c.studio?.slug
                                ? `/studios/${c.studio.slug}`
                                : null;
                              const label = (
                                <>
                                  {linkHref ? (
                                    <Link
                                      href={linkHref}
                                      className="text-ink hover:text-collect underline-offset-4 decoration-1 hover:underline transition-colors no-underline"
                                    >
                                      {display}
                                    </Link>
                                  ) : (
                                    display
                                  )}
                                  {city && (
                                    <span className="font-mono text-[10px] tracking-[.12em] uppercase text-ink-3 ml-1.5">
                                      · {city}
                                    </span>
                                  )}
                                </>
                              );
                              return (
                                <span key={i} className="inline-flex items-baseline">
                                  {label}
                                  {i < locs.length - 1 && (
                                    <span className="text-ink-3 mx-2">·</span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </Room>
              );
            })()}

            {/* Auto-attached channel videos sit here, right after the credits.
                These come from Sanity videos with `relatedRelease` references. */}
            {releaseVideos.length > 0 && (
              <RelatedVideos videos={releaseVideos} eyebrow={`FROM THE CHANNEL · ${releaseVideos.length}`} title="videos" theme="light" />
            )}

            {/* === THE WATCH === music videos + reels + performance clips. */}
            {allClips.length > 0 && (
              <Room
                number="05"
                title="the watch"
                kicker={allClips.length > 1 ? "the whole playlist" : "music video"}
              >
                {allClips.length > 1 ? (
                  <VideoPlaylist
                    items={allClips.map((c) => ({ url: c.url, title: c.title ?? undefined }))}
                    accent={release.coverColor ?? "#F2B705"}
                  />
                ) : (
                  <div>
                    <MediaEmbed url={allClips[0].url} title={allClips[0].title ?? release.title} />
                    {allClips[0].title && (
                      <div className="font-mono text-[10px] tracking-[.1em] uppercase text-ink-3 mt-2">{allClips[0].title}</div>
                    )}
                  </div>
                )}
              </Room>
            )}

            {/* === THE GALLERY === cinematic photo gallery w/ lightbox */}
            {(() => {
              const releaseGallery = release.gallery ?? [];
              const sessionGallery = release.relatedSession?.gallery ?? [];
              const all = [...releaseGallery, ...sessionGallery];
              if (all.length === 0) return null;
              const photos = all.map((img) => ({
                src: urlFor(img).width(2000).url(),
                alt: "",
              }));
              return (
                <Room
                  number="06"
                  title="the gallery"
                  kicker={sessionGallery.length > 0 && releaseGallery.length === 0 ? "from the session" : "out the lens"}
                >
                  <PhotoGallery photos={photos} />
                </Room>
              );
            })()}

            {release.relatedSession && (
              <Room number="07" title="from the session" kicker="">
                <div className="max-w-[720px]">
                  <Link
                    href={`/sessions/${release.relatedSession.slug}`}
                    className="font-display font-semibold text-[28px] uppercase tracking-tight hover:opacity-70 no-underline"
                  >
                    {release.relatedSession.title} →
                  </Link>
                </div>
              </Room>
            )}

            {/* (RelatedVideos used to live here at the bottom — moved up to
                just before the tracklist so visitors actually see it without
                scrolling past 16 tracks + credits + gallery + session first.) */}

            {/* === PRESS RAIL === outlets that covered the record. Lives near
                the bottom because it's catalog flavor — visitors who care to
                read what FADER / Stereogum / Pitchfork said scroll here. Accent
                picks up the release's cover color when set (slime green for
                Old English, etc.) and falls back to C+C red. */}
            {releasePress.length > 0 && (
              <PressGrid
                items={releasePress}
                accent={release.coverColor ?? "#E83A1C"}
                eyebrow="WHAT THEY SAID"
                heading="press"
                variant="light"
              />
            )}

            {/* === KUSA · THE ALTERNATE === image-only at the bottom of the page.
                No description — just the cover. The lead cover lives in the hero;
                this is the second direction shown plainly for visual rhythm. */}
            {release.slug === "cc029-kusa" && (
              <section className="mt-16 pt-8 border-t-2 border-ink">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect mb-5">
                  ALTERNATE COVER
                </div>
                <figure className="m-0 max-w-[640px]">
                  <div className="border-2 border-ink overflow-hidden">
                    <IntiCover07 />
                  </div>
                </figure>
              </section>
            )}

            {/* "LISTEN ON" footer — repeats the stream-out links at the bottom
                of the article so visitors who scrolled past the meta header
                can still reach Spotify / Apple / etc. without scrolling back. */}
            {STREAM_LINK_LABELS.some((link) => release[link.key]) && (
              <section className="mt-16 pt-8 border-t-2 border-ink">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect mb-4">
                  LISTEN ON · ALL THE PLATFORMS
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {STREAM_LINK_LABELS.map((link) => {
                    const url = release[link.key];
                    if (!url) return null;
                    return (
                      <a
                        key={`bot-${link.key}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-display font-semibold text-[14px] tracking-[.04em] uppercase px-5 py-3 border border-ink bg-paper text-ink hover:bg-ink hover:text-paper transition-colors no-underline"
                      >
                        {link.label} →
                      </a>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </article>
      </main>
      <Footer
        theme="paper"
        heptagon="fill-black"
        signoff="stay high 💚"
        meta="calm + collect · a record label · 2013 → today"
        links={[...FOOTER_LINKS.label]}
      />
    </>
  );
}
