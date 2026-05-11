/**
 * Renders a Bandcamp player. Pass a numeric album/track id (preferred) or fall
 * back to a basic linked card if only a URL is known.
 */
type Props = {
  albumId?: string;
  trackId?: string;
  bandcampUrl?: string;
  title?: string;
  size?: "large" | "small";
};

export function BandcampEmbed({ albumId, trackId, bandcampUrl, title, size = "large" }: Props) {
  if (!albumId && !trackId) {
    if (!bandcampUrl) return null;
    return (
      <a
        href={bandcampUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block border border-current p-5 font-mono text-[12px] tracking-[.1em] uppercase hover:opacity-80 transition-opacity"
      >
        ▶ listen on bandcamp →
      </a>
    );
  }

  const id = albumId ?? trackId;
  const idType = albumId ? "album" : "track";
  const isLarge = size === "large";
  const heightAttr = isLarge ? "size=large/bgcol=ffffff/linkcol=0687f5/tracklist=true/transparent=true/" : "size=small/bgcol=ffffff/linkcol=0687f5/transparent=true/";
  const cssHeight = isLarge ? 470 : 42;
  const src = `https://bandcamp.com/EmbeddedPlayer/${idType}=${id}/${heightAttr}`;

  return (
    <iframe
      src={src}
      seamless
      style={{ border: 0, width: "100%", height: cssHeight }}
      title={title ?? "Bandcamp player"}
    />
  );
}
