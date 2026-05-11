import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getProjects, type ProjectListItem } from "../_lib/sanity-queries";
import { urlFor } from "../_lib/sanity";
import { FOOTER_LINKS } from "../_lib/social-links";

export const revalidate = 60;

export const metadata = {
  title: "eras — nick hook",
  description: "the bands, the labels, the tours, the residencies. one era per page.",
};

function years(p: { yearStart?: number; yearEnd?: number }): string {
  if (!p.yearStart) return "";
  if (!p.yearEnd) return `${p.yearStart} →`;
  return `${p.yearStart}–${p.yearEnd}`;
}

// Group ordering — bands first (the projects he was IN), then labels (the
// ones he BUILT), then tours/residencies/umbrellas (where he WORKED).
const GROUPS: { id: string; title: string; copy: string; matchKinds: string[] }[] = [
  {
    id: "bands",
    title: "bands & projects",
    copy: "groups nick was in. the road years.",
    matchKinds: ["band"],
  },
  {
    id: "labels",
    title: "labels & imprints",
    copy: "the ones he built or co-runs.",
    matchKinds: ["label era", "imprint era"],
  },
  {
    id: "tours",
    title: "tours, residencies, umbrellas",
    copy: "the rest of the road. solo runs, residencies, festival circuits, tours-for-hire.",
    matchKinds: ["production era", "residency", "other"],
  },
];

function groupOf(p: ProjectListItem): string {
  const kind = (p.kind ?? "other").toLowerCase();
  return GROUPS.find((g) => g.matchKinds.includes(kind))?.id ?? "tours";
}

export default async function ErasIndex() {
  const projects = await getProjects(60);
  const byGroup = new Map<string, ProjectListItem[]>();
  for (const g of GROUPS) byGroup.set(g.id, []);
  for (const p of projects) {
    const g = groupOf(p);
    byGroup.get(g)?.push(p);
  }
  // Sort each group by yearStart asc (earliest first within group)
  for (const arr of byGroup.values()) {
    arr.sort((a, b) => (a.yearStart ?? 9999) - (b.yearStart ?? 9999));
  }

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="nick" />
      <main className="flex-1">
        <header className="px-8 pt-16 pb-10 border-b-2 border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">CAREER · ERAS · PROJECTS</div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            eras
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[780px] text-paper-2">
            {projects.length === 0
              ? "no eras yet — add your first via /studio."
              : "every band nick was in, every label he built, every tour or residency he ran. one era per page — click any to dig in."}
          </p>
          {projects.length > 0 && (
            <nav className="flex flex-wrap gap-2.5 mt-6">
              {GROUPS.map((g) => (
                <a
                  key={g.id}
                  href={`#${g.id}`}
                  className="font-mono text-[10px] tracking-[.14em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline"
                >
                  {g.title} · {byGroup.get(g.id)?.length ?? 0}
                </a>
              ))}
            </nav>
          )}
        </header>

        {GROUPS.map((g) => {
          const list = byGroup.get(g.id) ?? [];
          if (list.length === 0) return null;
          return (
            <section
              key={g.id}
              id={g.id}
              className="px-8 py-12 border-b border-paper/30"
            >
              <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
                <div>
                  <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline">{g.id.replace(/-/g, " ")}</div>
                  <h2
                    className="font-display font-bold uppercase m-0 mt-1"
                    style={{ fontSize: "clamp(32px, 4.5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
                  >
                    {g.title}
                  </h2>
                  <p className="font-serif italic text-[16px] text-paper-2 mt-2 max-w-[520px]">{g.copy}</p>
                </div>
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                {list.map((p) => {
                  const cover = p.cover ? urlFor(p.cover).width(640).height(640).fit("crop").url() : null;
                  return (
                    <Link
                      key={p._id}
                      href={`/eras/${p.slug}`}
                      className="group block transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#E83A1C] no-underline text-paper"
                    >
                      <div
                        className="aspect-[4/3] border border-paper overflow-hidden flex items-center justify-center relative px-4"
                        style={{ background: p.color ?? "#1C1A17" }}
                      >
                        {cover ? (
                          <img src={cover} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <span
                            className="font-display font-bold uppercase text-center"
                            style={{ fontSize: "clamp(20px, 2.4vw, 28px)", letterSpacing: "-0.015em", lineHeight: 1, color: p.color ? "#0B0B0B" : "#F4EFE6" }}
                          >
                            {p.name}
                          </span>
                        )}
                        <div className="absolute top-2 left-2 font-mono text-[9px] tracking-[.16em] uppercase text-paper-2 bg-ink/55 px-1.5 py-0.5">
                          {years(p)}
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <div className="font-display font-semibold text-[18px] uppercase tracking-[-0.005em] leading-tight">{p.name}</div>
                        {p.tagline && <div className="font-serif italic text-[14px] text-paper-2 mt-1 line-clamp-2 leading-snug">{p.tagline}</div>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
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
