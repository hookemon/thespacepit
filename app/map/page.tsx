import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getPlaces } from "../_lib/sanity-queries";
import { worldCountries } from "../_lib/world-map";
import { FOOTER_LINKS } from "../_lib/social-links";
import { SHOWS } from "../_lib/shows";
import { CITY_COORDS } from "../_lib/city-coords";
import { MapClient } from "./MapClient";

export const revalidate = 600;

export const metadata = {
  title: "the globe — thespacepit",
  description:
    "the studios. the venues. the festivals. the spots. every tour stop. nick's world, pinned. spinning.",
};

const TOUR_SKIP_CITIES = new Set(["TBC", "(TBC)", "(city TBC)", "USA", "Various", "Upstate", "Mexico"]);

export default async function MapPage() {
  const places = await getPlaces();

  // Sanity places — lat/lng pairs go to the client (no pre-projection so we
  // can spin the globe).
  const sanityPins = places.map((p) => ({
    ...p,
    source: "place" as const,
  }));

  type TourShow = { date: string | null; venue: string | null; era: string; year: number | null };
  const showsByCity = new Map<string, TourShow[]>();
  for (const s of SHOWS) {
    if (!s.city) continue;
    const city = s.city.trim();
    if (TOUR_SKIP_CITIES.has(city)) continue;
    if (!CITY_COORDS[city]) continue;
    const list = showsByCity.get(city) ?? [];
    list.push({ date: s.date, venue: s.venue, era: s.era, year: s.year });
    showsByCity.set(city, list);
  }

  const tourPins = [...showsByCity.entries()].map(([city, shows]) => {
    const coord = CITY_COORDS[city];
    shows.sort((a, b) => (b.date ?? "0").localeCompare(a.date ?? "0"));
    const years = shows.map((s) => s.year).filter((y): y is number => Number.isFinite(y));
    return {
      city,
      country: coord.country,
      lat: coord.lat,
      lng: coord.lng,
      showCount: shows.length,
      firstYear: years.length ? Math.min(...years) : null,
      lastYear: years.length ? Math.max(...years) : null,
      shows,
      source: "tour" as const,
    };
  });

  const countries = worldCountries();

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        <header className="px-5 sm:px-8 pt-16 pb-10 border-b border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">
            THE GLOBE · CURATED PINS · TOUR CITIES · SHOWS
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            the globe
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[760px] text-paper-2">
            every tour stop, every studio, every spot. shows across cities. spinning · drag to look around · click a pin for the story.
          </p>
        </header>

        <MapClient pins={sanityPins} tourPins={tourPins} countries={countries} />
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
