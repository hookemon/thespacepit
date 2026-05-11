import Link from "next/link";
import { getProjects } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";

function years(p: { yearStart?: number; yearEnd?: number }): string {
  if (!p.yearStart) return "";
  if (!p.yearEnd) return `${p.yearStart} →`;
  return `${p.yearStart}–${p.yearEnd}`;
}

export async function NHErasStrip() {
  const projects = await getProjects(20);
  if (projects.length === 0) {
    // Don't render the section at all when empty — just show a quiet hint
    // for Nick when he's logged in, but skip for the public.
    return null;
  }

  return (
    <section id="eras" className="px-5 sm:px-8 py-16 bg-ink-2 text-paper border-y border-paper/20">
      <div className="flex items-end justify-between mb-7 flex-wrap gap-4">
        <div>
          <div className="font-mono text-[11px] tracking-[.12em] uppercase text-redline">CAREER</div>
          <h2
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
          >
            eras
          </h2>
        </div>
        <Link
          href="/eras"
          className="group font-mono text-[11px] tracking-[.12em] uppercase text-on-dark hover:text-redline transition-colors no-underline"
        >
          see all eras{" "}
          <span className="inline-block transition-transform duration-200 group-hover:translate-x-1.5">→</span>
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-8 px-5 sm:px-8 snap-x snap-mandatory">
        {projects.map((p) => {
          const cover = p.cover ? urlFor(p.cover).width(560).height(560).fit("crop").url() : null;
          return (
            <Link
              key={p._id}
              href={`/eras/${p.slug}`}
              className="group flex-shrink-0 snap-start no-underline text-paper transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#E83A1C]"
              style={{ width: 220 }}
            >
              <div
                className="w-[220px] h-[220px] border border-paper overflow-hidden flex items-center justify-center"
                style={{ background: p.color ?? "#1C1A17" }}
              >
                {cover ? (
                  <img src={cover} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span
                    className="font-display font-bold uppercase text-center px-3"
                    style={{ fontSize: 22, letterSpacing: "-0.02em", color: p.color ? "#0B0B0B" : "#F4EFE6" }}
                  >
                    {p.name}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <div className="font-mono text-[10px] tracking-[.12em] uppercase text-redline">{years(p)}</div>
                <div className="font-display font-semibold text-[18px] uppercase tracking-[-0.005em] leading-tight mt-0.5">{p.name}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
