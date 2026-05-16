import { notFound } from "next/navigation";
import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { MediaEmbed } from "../../_components/shared/MediaEmbed";
import { getGearBySlug, getGearSlugs, getVideosForGear, type PackKind } from "../../_lib/sanity-queries";
import { RelatedVideos } from "../../_components/shared/RelatedVideos";
import { urlFor } from "../../_lib/sanity";
import { FOOTER_LINKS } from "../../_lib/social-links";
import { CATEGORIES } from "../../_lib/gear-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getGearSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await getGearBySlug(slug);
  if (!g) return { title: "gear not found" };
  return {
    title: `${g.name} — gear log`,
    description: g.note ?? `${g.manufacturer ?? ""} ${g.name}`,
  };
}

const PACK_KIND_LABEL: Record<PackKind, string> = {
  "sample-pack": "sample pack",
  "preset-pack": "preset pack",
  "template":    "template",
  "tutorial":    "tutorial",
  "loop-pack":   "loop pack",
  "drum-kit":    "drum kit",
};

const STATUS_LABEL: Record<string, string> = {
  active: "patched in",
  shelf: "on the shelf",
  travel: "travel kit",
  wishlist: "wishlist",
  retired: "retired",
};

const STATUS_COLOR: Record<string, string> = {
  active: "#F2B705",
  shelf: "#F4EFE6",
  travel: "#7BD3A8",
  wishlist: "#E83A1C",
  retired: "rgba(244,239,230,0.4)",
};

