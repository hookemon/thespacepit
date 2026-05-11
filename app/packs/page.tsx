import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getPacks, type PackKind } from "../_lib/sanity-queries";
import { urlFor } from "../_lib/sanity";
import { FOOTER_LINKS } from "../_lib/social-links";

export const revalidate = 300;

export const metadata = {
  title: "packs — thespacepit",
  description:
    "sample packs, drum kits, presets, templates. straight from nick's rig. cop on gumroad.",
};

const KIND_LABEL: Record<PackKind, string> = {
  "sample-pack": "sample pack",
  "preset-pack": "preset pack",
  "template":    "template",
  "tutorial":    "tutorial / 1-on-1",
  "loop-pack":   "loop pack",
  "drum-kit":    "drum kit",
};

const KIND_COLOR: Record<PackKind, string> = {
  "sample-pack": "#F2B705",
  "preset-pack": "#C9B9E8",
  "template":    "#7BD3A8",
  "tutorial":    "#E83A1C",
  "loop-pack":   "#65C7F7",
  "drum-kit":    "#FF6FB5",
};

export default async function PacksPage() {
  const packs = await getPacks();

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        <header className="px-8 pt-16 pb-10 border-b border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">
            THE PACKS · ON GUMROAD
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            sample packs
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[720px] text-paper-2">
            sample packs, drum kits, presets, ableton move templates, 1-on-1 sessions. straight from the rig at thespacepit + la burbuja. click any cover to cop on gumroad.
          </p>
        </header>

        <section className="px-8 py-12">
          {packs.length === 0 ? (
            <p className="font-serif italic text-[20px] text-paper-2">no packs yet.</p>
          ) : (
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {packs.map((p) => {
                const cover = p.cover ? urlFor(p.cover).width(720).height(720).fit("crop").url() : null;
                const color = KIND_COLOR[p.kind] ?? "#F2B705";
                return (
                  <Link
                    key={p._id}
                    href={p.downloadUrl ?? "#"}
                    target={p.downloadUrl ? "_blank" : undefined}
                    rel={p.downloadUrl ? "noopener noreferrer" : undefined}
                    className="group block border border-paper bg-ink-2 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#F2B705] transition-transform duration-150 overflow-hidden no-underline text-paper"
                  >
                    <div className="aspect-square border-b border-paper bg-ink-2 overflow-hidden relative">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center p-4 text-center font-display uppercase text-paper-2">
                          {p.name}
                        </div>
                      )}
                      {p.featured && (
                        <div
                          className="absolute top-2 left-2 font-mono text-[9px] tracking-[.14em] uppercase px-2 py-0.5 rounded-full"
                          style={{ background: color, color: "#0B0B0B" }}
                        >
                          featured
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ background: color }}
                        />
                        <div className="font-mono text-[10px] tracking-[.14em] uppercase" style={{ color }}>
                          {KIND_LABEL[p.kind]}
                        </div>
                        {p.price && (
                          <div className="ml-auto font-mono text-[10px] tracking-[.1em] uppercase text-paper-2">
                            {p.price}
                          </div>
                        )}
                      </div>
                      <div className="font-display font-semibold text-[20px] uppercase tracking-[-0.005em] leading-tight line-clamp-2">
                        {p.name}
                      </div>
                      {p.tagline && (
                        <p className="font-serif italic text-[14px] text-paper-2 leading-snug mt-1.5 line-clamp-2">
                          {p.tagline}
                        </p>
                      )}
                      <div className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 mt-3 group-hover:text-lamp transition-colors">
                        gumroad ↗
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
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
