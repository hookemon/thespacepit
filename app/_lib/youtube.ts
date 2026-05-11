export type YouTubeVideo = {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  duration: string;
  viewCount: string;
  ago: string;
  category: VideoCategory;
};

export type VideoCategory = "all" | "gear" | "live" | "radio";

const KEY = process.env.YOUTUBE_API_KEY;
const PLAYLIST = process.env.YOUTUBE_UPLOADS_PLAYLIST_ID;

const REVALIDATE_SECONDS = 3600;

const GEAR_KEYWORDS = /\b(gear|sidekick|move|op-1|op1|808|prophet|octatrack|emt|pultec|moog|ableton|teenage engineering|mpc|sp-|tr-|patch|rack|drum machine|sampler|synth|mic|reverb|distressor)\b/i;
const LIVE_KEYWORDS = /\b(live|set|festival|sónar|sonar|movement|medellín|brooklyn|jam|session|stream|streaming|stream)\b/i;
const RADIO_KEYWORDS = /\b(radio|mix|episode|podcast|the lot|nts)\b/i;

function categorize(title: string): VideoCategory {
  if (RADIO_KEYWORDS.test(title)) return "radio";
  if (LIVE_KEYWORDS.test(title)) return "live";
  if (GEAR_KEYWORDS.test(title)) return "gear";
  return "gear";
}

function formatDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h = parseInt(m[1] || "0");
  const min = parseInt(m[2] || "0");
  const s = parseInt(m[3] || "0");
  if (h > 0) return `${h}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${min}:${String(s).padStart(2, "0")}`;
}

