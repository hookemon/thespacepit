import { notFound } from "next/navigation";
import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { PortableText } from "../../_components/shared/PortableText";
import { MixcloudEmbed } from "../../_components/shared/MixcloudEmbed";
import { MediaEmbed } from "../../_components/shared/MediaEmbed";
import { MixAudioPlayer } from "./MixAudioPlayer";
import { getMixBySlug, getMixSlugs } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";
import { FOOTER_LINKS } from "../../_lib/social-links";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getMixSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mix = await getMixBySlug(slug);
  if (!mix) return { title: "mix not found" };
  return {
    title: `${mix.title} — nick hook mix`,
    description: mix.era ? `${mix.title} · ${mix.era}` : mix.title,
  };
}

export default async function MixPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mix = await getMixBySlug(slug);
  if (!mix) notFound();

  const cover = mix.cover ? urlFor(mix.cover).width(900).height(900).fit("crop").url() : null;

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="nick" />
      <main className="flex-1">
        <article className="px-6 sm:px-8 py-12">
          <div className="max-w-[1180px] mx-auto">
            <Link
              href="/mixes"
              className="font-mono text-[11px] tracking-[.14em] uppercase text-redline hover:opacity-70 no-underline"
            >
              ← back to mixes
            </Link>

            <div className="grid gap-10 mt-6 md:grid-cols-[minmax(280px,420px)_1fr] items-start">
              <div className="aspect-square border border-paper overflow-hidden bg-ink-2 flex items-center justify-center">
                {cover ? (
                  <img src={cover} alt={mix.title} className="w-full h-full object-cover" />
                ) : (
                  <span
                    className="font-display font-bold uppercase text-center px-6"
                    style={{ fontSize: 36, transform: "rotate(-4deg)", letterSpacing: "-0.02em" }}
                  >
                    {mix.title}
                  </span>
                )}
              </div>

              <div>
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-3 flex flex-wrap gap-2.5">
                  {mix.era && <span>{mix.era}</span>}
                  {mix.date && (<><span>·</span><span>{mix.date}</span></>)}
                  {mix.duration && (<><span>·</span><span>{mix.duration}</span></>)}
                </div>
                <h1
                  className="font-display font-bold uppercase m-0"
                  style={{ fontSize: "clamp(40px, 6vw, 80px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
                >
                  {mix.title}
                </h1>

                {mix.mixcloudUrl && (
                  <div className="mt-7">
                    <MixcloudEmbed url={mix.mixcloudUrl} title={mix.title} size="tall" />
                  </div>
                )}

                {mix.youtubeUrl && (
                  <div className="mt-5">
                    <MediaEmbed url={mix.youtubeUrl} title={mix.title} />
                  </div>
                )}

                {/* Direct-upload audio (no external embed) → play through the
                    global MiniPlayer. Only renders when there's no
                    Mixcloud/YouTube embed already taking the audio surface. */}
                {mix.audioUrl && !mix.mixcloudUrl && !mix.youtubeUrl && (
                  <div className="mt-7">
                    <MixAudioPlayer
                      audioUrl={mix.audioUrl}
                      title={mix.title}
                      era={mix.era}
                      coverUrl={mix.cover ? urlFor(mix.cover).width(400).height(400).fit("crop").url() : null}
                      duration={mix.duration}
                      mixSlug={mix.slug}
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-6">
                  {mix.mixcloudUrl && (
                    <a
                      href={mix.mixcloudUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] tracking-[.1em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline"
                    >
                      mixcloud →
                    </a>
                  )}
                  {mix.soundcloudUrl && (
                    <a
                      href={mix.soundcloudUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] tracking-[.1em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline"
                    >
                      soundcloud →
                    </a>
                  )}
                  {mix.youtubeUrl && (
                    <a
                      href={mix.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] tracking-[.1em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline"
                    >
                      youtube →
                    </a>
                  )}
                </div>
              </div>
            </div>

            {mix.description && Array.isArray(mix.description) && mix.description.length > 0 && (
              <section className="mt-16 max-w-[720px]">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-3">NOTES</div>
                <PortableText value={mix.description} />
              </section>
            )}

            {mix.tracklist && mix.tracklist.length > 0 && (
              <section className="mt-12 max-w-[720px]">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-4">TRACKLIST</div>
                <ol className="font-mono text-[13px] tabular-nums">
                  {mix.tracklist.map((t, i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[40px_1fr] gap-3 py-2 border-b border-ink-3"
                    >
                      <span className="text-on-dark">{String(i + 1).padStart(2, "0")}</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
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
