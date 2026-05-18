"use client";

/**
 * Play button for a mix that's been uploaded as a Sanity-hosted audio file
 * (no external Mixcloud / SoundCloud / YouTube embed). Click → hands the
 * audio URL to the global ListeningProvider; the MiniPlayer at the bottom
 * of the page handles playback, pause, scrub, and survives navigation.
 */
import { useListening } from "../../_components/listening/ListeningProvider";

export function MixAudioPlayer({
  audioUrl,
  title,
  era,
  coverUrl,
  duration,
  mixSlug,
}: {
  audioUrl: string;
  title: string;
  era?: string;
  coverUrl?: string | null;
  duration?: string;
  mixSlug: string;
}) {
  const { current, isPlaying, toggle, play } = useListening();
  const trackId = `mix-${mixSlug}`;
  const isThisMixCurrent = current?.id === trackId;
  const isThisMixPlaying = isThisMixCurrent && isPlaying;

  const handle = () => {
    if (isThisMixCurrent) {
      toggle();
    } else {
      play({
        id: trackId,
        title,
        artist: era ?? "nick hook",
        coverUrl: coverUrl ?? null,
        audioUrl,
        duration,
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      className="inline-flex items-center gap-3 font-display font-bold uppercase tracking-[-0.005em] text-[18px] px-5 py-3 border-2 border-paper rounded-full text-paper hover:bg-lamp hover:text-ink hover:border-lamp transition-all"
      aria-label={isThisMixPlaying ? `pause ${title}` : `play ${title}`}
    >
      <span aria-hidden>{isThisMixPlaying ? "❚❚" : "▶"}</span>
      <span>{isThisMixPlaying ? "pause" : duration ? `play · ${duration}` : "play the mix"}</span>
    </button>
  );
}
