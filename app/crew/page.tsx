import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { FOOTER_LINKS } from "../_lib/social-links";
import { getCrew, type CrewMember } from "../_lib/sanity-queries";
import { urlFor } from "../_lib/sanity";

export const revalidate = 300;

export const metadata = {
  title: "the crew — thespacepit alumni · interns to gold",
  description:
    "the producers, engineers, and regulars who came up through thespacepit. some interned. some now have gold records. the family.",
};

/**
 * /crew — TSP alumni page. The story arc: people came through the room
 * over the years; some were interns, some friends, some neighbors who just
 * showed up to chop. Now the interns have gold records, the friends are
 * playing the big rooms, the neighbors are doing their own work.
 *
 * Data source: every artist doc with `tspCrew == true`. Hand-curated in
 * /studio. Sorted by `crewYearStart` so OGs come first.
 *
 * Each card → links to /artists/[slug] — their own page that already shows
 * their releases + appearances + sessions, all wired via the existing
 * artist query. This page is the gateway / story page, the artist page is
 * the deep dive.
 */
export default async function CrewPage() {
  const crew = await getCrew();

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        {/* HERO */}
        <header className="px-5 sm:px-8 pt-16 pb-12 border-b border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">
            THE CREW · THESPACEPIT ALUMNI
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 11vw, 160px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
          >
            the crew
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[760px] text-paper-2">
            the producers, engineers, and regulars who came up through the room. interns who got golds. neighbors who became collaborators. the family the spacepit grew.
          </p>
          <p className="font-mono text-[11px] tracking-[.14em] uppercase text-paper-2/70 mt-5">
            {crew.length} {crew.length === 1 ? "person" : "people"} on the wall · always adding
          </p>
        </header>

        {/* GRID */}
        <section className="px-5 sm:px-8 py-14">
          {crew.length === 0 ? (
            <p className="font-serif italic text-[20px] text-paper-2">no crew on file yet.</p>
          ) : (
            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {crew.map((m) => (
                <CrewCard key={m._id} m={m} />
              ))}
            </div>
          )}
        </section>

        {/* STORY CLOSER */}
        <section className="px-5 sm:px-8 py-16 border-t border-paper/30 bg-ink-2">
          <div className="max-w-[760px]">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-2">
              THE THESIS
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-4"
              style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
            >
              the room makes the records.
            </h2>
            <p className="font-serif italic text-[18px] text-paper-2 leading-snug mb-3">
              nick has run thespacepit since 2011. every kid who showed up to chop, every intern who held the cables, every friend who slept on the couch — they're on this page. some have gold records now. some are starting their own labels. some still come through every monday.
            </p>
            <p className="font-serif italic text-[18px] text-paper-2 leading-snug">
              the room makes the records. the people make the room.
            </p>
          </div>
        </section>
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

/* ============================================================================
 * Crew card — portrait (or monogram fallback), name, role tag, year + city,
 * a credit-count chip ("8 records, 12 videos"), click-through to /artists.
 * ========================================================================== */
function CrewCard({ m }: { m: CrewMember }) {
  const portrait = m.portrait
    ? urlFor(m.portrait).width(720).height(720).fit("crop").url()
    : null;
  const initials = m.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Link
      href={`/artists/${m.slug}`}
      className="group block border border-paper bg-ink-2 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#F2B705] transition-all duration-150 overflow-hidden no-underline text-paper"
    >
      <div className="aspect-square border-b border-paper bg-ink overflow-hidden relative">
        {portrait ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portrait} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-display font-bold tracking-[-0.04em] text-paper-2/60 select-none"
              style={{ fontSize: "clamp(72px, 10vw, 120px)", lineHeight: 1 }}
            >
              {initials}
            </span>
          </div>
        )}
        {m.crewYearStart && (
          <div className="absolute top-2 right-2 font-mono text-[9px] tracking-[.14em] uppercase px-2 py-0.5 rounded-full bg-ink/85 backdrop-blur-sm text-paper border border-paper">
            since {m.crewYearStart}
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="font-display font-bold uppercase text-[22px] leading-tight tracking-[-0.005em]">
          {m.name}
        </div>
        {m.crewRole && (
          <div className="font-mono text-[10px] tracking-[.14em] uppercase text-lamp mt-1.5">
            {m.crewRole}
          </div>
        )}
        {m.tagline && (
          <p className="font-serif italic text-[14px] text-paper-2 leading-snug mt-2.5 line-clamp-3">
            {m.tagline}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3 font-mono text-[10px] tracking-[.12em] uppercase text-paper-2">
          {m.creditCount > 0 && (
            <span className="px-2 py-0.5 rounded-full border border-paper/30">
              {m.creditCount} {m.creditCount === 1 ? "release" : "releases"}
            </span>
          )}
          {m.videoCount > 0 && (
            <span className="px-2 py-0.5 rounded-full border border-paper/30">
              ▶ {m.videoCount}
            </span>
          )}
          <span className="ml-auto group-hover:text-lamp transition-colors">enter →</span>
        </div>
      </div>
    </Link>
  );
}
