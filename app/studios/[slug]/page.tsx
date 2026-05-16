import { notFound } from "next/navigation";
import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { PortableText } from "../../_components/shared/PortableText";
import { MediaEmbed } from "../../_components/shared/MediaEmbed";
import { getStudioBySlug, getStudioSlugs } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";
import { getVideosFromPlaylist } from "../../_lib/youtube";
import { FOOTER_LINKS } from "../../_lib/social-links";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getStudioSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const studio = await getStudioBySlug(slug);
  if (!studio) return { title: "studio not found" };
  return { title: `${studio.name} — thespacepit`, description: studio.tagline };
}

export default async function StudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const studio = await getStudioBySlug(slug);
  if (!studio) notFound();

  const hero = studio.hero ? urlFor(studio.hero).width(2200).height(1200).fit("crop").url() : null;

  // Combine playlist videos + manual one-offs (IG reels, TikToks, etc.)
  const playlistVideos = studio.youtubePlaylistId
    ? await getVideosFromPlaylist(studio.youtubePlaylistId, 24)
    : [];
  const manualClips = (studio.videos ?? []).map((v) => ({ url: v.youtubeUrl, title: v.title }));
  const playlistClips = playlistVideos.map((v) => ({
    url: `https://www.youtube.com/watch?v=${v.id}`,
    title: v.title,
  }));
  const seenUrls = new Set(manualClips.map((c) => c.url));
  const allClips = [...manualClips, ...playlistClips.filter((c) => !seenUrls.has(c.url))];

  return (
    <>
      <TopNav current="spacepit" />
      <main className="flex-1 bg-paper text-ink">
        <header
          className="relative overflow-hidden px-6 sm:px-8 py-20 border-b-2 border-ink"
          style={{ background: studio.color ?? "#1C1A17" }}
        >
          {hero && (
            <>
              <img src={hero} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-ink/45" />
            </>
          )}
          <div className="relative max-w-[1180px] mx-auto">
            <Link href="/studios" className="font-mono text-[11px] tracking-[.14em] uppercase text-paper hover:opacity-70 no-underline">
              ← back to studios
            </Link>
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-paper-2 mt-6 mb-2 flex flex-wrap gap-2.5">
              {studio.city && <span>{studio.city}</span>}
              {studio.country && (<><span>·</span><span>{studio.country}</span></>)}
              {studio.yearOpened && (<><span>·</span><span>EST. {studio.yearOpened}</span></>)}
            </div>
            <h1
              className="font-display font-bold uppercase m-0 text-paper break-words"
              style={{ fontSize: "clamp(48px, 11vw, 200px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
            >
              {studio.name}
            </h1>
            {studio.tagline && (
              <p className="font-serif italic text-[22px] mt-5 max-w-[720px] text-paper-2">{studio.tagline}</p>
            )}
            {studio.instagramUrl && (
              <a
                href={studio.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-6 font-mono text-[11px] tracking-[.1em] uppercase px-3 py-1.5 border border-paper text-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline"
              >
                instagram →
              </a>
            )}
          </div>
        </header>

        <div className="px-6 sm:px-8 py-12 max-w-[1180px] mx-auto">
          {studio.story && Array.isArray(studio.story) && studio.story.length > 0 && (
            <section className="max-w-[720px]">
              <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp-deep mb-3">THE STORY</div>
              <PortableText value={studio.story} />
            </section>
          )}

          {studio.gear && studio.gear.length > 0 && (
            <section className="mt-16 max-w-[720px]">
              <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp-deep mb-4">GEAR THAT LIVES HERE</div>
              <ul className="font-mono text-[14px] grid gap-2">
                {studio.gear.map((g, i) => (
                  <li key={i} className="border-b border-ink/20 py-1.5">· {g}</li>
                ))}
              </ul>
            </section>
          )}

          {allClips.length > 0 && (
            <section className="mt-16">
              <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp-deep mb-2">
                INSIDE THE ROOM
              </div>
              <h2
                className="font-display font-bold uppercase m-0 mb-6"
                style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
              >
                video
              </h2>
              <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
                {allClips.map((c, i) => (
                  <div key={`${c.url}-${i}`}>
                    <MediaEmbed url={c.url} title={c.title ?? studio.name} />
                    {c.title && (
                      <div className="font-mono text-[10px] tracking-[.1em] uppercase text-ink-3 mt-2 line-clamp-2">
                        {c.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {studio.gallery && studio.gallery.length > 0 && (
            <section className="mt-16">
              <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp-deep mb-4">GALLERY</div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                {studio.gallery.map((img, i) => {
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
      </main>
      <Footer
        theme="paper"
        heptagon="fill-white"
        signoff="see u in the pit 🪐"
        meta="brooklyn · medellín · since 2011"
        links={[...FOOTER_LINKS.spacepit]}
      />
    </>
  );
}
