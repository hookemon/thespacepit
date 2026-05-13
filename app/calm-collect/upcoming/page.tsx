import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import type { ReactElement } from "react";
import { getUpcomingReleases } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";
import { IntiCover06 } from "../../_components/releases/IntiCover06";
import { FOOTER_LINKS } from "../../_lib/social-links";

// Same registry idea as releases/[slug]/page.tsx: when a release has a live
// React cover, render it here in the pitch grid tile too. Keeps this view
// and the per-release page in visual lockstep.
const LIVE_COVERS: Record<string, () => ReactElement> = {
  "cc029-kusa": () => <IntiCover06 />,
};

export const revalidate = 60;

export const metadata = {
  title: "upcoming — calm + collect",
  description: "the 2026 calm + collect slate. distro pitch one-sheet — not for public release.",
  // Distro one-sheet — keep out of search engines until it goes public.
  robots: { index: false, follow: false },
};

// Inline DROPPING stamp — mirrors the wax-stamp treatment on /releases/[slug].
// Same look (paper card + ink border + hard red offset, rotated -6°) so the
// pitch grid and the per-release pages feel like one continuous artifact.
function DroppingStamp({ date, size = "sm" }: { date: string; size?: "sm" | "lg" }) {
  const bigTitle = size === "lg" ? 30 : 22;
  const dateSize = size === "lg" ? 9 : 8;
  const padX = size === "lg" ? "px-3.5" : "px-2.5";
  const padY = size === "lg" ? "py-2" : "py-1.5";
  return (
    <div
      className="absolute top-2 right-2 z-20 select-none pointer-events-none"
      style={{ transform: "rotate(-6deg)" }}
    >
      <div
        className={`bg-paper border-2 border-ink ${padX} ${padY} inline-block text-center`}
        style={{ boxShadow: "3px 3px 0 var(--color-redline)" }}
      >
        <div
          className="font-display font-bold uppercase text-ink leading-none"
          style={{ fontSize: bigTitle, letterSpacing: "-0.02em" }}
        >
          Dropping
        </div>
        <div
          className="font-mono tracking-[.18em] uppercase text-ink-3 mt-1"
          style={{ fontSize: dateSize }}
        >
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
      <main className="flex-1 bg-paper text-ink">
        <header className="px-5 sm:px-8 pt-16 pb-10 border-b-2 border-ink">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase text-redline mb-2 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-redline sp-pulse" />
            distro pitch · 2026 slate · not for public release
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            upcoming
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[640px]">
            the {releases.length}-record calm + collect slate for 2026. tap any cover to
            enter the world — bio, audio, art, sample pack, lyrics.
          </p>
        </header>

        <section className="px-5 sm:px-8 py-12">
          {releases.length === 0 ? (
            <p className="font-mono text-[12px] tracking-[.14em] uppercase text-mute">
              no releases in <span className="text-ink">status: dropping</span> right now.
            </p>
          ) : (
            <div
              className="grid gap-6 md:gap-8"
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
                    className="group block no-underline text-ink"
                  >
                    <div
                      className="aspect-square border-2 border-ink relative overflow-hidden flex items-center justify-center transition-transform duration-150 group-hover:-translate-x-[3px] group-hover:-translate-y-[3px]"
                      style={{
                        background: r.coverColor ?? "#1C1A17",
                        color: "#F4EFE6",
                        boxShadow: "0 0 0 transparent",
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
                        <span
                          className="font-display font-bold uppercase text-center px-6"
                          style={{
                            fontSize: 36,
                            transform: "rotate(-4deg)",
                            letterSpacing: "-0.02em",
                            color: r.coverColor ? "#0B0B0B" : "#F4EFE6",
                          }}
                        >
                          {r.title}
                        </span>
                      )}
                      <DroppingStamp date={dateLabel} />
                      <div className="absolute inset-0 transition-shadow duration-150 group-hover:[box-shadow:6px_6px_0_var(--color-lamp)]" />
                    </div>
                    <div className="mt-3 flex items-baseline justify-between gap-3">
                      <div className="font-mono text-[10px] tracking-[.14em] uppercase text-collect">
                        {r.catalogNumber ?? "—"}
                      </div>
                      <div className="font-mono text-[10px] tracking-[.14em] uppercase text-ink-3">
                        {r.format ?? "—"}
                      </div>
                    </div>
                    <div
                      className="font-display font-bold uppercase mt-1 leading-none"
                      style={{ fontSize: 28, letterSpacing: "-0.015em" }}
                    >
                      {r.title}
                    </div>
                    <div className="font-sans text-[14px] text-ink-3 mt-1.5 leading-snug">
                      {artistText}
                    </div>
                    {r.tagline && (
                      <div className="font-serif italic text-[14px] text-ink-3 mt-1.5 leading-snug">
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
        theme="paper"
        heptagon="fill-black"
        signoff="stay high 💚"
        meta="calm + collect · 2026 slate · distro pitch one-sheet"
        links={[...FOOTER_LINKS.label]}
      />
    </>
  );
}
