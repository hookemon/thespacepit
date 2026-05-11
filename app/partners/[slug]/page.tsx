import { notFound } from "next/navigation";
import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { PortableText } from "../../_components/shared/PortableText";
import { MediaEmbed } from "../../_components/shared/MediaEmbed";
import { getBrandBySlug, getBrandSlugs } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";
import { getVideosFromPlaylist } from "../../_lib/youtube";
import { FOOTER_LINKS } from "../../_lib/social-links";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getBrandSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return { title: "partner not found" };
  return { title: `${brand.name} — partners`, description: brand.tagline };
}

// A combined media item from all sources (playlist + manual one-offs).
type MediaClip = { url: string; title?: string; source: "playlist" | "manual" };

export default async function PartnerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const logo = brand.logo ? urlFor(brand.logo).width(900).height(900).fit("max").url() : null;
  const bg = brand.backgroundImage ? urlFor(brand.backgroundImage).width(2000).height(1100).fit("crop").url() : null;

  // Pull videos from the YouTube playlist if one is set, then combine with the
  // manual videos[] list. Dedupe so a clip showing up in both places only
  // renders once.
  const playlistVideos = brand.youtubePlaylistId
    ? await getVideosFromPlaylist(brand.youtubePlaylistId, 24)
    : [];

  const fromPlaylist: MediaClip[] = playlistVideos.map((v) => ({
    url: `https://www.youtube.com/watch?v=${v.id}`,
    title: v.title,
    source: "playlist",
  }));

  const fromManual: MediaClip[] = (brand.videos ?? []).map((v) => ({
    url: v.youtubeUrl,
    title: v.title,
    source: "manual",
  }));

  // Manual entries first (curated), then playlist fill — minus any URL overlap.
  const seen = new Set(fromManual.map((m) => m.url));
  const allClips: MediaClip[] = [
    ...fromManual,
    ...fromPlaylist.filter((m) => !seen.has(m.url)),
  ];

  const hasClips = allClips.length > 0;

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="nick" />
      <main className="flex-1">
        {/* Hero — full-bleed bg photo with logo overlaid */}
        <section
          className="relative border-b-2 border-paper overflow-hidden"
          style={{ background: bg ? "#0B0B0B" : (brand.logoColor ?? "#1C1A17") }}
        >
          {bg && (
            <img
              src={bg}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {bg && (
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(11,11,11,0.20) 0%, rgba(11,11,11,0.65) 100%)" }}
            />
          )}
          <div className="relative px-6 sm:px-8 pt-8 pb-16">
            <div className="max-w-[1180px] mx-auto">
              <Link
                href="/partners"
                className="font-mono text-[11px] tracking-[.14em] uppercase text-paper hover:opacity-70 no-underline drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
              >
                ← back to partners
              </Link>

              <div className="flex flex-col items-center text-center pt-16 pb-12 sm:pt-24 sm:pb-20">
                {logo ? (
                  <img
                    src={logo}
                    alt={brand.name}
                    className="max-w-[440px] w-[70%] max-h-[280px] object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)]"
                  />
                ) : (
                  <h1
                    className="font-display font-bold uppercase m-0 drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)]"
                    style={{
                      fontSize: "clamp(48px, 9vw, 120px)",
                      lineHeight: 0.9,
                      letterSpacing: "-0.02em",
                      color: bg ? "#F4EFE6" : (brand.logoColor ? "#0B0B0B" : "#F4EFE6"),
                    }}
                  >
                    {brand.name}
                  </h1>
                )}

                {brand.relationship && (
                  <div className="font-mono text-[11px] tracking-[.18em] uppercase text-redline mt-7 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                    {brand.relationship}
                  </div>
                )}
                {logo && <h1 className="sr-only">{brand.name}</h1>}
                {brand.tagline && (
                  <p className="font-serif italic text-[20px] sm:text-[22px] mt-4 max-w-[640px] text-paper drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">
                    {brand.tagline}
                  </p>
                )}
                {brand.websiteUrl && (
                  <div className="mt-6">
                    <a
                      href={brand.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block font-mono text-[11px] tracking-[.1em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline backdrop-blur-sm bg-ink/30"
                    >
                      website →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <article className="px-6 sm:px-8 py-12">
          <div className="max-w-[1180px] mx-auto">
            {brand.story && Array.isArray(brand.story) && brand.story.length > 0 && (
              <section className="max-w-[720px]">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-3">THE STORY</div>
                <PortableText value={brand.story} />
              </section>
            )}

            {hasClips && (
              <section className={brand.story && Array.isArray(brand.story) && brand.story.length > 0 ? "mt-16" : ""}>
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">
                  THE WORK WE DID · {allClips.length} CLIP{allClips.length === 1 ? "" : "S"}
                </div>
                <h2
                  className="font-display font-bold uppercase m-0 mb-6"
                  style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
                >
                  together
                </h2>
                <div
                  className="grid gap-5"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}
                >
                  {allClips.map((c, i) => (
                    <div key={`${c.url}-${i}`}>
                      <MediaEmbed url={c.url} title={c.title ?? brand.name} />
                      {c.title && (
                        <div className="font-mono text-[10px] tracking-[.1em] uppercase text-on-dark mt-2 line-clamp-2">
                          {c.title}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {brand.gear && brand.gear.length > 0 && (
              <section className="mt-16 max-w-[720px]">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-4">GEAR</div>
                <ul className="font-mono text-[14px] grid gap-2">
                  {brand.gear.map((g, i) => (
                    <li key={i} className="border-b border-ink-3 py-1.5">· {g}</li>
                  ))}
                </ul>
              </section>
            )}
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
