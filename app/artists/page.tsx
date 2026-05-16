/**
 * /artists — the full directory.
 *
 * Every person/group with a doc in Sanity. Alphabetical. Each card links
 * to /artists/<slug>. Cards with portraits render the portrait; otherwise
 * the card shows just the name on a colored block.
 *
 * Why this exists: sitemap.ts and various pages link to /artists, but the
 * folder only had [slug] before. This index gives Google + visitors a
 * landing surface that lists everyone at once.
 */
import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getAllArtists } from "../_lib/sanity-queries";
import { urlFor } from "../_lib/sanity";
import { FOOTER_LINKS } from "../_lib/social-links";

export const revalidate = 3600;

export const metadata = {
  title: "artists — thespacepit",
  description:
    "every artist with a world on thespacepit — performers, producers, MCs, vocalists, drummers, DJs. tap any name to enter.",
};

export default async function ArtistsIndex() {
  const artists = await getAllArtists();

  // Group by first letter for the A→Z anchor strip + section headers.
  const groups = new Map<string, typeof artists>();
  for (const a of artists) {
    // Strip diacritics/punctuation so "Á" lands under "A", "$" under the
    // closest alphabetic char. Numbers go under "#".
    const raw = a.name.replace(/[^\p{L}\p{N}]/gu, "").charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(raw) ? raw : "#";
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(a);
  }
  const letters = Array.from(groups.keys()).sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b);
  });

  return (
    <>
      <TopNav current="spacepit" />
      <main className="flex-1 bg-paper text-ink">
        <header className="px-5 sm:px-8 pt-16 pb-10 border-b-2 border-ink">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase text-collect mb-2">
            ARTIST DIRECTORY · {artists.length} WORLDS
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            artists
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[680px] text-ink-2">
            every artist with a world on the site. performers, producers, MCs, vocalists, drummers, DJs.
            tap any name to enter.
          </p>

          {/* A→Z anchor strip — jump to any letter section instantly. */}
          <nav
            aria-label="Jump to letter"
            className="flex flex-wrap gap-x-3 gap-y-1 mt-6 font-mono text-[12px] tracking-[.1em] uppercase"
          >
            {letters.map((L) => (
              <a key={L} href={`#letter-${L}`} className="text-ink hover:text-collect transition-colors">
                {L}
              </a>
            ))}
          </nav>
        </header>

        <section className="px-5 sm:px-8 py-14">
          {letters.map((letter) => {
            const rows = groups.get(letter) ?? [];
            return (
              <div key={letter} id={`letter-${letter}`} className="mb-14 scroll-mt-20">
                <div className="font-display font-bold uppercase text-[64px] leading-none mb-5 text-collect">
                  {letter}
                </div>
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
                >
                  {rows.map((a) => {
                    const portrait = a.portrait
                      ? urlFor(a.portrait).width(440).height(440).fit("crop").url()
                      : null;
                    return (
                      <Link
                        key={a._id}
                        href={`/artists/${a.slug}`}
                        className="group block border-2 border-ink bg-paper-2 no-underline text-ink transition-all duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[5px_5px_0_var(--color-collect)]"
                      >
                        <div className="aspect-square bg-ink-2 overflow-hidden relative">
                          {portrait ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={portrait}
                              alt={a.name}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-paper-2 font-display font-bold uppercase text-[24px] leading-none tracking-tight p-3 text-center">
                              {a.displayInitials || a.name}
                            </div>
                          )}
                        </div>
                        <div className="p-3 border-t-2 border-ink">
                          <div className="font-display uppercase font-semibold leading-tight text-[16px] line-clamp-2">
                            {a.name}
                          </div>
                          {(a.city || a.tagline) && (
                            <div className="font-mono text-[10px] tracking-[.1em] uppercase text-ink-3 mt-1 line-clamp-1">
                              {a.city ?? a.tagline}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </main>
      <Footer
        theme="paper"
        signoff="every name → a door"
        meta="thespacepit · brooklyn"
        links={[...FOOTER_LINKS.spacepit]}
      />
    </>
  );
}
