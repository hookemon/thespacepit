import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getCollection } from "../_lib/discogs";
import { getReleasesByArtist, getVideos } from "../_lib/sanity-queries";
import { FOOTER_LINKS } from "../_lib/social-links";
import { RadioClient } from "./RadioClient";

export const revalidate = 3600;

export const metadata = {
  title: "the radio — thespacepit",
  description: "nick's record collection + his catalog + music videos. press play. random rotation.",
};

export default async function RadioPage() {
  // 3 streams in parallel: discogs crate, nick's own catalog, music videos.
  const [crate, catalog, allVideos] = await Promise.all([
    getCollection(),
    getReleasesByArtist("nick-hook"),
    getVideos(500),
  ]);
  const { total, records } = crate;
  // Music videos = videos tagged "music-video" with a youtubeId.
  const musicVideos = allVideos.filter((v) => v.tags?.includes("music-video") && v.youtubeId);
  // Catalog tracks = releases where Nick is primary artist (cap to keep the queue
  // searchable; the same titles show up in the chronological catalog wall too).
  const catalogTracks = catalog.slice(0, 200);

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        <header className="px-5 sm:px-8 pt-16 pb-8 border-b border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">
            THE RADIO · {total.toLocaleString()} RECORDS · {catalogTracks.length} RELEASES · {musicVideos.length} MUSIC VIDEOS
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            the radio
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[760px] text-paper-2">
            three streams in one — your discogs crate, your own catalog, your music videos. random pulls, youtube finds the match. press play. skip whenever. reshuffle the mood.
          </p>
        </header>

        {records.length > 0 || catalogTracks.length > 0 || musicVideos.length > 0 ? (
          <RadioClient
            records={records}
            catalogTracks={catalogTracks}
            musicVideos={musicVideos}
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
