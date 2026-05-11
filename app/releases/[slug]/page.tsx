import { notFound } from "next/navigation";
import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { PortableText } from "../../_components/shared/PortableText";
import { BandcampEmbed } from "../../_components/shared/BandcampEmbed";
import { MediaEmbed } from "../../_components/shared/MediaEmbed";
import { StemPlayer } from "../../_components/shared/StemPlayer";
import { PadGrid } from "../../_components/shared/PadGrid";
import { TracklistAndCover } from "./TracklistAndCover";
import { CoverPlayBadge } from "./CoverPlayBadge";
import { Room } from "../../_components/shared/Room";
import { PhotoGallery } from "../../_components/shared/PhotoGallery";
import { getReleaseBySlug, getReleaseSlugs, getPacksForRelease } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";
import { getVideosFromPlaylist } from "../../_lib/youtube";
import { FOOTER_LINKS } from "../../_lib/social-links";

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
  return {
    title: `${release.title} — ${artistNames || "calm + collect"}`,
    description: release.tagline ?? `${release.title} (${release.year ?? ""}). on calm + collect.`,
  };
}

const STREAM_LINK_LABELS: { key: keyof Pick<NonNullable<Awaited<ReturnType<typeof getReleaseBySlug>>>, "spotifyUrl" | "appleMusicUrl" | "youtubeUrl" | "soundcloudUrl"> | "bandcampUrl"; label: string }[] = [
  { key: "bandcampUrl", label: "bandcamp" },
  { key: "spotifyUrl", label: "spotify" },
  { key: "appleMusicUrl", label: "apple music" },
  { key: "youtubeUrl", label: "youtube" },
  { key: "soundcloudUrl", label: "soundcloud" },
];

