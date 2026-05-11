// Hero photo pool — rotates per page load. Each entry has its own crop hint
// because the subject sits in a different spot in every frame.
type HeroPhoto = { src: string; alt: string; objectPosition: string };
const HERO_PHOTOS: HeroPhoto[] = [
  { src: "/epk/nick-1-2.png", alt: "Nick in a Japanese garden",        objectPosition: "30% 60%" },
  { src: "/epk/nick-3-0.jpg", alt: "Duotone portrait, graffiti walls", objectPosition: "60% 30%" },
  { src: "/epk/nick-2-0.jpg", alt: "Studio session at the pit",        objectPosition: "70% 50%" },
  { src: "/epk/nick-5-5.jpg", alt: "B&W studio portrait",              objectPosition: "55% 35%" },
  { src: "/epk/nick-6-0.jpg", alt: "At the gear, modular + MPC",       objectPosition: "70% 50%" },
  { src: "/epk/nick-7-3.png", alt: "Live in orange smoke",             objectPosition: "65% 40%" },
];

// Tell Next.js this hero is dynamic so the random pick refreshes per request.
export const dynamic = "force-dynamic";

export async function NHHero() {
  // Random hero photo — picks a fresh one each request.
  const photo = HERO_PHOTOS[Math.floor(Math.random() * HERO_PHOTOS.length)];

  return (
    <section className="relative overflow-hidden bg-ink text-paper border-b border-paper">
      {/* Layout: photo dominant on the right (55%), content left (45%).
          Stacks on mobile with photo on top. */}
      <div className="grid md:grid-cols-[1fr_1.25fr] min-h-[640px]">
        {/* LEFT — content. Logo is the dominant graphic. */}
        <div className="relative px-8 pt-24 pb-12 md:py-20 flex flex-col justify-center">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-5 flex flex-wrap gap-2.5">
            <span>PRODUCER</span><span>·</span><span>COMPOSER</span><span>·</span><span>DJ</span><span>·</span><span>SYNTHESIZER</span><span>·</span><span>ENGINEER</span><span>·</span><span>COLLABORATOR</span>
          </div>
          <h1 className="m-0">
            <span className="sr-only">Nick Hook</span>
            <img
              src="/nick-hook-logo-paper.png"
              alt="Nick Hook"
              className="block w-full max-w-[680px] h-auto"
            />
          </h1>
          <div className="flex flex-wrap gap-3 mt-8">
            <a href="/catalog" className="font-display font-semibold text-[15px] tracking-[.04em] uppercase px-5 py-3 border border-paper bg-redline text-paper cursor-pointer rounded-none hover:bg-paper hover:text-ink transition-colors no-underline">
              see the catalogue →
            </a>
            <a href="/" className="font-display font-semibold text-[15px] tracking-[.04em] uppercase px-5 py-3 border border-paper bg-transparent text-paper cursor-pointer rounded-none hover:bg-paper hover:text-ink transition-colors no-underline">
              pull up to the pit
            </a>
          </div>
        </div>

        {/* RIGHT — full-bleed photo, larger ratio */}
        <div className="relative min-h-[440px] md:min-h-[640px] overflow-hidden border-l md:border-l border-paper">
          <img
            src={photo.src}
            alt={photo.alt}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: photo.objectPosition }}
            loading="eager"
          />
          {/* Soft gradient seam on the left edge */}
          <div
            aria-hidden
            className="absolute inset-0 hidden md:block"
            style={{ background: "linear-gradient(90deg, rgba(11,11,11,0.45) 0%, rgba(11,11,11,0) 22%)" }}
          />
          <div
            aria-hidden
            className="absolute top-6 right-6 flex items-center gap-2.5 font-mono text-[10px] tracking-[.1em] uppercase text-paper-2"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
          >
            <img src="/heptagon-paper.png" alt="" className="w-7 h-7 heptagon-spin" />
            <span>BROOKLYN · MEDELLÍN · EST. 2011</span>
          </div>
        </div>
      </div>

    </section>
  );
}
