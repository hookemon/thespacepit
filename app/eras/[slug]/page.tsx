import { notFound } from "next/navigation";
import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { PortableText } from "../../_components/shared/PortableText";
import { getProjectBySlug, getProjectSlugs, getVideosForEra } from "../../_lib/sanity-queries";
import { RelatedVideos } from "../../_components/shared/RelatedVideos";
import { urlFor } from "../../_lib/sanity";
import { FOOTER_LINKS } from "../../_lib/social-links";

export const revalidate = 60;

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

export default async function EraPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) notFound();
  const videos = await getVideosForEra(slug);

  const cover = p.cover ? urlFor(p.cover).width(1200).height(800).fit("crop").url() : null;
  const years = p.yearStart ? (p.yearEnd ? `${p.yearStart}–${p.yearEnd}` : `${p.yearStart} → today`) : "";

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="nick" />
      <main className="flex-1">
        <article>
          <header className="relative px-6 sm:px-8 py-16 border-b border-paper overflow-hidden" style={{ background: p.color ?? "#1C1A17" }}>
            {cover && (
              <>
                <img src={cover} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-ink/55" />
              </>
            )}
            <div className="relative max-w-[1180px] mx-auto">
              <Link href="/eras" className="font-mono text-[11px] tracking-[.14em] uppercase text-paper hover:opacity-70 no-underline">
                ← back to eras
              </Link>
              <div className="font-mono text-[11px] tracking-[.14em] uppercase text-paper mt-6 mb-2">
                {years}{p.kind && years ? " · " : ""}{p.kind}
              </div>
              <h1
                className="font-display font-bold uppercase m-0 text-paper"
                style={{ fontSize: "clamp(48px, 10vw, 160px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
              >
                {p.name}
              </h1>
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
            </div>
          </header>

          <div className="px-6 sm:px-8 py-12 max-w-[1180px] mx-auto">
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
                    return (
                      <Link
                        key={r._id}
                        href={`/releases/${r.slug}`}
                        className="block border border-paper p-3.5 transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#E83A1C] no-underline text-paper"
                      >
                        <div className="aspect-square border border-paper mb-3 overflow-hidden" style={{ background: r.coverColor ?? "#1C1A17" }}>
                          {cv && <img src={cv} alt={r.title} className="w-full h-full object-cover" />}
                        </div>
                        <div className="font-display font-bold text-[18px] uppercase leading-none">{r.title}</div>
                        {r.year && <div className="font-mono text-[10px] tracking-[.1em] uppercase text-on-dark mt-1.5">{r.year}</div>}
                      </Link>
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
