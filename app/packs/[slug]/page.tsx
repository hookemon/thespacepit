import Link from "next/link";
import { notFound } from "next/navigation";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { NewsletterSection } from "../../_components/shared/NewsletterSection";
import { YouTubeEmbed } from "../../_components/shared/YouTubeEmbed";
import { PortableText } from "../../_components/shared/PortableText";
import {
  getPackBySlug,
  getPackSlugs,
  type PackKind,
  type PackAccess,
} from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";
import { FOOTER_LINKS } from "../../_lib/social-links";

export const revalidate = 300;

const KIND_LABEL: Record<PackKind, string> = {
  "sample-pack": "sample pack",
  "preset-pack": "preset pack",
  "template":    "template",
  "tutorial":    "tutorial / 1-on-1",
  "loop-pack":   "loop pack",
  "drum-kit":    "drum kit",
};

const KIND_COLOR: Record<PackKind, string> = {
  "sample-pack": "#F2B705",
  "preset-pack": "#C9B9E8",
  "template":    "#7BD3A8",
  "tutorial":    "#E83A1C",
  "loop-pack":   "#65C7F7",
  "drum-kit":    "#FF6FB5",
};

const ACCESS_META: Record<PackAccess, { label: string; cta: string; color: string }> = {
  free:     { label: "free · public download",         cta: "download now ↓",           color: "#7BD3A8" },
  vault:    { label: "vault · supporter unlock",       cta: "unlock w/ patreon →",      color: "#F2B705" },
  purchase: { label: "purchase · one-time pay",        cta: "cop on gumroad ↗",         color: "#E83A1C" },
};

function resolveAccess(p: { access?: PackAccess }): PackAccess {
  return p.access ?? "free";
}

function resolveHref(p: { access?: PackAccess; vaultUrl?: string; downloadUrl?: string }): string {
  const a = resolveAccess(p);
  if (a === "vault") return p.vaultUrl ?? p.downloadUrl ?? "#";
  return p.downloadUrl ?? p.vaultUrl ?? "#";
}

export async function generateStaticParams() {
  const slugs = await getPackSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pack = await getPackBySlug(slug);
  if (!pack) return { title: "pack — thespacepit" };
  return {
    title: `${pack.name.toLowerCase()} — thespacepit packs`,
    description:
      pack.tagline ??
      `${KIND_LABEL[pack.kind] ?? "pack"} from nick hook's rig at thespacepit.`,
  };
}

