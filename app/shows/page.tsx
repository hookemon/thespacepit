import { groq } from "next-sanity";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { PhotoGallery } from "../_components/shared/PhotoGallery";
import { SHOWS } from "../_lib/shows";
import { sanityFetch } from "../_lib/sanity";
import { urlFor } from "../_lib/sanity";
import { FOOTER_LINKS } from "../_lib/social-links";
import { ShowsTable } from "./ShowsTable";
import type { SanityImage } from "../_lib/sanity-queries";

export const revalidate = 600;

export const metadata = {
  title: "shows — nick hook",
  description:
    "every known show, 2004 → 2023. men women + children to run the jewels to medellín.",
};

type StudioGallery = { gallery?: SanityImage[] };

export default async function ShowsPage() {
  // Pull session/tour-life photos from the studio galleries to give /shows
  // visual weight before the dense table.
  const [thespacepit, laburbuja] = await Promise.all([
    sanityFetch<StudioGallery | null>(
      groq`*[_type == "studio" && slug.current == "thespacepit"][0]{ gallery }`
    ),
    sanityFetch<StudioGallery | null>(
      groq`*[_type == "studio" && slug.current == "la-burbuja"][0]{ gallery }`
    ),
  ]);

  const studioPhotos = [
    ...(thespacepit?.gallery ?? []),
    ...(laburbuja?.gallery ?? []),
  ];
  const galleryPhotos = studioPhotos.map((img) => ({
    src: urlFor(img).width(2000).url(),
    alt: "",
  }));

  // EPK photo strip — anchor live shots up top.
  const epkStrip: { src: string; alt: string; caption: string }[] = [
    { src: "/epk/nick-7-2.png", alt: "Sónar 2017 main stage",     caption: "sónar · 2017" },
    { src: "/epk/nick-7-3.png", alt: "live in orange smoke",      caption: "live" },
    { src: "/epk/nick-7-1.png", alt: "nick at the decks in blue", caption: "decks" },
    { src: "/epk/nick-2-0.jpg", alt: "studio session, the pit",   caption: "the pit" },
  ];

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="nick" />
      <main className="flex-1">
        <header className="px-5 sm:px-8 pt-16 pb-8 border-b-2 border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">
            EVERY KNOWN SHOW · 2004 → 2023
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            shows
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[760px] text-paper-2">
            performances on record. men women + children to run the jewels to medellín. filterable.
          </p>
        </header>

        {/* EPK photo strip — live anchors */}
        <section
          aria-label="tour images from the EPK"
          className="px-5 sm:px-8 py-6 border-b border-paper/30 grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
        >
          {epkStrip.map((p) => (
            <figure key={p.src} className="relative aspect-[4/3] overflow-hidden border border-paper/40 m-0">
              <img
                src={p.src}
                alt={p.alt}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <figcaption className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5 font-mono text-[10px] tracking-[.14em] uppercase text-paper bg-gradient-to-t from-ink/85 to-transparent">
                {p.caption}
              </figcaption>
            </figure>
          ))}
        </section>

        {/* Studio gallery — pulled live from Sanity (NI shoot + spacepit candids) */}
        {galleryPhotos.length > 0 && (
          <section className="px-5 sm:px-8 py-10 border-b border-paper/30">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">
              IN THE ROOMS
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-6"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
            >
              brooklyn → medellín
            </h2>
            <PhotoGallery photos={galleryPhotos} />
          </section>
        )}

        <ShowsTable />
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
