import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getVideos } from "../_lib/sanity-queries";
import { FOOTER_LINKS } from "../_lib/social-links";
import { WatchClient } from "./WatchClient";

export const revalidate = 600;

export const metadata = {
  title: "watch — thespacepit",
  description: "every video on the channel. tag-filtered, search-able. studio + live + chakra + tutorial.",
};

// Display label + ordering for the tag chips at the top of /watch.
// Order matters: chips render in this sequence.
const TAG_ORDER: { value: string; label: string }[] = [
  { value: "gear-demo",            label: "gear" },
  { value: "live-set",             label: "live set" },
  { value: "livestream",           label: "livestream" },
  { value: "studio-session",       label: "studio" },
  { value: "jam",                  label: "jam" },
  { value: "tutorial",             label: "tutorial" },
  { value: "music-video",          label: "music video" },
  { value: "behind-the-scenes",    label: "bts" },
  { value: "interview",            label: "interview" },
  { value: "chakra",               label: "chakra" },
  { value: "spiritual-friendship", label: "spiritual friendship" },
  { value: "rtj",                  label: "rtj" },
  { value: "dam-funk",             label: "dām-funk" },
  { value: "mwc",                  label: "mwc" },
  { value: "cubic-zirconia",       label: "cubic zirconia" },
  { value: "mix",                  label: "mix / radio" },
  { value: "spacepit",             label: "the pit" },
  { value: "medellin",             label: "medellín" },
  { value: "sample-pack",          label: "sample pack" },
  { value: "vlog",                 label: "vlog" },
];

export default async function WatchPage() {
  const videos = await getVideos(500);

  // Build tag counts so chips can show "(N)" only for tags that actually have videos.
  const counts: Record<string, number> = {};
  for (const v of videos) for (const t of v.tags ?? []) counts[t] = (counts[t] ?? 0) + 1;
  const visibleTags = TAG_ORDER.filter((t) => (counts[t.value] ?? 0) > 0).map((t) => ({
    ...t,
    count: counts[t.value],
  }));

  return (
    <>
      <TopNav current="spacepit" />
      <main className="flex-1 bg-paper text-ink">
        <header className="px-5 sm:px-8 pt-16 pb-8 border-b-2 border-ink">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp-deep mb-2">
            YOUTUBE · @THESPACEPIT · {videos.length} VIDEOS
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 11vw, 160px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
          >
            watch
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[680px] text-ink-3 leading-snug">
            the channel. all of it. tag-filtered, search-able, click any tile to play it inline. {videos.length} videos and counting.
          </p>
        </header>
        <WatchClient videos={videos} tags={visibleTags} />
      </main>
      <Footer
        theme="paper"
        heptagon="fill-white"
        signoff="see u in the pit 🪐"
        meta="brooklyn · medellín · the channel"
        links={[...FOOTER_LINKS.spacepit]}
      />
    </>
  );
}
