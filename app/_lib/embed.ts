// URL → embed config. Handles YouTube, Instagram (reels + posts), Vimeo, TikTok.
//
// Returns iframe src + native aspect ratio so we can keep videos looking right
// without forcing 16:9 on a vertical reel.

export type EmbedKind = "youtube" | "instagram" | "vimeo" | "tiktok" | "soundcloud" | "mixcloud" | "unknown";

export type Embed = {
  kind: EmbedKind;
  src: string;
  /** width / height — 16/9 = 1.77, 9/16 = 0.56 */
  aspectRatio: number;
  thumbnail?: string;
  rawUrl: string;
  /** For YouTube: deep-link timestamp in seconds (e.g. ?t=183). */
  startSeconds?: number;
};

/**
 * Parse a YouTube timestamp from any of the forms YouTube accepts:
 *   ?t=183   ?t=3m3s   &start=183
 * Returns seconds (integer). Returns 0 if not present.
 */
function parseYouTubeTimestamp(url: string): number {
  if (!url) return 0;
  const m = url.match(/[?&](?:t|start)=([0-9hms]+)/i);
  if (!m) return 0;
  const v = m[1];
  if (/^\d+$/.test(v)) return parseInt(v, 10);
  // "3m3s" / "1h2m3s" form
  let total = 0;
  const re = /(\d+)([hms])/g;
  let part: RegExpExecArray | null;
  while ((part = re.exec(v)) !== null) {
    const n = parseInt(part[1], 10);
    if (part[2] === "h") total += n * 3600;
    else if (part[2] === "m") total += n * 60;
    else total += n;
  }
  return total;
}

/** Format seconds as M:SS or H:MM:SS for display. */
export function formatTimestamp(s: number): string {
  if (s < 60) return `0:${String(s).padStart(2, "0")}`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const YT_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const IG_RE = /instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/;
// TikTok video URLs: tiktok.com/@user/video/{id}
const TIKTOK_RE = /tiktok\.com\/@[^/]+\/video\/(\d+)/;
// SoundCloud track or playlist URLs — username/track-slug structure.
const SOUNDCLOUD_RE = /(?:^|\/\/)(?:www\.)?soundcloud\.com\/([^/?#]+\/(?:sets\/)?[^/?#]+)/;
// Mixcloud show URLs — username/show-slug structure.
const MIXCLOUD_RE = /(?:^|\/\/)(?:www\.)?mixcloud\.com\/([^/?#]+\/[^/?#]+)/;

export function parseEmbed(url: string): Embed {
  if (!url) {
    return { kind: "unknown", src: "", aspectRatio: 16 / 9, rawUrl: "" };
  }
  const ytMatch = url.match(YT_RE);
  if (ytMatch) {
    const id = ytMatch[1];
    // Pull a `?t=` / `?start=` timestamp so a deep-link like
    // youtu.be/abc?t=183 jumps the embed to that second.
    const ts = parseYouTubeTimestamp(url);
    const params = ["rel=0"];
    if (ts > 0) params.push(`start=${ts}`);
    return {
      kind: "youtube",
      src: `https://www.youtube-nocookie.com/embed/${id}?${params.join("&")}`,
      aspectRatio: 16 / 9,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      rawUrl: url,
      startSeconds: ts > 0 ? ts : undefined,
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

  // SoundCloud — uses the public player widget. Encode the original URL
  // and pass it to w.soundcloud.com/player. Aspect ratio is wide+short
  // (~5:1) because the standard player is a horizontal strip with cover
  // art + waveform.
  const scMatch = url.match(SOUNDCLOUD_RE);
  if (scMatch) {
    const enc = encodeURIComponent(`https://soundcloud.com/${scMatch[1]}`);
    return {
      kind: "soundcloud",
      src: `https://w.soundcloud.com/player/?url=${enc}&color=%23F2B705&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&visual=true`,
      aspectRatio: 16 / 9,
      rawUrl: url,
    };
  }

  // Mixcloud — same pattern, different widget URL. Mixcloud's widget
  // is naturally taller than SoundCloud's (~16:9 with the show art big).
  const mxMatch = url.match(MIXCLOUD_RE);
  if (mxMatch) {
    const enc = encodeURIComponent(`/${mxMatch[1]}/`);
    return {
      kind: "mixcloud",
      src: `https://player-widget.mixcloud.com/widget/iframe/?feed=${enc}&hide_cover=0&light=0`,
      aspectRatio: 16 / 9,
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
    case "youtube":    return "youtube";
    case "instagram":  return "instagram";
    case "vimeo":      return "vimeo";
    case "tiktok":     return "tiktok";
    case "soundcloud": return "soundcloud";
    case "mixcloud":   return "mixcloud";
    default:           return "link";
  }
}
