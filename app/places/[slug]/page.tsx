import { notFound } from "next/navigation";
import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { PortableText } from "../../_components/shared/PortableText";
import { getPlaceBySlug, getPlaces, type PlaceKind } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";
import { FOOTER_LINKS } from "../../_lib/social-links";

export const revalidate = 3600;

export async function generateStaticParams() {
  const places = await getPlaces();
  return places.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) return { title: "place not found" };
  return {
    title: `${place.name}, ${place.city ?? ""} — the spacepit map`,
    description: place.tagline ?? `${place.name} in ${place.city ?? "the world"}.`,
  };
}

// Reuse the same palette as the map.
const KIND_COLORS: Record<PlaceKind, { fill: string; label: string }> = {
  studio:        { fill: "#F2B705", label: "studio" },
  show:          { fill: "#E83A1C", label: "show" },
  club:          { fill: "#E83A1C", label: "club" },
  festival:      { fill: "#C9B9E8", label: "festival" },
  restaurant:    { fill: "#7BD3A8", label: "restaurant" },
  bar:           { fill: "#7BD3A8", label: "bar / café" },
  hotel:         { fill: "#F4EFE6", label: "hotel" },
  "record-store":{ fill: "#0E4B3A", label: "record store" },
  vibe:          { fill: "#F4EFE6", label: "vibe" },
  moment:        { fill: "#F4EFE6", label: "moment" },
  session:       { fill: "#F2B705", label: "session" },
  party:         { fill: "#E83A1C", label: "party" },
  workshop:      { fill: "#C9B9E8", label: "workshop" },
};

export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) notFound();

  const hero = place.hero ? urlFor(place.hero).width(2200).height(1100).fit("crop").url() : null;
  const kind = KIND_COLORS[place.kind] ?? KIND_COLORS.vibe;

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        {/* Hero — full-bleed photo or solid color */}
        <section
          className="relative border-b-2 border-paper overflow-hidden"
          style={{ background: hero ? "#0B0B0B" : "#1C1A17" }}
        >
          {hero && (
            <>
              <img src={hero} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, rgba(11,11,11,0.20) 0%, rgba(11,11,11,0.70) 100%)" }}
              />
            </>
          )}
          <div className="relative px-6 sm:px-8 pt-8 pb-20">
            <div className="max-w-[1180px] mx-auto">
              <Link
                href="/map"
                className="font-mono text-[11px] tracking-[.14em] uppercase text-paper hover:opacity-70 no-underline drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
              >
                ← back to the map
              </Link>

              <div className="mt-16 sm:mt-24 max-w-[920px]">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ background: kind.fill, boxShadow: "0 0 0 2px rgba(11,11,11,0.5)" }}
                    aria-hidden
                  />
                  <span
                    className="font-mono text-[11px] tracking-[.18em] uppercase"
                    style={{ color: kind.fill }}
                  >
                    {kind.label}
                    {place.year ? ` · since ${place.year}` : ""}
                  </span>
                </div>
                <h1
                  className="font-display font-bold uppercase m-0 drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)]"
                  style={{ fontSize: "clamp(48px, 10vw, 140px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
                >
                  {place.name}
                </h1>
                <div className="font-mono text-[12px] tracking-[.12em] uppercase text-paper-2 mt-3 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                  {place.city}
                  {place.country ? ` · ${place.country}` : ""}
                  {Number.isFinite(place.lat) && Number.isFinite(place.lng) && (
                    <> · <span className="tabular-nums">{place.lat.toFixed(3)}°, {place.lng.toFixed(3)}°</span></>
                  )}
                </div>
                {place.tagline && (
                  <p className="font-serif italic text-[20px] sm:text-[22px] mt-5 max-w-[640px] text-paper drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">
                    {place.tagline}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-6">
                  {place.websiteUrl && (
                    <a
                      href={place.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block font-mono text-[11px] tracking-[.1em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline backdrop-blur-sm bg-ink/30"
                    >
                      website →
                    </a>
                  )}
                  {place.googleMapsUrl && (
                    <a
                      href={place.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block font-mono text-[11px] tracking-[.1em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline backdrop-blur-sm bg-ink/30"
                    >
                      open in maps →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <article className="px-6 sm:px-8 py-12">
          <div className="max-w-[1180px] mx-auto">
            {place.story && Array.isArray(place.story) && place.story.length > 0 ? (
              <section className="max-w-[720px]">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-3">THE TRAVEL GUIDE</div>
                <PortableText value={place.story} />
              </section>
            ) : (
              <section className="max-w-[720px]">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-3">THE TRAVEL GUIDE</div>
                <p className="font-serif italic text-[18px] text-paper-2">
                  no story logged yet. {place.tagline ?? "more soon."}
                </p>
              </section>
            )}

            {place.gallery && place.gallery.length > 0 && (
              <section className="mt-16">
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-4">GALLERY</div>
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                  {place.gallery.map((img, i) => {
                    const src = urlFor(img).width(800).url();
                    return (
                      <div key={i} className="border border-paper overflow-hidden aspect-square">
                        <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </article>
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