export default async function GearDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await getGearBySlug(slug);
  if (!g) notFound();
  const gearVideos = await getVideosForGear(slug);

  const photo = g.photo ? urlFor(g.photo).width(2000).height(1100).fit("crop").url() : null;
  const categoryLabel = CATEGORIES.find((c) => c.key === g.category)?.label ?? g.category;
  const statusLabel = STATUS_LABEL[g.status] ?? g.status;
  const statusColor = STATUS_COLOR[g.status] ?? "#F4EFE6";

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        {/* Hero — full-bleed photo or solid panel */}
        <section
          className="relative border-b-2 border-paper overflow-hidden"
          style={{ background: photo ? "#0B0B0B" : "#1C1A17" }}
        >
          {photo && (
            <>
              <img src={photo} alt={g.name} aria-hidden className="absolute inset-0 w-full h-full object-cover" />
              <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,11,11,0.20) 0%, rgba(11,11,11,0.75) 100%)" }} />
            </>
          )}
          <div className="relative px-6 sm:px-8 pt-8 pb-16">
            <div className="max-w-[1180px] mx-auto">
              <Link
                href={`/gear?cat=${g.category}`}
                className="font-mono text-[11px] tracking-[.14em] uppercase text-paper hover:opacity-70 no-underline drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
              >
                ← {categoryLabel}
              </Link>

              <div className="mt-16 sm:mt-24 max-w-[920px]">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ background: statusColor, boxShadow: "0 0 0 2px rgba(11,11,11,0.5)" }}
                    aria-hidden
                  />
                  <span
                    className="font-mono text-[11px] tracking-[.18em] uppercase"
                    style={{ color: statusColor }}
                  >
                    {statusLabel}
                    {g.yearAcquired ? ` · since ${g.yearAcquired}` : ""}
                  </span>
                </div>
                {g.manufacturer && (
                  <div className="font-mono text-[12px] tracking-[.18em] uppercase text-paper-2 mb-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                    {g.manufacturer}
                  </div>
                )}
                <h1
                  className="font-display font-bold uppercase m-0 drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)]"
                  style={{ fontSize: "clamp(40px, 9vw, 120px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
                >
                  {g.name}
                </h1>
                {g.note && (
                  <p className="font-serif italic text-[20px] sm:text-[22px] mt-5 max-w-[640px] text-paper drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">
                    {g.note}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <article className="px-6 sm:px-8 py-12">
          <div className="max-w-[1180px] mx-auto">
            {g.packs.length > 0 ? (
              <section>
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">
                  PACKS
                </div>
                <h2
                  className="font-display font-bold uppercase m-0 mb-6"
                  style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
                >
                  drop on it
                </h2>
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                  {g.packs.map((p) => {
                    const cover = p.cover ? urlFor(p.cover).width(520).height(520).fit("crop").url() : null;
                    return (
                      <Link
                        key={p._id}
                        href={p.downloadUrl ?? "#"}
                        target={p.downloadUrl ? "_blank" : undefined}
                        rel={p.downloadUrl ? "noopener noreferrer" : undefined}
                        className="group block border border-paper p-3.5 transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0_#F2B705] no-underline text-paper"
                      >
                        <div className="aspect-square border border-paper/40 mb-3 flex items-center justify-center relative overflow-hidden bg-ink-2">
                          {cover ? (
                            <img src={cover} alt={p.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <span className="font-display font-bold uppercase text-center px-3 text-paper-2" style={{ fontSize: 18, letterSpacing: "-0.02em" }}>
                              {p.name}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[9px] tracking-[.14em] uppercase text-lamp">
                          {PACK_KIND_LABEL[p.kind] ?? p.kind}
                          {p.year ? ` · ${p.year}` : ""}
                        </div>
                        <div className="font-display font-semibold text-[18px] uppercase tracking-[-0.005em] leading-tight mt-1">
                          {p.name}
                        </div>
                        {p.tagline && (
                          <div className="font-serif italic text-[14px] text-paper-2 mt-1 line-clamp-2">{p.tagline}</div>
                        )}
                        {(p.downloadUrl || p.price) && (
                          <div className="font-mono text-[10px] tracking-[.12em] uppercase mt-2 text-paper-2 group-hover:text-lamp transition-colors flex items-center gap-2">
                            {p.price && <span>{p.price}</span>}
                            {p.downloadUrl && <span>↗ get it</span>}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>

                {g.packs.some((p) => p.youtubeUrl) && (
                  <div className="mt-12">
                    <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-4">WALKTHROUGHS</div>
                    <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
                      {g.packs.filter((p) => p.youtubeUrl).map((p) => (
                        <div key={`v-${p._id}`}>
                          <MediaEmbed url={p.youtubeUrl!} title={p.name} />
                          <div className="font-mono text-[10px] tracking-[.1em] uppercase text-on-dark mt-2 line-clamp-2">{p.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <section>
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-3">PACKS</div>
                <p className="font-serif italic text-[18px] text-paper-2 max-w-[560px]">
                  no packs for this one yet. when nick drops a sample pack, preset pack, or template that uses this unit, it&apos;ll appear here automatically.
                </p>
              </section>
            )}

            <RelatedVideos videos={gearVideos} eyebrow={`FROM THE CHANNEL · ${gearVideos.length}`} title="every demo + jam tagged here" theme="dark" />

            {/* IN THE WILD — articles, videos, movie scenes, podcasts, anywhere
                this gear shows up beyond the studio. Editable in /studio under
                gear.links[]. */}
            {g.links && g.links.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">
                  IN THE WILD · {g.links.length}
                </div>
                <h2
                  className="font-display font-bold uppercase m-0 mb-6 text-paper"
                  style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.01em" }}
                >
                  press · features · scenes
                </h2>
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                  {g.links.map((l, i) => (
                    <a
                      key={i}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border border-paper p-4 transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0_#E83A1C] no-underline text-paper"
                    >
                      <div className="font-mono text-[10px] tracking-[.16em] uppercase text-redline mb-2 flex items-center gap-2">
                        <span>{l.kind}</span>
                        {l.source && <><span>·</span><span className="text-paper-2">{l.source}</span></>}
                      </div>
                      <div
                        className="font-display font-semibold uppercase leading-tight"
                        style={{ fontSize: "clamp(16px, 2vw, 20px)", letterSpacing: "-0.005em" }}
                      >
                        {l.title}
                      </div>
                      {l.note && (
                        <p className="font-serif italic text-[14px] text-paper-2 mt-2 leading-snug line-clamp-3">{l.note}</p>
                      )}
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* GALLERY — extra photos with captions. Edit in /studio under gear.gallery[]. */}
            {g.gallery && g.gallery.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">
                  GALLERY · {g.gallery.length}
                </div>
                <h2
                  className="font-display font-bold uppercase m-0 mb-6 text-paper"
                  style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.01em" }}
                >
                  in context
                </h2>
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                  {g.gallery.map((p, i) => {
                    const src = urlFor(p.image).width(900).height(900).fit("crop").url();
                    return (
                      <figure key={i} className="border border-paper">
                        <img src={src} alt={p.caption ?? g.name} className="block w-full aspect-square object-cover" loading="lazy" />
                        {p.caption && (
                          <figcaption className="font-mono text-[10px] tracking-[.1em] uppercase text-paper-2 p-3 leading-snug">
                            {p.caption}
                          </figcaption>
                        )}
                      </figure>
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
        heptagon="fill-white"
        signoff="see u in the pit 🪐"
        meta="brooklyn · medellín · since 2011"
        links={[...FOOTER_LINKS.spacepit]}
      />
    </div>
  );
}
