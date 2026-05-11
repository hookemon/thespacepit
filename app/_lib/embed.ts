// URL → embed config. Handles YouTube, Instagram (reels + posts), Vimeo, TikTok.
//
// Returns iframe src + native aspect ratio so we can keep videos looking right
// without forcing 16:9 on a vertical reel.

export type EmbedKind = "youtube" | "instagram" | "vimeo" | "tiktok" | "unknown";

export type Embed = {
  kind: EmbedKind;
  src: string;
  /** width / height — 16/9 = 1.77, 9/16 = 0.56 */
  aspectRatio: number;
  thumbnail?: string;
  rawUrl: string;
};

const YT_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const IG_RE = /instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/;
// TikTok video URLs: tiktok.com/@user/video/{id}
const TIKTOK_RE = /tiktok\.com\/@[^/]+\/video\/(\d+)/;

export function parseEmbed(url: string): Embed {
  const ytMatch = url.match(YT_RE);
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      kind: "youtube",
      src: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
      aspectRatio: 16 / 9,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      rawUrl: url,
    };
  }

  const igMatch = url.match(IG_RE);
  if (igMatch) {
    const shortcode = igMatch[1];
    // /embed/captioned hides nothing; without /captioned the card is tighter.
    // Reels are vertical; static posts are usually square. We aim for ~9:16
    // (the dominant case is reels) and let the IG card fall back gracefully.
    return {
      kind: "instagram",
      src: `https://www.instagram.com/p/${shortcode}/embed/`,
      aspectRatio: 9 / 16,
      rawUrl: url,
    };
  }

  const vmMatch = url.match(VIMEO_RE);
  if (vmMatch) {
    return {
      kind: "vimeo",
      src: `https://player.vimeo.com/video/${vmMatch[1]}`,
      aspectRatio: 16 / 9,
      rawUrl: url,
    };
  }

  const ttMatch = url.match(TIKTOK_RE);
  if (ttMatch) {
    return {
      kind: "tiktok",
      src: `https://www.tiktok.com/embed/v2/${ttMatch[1]}`,
      aspectRatio: 9 / 16,
      rawUrl: url,
    };
  }

  return {
    kind: "unknown",
    src: url,
    aspectRatio: 16 / 9,
    rawUrl: url,
  };
}

/** Quick host label for chips ("youtube", "instagram", etc.) */
export function embedLabel(kind: EmbedKind): string {
  switch (kind) {
    case "youtube":   return "youtube";
    case "instagram": return "instagram";
    case "vimeo":     return "vimeo";
    case "tiktok":    return "tiktok";
    default:          return "link";
  }
}
