import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { FOOTER_LINKS } from "../_lib/social-links";
import { sanityFetch } from "../_lib/sanity";
import { urlFor } from "../_lib/sanity";
import type { SanityImage } from "../_lib/sanity-queries";
import { groq } from "next-sanity";
import { WallClient } from "./WallClient";

export const revalidate = 300;

export const metadata = {
  title: "the wall — every flyer, every show",
  description:
    "every flyer, poster, show invite, sticker — the studio's actual wall. taped up, slightly rotated, real.",
};

export type FlyerCard = {
  _id: string;
  title?: string;
  kind?: string;
  date?: string;
  year?: number;
  city?: string;
  venue?: string;
  tags?: string[];
  image?: SanityImage;
};

export default async function WallPage() {
  // Pull every flyer that isn't hidden. Order: featured first, then newest,
  // then alphabetical-ish for the un-dated stragglers.
  const flyers = await sanityFetch<FlyerCard[]>(groq`
    *[_type == "flyer" && hidden != true]
      | order(featured desc, date desc, year desc, _createdAt desc) {
      _id, title, kind, date, year, city, venue, tags, image
    }
  `);

  // Pre-render image URLs server-side so the client component just needs
  // to lay them out + handle clicks (no Sanity client in the browser).
  const tiles = flyers
    .filter((f) => f.image)
    .map((f) => ({
      id: f._id,
      title: f.title ?? "",
      kind: f.kind ?? "show",
      date: f.date ?? null,
      year: f.year ?? null,
      city: f.city ?? null,
      venue: f.venue ?? null,
      tags: f.tags ?? [],
      // Web-sized + a high-res for lightbox
      src: urlFor(f.image!).width(900).fit("max").url(),
      hiRes: urlFor(f.image!).width(2200).fit("max").url(),
    }));

  return (
    <>
      <TopNav current="spacepit" />
      <main className="flex-1 bg-ink text-paper relative">
        <header className="px-5 sm:px-8 pt-14 pb-8 border-b border-paper/40">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">
            EVERY FLYER · EVERY SHOW · EVERY DOOR
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 11vw, 160px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
          >
            the wall
          </h1>
          <p className="font-serif italic text-[20px] mt-3 max-w-[720px] text-paper-2">
            the studio's wall — every gig flyer, tour poster, release party invite, sticker traded at SXSW, mixtape sleeve. taped up. slightly rotated. real. {tiles.length} pinned so far.
          </p>
        </header>

        {tiles.length === 0 ? (
          <section className="px-5 sm:px-8 py-24 text-center">
            <p className="font-serif italic text-[24px] text-paper-2 max-w-[640px] mx-auto">
              the wall is empty for the moment — bulk flyer import is running. flyers from drives + dropbox land within the hour. gmail flyer attachments come next (separate node script needed to pull binary attachments out of mail).
            </p>
          </section>
        ) : (
          <WallClient tiles={tiles} />
        )}
      </main>
      <Footer
        theme="dark"
        signoff="taped up 🧷"
        meta={`${tiles.length} flyers · refreshes every 5 min`}
        links={[...FOOTER_LINKS.spacepit]}
        heptagon="fill-white"
      />
    </>
  );
}