function formatViews(n: string): string {
  const v = parseInt(n);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}m`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return String(v);
}

function ago(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

export type YouTubeChannelStats = {
  videoCount: number;
  subscriberCount: number;
  viewCount: number;
};

export async function getChannelStats(): Promise<YouTubeChannelStats | null> {
  if (!KEY) return null;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!channelId) return null;
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "statistics");
  url.searchParams.set("id", channelId);
  url.searchParams.set("key", KEY);
  const res = await fetch(url.toString(), { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) return null;
  const data = (await res.json()) as { items?: { statistics?: { videoCount?: string; subscriberCount?: string; viewCount?: string } }[] };
  const s = data.items?.[0]?.statistics;
  if (!s) return null;
  return {
    videoCount: parseInt(s.videoCount ?? "0"),
    subscriberCount: parseInt(s.subscriberCount ?? "0"),
    viewCount: parseInt(s.viewCount ?? "0"),
  };
}

export type YouTubePlaylistMeta = {
  id: string;
  title: string;
  description: string;
  itemCount: number;
};

export async function getPlaylistMeta(playlistId: string): Promise<YouTubePlaylistMeta | null> {
  if (!KEY) return null;
  const url = new URL("https://www.googleapis.com/youtube/v3/playlists");
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("id", playlistId);
  url.searchParams.set("key", KEY);
  const res = await fetch(url.toString(), { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) return null;
  const data = (await res.json()) as { items?: { id: string; snippet?: { title?: string; description?: string }; contentDetails?: { itemCount?: number } }[] };
  const p = data.items?.[0];
  if (!p) return null;
  return {
    id: p.id,
    title: p.snippet?.title ?? "",
    description: p.snippet?.description ?? "",
    itemCount: p.contentDetails?.itemCount ?? 0,
  };
}

export async function getVideosFromPlaylist(playlistId: string, limit = 50): Promise<YouTubeVideo[]> {
  if (!KEY) return [];
  return fetchPlaylistVideos(playlistId, limit);
}

async function fetchPlaylistVideos(playlistId: string, limit: number): Promise<YouTubeVideo[]> {
  const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  playlistUrl.searchParams.set("part", "snippet,contentDetails");
  playlistUrl.searchParams.set("playlistId", playlistId);
  playlistUrl.searchParams.set("maxResults", String(Math.min(limit, 50)));
  playlistUrl.searchParams.set("key", KEY!);

  const playlistRes = await fetch(playlistUrl.toString(), { next: { revalidate: REVALIDATE_SECONDS } });
  if (!playlistRes.ok) {
    console.error("YouTube playlistItems fetch failed:", playlistRes.status);
    return [];
  }
  const playlistData = await playlistRes.json();
  type PlaylistItem = {
    snippet: { title: string; publishedAt: string; thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } } };
    contentDetails: { videoId: string };
  };
  const items: PlaylistItem[] = playlistData.items ?? [];
  if (items.length === 0) return [];
  const ids = items.map((i) => i.contentDetails.videoId).join(",");

  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("part", "contentDetails,statistics");
  videosUrl.searchParams.set("id", ids);
  videosUrl.searchParams.set("key", KEY!);

  const videosRes = await fetch(videosUrl.toString(), { next: { revalidate: REVALIDATE_SECONDS } });
  if (!videosRes.ok) {
    console.error("YouTube videos fetch failed:", videosRes.status);
    return [];
  }
  const videosData = await videosRes.json();
  type VideoDetail = { id: string; contentDetails: { duration: string }; statistics: { viewCount?: string } };
  const detailsById: Record<string, VideoDetail> = {};
  for (const v of (videosData.items as VideoDetail[]) ?? []) {
    detailsById[v.id] = v;
  }

  return items.map((it) => {
    const id = it.contentDetails.videoId;
    const title = it.snippet.title;
    const publishedAt = it.snippet.publishedAt;
    const thumb =
      it.snippet.thumbnails.high?.url ??
      it.snippet.thumbnails.medium?.url ??
      it.snippet.thumbnails.default?.url ??
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    const detail = detailsById[id];
    return {
      id,
      title,
      publishedAt,
      thumbnail: thumb,
      duration: detail ? formatDuration(detail.contentDetails.duration) : "",
      viewCount: detail?.statistics.viewCount ? formatViews(detail.statistics.viewCount) : "—",
      ago: ago(publishedAt),
      category: categorize(title),
    };
  });
}

export async function getLatestVideos(limit = 12): Promise<YouTubeVideo[]> {
  if (!KEY || !PLAYLIST) {
    console.warn("YOUTUBE_API_KEY or YOUTUBE_UPLOADS_PLAYLIST_ID not set; returning empty list");
    return [];
  }

  const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  playlistUrl.searchParams.set("part", "snippet,contentDetails");
  playlistUrl.searchParams.set("playlistId", PLAYLIST);
  playlistUrl.searchParams.set("maxResults", String(limit));
  playlistUrl.searchParams.set("key", KEY);

  const playlistRes = await fetch(playlistUrl.toString(), {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!playlistRes.ok) {
    console.error("YouTube playlistItems fetch failed:", playlistRes.status, await playlistRes.text());
    return [];
  }
  const playlistData = await playlistRes.json();
  type PlaylistItem = {
    snippet: { title: string; publishedAt: string; thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } } };
    contentDetails: { videoId: string };
  };
  const items: PlaylistItem[] = playlistData.items ?? [];
  const ids = items.map((i) => i.contentDetails.videoId).join(",");

  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("part", "contentDetails,statistics");
  videosUrl.searchParams.set("id", ids);
  videosUrl.searchParams.set("key", KEY);

  const videosRes = await fetch(videosUrl.toString(), {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!videosRes.ok) {
    console.error("YouTube videos fetch failed:", videosRes.status, await videosRes.text());
    return [];
  }
  const videosData = await videosRes.json();
  type VideoDetail = { id: string; contentDetails: { duration: string }; statistics: { viewCount?: string } };
  const detailsById: Record<string, VideoDetail> = {};
  for (const v of (videosData.items as VideoDetail[]) ?? []) {
    detailsById[v.id] = v;
  }

  return items.map((it) => {
    const id = it.contentDetails.videoId;
    const title = it.snippet.title;
    const publishedAt = it.snippet.publishedAt;
    const thumb =
      it.snippet.thumbnails.high?.url ??
      it.snippet.thumbnails.medium?.url ??
      it.snippet.thumbnails.default?.url ??
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    const detail = detailsById[id];
    return {
      id,
      title,
      publishedAt,
      thumbnail: thumb,
      duration: detail ? formatDuration(detail.contentDetails.duration) : "",
      viewCount: detail?.statistics.viewCount ? formatViews(detail.statistics.viewCount) : "—",
      ago: ago(publishedAt),
      category: categorize(title),
    };
  });
}
