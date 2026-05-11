import { notFound } from "next/navigation";
import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { PortableText } from "../../_components/shared/PortableText";
import { getArtistBySlug, getArtistSlugs } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";
import { FOOTER_LINKS } from "../../_lib/social-links";

export const revalidate = 60;

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

  const portraitUrl = artist.portrait ? urlFor(artist.portrait).width(800).height(800).fit("crop").url() : null;

  return (
    <>
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
              <div className="aspect-square border border-ink overflow-hidden bg-paper-2 flex items-center justify-center">
                {portraitUrl ? (
                  <img src={portraitUrl} alt={artist.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="font-display font-bold uppercase text-[40px] text-ink-3 p-6 text-center" style={{ letterSpacing: "-0.02em" }}>
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
                </div>
              </div>
            </div>

            {artist.bio && Array.isArray(artist.bio) && artist.bio.length > 0 && (
              <section className="mt-16 max-w-[720px]">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect mb-3">BIO</div>
                <PortableText value={artist.bio} />
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
                  BANDS · {artist.bands.length}
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
                  APPEARS ON · {artist.appearsOn.length}
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
