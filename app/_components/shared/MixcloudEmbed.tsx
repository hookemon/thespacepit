/**
 * Renders a Mixcloud player. Pass the full mixcloud URL — we extract the
 * /username/show-slug/ feed path and stuff it into their iframe widget.
 */
function extractFeed(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/mixcloud\.com$/.test(u.hostname)) return null;
    // path is like /nickhook/some-mix/   (must keep leading and trailing slash)
    const path = u.pathname.endsWith("/") ? u.pathname : `${u.pathname}/`;
    return path;
  } catch {
    return null;
  }
}

type Props = {
  url: string;
  title?: string;
  size?: "tall" | "slim";
};

export function MixcloudEmbed({ url, title, size = "tall" }: Props) {
  const feed = extractFeed(url);
  if (!feed) return null;
  const tall = size === "tall";
  const params = new URLSearchParams({
    feed,
    ...(tall ? {} : { hide_cover: "1" }),
  });
  const src = `https://www.mixcloud.com/widget/iframe/?${params.toString()}`;
  const height = tall ? 400 : 60;
  return (
    <iframe
      src={src}
      title={title ?? "Mixcloud player"}
      width="100%"
      height={height}
      frameBorder="0"
      allow="autoplay"
      style={{ border: 0 }}
    />
  );
}