export default async function PackDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pack = await getPackBySlug(slug);
  if (!pack) notFound();

  const cover = pack.cover ? urlFor(pack.cover).width(1280).height(1280).fit("crop").url() : null;
  const kindColor = KIND_COLOR[pack.kind] ?? "#F2B705";
  const access = resolveAccess(pack);
  // Defensive: if Sanity has an unexpected access value (typo / new field),
  // fall back to "free" meta rather than crashing the prerender.
  const accessMeta = ACCESS_META[access] ?? ACCESS_META.free;
  const href = resolveHref(pack);
  const external = href.startsWith("http");

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        {/* ---------- BACK LINK ---------- */}
        <div className="px-5 sm:px-8 pt-8">
          <Link
            href="/packs"
            className="font-mono text-[11px] tracking-[.14em] uppercase text-paper-2 hover:text-lamp no-underline"
          >
            ← back to packs
          </Link>
        </div>

        {/* ---------- HERO ---------- */}
        <header className="px-5 sm:px-8 pt-6 pb-10 border-b border-paper/30">
          <div className="max-w-[1180px] mx-auto grid gap-10 md:grid-cols-[minmax(280px,1fr)_1.2fr] items-start">
            {/* Cover */}
            <div className="border border-paper bg-ink-2 aspect-square overflow-hidden">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={pack.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-6 text-center font-display uppercase text-paper-2">
                  {pack.name}
                </div>
              )}
            </div>

            {/* Meta */}
            <div>
              <div className="flex items-baseline gap-3 flex-wrap mb-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: kindColor }} aria-hidden />
                <div className="font-mono text-[11px] tracking-[.18em] uppercase" style={{ color: kindColor }}>
                  {KIND_LABEL[pack.kind]}
                </div>
                <span
                  className="font-mono text-[9px] tracking-[.18em] uppercase px-2 py-0.5 rounded-full"
                  style={{ background: accessMeta.color, color: "#0B0B0B" }}
                >
                  {accessMeta.label}
                </span>
                {pack.featured && (
                  <span
                    className="font-mono text-[9px] tracking-[.18em] uppercase px-2 py-0.5 rounded-full"
                    style={{ background: kindColor, color: "#0B0B0B" }}
                  >
                    featured
                  </span>
                )}
              </div>
              <h1
                className="font-display font-bold uppercase m-0"
                style={{ fontSize: "clamp(48px, 8vw, 112px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
              >
                {pack.name}
              </h1>
              {pack.tagline && (
                <p className="font-serif italic text-[20px] mt-4 text-paper-2">{pack.tagline}</p>
              )}

              {/* Gear + releases */}
              {(pack.gearItems?.length || pack.relatedReleases?.length) && (
                <div className="mt-6 grid gap-3 text-[12px] font-mono tracking-[.1em] uppercase">
                  {pack.gearItems && pack.gearItems.length > 0 && (
                    <div>
                      <span className="text-paper-2 mr-2">for:</span>
                      {pack.gearItems.map((g, i) => (
                        <span key={g.slug}>
                          <Link href={`/gear/${g.slug}`} className="underline underline-offset-4 hover:text-lamp">
                            {g.name}
                          </Link>
                          {i < pack.gearItems!.length - 1 && <span className="text-paper-2">, </span>}
                        </span>
                      ))}
                    </div>
                  )}
                  {pack.relatedReleases && pack.relatedReleases.length > 0 && (
                    <div>
                      <span className="text-paper-2 mr-2">ties to:</span>
                      {pack.relatedReleases.map((r, i) => (
                        <span key={r.slug}>
                          <Link href={`/releases/${r.slug}`} className="underline underline-offset-4 hover:text-lamp">
                            {r.title}
                          </Link>
                          {i < pack.relatedReleases!.length - 1 && <span className="text-paper-2">, </span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CTA */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center font-display font-semibold tracking-[.04em] uppercase px-6 py-3.5 border-2 no-underline transition-colors"
                  style={{
                    background: accessMeta.color,
                    color: "#0B0B0B",
                    borderColor: accessMeta.color,
                    fontSize: "clamp(16px, 2vw, 22px)",
                    boxShadow: "6px 6px 0 var(--color-paper)",
                  }}
                >
                  {accessMeta.cta}
                </a>
                {pack.price && (
                  <div className="font-mono text-[12px] tracking-[.14em] uppercase text-paper-2">
                    {pack.price}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ---------- AUDIO PREVIEW ---------- */}
        {pack.previewUrl && (
          <section className="px-5 sm:px-8 py-10 border-b border-paper/20 bg-ink-2">
            <div className="max-w-[1180px] mx-auto">
              <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-3">
                LISTEN · 30S TASTE
              </div>
              {/* If it's a raw audio URL we render <audio>. Otherwise show a link.
                  Bandcamp/Soundcloud embeds can replace this later if needed. */}
              {/\.(mp3|wav|m4a|ogg)(\?|$)/i.test(pack.previewUrl) ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <audio controls src={pack.previewUrl} className="w-full max-w-[560px]" />
              ) : (
                <a
                  href={pack.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[12px] tracking-[.14em] uppercase underline underline-offset-4 hover:text-lamp"
                >
                  preview audio ↗
                </a>
              )}
            </div>
          </section>
        )}

        {/* ---------- WALKTHROUGH VIDEO ---------- */}
        {pack.youtubeUrl && (
          <section className="px-5 sm:px-8 py-12 border-b border-paper/20">
            <div className="max-w-[1180px] mx-auto">
              <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-3">
                WALKTHROUGH · VIDEO
              </div>
              <div className="max-w-[860px]">
                <YouTubeEmbed url={pack.youtubeUrl} title={`${pack.name} walkthrough`} />
              </div>
            </div>
          </section>
        )}

        {/* ---------- DESCRIPTION ---------- */}
        {pack.description && (pack.description as unknown[]).length > 0 && (
          <section className="px-5 sm:px-8 py-12 border-b border-paper/20">
            <div className="max-w-[760px] mx-auto">
              <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-3">
                WHAT'S IN IT
              </div>
              <div className="text-paper">
                <PortableText value={pack.description} />
              </div>
            </div>
          </section>
        )}

        {/* ---------- CLOSING CTA ---------- */}
        <section className="px-5 sm:px-8 py-12 border-b border-paper/30 bg-ink-2">
          <div className="max-w-[760px] mx-auto text-center">
            <h2
              className="font-display font-bold uppercase m-0 mb-6"
              style={{ fontSize: "clamp(28px, 4.5vw, 48px)", lineHeight: 0.95, letterSpacing: "-0.015em" }}
            >
              ready?
            </h2>
            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="inline-flex items-center font-display font-semibold tracking-[.04em] uppercase px-7 py-4 border-2 no-underline transition-colors"
              style={{
                background: accessMeta.color,
                color: "#0B0B0B",
                borderColor: accessMeta.color,
                fontSize: "clamp(18px, 2.4vw, 26px)",
                boxShadow: "8px 8px 0 var(--color-paper)",
              }}
            >
              {accessMeta.cta}
            </a>
          </div>
        </section>

        <NewsletterSection
          source={`pack:${pack.slug}`}
          blurb="new pack drops, sessions, behind-the-scenes — first in your inbox."
        />
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
