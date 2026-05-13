import { notFound } from "next/navigation";
import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { PortableText } from "../../_components/shared/PortableText";
import { MediaEmbed } from "../../_components/shared/MediaEmbed";
import { getBrandBySlug, getBrandSlugs, getVideosForBrand, getGearForBrand } from "../../_lib/sanity-queries";
import { RelatedVideos } from "../../_components/shared/RelatedVideos";
import { urlFor } from "../../_lib/sanity";
import { getVideosFromPlaylist } from "../../_lib/youtube";
import { FOOTER_LINKS } from "../../_lib/social-links";
import { ArticleReader } from "./ArticleReader";

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
  const brandVideos = await getVideosForBrand(slug);
  // Pull every gear doc whose manufacturer matches this brand's name so
  // we can auto-surface Nick's full rack from this brand. Skips manual
  // re-listing in productsUsed[] — for brands like Teenage Engineering with
  // 14+ pieces this is way better than hand-curating.
  const fullRack = await getGearForBrand(brand.name);

  const logo = brand.logo ? urlFor(brand.logo).width(900).height(900).fit("max").url() : null;
  // Hero background: prefer explicit backgroundImage, fall back to the
  // featured article's hero image, so brands like Ableton can populate one
  // upload and have it work everywhere.
  const heroSrc = brand.backgroundImage ?? brand.articleImage;
  const bg = heroSrc ? urlFor(heroSrc).width(2000).height(1100).fit("crop").url() : null;
  const articleImg = brand.articleImage
    ? urlFor(brand.articleImage).width(1600).height(900).fit("crop").url()
    : null;

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

            {/* === FEATURED VIDEO + SAMPLE PACK CTA === when the brand has
                a signature video (Eventide H3000 demo etc.) + a downloadable
                sample pack Nick made for them. Renders LARGE — the video
                takes the full width of the content column at 16:9. Sample
                pack download sits as a fat CTA right below. */}
            {(brand.featuredVideoUrl || brand.samplePackUrl) && (
              <section className="mt-12">
                {brand.featuredVideoUrl && (
                  <div className="mb-6">
                    <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-3">
                      ▶ THE FIRE
                    </div>
                    <div className="border border-ink overflow-hidden">
                      <MediaEmbed url={brand.featuredVideoUrl} title={`${brand.name} — featured video`} />
                    </div>
                  </div>
                )}
                {brand.samplePackUrl && (
                  <div className="mt-6 flex flex-wrap gap-3 items-center">
                    <a
                      href={brand.samplePackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 font-display font-bold uppercase tracking-tight px-6 py-3.5 bg-ink text-paper border-2 border-ink hover:bg-paper hover:text-ink transition-colors no-underline"
                      style={{ fontSize: "clamp(16px, 1.4vw, 20px)" }}
                    >
                      <span aria-hidden>↓</span>
                      <span>{brand.samplePackTitle ?? `download nick's sample pack`}</span>
                    </a>
                    <span className="font-mono text-[10px] tracking-[.14em] uppercase text-ink-3">
                      free · made by nick for {brand.name.toLowerCase()}
                    </span>
                  </div>
                )}
              </section>
            )}

            {/* === THE ARTICLE — INLINE READER === if this brand has an
                article body scraped onto its doc, render it big as the lead
                long-form section. Recreates the article on Nick's site so
                it's part of the partnership page, not a portal out. */}
            {brand.articleBody && brand.articleBody.length > 0 && (
              <ArticleReader
                brandName={brand.name}
                articleTitle={brand.articleTitle}
                articleUrl={brand.articleUrl}
                body={brand.articleBody}
                heroImg={articleImg}
                publishedNote="Feb. 8, 2017"
              />
            )}

            {/* === PRODUCTS USED === the brand's actual products Nick uses */}
            {brand.productsUsed && brand.productsUsed.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-3">
                  IN THE RIG
                </div>
                <h2
                  className="font-display font-bold uppercase m-0 mb-6"
                  style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
                >
                  products i actually use
                </h2>
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
                >
                  {brand.productsUsed.map((p, i) => {
                    const img = p.image ? urlFor(p.image).width(720).height(720).fit("crop").url() : null;
                    const Wrapper = (props: { children: React.ReactNode }) =>
                      p.url ? (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block border border-paper bg-ink-2 transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0_#F2B705] no-underline text-paper overflow-hidden"
                        >
                          {props.children}
                        </a>
                      ) : (
                        <div className="block border border-paper bg-ink-2 overflow-hidden">{props.children}</div>
                      );
                    return (
                      <Wrapper key={i}>
                        <div className="aspect-square border-b border-paper bg-ink-2 overflow-hidden relative flex items-center justify-center">
                          {img ? (
                            <img
                              src={img}
                              alt={p.name}
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <div className="font-display font-bold uppercase text-center px-4 text-paper-2" style={{ fontSize: 22, letterSpacing: "-0.015em" }}>
                              {p.name}
                            </div>
                          )}
                        </div>
                        <div className="p-3.5">
                          <div className="font-display font-semibold text-[18px] uppercase tracking-[-0.005em] leading-tight line-clamp-2">
                            {p.name}
                          </div>
                          {p.note && (
                            <div className="font-mono text-[10px] tracking-[.06em] text-on-dark mt-1.5 leading-snug line-clamp-3">
                              {p.note}
                            </div>
                          )}
                          {p.url && (
                            <div className="font-mono text-[9px] tracking-[.14em] uppercase text-paper-2 mt-2 group-hover:text-lamp transition-colors">
                              learn more ↗
                            </div>
                          )}
                        </div>
                      </Wrapper>
                    );
                  })}
                </div>
              </section>
            )}

            {/* === THE FULL RACK FROM {BRAND} === auto-populated from gear
                docs whose manufacturer matches this brand. For brands like TE
                or Roland where Nick has many pieces, this saves him from
                re-listing each one in productsUsed. Clicks through to each
                gear's detail page. */}
            {fullRack.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">
                  THE FULL RACK · EVERYTHING {brand.name.toUpperCase()} IN MY ROOM
                </div>
                <h2
                  className="font-display font-bold uppercase m-0 mb-6"
                  style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
                >
                  the shelf · {brand.name.toLowerCase()}
                </h2>
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
                >
                  {fullRack.map((g) => {
                    const photo = g.photo ? urlFor(g.photo).width(480).height(360).fit("crop").url() : null;
                    return (
                      <Link
                        key={g._id}
                        href={`/gear/${g.slug}`}
                        className="group block border border-paper bg-ink-2 transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0_#F2B705] no-underline text-paper overflow-hidden"
                      >
                        <div className="aspect-[4/3] border-b border-paper bg-ink-2 overflow-hidden relative flex items-center justify-center">
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={photo} alt={g.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="font-display font-bold uppercase text-center px-3 text-paper-2/80 leading-tight" style={{ fontSize: 16, letterSpacing: "-0.01em" }}>
                              {g.name.replace(new RegExp(`^${brand.name}\\s*`, "i"), "")}
                            </div>
                          )}
                          {g.pinned && (
                            <div
                              className="absolute top-1.5 right-1.5 font-mono text-[7px] tracking-[.16em] uppercase px-1 py-0.5 rounded-full bg-lamp text-ink"
                            >
                              patched
                            </div>
                          )}
                          {/* Video count badge — flags gear with demos */}
                          {g.videoCount && g.videoCount > 0 && (
                            <div className="absolute top-1.5 left-1.5 font-mono text-[7px] tracking-[.16em] uppercase px-1 py-0.5 rounded-full bg-ink/85 text-lamp border border-lamp flex items-center gap-0.5">
                              <span>▶</span><span>{g.videoCount}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="font-display font-semibold text-[14px] uppercase tracking-[-0.005em] leading-tight line-clamp-2">
                            {g.name.replace(new RegExp(`^${brand.name}\\s*`, "i"), "")}
                          </div>
                          <div className="font-mono text-[8px] tracking-[.14em] uppercase text-paper-2 mt-1.5 flex items-center gap-1.5">
                            <span>{g.category.replace("-", " ")}</span>
                            {g.status === "active" && <span className="text-lamp">·  active</span>}
                            {g.status === "shelf" && <span>· shelf</span>}
                            {g.status === "travel" && <span>· travel</span>}
                            {g.videoCount && g.videoCount > 0 && (
                              <span className="text-lamp ml-auto">· {g.videoCount} ▶</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {hasClips && (
              <section className={brand.story && Array.isArray(brand.story) && brand.story.length > 0 ? "mt-16" : ""}>
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">
                  THE WORK WE DID
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

            {/* === WORKSHOPS / MASTERCLASSES / TALKS === sortable list of
                every event with this brand. Empty entries hidden. */}
            {brand.workshops && brand.workshops.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-3">
                  ON THE ROAD WITH {brand.name.toUpperCase()}
                </div>
                <h2
                  className="font-display font-bold uppercase m-0 mb-6"
                  style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
                >
                  workshops + talks
                </h2>
                <ol className="list-none p-0 m-0 border-t border-paper/30 max-w-[920px]">
                  {[...brand.workshops]
                    .sort((a, b) => {
                      // Latest first — fall back to year prefix if no full date
                      const ad = a.date ?? "";
                      const bd = b.date ?? "";
                      return bd.localeCompare(ad);
                    })
                    .map((w, i) => {
                      const place = [w.venue, w.city, w.country].filter(Boolean).join(" · ");
                      const Inner = (
                        <>
                          <div className="font-mono text-[11px] tracking-[.12em] uppercase text-paper-2 shrink-0 w-[120px] tabular-nums">
                            {w.date
                              ? w.yearOnly
                                ? w.date.slice(0, 4)
                                : w.date
                              : "—"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-display font-semibold text-[18px] uppercase tracking-[-0.005em] leading-tight">
                              {place || w.kind || "workshop"}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {w.kind && (
                                <span className="font-mono text-[9px] tracking-[.14em] uppercase text-redline">
                                  {w.kind}
                                </span>
                              )}
                              {w.note && (
                                <span className="font-serif italic text-[14px] text-paper-2">
                                  {w.note}
                                </span>
                              )}
                            </div>
                          </div>
                          {w.url && (
                            <span className="font-mono text-[9px] tracking-[.14em] uppercase text-paper-2 group-hover:text-redline transition-colors shrink-0">
                              recap ↗
                            </span>
                          )}
                        </>
                      );
                      return (
                        <li key={i} className="border-b border-paper/30 py-3">
                          {w.url ? (
                            <a
                              href={w.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-baseline gap-4 no-underline text-paper hover:opacity-90"
                            >
                              {Inner}
                            </a>
                          ) : (
                            <div className="flex items-baseline gap-4">{Inner}</div>
                          )}
                        </li>
                      );
                    })}
                </ol>
              </section>
            )}

            {/* === PRESS FALLBACK === If we have an articleUrl but no
                articleBody scraped yet, show a small link card so the page
                isn't completely missing the press piece. */}
            {brand.articleUrl && (!brand.articleBody || brand.articleBody.length === 0) && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-3">
                  PRESS · {brand.name.toUpperCase()} WROTE ABOUT ME
                </div>
                <a
                  href={brand.articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 font-mono text-[11px] tracking-[.14em] uppercase px-4 py-2 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline text-paper"
                >
                  {brand.articleTitle ?? "read the article"} ↗
                </a>
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

            <RelatedVideos videos={brandVideos} eyebrow={`FROM THE CHANNEL · ${brandVideos.length}`} title="every video tagged here" theme="dark" />
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
