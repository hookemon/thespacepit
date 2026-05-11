import Link from "next/link";
import { getFeaturedRelease, getReleases, getRosterArtists } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";

export async function CCHero() {
  // Pull live counts so the meta strip stays accurate as the catalogue grows.
  const [featured, allReleases, rosterArtists] = await Promise.all([
    getFeaturedRelease(),
    getReleases(120),
    getRosterArtists(),
  ]);

  const featuredCover = featured?.cover ? urlFor(featured.cover).width(900).height(900).fit("crop").url() : null;
  const isPinned = featured?.featured === true;
  const featuredArtists = featured?.artists.map((a) => a.name).join(" · ") ?? "";

  return (
    <section className="relative overflow-hidden px-8 pt-16 pb-12 bg-paper text-ink border-b-2 border-ink">
      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(280px,420px)] items-center">
        {/* LEFT — heptagon over text, flush to the edge */}
        <div>
          <img src="/heptagon-fill-black.png" alt="" className="w-20 h-20 heptagon-spin mb-6" />
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect mb-3.5 flex flex-wrap gap-2.5">
            <span>◆ A RECORD LABEL</span><span>·</span><span>EST. 2013</span><span>·</span><span>NY → MDE</span>
          </div>
          <h1
            className="font-display font-bold uppercase m-0 break-words"
            style={{ fontSize: "clamp(48px, 12vw, 180px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
          >
            calm
            <br />
            <span className="text-collect font-normal">+</span> collect
          </h1>
          <p
            className="font-serif italic mt-5 max-w-[620px] leading-snug"
            style={{ fontSize: "clamp(20px, 2.2vw, 26px)" }}
          >
            cultivating records where the sound is shared. nick hook &amp; gareth jones. hip-hop, experimental, and ambient — released with care, one after the other.
          </p>
          <div className="mt-8 flex gap-5 flex-wrap font-mono text-[11px] tracking-[.1em] uppercase text-ink-3">
            <span>{allReleases.length} releases</span>
            <span>·</span>
            <span>{rosterArtists.length} artists</span>
            <span>·</span>
            <span>1 sub-label · calllm</span>
          </div>
        </div>

        {/* RIGHT — featured release of the day (rotates through the catalog) */}
        {featured && (
          <Link
            href={`/releases/${featured.slug}`}
            className="group block no-underline text-ink"
          >
            <div className="font-mono text-[10px] tracking-[.16em] uppercase text-collect mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-collect sp-pulse" />
              {isPinned ? "NEW · FEATURED RELEASE" : "TODAY'S FEATURED RELEASE"}
            </div>
            <div
              className="aspect-square border border-ink overflow-hidden flex items-center justify-center relative transition-transform duration-200 group-hover:-translate-x-[3px] group-hover:-translate-y-[3px] group-hover:shadow-[6px_6px_0_#0E4B3A]"
              style={{ background: featured.coverColor ?? "#1C1A17" }}
            >
              {featuredCover ? (
                <img src={featuredCover} alt={featured.title} className="w-full h-full object-cover" />
              ) : (
                <span
                  className="font-display font-bold uppercase text-center px-6"
                  style={{ fontSize: 34, transform: "rotate(-4deg)", letterSpacing: "-0.02em", color: featured.coverColor === "#F4EFE6" || featured.coverColor === "#F2B705" ? "#0B0B0B" : "#F4EFE6" }}
                >
                  {featured.title}
                </span>
              )}
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] tracking-[.12em] uppercase text-ink-3">{featured.catalogNumber}{featured.year ? ` · ${featured.year}` : ""}</div>
                <div className="font-display font-bold text-[26px] uppercase tracking-[-0.005em] leading-none mt-1">{featured.title}</div>
                {featuredArtists && <div className="font-sans text-[13px] text-ink-3 mt-1">{featuredArtists}</div>}
              </div>
              <span className="font-mono text-[11px] tracking-[.12em] uppercase text-collect group-hover:translate-x-1 transition-transform inline-block">
                listen →
              </span>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
