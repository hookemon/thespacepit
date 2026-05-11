import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getPlaylistMeta, getVideosFromPlaylist } from "../_lib/youtube";
import { PLAYLISTS } from "../_lib/youtube-playlists";
import { FOOTER_LINKS } from "../_lib/social-links";
import { WatchClient } from "./WatchClient";

export const revalidate = 600;

export const metadata = {
  title: "watch — thespacepit",
  description: "every video. every playlist. studio + live + radio + tutorials.",
};

export default async function WatchPage() {
  // Pull each playlist's meta + videos in parallel
  const buckets = await Promise.all(
    PLAYLISTS.map(async (p) => {
      const [meta, videos] = await Promise.all([
        getPlaylistMeta(p.id),
        getVideosFromPlaylist(p.id, 50),
      ]);
      return {
        slug: p.slug,
        title: meta?.title ?? p.slug,
        description: meta?.description ?? "",
        videos,
      };
    })
  );
  const totalCount = buckets.reduce((sum, b) => sum + b.videos.length, 0);

  return (
    <>
      <TopNav current="spacepit" />
      <main className="flex-1 bg-paper text-ink">
        <header className="px-8 pt-16 pb-8 border-b-2 border-ink">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp-deep mb-2">YOUTUBE · @THESPACEPIT</div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            watch
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[760px]">
            {totalCount === 0
              ? "no videos yet — add a YouTube playlist in app/_lib/youtube-playlists.ts."
              : "videos across curated playlists. studio sessions, live, radio, tutorials, behind-the-scenes."}
          </p>
        </header>

        <WatchClient buckets={buckets} />
      </main>
      <Footer
        theme="paper"
        heptagon="fill-white"
        signoff="see u in the pit 🪐"
        meta="brooklyn · medellín · since 2014"
        links={[...FOOTER_LINKS.spacepit]}
      />
    </>
  );
}
