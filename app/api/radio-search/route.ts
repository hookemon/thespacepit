import { NextResponse } from "next/server";

// Server-side YouTube search. Caches per-query for a day.
export const revalidate = 86400;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  if (!q) return NextResponse.json({ error: "missing q" }, { status: 400 });
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return NextResponse.json({ error: "no api key" }, { status: 500 });

  const search = new URL("https://www.googleapis.com/youtube/v3/search");
  search.searchParams.set("part", "snippet");
  search.searchParams.set("q", q);
  search.searchParams.set("type", "video");
  search.searchParams.set("videoEmbeddable", "true");
  search.searchParams.set("maxResults", "1");
  search.searchParams.set("key", key);

  try {
    const res = await fetch(search.toString(), { next: { revalidate: 86400 } });
    if (!res.ok) {
      return NextResponse.json({ error: `youtube ${res.status}` }, { status: 502 });
    }
    const data = (await res.json()) as {
      items?: { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string } }[];
    };
    const first = data.items?.[0];
    if (!first?.id?.videoId) return NextResponse.json({ videoId: null });
    return NextResponse.json({
      videoId: first.id.videoId,
      title: first.snippet?.title ?? null,
      channel: first.snippet?.channelTitle ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
