import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getStudios } from "../_lib/sanity-queries";
import { urlFor } from "../_lib/sanity";
import { FOOTER_LINKS } from "../_lib/social-links";

export const revalidate = 3600;

export const metadata = {
  title: "studios — thespacepit",
  description: "two rooms. brooklyn + medellín.",
};

export default async function StudiosIndex() {
  const studios = await getStudios();

  return (
    <>
      <TopNav current="spacepit" />
      <main className="flex-1 bg-paper text-ink">
        <header className="px-5 sm:px-8 pt-16 pb-8 border-b-2 border-ink">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp-deep mb-2">TWO ROOMS · ONE WORLD</div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            studios
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[680px]">
            {studios.length === 0
              ? "no studios filled in yet — add the spacepit + la burbuja via /studio."
              : "the rooms. recording, mixing, residencies. brooklyn → medellín."}
          </p>
        </header>

        {studios.length > 0 && (
          <section className="px-5 sm:px-8 py-12 grid gap-12 lg:grid-cols-2">
            {studios.map((s) => {
              const hero = s.hero ? urlFor(s.hero).width(1200).height(900).fit("crop").url() : null;
              return (
                <Link
                  key={s._id}
                  href={`/studios/${s.slug}`}
                  className="group block no-underline text-ink transition-transform duration-200 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_#F2B705]"
                >
                  <div
                    className="relative overflow-hidden border border-ink"
                    style={{ aspectRatio: "4 / 3", background: s.color ?? "#1C1A17" }}
                  >
                    {hero ? (
                      <img src={hero} alt={s.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span
                        className="absolute inset-0 flex items-center justify-center font-display font-bold uppercase text-paper text-center px-6"
                        style={{ fontSize: "clamp(40px, 6vw, 72px)", letterSpacing: "-0.02em", lineHeight: 0.92 }}
                      >
                        {s.name}
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    {s.yearOpened && (
                      <div className="font-mono text-[10px] tracking-[.14em] uppercase text-lamp-deep">
                        {s.yearOpened} →{s.city ? ` · ${s.city}` : ""}{s.country ? `, ${s.country}` : ""}
                      </div>
                    )}
                    <div className="font-display font-bold text-[40px] uppercase tracking-[-0.01em] leading-none mt-1">
                      {s.name}
                    </div>
                    {s.tagline && (
                      <p className="font-serif italic text-[18px] mt-2 text-ink-3 max-w-[520px]">{s.tagline}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </main>
      <Footer
        theme="paper"
        heptagon="fill-white"
        signoff="see u in the pit 🪐"
        meta="brooklyn · medellín · since 2011"
        links={[...FOOTER_LINKS.spacepit]}
      />
    </>
  );
}
