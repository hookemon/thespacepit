import Link from "next/link";
import { groq } from "next-sanity";
import { sanityFetch } from "../../_lib/sanity";

type ChakraDef = { n: string; k: string; bg: string; slugStart: string };

// Visual definitions for each chakra, matched to the corresponding release by
// looking up the catalog number prefix (CLM003 = Root → "clm003-").
const CHAKRAS: ChakraDef[] = [
  { n: "root",      k: "C",  bg: "#9B1B1B", slugStart: "clm003" },
  { n: "sacral",    k: "D",  bg: "#E2651A", slugStart: "clm004" },
  { n: "solar",     k: "E",  bg: "#F2C84B", slugStart: "clm005" },
  { n: "heart",     k: "F#", bg: "#3E8E5A", slugStart: "clm006" },
  { n: "throat",    k: "G",  bg: "#2F6FB3", slugStart: "clm007" },
  { n: "third eye", k: "A",  bg: "#4B2E83", slugStart: "clm008" },
  { n: "crown",     k: "B",  bg: "#E3D4F2", slugStart: "clm009" },
];

const CHAKRA_GRADIENT =
  "linear-gradient(120deg, #9B1B1B 0%, #E2651A 16%, #F2C84B 33%, #3E8E5A 50%, #2F6FB3 67%, #4B2E83 84%, #E3D4F2 100%)";

type ChakraRow = { title: string; slug: string };

export async function CCCalllmStrip() {
  // Pull every Calllm release with its slug — we'll match each chakra card to
  // its album by catalog number prefix.
  const rows = await sanityFetch<ChakraRow[]>(groq`
    *[_type == "release" && label == "Calllm" && (withdrawn != true)] | order(catalogNumber asc) {
      title, "slug": slug.current
    }
  `);
  const bySlugStart = new Map(rows.map((r) => [r.slug.split("-")[0], r] as const));

  return (
    <section
      id="calllm"
      className="relative overflow-hidden px-8 py-20 text-paper border-t-2 border-b-2 border-ink"
      style={{ background: CHAKRA_GRADIENT }}
    >
      <div className="absolute inset-0 bg-ink/50" style={{ backdropFilter: "blur(2px)" }} />
      <div className="relative z-[1]">
        <div className="font-mono text-[11px] tracking-[.14em] uppercase text-calllm mb-3">◐ SUB-LABEL · AMBIENT / DRONE</div>
        <h2
          className="font-display font-bold uppercase m-0"
          style={{ fontSize: "clamp(56px, 10vw, 160px)", lineHeight: 0.86, letterSpacing: "-0.02em" }}
        >
          calllm
        </h2>
        <p
          className="font-serif italic mt-5 max-w-[620px] leading-snug"
          style={{ fontSize: "clamp(20px, 2vw, 26px)" }}
        >
          seven chakra-inspired drones. released weekly with live watercolor and guided meditation. the calm + collect ambient wing. click any chakra to enter the album.
        </p>
        <div className="grid grid-cols-7 mt-10 border border-paper">
          {CHAKRAS.map((c, i) => {
            const lightChakra = c.bg === "#E3D4F2" || c.bg === "#F2C84B";
            const release = bySlugStart.get(c.slugStart);
            const borderRight = i < CHAKRAS.length - 1 ? "border-r border-paper" : "";

            const cell = (
              <div
                className={`px-2.5 py-4 text-center transition-transform duration-150 ${borderRight}`}
                style={{ background: c.bg, color: lightChakra ? "#0B0B0B" : "#F4EFE6" }}
              >
                <div className="font-display font-bold text-[14px] sm:text-[18px] md:text-[22px] uppercase">{c.n}</div>
                <div className="mt-1 font-mono text-[10px] sm:text-[12px] tracking-[.1em] uppercase">{c.k}</div>
                {release && (
                  <div className="mt-2 font-mono text-[9px] tracking-[.1em] uppercase opacity-70">
                    enter →
                  </div>
                )}
              </div>
            );

            if (!release) {
              return (
                <div key={c.n} className="cursor-default">
                  {cell}
                </div>
              );
            }

            return (
              <Link
                key={c.n}
                href={`/releases/${release.slug}`}
                className="block no-underline hover:scale-[1.04] hover:z-[2] hover:relative transition-transform duration-150"
                aria-label={`${c.n} chakra — ${release.title}`}
              >
                {cell}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
