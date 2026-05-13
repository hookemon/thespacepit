import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getCollection } from "../_lib/discogs";
import {
  getCatalogSongs,
  getEraReleaseMap,
  getReleasesByArtist,
  getVideos,
} from "../_lib/sanity-queries";
// Note: getReleasesByArtist is used to power the station builder (we filter
// stations against the FULL release list, not just those with tracklists).
import { FOOTER_LINKS } from "../_lib/social-links";
import { RadioClient } from "./RadioClient";
import { STATIONS, buildStationMap, countTracksPerStation } from "../_lib/stations";

export const revalidate = 3600;

export const metadata = {
  title: "the radio — thespacepit",
  description: "nick's record collection + his catalog + music videos. press play. random rotation.",
};

export default async function RadioPage() {
  // 5 streams in parallel: discogs crate, nick's own catalog (releases),
  // every song flattened from those releases, era→release map for stations,
  // and music videos.
  const [crate, catalog, songs, eraReleaseMap, allVideos] = await Promise.all([
    getCollection(),
    getReleasesByArtist("nick-hook"),
    getCatalogSongs("nick-hook"),
    getEraReleaseMap(),
    getVideos(500),
  ]);
  const { total, records } = crate;
  // Music videos = videos tagged "music-video" with a youtubeId.
  const musicVideos = allVideos.filter((v) => v.tags?.includes("music-video") && v.youtubeId);

  // Resolve stations server-side: each station → set of release slugs that
  // belong to it (era-expanded + label-matched + year-filtered + explicit).
  const stationReleaseMap = buildStationMap(catalog, eraReleaseMap);
  // Per-station track count (for chip labels). Built from the flattened
  // songs list so it reflects ACTUAL listenable songs, not just release count.
  const releaseToTrackCount: Record<string, number> = {};
  for (const s of songs) {
    releaseToTrackCount[s.releaseSlug] = (releaseToTrackCount[s.releaseSlug] ?? 0) + 1;
  }
  const stationTrackCounts = countTracksPerStation(stationReleaseMap, releaseToTrackCount);

  // Convert Sets → string[] for serialization to the client component.
  const stationReleaseSlugs: Record<string, string[]> = {};
  for (const [k, set] of Object.entries(stationReleaseMap)) {
    stationReleaseSlugs[k] = [...set];
  }
  // Strip non-serializable matchers (titleMatch is a RegExp) before sending
  // to the client. The client only needs the display fields — the matching
  // already happened on the server (stationReleaseSlugs is the resolved set).
  const clientStations = STATIONS.map((s) => ({
    slug: s.slug,
    label: s.label,
    blurb: s.blurb,
  }));

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        <header className="px-5 sm:px-8 pt-16 pb-8 border-b border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">
            THE RADIO · {total.toLocaleString()} RECORDS · {songs.length} SONGS · {musicVideos.length} MUSIC VIDEOS
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            the radio
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[760px] text-paper-2">
            three streams, infinite stations — your discogs crate, every song from your own catalog, and your music videos. pick a station to filter the catalog into a vibe — calm + collect, the bands, the rappers, the drones. press play. youtube finds the match. shuffle whenever.
          </p>
        </header>

        {records.length > 0 || songs.length > 0 || musicVideos.length > 0 ? (
          <RadioClient
            records={records}
            songs={songs}
            musicVideos={musicVideos}
            stations={clientStations}
            stationReleaseSlugs={stationReleaseSlugs}
            stationTrackCounts={stationTrackCounts}
          />
        ) : (
          <div className="px-5 sm:px-8 py-16">
            <p className="font-serif italic text-[20px] text-paper-2">
              the crate is empty — check the discogs connection.
            </p>
          </div>
        )}
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
