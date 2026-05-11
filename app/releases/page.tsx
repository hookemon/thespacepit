import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getReleases } from "../_lib/sanity-queries";
import { urlFor } from "../_lib/sanity";
import { FOOTER_LINKS } from "../_lib/social-links";

export const revalidate = 60;

export const metadata = {
  title: "releases — calm + collect",
  description: "the full calm + collect catalogue. clickable.",
};

const IMPRINT_ORDER = [
  "Calm + Collect",
  "Calm + Collect Instrumental",
  "Calllm",
  "Hookemon",
  "Lockhart Dynasty × Calm + Collect",
] as const;

export default async function ReleasesIndex() {
  const all = await getReleases(120);

  // Group by imprint, preserving the priority order.
  const groups = new Map<string, typeof all>();
  for (const imprint of IMPRINT_ORDER) groups.set(imprint, []);
  for (const r of all) {
    const key = r.label ?? "Calm + Collect";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  return (
    <>
      <TopNav current="label" />
      <main className="flex-1 bg-paper text-ink">
        <header className="px-8 pt-16 pb-8 border-b-2 border-ink">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect mb-2">THE FULL CATALOGUE</div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            releases
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[640px]">
            releases across the imprints. click any cover to enter the world.
          </p>
        </header>

        {[...groups.entries()].map(([imprint, releases]) => {
          if (releases.length === 0) return null;
          return (
            <section key={imprint} className="px-8 py-12 border-b border-ink/30">
              <div className="font-mono text-[11px] tracking-[.14em] uppercase text-collect mb-1">IMPRINT</div>
              <h2
                className="font-display font-bold uppercase m-0 mb-6"
                style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
              >
                {imprint}
              </h2>
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
                {releases.map((r) => {
                  const cover = r.cover ? urlFor(r.cover).width(400).height(400).fit("crop").url() : null;
                  const artists = r.artists.map((a) => a.name).join(" · ");
                  return (
                    <Link
                      key={r._id}
                      href={`/releases/${r.slug}`}
                      className="block transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#0E4B3A] no-underline text-ink"
                    >
                      <div
                        className="aspect-square border border-ink overflow-hidden flex items-center justify-center"
                        style={{ background: r.coverColor ?? "#1C1A17" }}
                      >
                        {cover ? (
                          <img src={cover} alt={r.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <span
                            className="font-display font-bold uppercase text-center px-3"
                            style={{ fontSize: 18, transform: "rotate(-4deg)", letterSpacing: "-0.02em", color: r.coverColor === "#F4EFE6" || r.coverColor === "#F2B705" || r.coverColor === "#F2C84B" ? "#0B0B0B" : "#F4EFE6" }}
                          >
                            {r.title}
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <div className="font-mono text-[10px] tracking-[.1em] uppercase text-ink-3">{r.catalogNumber}</div>
                        <div className="font-display font-semibold text-[18px] uppercase tracking-[-0.005em] leading-tight mt-0.5">{r.title}</div>
                        <div className="font-sans text-[12px] text-ink-3 mt-0.5 line-clamp-1">{artists}</div>
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
        theme="paper"
        heptagon="fill-black"
        signoff="stay high 💚"
        meta="calm + collect · a record label · 2013 → today"
        links={[...FOOTER_LINKS.label]}
      />
    </>
  );
}
