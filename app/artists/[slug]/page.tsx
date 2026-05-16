import { notFound } from "next/navigation";
import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { PortableText } from "../../_components/shared/PortableText";
import { getArtistBySlug, getArtistSlugs, getSessionsForArtist } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";
import { FOOTER_LINKS } from "../../_lib/social-links";
import { buildArtistJsonLd, jsonLdScript } from "../../_lib/schema-jsonld";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getArtistSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) return { title: "artist not found" };
  return {
    title: artist.name,
    description: artist.tagline ?? `${artist.name} on calm + collect.`,
  };
}

const SOCIAL_LINKS: { key: "bandcampUrl" | "instagramUrl" | "spotifyUrl" | "websiteUrl"; label: string }[] = [
  { key: "bandcampUrl", label: "bandcamp" },
  { key: "spotifyUrl", label: "spotify" },
  { key: "instagramUrl", label: "instagram" },
  { key: "websiteUrl", label: "website" },
];

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();
  // Sessions = every studioSession doc referencing this artist in `people[]`.
  // Each session lists the OTHER artists who were there, and any releases
  // that came from it. Lights up A-Trak / Big Boi / anyone — but only when
  // session docs actually exist for them (none yet by default).
  const sessions = await getSessionsForArtist(slug);

  const useInitials = artist.displayInitials || !artist.portrait;
  const portraitUrl = artist.portrait ? urlFor(artist.portrait).width(800).height(800).fit("crop").url() : null;
  const initials = (() => {
    const parts = artist.name.replace(/[\(\[\{].*?[\)\]\}]/g, "").split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "·";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  // MusicGroup JSON-LD for SEO — gives Google a rich snippet (artist name,
  // image, social links, discography) when this page appears in search.
  const artistJsonLd = jsonLdScript(buildArtistJsonLd(artist, { portraitUrl }));

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: artistJsonLd }}
      />
      <TopNav current="label" />
      <main className="flex-1 bg-paper text-ink">
        <article className="px-6 sm:px-8 py-12">
          <div className="max-w-[1180px] mx-auto">
            <Link
              href="/calm-collect#artists"
              className="font-mono text-[11px] tracking-[.14em] uppercase text-collect hover:opacity-70 no-underline"
            >
              ← back to roster
            </Link>

            <div className="grid gap-10 mt-6 md:grid-cols-[minmax(240px,360px)_1fr] items-start">
              <div
                className="aspect-square border border-ink overflow-hidden flex items-center justify-center relative"
                style={{ background: useInitials ? "#F2B705" : undefined }}
              >
                {useInitials ? (
                  <>
                    {/* Big lamp-amber block with the initials punched out — design-system
                        anchor (lamp #F2B705) + ink. Hard-offset shadow per the brand. */}
                    <span
                      className="font-display font-black uppercase text-ink select-none leading-none"
                      style={{
                        fontSize: "clamp(120px, 22vw, 280px)",
                        letterSpacing: "-0.04em",
                      }}
                      aria-label={artist.name}
                    >
                      {initials}
                    </span>
                  </>
                ) : portraitUrl ? (
                  <img src={portraitUrl} alt={artist.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="font-display font-bold uppercase text-[40px] text-ink-3 p-6 text-center bg-paper-2 w-full h-full flex items-center justify-center" style={{ letterSpacing: "-0.02em" }}>
                    {artist.name}
                  </div>
                )}
              </div>

              <div>
                {artist.city && (
                  <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect mb-3">{artist.city}</div>
                )}
                <h1
                  className="font-display font-bold uppercase m-0"
                  style={{ fontSize: "clamp(48px, 8vw, 120px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
                >
                  {artist.name}
                </h1>
                {artist.tagline && (
                  <p className="font-serif italic text-[20px] mt-4 max-w-[600px]">{artist.tagline}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-6">
                  {SOCIAL_LINKS.map((link) => {
                    const url = artist[link.key];
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
                  {/* === Collab world banner === when an artist has a dedicated
                      tribute / shared-history page under /collabs/, surface
                      it loudly so visitors hit the deep page, not just the
                      generic credits list. */}
                  {artist.slug === "gangsta-boo" && (
                    <Link
                      href="/collabs/gangsta-boo"
                      className="font-mono text-[11px] tracking-[.14em] uppercase px-3 py-1.5 border-2 rounded-full no-underline transition-colors"
                      style={{ borderColor: "#F2C84B", color: "#0B0B0B", background: "#F2C84B" }}
                    >
                      boo + hook world →
                    </Link>
                  )}
                  {(artist.slug === "run-the-jewels" || artist.slug === "el-p") && (
                    <Link
                      href="/collabs/run-the-jewels"
                      className="font-mono text-[11px] tracking-[.14em] uppercase px-3 py-1.5 border-2 rounded-full no-underline transition-colors"
                      style={{ borderColor: "#9B1B1B", color: "#fff", background: "#9B1B1B" }}
                    >
                      rtj + hook world →
                    </Link>
                  )}
                  {(artist.slug === "cubic-zirconia" || artist.slug === "tiombe-lockhart") && (
                    <Link
                      href="/collabs/cubic-zirconia"
                      className="font-mono text-[11px] tracking-[.14em] uppercase px-3 py-1.5 border-2 rounded-full no-underline transition-colors"
                      style={{ borderColor: "#4B2E83", color: "#fff", background: "#4B2E83" }}
                    >
                      cubic zirconia world →
                    </Link>
                  )}
                  {artist.slug === "men-women-children-band" && (
                    <Link
                      href="/collabs/men-women-children"
                      className="font-mono text-[11px] tracking-[.14em] uppercase px-3 py-1.5 border-2 rounded-full no-underline transition-colors"
                      style={{ borderColor: "#E2651A", color: "#fff", background: "#E2651A" }}
                    >
                      mwc world →
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {artist.bio && Array.isArray(artist.bio) && artist.bio.length > 0 && (
              <section className="mt-16 max-w-[720px]">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect mb-3">BIO</div>
                <PortableText value={artist.bio} />
              </section>
            )}

            {/* === SESSIONS === every studioSession doc that references
                this artist. Each tile shows: date · location · the OTHER
                people on the session · any released records that came from
                it. Empty list = no sessions catalogued yet for them (most
                artists will be empty until Nick populates /studio). */}
            {sessions.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect mb-4">
                  SESSIONS @ THE SPACEPIT · {sessions.length}
                </div>
                <ol className="list-none p-0 m-0 grid gap-3 max-w-[920px]">
                  {sessions.map((s) => {
                    const others = s.people.filter((p) => p.slug !== artist.slug);
                    return (
                      <li key={s._id} className="border border-ink/40 p-4">
                        <div className="flex items-baseline justify-between gap-3 flex-wrap">
                          <div>
                            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect tabular-nums">
                              {new Date(s.date + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                              {s.location && <span className="text-ink-3"> · {s.location}</span>}
                            </div>
                            <div className="font-display font-semibold text-[20px] sm:text-[22px] uppercase tracking-[-0.005em] leading-tight mt-1">
                              {s.title}
                            </div>
                          </div>
                          {s.becameReleases && s.becameReleases.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {s.becameReleases.map((r) => (
                                <Link
                                  key={r._id}
                                  href={`/releases/${r.slug}`}
                                  className="font-mono text-[10px] tracking-[.12em] uppercase px-2.5 py-1 border border-collect rounded-full no-underline text-collect hover:bg-collect hover:text-paper transition-colors"
                                >
                                  ▶ {r.title}{r.year ? ` (${r.year})` : ""}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                        {others.length > 0 && (
                          <div className="font-mono text-[10px] tracking-[.1em] text-ink-3 mt-2 flex flex-wrap gap-x-2">
                            <span className="text-ink-3/60 uppercase tracking-[.14em]">with</span>
                            {others.map((p, i) => (
                              <span key={p.slug}>
                                <Link
                                  href={`/artists/${p.slug}`}
                                  className="underline underline-offset-2 hover:text-collect no-underline"
                                >
                                  {p.name}
                                </Link>
                                {i < others.length - 1 ? " ·" : ""}
                              </span>
                            ))}
                          </div>
                        )}
                        {s.guests && s.guests.length > 0 && (
                          <div className="font-mono text-[10px] tracking-[.1em] text-ink-3 mt-1">
                            <span className="text-ink-3/60 uppercase tracking-[.14em]">guests:</span> {s.guests.join(" · ")}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {artist.releases && artist.releases.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect mb-4">RELEASES</div>
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                  {artist.releases.map((r) => {
                    const cover = r.cover ? urlFor(r.cover).width(440).height(440).fit("crop").url() : null;
                    return (
                      <Link
                        key={r._id}
                        href={`/releases/${r.slug}`}
                        className="group border border-ink p-3.5 transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#0E4B3A] no-underline text-ink"
                      >
                        <div
                          className="aspect-square border border-ink mb-3 flex items-center justify-center relative overflow-hidden"
                          style={{ background: r.coverColor ?? "#1C1A17" }}
                        >
                          {cover ? (
                            <img src={cover} alt={r.title} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <span
                              className="font-display font-bold uppercase text-center px-3 text-paper"
                              style={{ fontSize: 22, transform: "rotate(-4deg)", letterSpacing: "-0.02em", color: r.coverColor ? "#0B0B0B" : "#F4EFE6" }}
                            >
                              {r.title}
                            </span>
                          )}
                        </div>
                        <div className="font-display font-bold text-[20px] uppercase leading-none">{r.title}</div>
                        {r.year && <div className="font-mono text-[10px] tracking-[.1em] uppercase text-ink-3 mt-2">{r.year} · {r.format ?? ""}</div>}
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {artist.bands && artist.bands.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect mb-4">
                  BANDS
                </div>
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                  {artist.bands.map((b) => {
                    const years = b.yearStart
                      ? `${b.yearStart}${b.yearEnd ? `–${b.yearEnd}` : "–"}`
                      : "";
                    return (
                      <Link
                        key={b._id}
                        href={`/eras/${b.slug}`}
                        className="group border border-ink p-4 transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0_#0E4B3A] no-underline text-ink"
                      >
                        {b.kind && (
                          <div className="font-mono text-[10px] tracking-[.14em] uppercase text-collect">{b.kind}</div>
                        )}
                        <div className="font-display font-semibold text-[22px] uppercase tracking-[-0.005em] leading-tight mt-0.5">
                          {b.name}
                        </div>
                        {years && (
                          <div className="font-mono text-[10px] tracking-[.1em] uppercase text-ink-3 mt-1">{years}</div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {artist.appearsOn && artist.appearsOn.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect mb-4">
                  APPEARS ON
                </div>
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                  {artist.appearsOn.map((a) => {
                    const r = a.release;
                    const cover = r.cover ? urlFor(r.cover).width(440).height(440).fit("crop").url() : null;
                    const roles = (a.roles ?? []).filter(Boolean).join(" · ");
                    return (
                      <Link
                        key={r._id}
                        href={`/releases/${r.slug}`}
                        className="group border border-ink p-3.5 transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#0E4B3A] no-underline text-ink"
                      >
                        <div
                          className="aspect-square border border-ink mb-3 flex items-center justify-center relative overflow-hidden"
                          style={{ background: r.coverColor ?? "#1C1A17" }}
                        >
                          {cover ? (
                            <img src={cover} alt={r.title} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <span
                              className="font-display font-bold uppercase text-center px-3 text-paper"
                              style={{ fontSize: 22, transform: "rotate(-4deg)", letterSpacing: "-0.02em", color: r.coverColor ? "#0B0B0B" : "#F4EFE6" }}
                            >
                              {r.title}
                            </span>
                          )}
                        </div>
                        <div className="font-display font-bold text-[18px] uppercase leading-none">{r.title}</div>
                        {roles && (
                          <div className="font-mono text-[10px] tracking-[.1em] uppercase text-collect mt-2">{roles}</div>
                        )}
                        <div className="font-mono text-[10px] tracking-[.1em] uppercase text-ink-3 mt-1">
                          {r.artists.map((x) => x.name).join(" · ")}
                          {r.year && <> · {r.year}</>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {artist.gallery && artist.gallery.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect mb-4">GALLERY</div>
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                  {artist.gallery.map((img, i) => {
                    const src = urlFor(img).width(800).url();
                    return (
                      <div key={i} className="border border-ink overflow-hidden aspect-square">
                        <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
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