export default async function ReleasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const release = await getReleaseBySlug(slug);
  if (!release) notFound();

  const coverUrl = release.cover ? urlFor(release.cover).width(1200).height(1200).fit("crop").url() : null;
  const artistNames = release.artists.map((a) => a.name).join(" · ");

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
  const allClips = [...manualClips, ...playlistClips.filter((c) => !seenUrls.has(c.url))];

  // Packs that target this release (e.g. WYGD sample pack on the CC027 page).
  const releasePacks = await getPacksForRelease(slug);

  return (
    <>
      <TopNav current="label" />
      <main className="flex-1 bg-paper text-ink">
        <article className="px-6 sm:px-8 py-12">
          <div className="max-w-[1180px] mx-auto">
            <Link
              href="/calm-collect#releases"
              className="font-mono text-[11px] tracking-[.14em] uppercase text-collect hover:opacity-70 no-underline"
            >
              ← back to catalogue
            </Link>

            <div className="grid gap-10 mt-6 md:grid-cols-[minmax(280px,420px)_1fr] items-start">
              <div
                className="aspect-square border border-ink relative overflow-hidden flex items-center justify-center"
                style={{ background: release.coverColor ?? "#1C1A17", color: "#F4EFE6" }}
              >
                {coverUrl ? (
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
              </div>

              <div>
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

                {(release.bandcampAlbumId || release.bandcampTrackId || release.bandcampUrl) && (
                  <div className="mt-7">
                    <BandcampEmbed
                      albumId={release.bandcampAlbumId}
                      trackId={release.bandcampTrackId}
                      bandcampUrl={release.bandcampUrl}
                      title={`${release.title} — ${artistNames}`}
                      size="large"
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-6">
                  {STREAM_LINK_LABELS.map((link) => {
                    const url = release[link.key];
                    if (!url) return null;
                    return (
                      <a
                        key={link.key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] tracking-[.1em] uppercase px-3 py-1.5 border border-ink rounded-full hover:bg-ink hover:text-paper transition-colors no-underline"
                      >
                        {link.label} →
                      </a>
                    );
                  })}
                </div>

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

                {/* Liner notes — moved up so they sit right under the hero,
                    not buried below the tracklist. */}
                {release.notes && Array.isArray(release.notes) && release.notes.length > 0 && (
                  <div className="mt-8 max-w-[640px]">
                    <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect mb-3">LINER NOTES</div>
                    <PortableText value={release.notes} />
                  </div>
                )}
              </div>
            </div>

            {/* === THE WATCH === music video grid lives near the top so it
                lands cinematically right after the hero. */}
            {allClips.length > 0 && (
              <Room
                number={leadVideoUrl ? "01" : "02"}
                title={`the watch · ${allClips.length} ${allClips.length === 1 ? "clip" : "clips"}`}
                kicker="every video"
              >
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))" }}>
                  {allClips.map((c, i) => (
                    <div key={`${c.url}-${i}`}>
                      <MediaEmbed url={c.url} title={c.title ?? release.title} />
                      {c.title && (
                        <div className="font-mono text-[10px] tracking-[.1em] uppercase text-ink-3 mt-2 line-clamp-2">{c.title}</div>
                      )}
                    </div>
                  ))}
                </div>
              </Room>
            )}

            {/* === THE JAM === stems + pads + downloadable packs */}
            {(() => {
              const hasStems = !!(release.stems && release.stems.length > 0);
              const hasPads = !!(release.oneshots && release.oneshots.length > 0);
              const hasPacks = releasePacks.length > 0;
              if (!hasStems && !hasPads && !hasPacks) return null;
              const sub: string[] = [];
              if (hasStems) sub.push(`${release.stems!.length} stems`);
              if (hasPads)  sub.push(`${release.oneshots!.length} pads`);
              if (hasPacks) sub.push(`${releasePacks.length} pack${releasePacks.length === 1 ? "" : "s"}`);
              return (
                <Room number="02" title={`the jam · ${sub.join(" · ")}`} kicker="play with it" accent="lamp">
                  <p className="font-serif italic text-[16px] text-ink-3 max-w-[640px] mb-5">
                    {hasStems && hasPads
                      ? "the stems plus a pad rack of one-shots. press play to sync the stems, then tap the pads (or use the keys) to layer on top."
                      : hasStems
                        ? "the stems for this track. press play to start them in sync. mute, solo, or pull a fader to remix on the fly."
                        : hasPads
                          ? "a pad rack of one-shots from this release. click or use the keys to fire them."
                          : "downloadable packs from this release. take it to your own rig."}
                  </p>
                  {hasStems && (
                    <div className="mb-6">
                      <StemPlayer stems={release.stems!} trackTitle={release.stemsTrackTitle ?? release.title} />
                    </div>
                  )}
                  {hasPads && (
                    <div className={hasPacks ? "mb-6" : ""}>
                      <div className="font-mono text-[10px] tracking-[.14em] uppercase text-collect mb-2">
                        ↓ PADS
                      </div>
                      <PadGrid pads={release.oneshots!} />
                    </div>
                  )}
                  {hasPacks && (
                    <div>
                      <div className="font-mono text-[10px] tracking-[.14em] uppercase text-collect mb-2">
                        ↓ PACKS · cop the sounds
                      </div>
                      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                        {releasePacks.map((p) => {
                          const cover = p.cover ? urlFor(p.cover).width(440).height(440).fit("crop").url() : null;
                          return (
                            <a
                              key={p._id}
                              href={p.downloadUrl ?? "#"}
                              target={p.downloadUrl ? "_blank" : undefined}
                              rel={p.downloadUrl ? "noopener noreferrer" : undefined}
                              className="group block border border-ink p-3 transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0_#F2B705] no-underline text-ink"
                            >
                              <div className="aspect-square border border-ink mb-2 overflow-hidden bg-ink-2">
                                {cover ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={cover} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-display uppercase text-[14px] text-ink-3 text-center p-2">{p.name}</div>
                                )}
                              </div>
                              <div className="font-mono text-[9px] tracking-[.14em] uppercase text-lamp-deep">
                                {p.kind.replace("-", " ")}
                                {p.price && <> · {p.price}</>}
                              </div>
                              <div className="font-display font-semibold text-[16px] uppercase tracking-[-0.005em] leading-tight mt-0.5 line-clamp-2">
                                {p.name}
                              </div>
                              <div className="font-mono text-[9px] tracking-[.14em] uppercase text-ink-3 mt-1 group-hover:text-lamp-deep transition-colors">
                                gumroad ↗
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Room>
              );
            })()}

            {/* === THE TRACKS === tracklist */}
            {release.tracklist && release.tracklist.length > 0 && (
              <Room
                number="03"
                title={`the tracks · ${release.tracklist.length} track${release.tracklist.length === 1 ? "" : "s"}${leadVideoTrack ? " · ▶ has video" : ""}`}
                kicker="tracklist"
              >
                <div className="max-w-[760px]">
                  <TracklistAndCover tracklist={release.tracklist} />
                </div>
              </Room>
            )}

            {/* === THE CREDITS === full credit list */}
            {release.credits && release.credits.length > 0 && (
              <Room
                number="05"
                title={`the credits · ${release.credits.length}`}
                kicker="who played what"
              >
                <ul className="grid gap-1.5 max-w-[760px]">
                  {release.credits.map((c, i) => (
                    <li key={i} className="flex items-baseline gap-3 border-b border-ink/20 py-2">
                      {c.role && (
                        <span className="font-mono text-[10px] tracking-[.14em] uppercase text-ink-3 shrink-0 w-[140px]">
                          {c.role}
                        </span>
                      )}
                      <span className="flex-1 font-display font-semibold text-[18px] uppercase tracking-[-0.005em] leading-tight">
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
                      </span>
                    </li>
                  ))}
                </ul>
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
                  title={`the gallery · ${photos.length} photo${photos.length === 1 ? "" : "s"}`}
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
