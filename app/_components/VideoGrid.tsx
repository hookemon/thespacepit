import Link from "next/link";
import { getPlaylistMeta, getVideosFromPlaylist } from "../_lib/youtube";
import { PLAYLISTS, FEATURED_PLAYLIST_SLUG } from "../_lib/youtube-playlists";
import { VideoGridClient } from "./VideoGridClient";

const FEATURED_PLAYLIST_LIMIT = 12;

export async function VideoGrid() {
  const featured = PLAYLISTS.find((p) => p.slug === FEATURED_PLAYLIST_SLUG) ?? PLAYLISTS[0];
  if (!featured) {
    return null;
  }

  const [meta, videos] = await Promise.all([
    getPlaylistMeta(featured.id),
    getVideosFromPlaylist(featured.id, FEATURED_PLAYLIST_LIMIT),
  ]);

  const fullCount = meta?.itemCount ?? videos.length;
  const playlistTitle = meta?.title ?? "in the pit";

  return (
    <section id="videos" className="px-8 py-16 bg-paper text-ink">
      <div className="flex items-end justify-between mb-7 border-b-2 border-ink pb-2.5 flex-wrap gap-3">
        <div>
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp-deep">
            YOUTUBE · @THESPACEPIT · {playlistTitle.toLowerCase()} playlist
          </div>
          <h2
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(44px, 6vw, 72px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
          >
            in the pit
          </h2>
        </div>
        <Link
          href="/watch"
          className="group block text-right no-underline text-ink hover:text-lamp-deep transition-colors"
        >
          <div className="font-mono text-[10px] tracking-[.14em] uppercase text-mute group-hover:text-lamp-deep transition-colors">
            {fullCount} videos curated · {PLAYLISTS.length} playlist{PLAYLISTS.length === 1 ? "" : "s"}
          </div>
          <div
            className="font-display font-bold uppercase mt-1 leading-none flex items-center justify-end gap-2"
            style={{ fontSize: "clamp(18px, 2vw, 26px)", letterSpacing: "-0.01em" }}
          >
            see every video
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1.5">→</span>
          </div>
        </Link>
      </div>
      <VideoGridClient videos={videos} />
    </section>
  );
}
