/**
 * Inline article reader for a brand page. Renders the article body that was
 * scraped + stored on `brand.articleBody`, with video embeds in-context.
 *
 * Visual: faithful recreation of Ableton's own blog article — clean sans
 * body, bold for the interview questions, italic caption UNDER each video,
 * blue inline links (preserved from the original via markdown-style
 * [text](url) encoding in the source text).
 */
import { MediaEmbed } from "../../_components/shared/MediaEmbed";
import type { ArticleBodyBlock } from "../../_lib/sanity-queries";

/**
 * Render a text string with markdown-style links + emphasis.
 * Supports:
 *   [text](https://url)  → <a href="url">text</a>
 *   *italic*             → <em>italic</em>
 *   **bold**             → <strong>bold</strong>
 *
 * We only parse the three forms above — no nested constructs, no headings
 * inside paragraphs. Anything we don't recognize stays as plain text.
 */
function renderInline(text: string): React.ReactNode[] {
  if (!text) return [];
  // Tokenize: alternating segments of [text](url) | **bold** | *italic* | plain
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  const out: React.ReactNode[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) out.push(text.slice(lastIdx, m.index));
    if (m[1] && m[2]) {
      out.push(
        <a
          key={`a-${key++}`}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-collect underline decoration-1 underline-offset-2 hover:text-redline transition-colors"
        >
          {m[1]}
        </a>
      );
    } else if (m[3]) {
      out.push(<strong key={`b-${key++}`}>{m[3]}</strong>);
    } else if (m[4]) {
      out.push(<em key={`i-${key++}`}>{m[4]}</em>);
    }
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) out.push(text.slice(lastIdx));
  return out;
}

export function ArticleReader({
  brandName,
  articleTitle,
  articleUrl,
  body,
  heroImg,
  publishedNote,
}: {
  brandName: string;
  articleTitle?: string;
  articleUrl?: string;
  body: ArticleBodyBlock[];
  heroImg?: string | null;
  publishedNote?: string;
}) {
  if (!body || body.length === 0) return null;

  const host = articleUrl ? new URL(articleUrl).host.replace(/^www\./, "") : "";

  return (
    <section className="mt-16">
      {/* Magazine masthead — keep redline kicker as our spacepit voice */}
      <div className="border-t-2 border-b border-paper pb-5 pt-5 mb-10">
        <div className="font-mono text-[10px] tracking-[.24em] uppercase text-redline mb-3">
          ↓ THE ARTICLE · ORIGINALLY ON {host.toUpperCase()}
        </div>
        {articleTitle && (
          <h2
            className="font-display font-bold uppercase m-0 leading-[0.93]"
            style={{ fontSize: "clamp(40px, 6vw, 88px)", letterSpacing: "-0.02em" }}
          >
            {articleTitle}
          </h2>
        )}
        {publishedNote && (
          <div className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 mt-3">
            {publishedNote} · by {brandName.toLowerCase()}
          </div>
        )}
      </div>

      {/* Hero image */}
      {heroImg && (
        <div className="mb-10 max-w-[1080px] mx-auto">
          <div className="relative aspect-[3/2] overflow-hidden bg-ink border border-paper">
            <img
              src={heroImg}
              alt={articleTitle ?? `${brandName} article`}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Article body — clean sans-serif reader, faithful to Ableton's style. */}
      <div className="max-w-[720px] mx-auto font-sans text-paper">
        {body.map((b, i) => {
          if (b.kind === "h2") {
            // h2 in the original Ableton article is a section CTA — usually
            // a styled link like "Download Nick Hook feat. Novelist as an
            // Ableton Live Set". Render it big + blue if its text contains a
            // markdown link; otherwise as a regular subheader.
            return (
              <h3
                key={b._key ?? i}
                className="m-0 mt-10 mb-4 font-display font-bold uppercase leading-tight tracking-[-0.01em]"
                style={{ fontSize: "clamp(22px, 2.6vw, 30px)", color: "#0E4B3A" /* collect green */ }}
              >
                {renderInline(b.text ?? "")}
              </h3>
            );
          }
          if (b.kind === "h3") {
            // The article's <h3> is the interview question — Ableton
            // renders them in bold sans body weight, not a separate kicker.
            return (
              <p
                key={b._key ?? i}
                className="m-0 mt-10 mb-3 text-[18px] sm:text-[19px] leading-[1.5] font-semibold text-paper"
              >
                {renderInline(b.text ?? "")}
              </p>
            );
          }
          if (b.kind === "p") {
            return (
              <p
                key={b._key ?? i}
                className="m-0 mb-5 text-[17px] sm:text-[18px] leading-[1.65] text-paper"
              >
                {renderInline(b.text ?? "")}
              </p>
            );
          }
          if (b.kind === "video" && b.url) {
            // Video embeds break out of the reader column so they sit big.
            // Caption goes BELOW in small italic text — Ableton style.
            return (
              <div key={b._key ?? i} className="my-8 sm:-mx-[100px]">
                <MediaEmbed url={b.url} title={b.caption ?? "video"} />
                {b.caption && (
                  <div className="text-[13px] italic text-paper-2 mt-2 leading-snug">
                    {b.caption}
                  </div>
                )}
              </div>
            );
          }
          if (b.kind === "soundcloud" && b.url) {
            return (
              <div key={b._key ?? i} className="my-8">
                <iframe
                  src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(b.url)}&color=666666&show_artwork=false&show_comments=false`}
                  width="100%"
                  height={b.url.includes("playlist") ? 350 : 134}
                  scrolling="no"
                  frameBorder="0"
                  allow="autoplay"
                  className="border border-paper"
                  title="soundcloud embed"
                />
              </div>
            );
          }
          return null;
        })}

        {/* Footer citation */}
        {articleUrl && (
          <div className="mt-12 pt-6 border-t border-paper/30 flex items-center justify-between gap-4 flex-wrap">
            <span className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2">
              Posted on {publishedNote ?? ""} in Artists · Tags: HipHop
            </span>
            <a
              href={articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] tracking-[.14em] uppercase text-paper-2 hover:text-redline transition-colors no-underline"
            >
              read the original on {host} ↗
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
