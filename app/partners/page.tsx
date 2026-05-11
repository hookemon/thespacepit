import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getBrands } from "../_lib/sanity-queries";
import { urlFor } from "../_lib/sanity";
import { FOOTER_LINKS } from "../_lib/social-links";

export const revalidate = 60;

export const metadata = {
  title: "partners — nick hook",
  description: "brands i work with. teenage engineering, ableton, and the rest.",
};

export default async function PartnersIndex() {
  const brands = await getBrands(60);

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="nick" />
      <main className="flex-1">
        <header className="px-8 pt-16 pb-8 border-b-2 border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">PARTNERS · GEAR · FAMILY</div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            partners
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[640px] text-paper-2">
            {brands.length === 0
              ? "no partners yet — add your first via /studio."
              : "the brands and teams i work with closely. each one has a page with the story + videos."}
          </p>
        </header>

        {brands.length > 0 && (
          <section className="px-8 py-12">
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
              {brands.map((b) => {
                const logo = b.logo ? urlFor(b.logo).width(640).height(640).fit("max").url() : null;
                const bg = b.backgroundImage ? urlFor(b.backgroundImage).width(1200).height(900).fit("crop").url() : null;
                return (
                  <Link
                    key={b._id}
                    href={`/partners/${b.slug}`}
                    className="group block no-underline text-paper transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#E83A1C]"
                  >
                    <div
                      className="relative aspect-[4/3] border border-paper overflow-hidden"
                      style={{ background: bg ? "#0B0B0B" : (b.logoColor ?? "#1C1A17") }}
                    >
                      {bg && (
                        <img
                          src={bg}
                          alt=""
                          aria-hidden
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      )}
                      {bg && (
                        <div
                          aria-hidden
                          className="absolute inset-0"
                          style={{ background: "linear-gradient(180deg, rgba(11,11,11,0.15) 0%, rgba(11,11,11,0.55) 100%)" }}
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center p-10">
                        {logo ? (
                          <img
                            src={logo}
                            alt={b.name}
                            className="max-w-[70%] max-h-[60%] object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]"
                            loading="lazy"
                          />
                        ) : (
                          <span
                            className="font-display font-bold uppercase text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]"
                            style={{
                              fontSize: 36,
                              letterSpacing: "-0.02em",
                              color: bg ? "#F4EFE6" : (b.logoColor ? "#0B0B0B" : "#F4EFE6"),
                            }}
                          >
                            {b.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      {b.relationship && (
                        <div className="font-mono text-[10px] tracking-[.12em] uppercase text-redline">
                          {b.relationship}
                        </div>
                      )}
                      <div className="font-display font-semibold text-[20px] uppercase tracking-[-0.005em] leading-tight mt-0.5">
                        {b.name}
                      </div>
                      {b.tagline && (
                        <div className="font-serif italic text-[15px] text-paper-2 mt-1 line-clamp-2">{b.tagline}</div>
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
