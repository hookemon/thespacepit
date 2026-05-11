import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getMixes } from "../_lib/sanity-queries";
import { urlFor } from "../_lib/sanity";
import { FOOTER_LINKS } from "../_lib/social-links";

export const revalidate = 60;

export const metadata = {
  title: "mixes — nick hook",
  description: "DJ mixes through the years.",
};

export default async function MixesIndex() {
  const mixes = await getMixes(60);

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="nick" />
      <main className="flex-1">
        <header className="relative overflow-hidden px-8 pt-16 pb-8 border-b-2 border-paper">
          {/* atmospheric photo behind the title — same pattern as the spacepit Hero. */}
          <img
            src="/epk/spacepit-3-0.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "50% 35%" }}
          />
          <div aria-hidden className="absolute inset-0 bg-ink/70" />
          <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,11,11,0.15) 0%, rgba(11,11,11,0.55) 100%)" }} />
          <div className="relative">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">DJ MIXES · THROUGH THE YEARS</div>
            <h1
              className="font-display font-bold uppercase m-0"
              style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
            >
              mixes
            </h1>
            <p className="font-serif italic text-[20px] mt-4 max-w-[640px] text-paper-2">
              {mixes.length === 0
                ? "no mixes yet — add your first via /studio."
                : `${mixes.length} mix${mixes.length === 1 ? "" : "es"}. cubic zirconia → drop the lime → calm + collect → today.`}
            </p>
          </div>
        </header>

        {mixes.length > 0 && (
          <section className="px-8 py-12">
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
              {mixes.map((m) => {
                const cover = m.cover ? urlFor(m.cover).width(560).height(560).fit("crop").url() : null;
                return (
                  <Link
                    key={m._id}
                    href={`/mixes/${m.slug}`}
                    className="group block transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#E83A1C] no-underline text-paper"
                  >
                    <div className="aspect-square border border-paper overflow-hidden flex items-center justify-center bg-ink-2 relative">
                      {cover ? (
                        <img src={cover} alt={m.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span
                          className="font-display font-bold uppercase text-center px-3"
                          style={{ fontSize: 22, transform: "rotate(-4deg)", letterSpacing: "-0.02em" }}
                        >
                          {m.title}
                        </span>
                      )}
                      {m.duration && (
                        <div className="absolute bottom-2 right-2 bg-ink text-paper font-mono text-[11px] px-1.5 py-0.5 tracking-[.05em]">
                          {m.duration}
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      {m.era && <div className="font-mono text-[10px] tracking-[.12em] uppercase text-redline">{m.era}</div>}
                      <div className="font-display font-semibold text-[20px] uppercase tracking-[-0.005em] leading-tight mt-0.5">
                        {m.title}
                      </div>
                      {m.date && (
                        <div className="font-mono text-[10px] tracking-[.1em] uppercase text-on-dark mt-1">
                          {m.date}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
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
