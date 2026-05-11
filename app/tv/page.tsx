import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getVideos } from "../_lib/sanity-queries";
import { FOOTER_LINKS } from "../_lib/social-links";
import { TVClient, type Channel } from "./TVClient";

export const revalidate = 600;

export const metadata = {
  title: "the tv — thespacepit",
  description:
    "the spacepit on television. channel 1: music videos + behind the scenes. channel 2: tutorials + gear demos. autoplay. flip the dial.",
};

// CHANNEL DEFINITIONS — extensible by design. Each channel is a tag-driven
// queue. To add a channel, drop another entry here.
const CHANNELS: Channel[] = [
  {
    id: "mtv",
    number: "01",
    name: "MTV",
    description: "music videos · behind the scenes · the visuals",
    tags: ["music-video", "behind-the-scenes"],
    accent: "#E83A1C", // redline
  },
  {
    id: "edu",
    number: "02",
    name: "EDU",
    description: "tutorials · gear demos · how it works",
    tags: ["tutorial", "gear-demo"],
    accent: "#F2B705", // lamp
  },
  {
    id: "live",
    number: "03",
    name: "LIVE",
    description: "live sets · jams · studio sessions",
    tags: ["live-set", "livestream", "studio-session", "jam"],
    accent: "#3E8E5A", // chakra-heart green
  },
  {
    id: "rtj",
    number: "04",
    name: "RTJ",
    description: "run the jewels — every angle",
    tags: ["rtj"],
    accent: "#9B1B1B", // chakra-root deep red
  },
  {
    id: "cz",
    number: "05",
    name: "CZ",
    description: "cubic zirconia · the grimy techno-soul",
    tags: ["cubic-zirconia"],
    accent: "#4B2E83", // chakra-third purple
  },
  {
    id: "chakra",
    number: "06",
    name: "CHAKRA",
    description: "spiritual friendship · ambient · meditation",
    tags: ["chakra", "spiritual-friendship"],
    accent: "#E3D4F2", // chakra-crown lavender
  },
];

export default async function TVPage() {
  const allVideos = await getVideos(500);

  // Pre-bucket videos by channel so the client doesn't have to filter on every
  // tick. Drop channels with 0 videos (empty channels are dead air).
  const stocked = CHANNELS.map((ch) => {
    const queue = allVideos.filter(
      (v) => v.youtubeId && (v.tags ?? []).some((t) => ch.tags.includes(t)) && !v.hidden
    );
    return { ...ch, queue };
  }).filter((ch) => ch.queue.length > 0);

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        <header className="px-5 sm:px-8 pt-16 pb-6 border-b border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">
            THE TV · {stocked.length} CHANNELS · TURN IT ON
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            the tv
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[760px] text-paper-2">
            the radio plays records. the tv plays the channel. flip between music videos, tutorials,
            live sets, RTJ, cubic zirconia, chakra. autoplay — when one video ends, the next one rolls.
          </p>
        </header>

        {stocked.length > 0 ? (
          <TVClient channels={stocked} />
        ) : (
          <div className="px-5 sm:px-8 py-16">
            <p className="font-serif italic text-[20px] text-paper-2">
              no channels have content yet. ingest some videos with proper tags first.
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
