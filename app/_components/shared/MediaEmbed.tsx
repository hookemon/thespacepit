import { embedLabel, formatTimestamp, parseEmbed } from "../../_lib/embed";

// Generic media embed — drop-in for YouTubeEmbed. Handles YT, Instagram reels,
// Vimeo, TikTok. Falls back to a tile + outbound link for unknown URLs.
//
// Aspect ratio comes from the URL parser so vertical reels don't get squashed
// into 16:9 letterboxes.

type Props = {
  url: string;
  title?: string;
  /** Override the auto-detected aspect ratio (width / height). */
  aspectRatio?: number;
};

export function MediaEmbed({ url, title, aspectRatio }: Props) {
  const embed = parseEmbed(url);

  if (embed.kind === "unknown") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-video bg-ink-2 border border-current p-4 hover:opacity-80 transition-opacity no-underline text-current"
      >
        <div className="font-mono text-[10px] tracking-[.14em] uppercase opacity-70">link</div>
        <div className="font-display uppercase text-[16px] mt-1 break-words">{title ?? url}</div>
      </a>
    );
  }

  const ratio = aspectRatio ?? embed.aspectRatio;

  return (
    <div className="relative">
      <div
        className="relative border border-current overflow-hidden bg-ink-2"
        style={{ aspectRatio: String(ratio) }}
      >
        <iframe
          src={embed.src}
          title={title ?? `${embedLabel(embed.kind)} embed`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          scrolling="no"
          className="absolute inset-0 w-full h-full"
        />
      </div>
      <div className="flex items-center gap-2 mt-1.5 font-mono text-[9px] tracking-[.14em] uppercase opacity-60">
        {embed.kind === "instagram" && <span>instagram reel</span>}
        {embed.kind === "tiktok" && <span>tiktok</span>}
        {embed.startSeconds && embed.startSeconds > 0 && (
          <span className="text-lamp opacity-100">▶ jumps to {formatTimestamp(embed.startSeconds)}</span>
        )}
      </div>
    </div>
  );
}
