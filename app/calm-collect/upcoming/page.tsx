import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import type { ReactElement } from "react";
import { getUpcomingReleases } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";
import { IntiCover06 } from "../../_components/releases/IntiCover06";
import { OldEnglishCover } from "../../_components/releases/OldEnglishCover";
import { FOOTER_LINKS } from "../../_lib/social-links";

// Same registry idea as releases/[slug]/page.tsx: when a release has a live
// React cover, render it here in the pitch grid tile too. Keeps this view
// and the per-release page in visual lockstep.
const LIVE_COVERS: Record<string, () => ReactElement> = {
  "cc029-kusa": () => <IntiCover06 />,
  "old-english-spinn-hook-remix": () => <OldEnglishCover />,
};

export const revalidate = 60;

const SHARE_IMAGE_URL = "https://cdn.sanity.io/images/7vj6i0c4/production/479a23eb498fc365662475995aae4529d9fd6ebb-3000x3000.jpg?w=1200&h=1200&fit=crop";

export const metadata = {
  title: "upcoming — calm + collect",
  description: "the 2026 calm + collect slate. distro pitch one-sheet — not for public release.",
  // Distro one-sheet — keep out of search engines until it goes public.
  robots: { index: false, follow: false },
  openGraph: {
    title: "upcoming — calm + collect 2026 slate",
    description: "the 2026 calm + collect slate. distro pitch one-sheet.",
    images: [{ url: SHARE_IMAGE_URL, width: 1200, height: 1200, alt: "KUSA — the lead 2026 release" }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "upcoming — calm + collect 2026 slate",
    description: "the 2026 calm + collect slate. distro pitch one-sheet.",
    images: [SHARE_IMAGE_URL],
  },
};

// DROPPING stamp — paper card + ink border + red offset, rotated.
// Same artifact as the release-page stamp + the homepage upcoming preview.
function DroppingStamp({ date }: { date: string }) {
  return (
    <div
      className="absolute top-2 right-2 z-20 select-none pointer-events-none"
      style={{ transform: "rotate(-6deg)" }}
    >
      <div
        className="bg-paper border-2 border-ink px-2.5 py-1.5 inline-block text-center"
        style={{ boxShadow: "3px 3px 0 var(--color-redline)" }}
      >
        <div
          className="font-display font-bold uppercase text-ink leading-none"
          style={{ fontSize: 22, letterSpacing: "-0.02em" }}
        >
          Dropping
        </div>
        <div className="font-mono tracking-[.18em] uppercase text-ink-3 mt-1" style={{ fontSize: 8 }}>
          {date}
        </div>
      </div>
    </div>
  );
}

export default async function UpcomingPage() {
  const releases = await getUpcomingReleases();

  return (
    <>
      <TopNav current="label" />
      {/* DARK / BLACKLETTER framing — Young Thug YSL slime-green accents on
          ink. Display headings in UnifrakturCook (blackletter / Old English
          Text feel). Body copy stays in the brand sans/serif. The tile
          renders keep their own aesthetics (KUSA matchbox yellow still
          reads as KUSA) — only the wrapper / chrome shifts. */}
      <main className="flex-1 bg-ink text-paper">
        <header className="px-5 sm:px-8 pt-16 pb-10 border-b-2 border-paper relative overflow-hidden">
          {/* Slime-green glow behind the masthead */}
          <div
            aria-hidden
            className="absolute -top-20 -left-10 w-[480px] h-[480px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(122,251,13,0.18) 0%, rgba(122,251,13,0) 70%)", filter: "blur(8px)" }}
          />
          <div
            className="font-mono text-[11px] tracking-[.18em] uppercase mb-3 flex items-center gap-2 relative"
            style={{ color: "var(--color-slime)" }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full sp-pulse"
              style={{ background: "var(--color-slime)" }}
            />
            distro pitch · 2026 slate · not for public release
          </div>
          <h1
            className="m-0 relative"
            style={{
              fontFamily: "var(--font-blackletter)",
              fontWeight: 700,
              fontSize: "clamp(64px, 12vw, 180px)",
              lineHeight: 0.92,
              letterSpacing: "0",
              color: "var(--color-slime)",
              textShadow: "4px 4px 0 #000, 8px 8px 0 rgba(122,251,13,0.18)",
            }}
          >
            Upcoming
          </h1>
          <p className="font-serif italic text-[20px] mt-5 max-w-[680px] text-paper-2 relative">
            ❧ the {releases.length}-record calm + collect slate for 2026. tap any cover to
            enter the world — bio, audio, art, sample pack, lyrics. ❧
          </p>
        </header>

        <section className="px-5 sm:px-8 py-14 bg-ink">
          {releases.length === 0 ? (
            <p className="font-mono text-[12px] tracking-[.14em] uppercase text-paper-2">
              no releases in <span style={{ color: "var(--color-slime)" }}>status: dropping</span> right now.
            </p>
          ) : (
            <div
              className="grid gap-6 md:gap-9"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
            >
              {releases.map((r) => {
                const cover = r.cover
                  ? urlFor(r.cover).width(900).height(900).fit("crop").url()
                  : null;
                const artistText = r.artists.map((a) => a.name).join(" · ");
                const dateLabel = r.releaseDate
                  ? new Date(r.releaseDate + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "date TBD";
                return (
                  <Link
                    key={r._id}
                    href={`/releases/${r.slug}`}
                    className="group block no-underline text-paper"
                  >
                    <div
                      className="aspect-square border-2 border-paper relative overflow-hidden flex items-center justify-center transition-transform duration-150 group-hover:-translate-x-[3px] group-hover:-translate-y-[3px]"
                      style={{
                        background: r.coverColor ?? "#1C1A17",
                        color: r.coverColor ? "#0B0B0B" : "#F4EFE6",
                      }}
                    >
                      {LIVE_COVERS[r.slug] ? (
                        <div className="absolute inset-0">{LIVE_COVERS[r.slug]()}</div>
                      ) : cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt={r.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        // Title in BLACKLETTER on the colored placeholder tile —
                        // matches the page's Old English framing. Drops back to
                        // a clean serif if the font hasn't loaded yet.
                        <span
                          className="text-center px-4"
                          style={{
                            fontFamily: "var(--font-blackletter)",
                            fontWeight: 700,
                            fontSize: r.title.length > 18 ? 26 : 38,
                            lineHeight: 1.0,
                            color: r.coverColor ? "#0B0B0B" : "#F4EFE6",
                          }}
                        >
                          {r.title}
                        </span>
                      )}
                      <DroppingStamp date={dateLabel} />
                      {/* Slime-green hover shadow under the tile */}
                      <div className="absolute inset-0 transition-shadow duration-150 group-hover:[box-shadow:6px_6px_0_var(--color-slime)]" />
                    </div>
                    <div className="mt-3 flex items-baseline justify-between gap-3">
                      <div
                        className="font-mono text-[10px] tracking-[.18em] uppercase"
                        style={{ color: "var(--color-slime)" }}
                      >
                        {r.catalogNumber ?? "—"}
                      </div>
                      <div className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2">
                        {r.format ?? "—"}
                      </div>
                    </div>
                    <div
                      className="uppercase mt-1.5 leading-tight"
                      style={{
                        fontFamily: "var(--font-blackletter)",
                        fontWeight: 700,
                        fontSize: 28,
                        color: "var(--color-paper)",
                      }}
                    >
                      {r.title}
                    </div>
                    <div className="font-sans text-[13px] text-paper-2 mt-1.5 leading-snug">
                      {artistText}
                    </div>
                    {r.tagline && (
                      <div className="font-serif italic text-[14px] text-paper-2 mt-1.5 leading-snug">
                        {r.tagline}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer
        theme="dark"
        signoff="stay high 💚"
        meta="calm + collect · 2026 slate · distro pitch one-sheet"
        links={[...FOOTER_LINKS.label]}
      />
    </>
  );
}
