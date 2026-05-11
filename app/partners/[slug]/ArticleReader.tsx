/**
 * Inline article reader for a brand page. Renders the article body that was
 * scraped + stored on `brand.articleBody`, with video embeds in-context
 * (instead of just a link out to the original).
 *
 * Visual: long-form magazine reader. Big serif body type, ALL CAPS mono
 * questions/headings in redline accent, videos break the column at full width.
 * Sits inside a max-w-[760px] reader column with the embeds escaping to
 * max-w-[1080px] for that "article on the brand's own site" feeling.
 */
import { MediaEmbed } from "../../_components/shared/MediaEmbed";
import type { ArticleBodyBlock } from "../../_lib/sanity-queries";

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
      {/* Magazine masthead */}
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

      {/* Article body — reader column. Videos escape to wider max width. */}
      <div className="max-w-[760px] mx-auto">
        {body.map((b, i) => {
          if (b.kind === "h2") {
            return (
              <h3
                key={b._key ?? i}
                className="font-display font-bold uppercase m-0 mt-10 mb-4"
                style={{ fontSize: "clamp(24px, 2.6vw, 32px)", lineHeight: 1.05, letterSpacing: "-0.015em" }}
              >
                {b.text}
              </h3>
            );
          }
          if (b.kind === "h3") {
            // The article uses <h3> for Q&A questions — render them in
            // redline mono caps like an interview transcript.
            return (
              <h4
                key={b._key ?? i}
                className="font-mono text-[13px] tracking-[.04em] uppercase text-redline m-0 mt-10 mb-3 leading-snug"
              >
                Q · {b.text}
              </h4>
            );
          }
          if (b.kind === "p") {
            return (
              <p
                key={b._key ?? i}
                className="font-serif text-[18px] sm:text-[19px] leading-[1.6] text-paper m-0 mb-5"
              >
                {b.text}
              </p>
            );
          }
          if (b.kind === "video" && b.url) {
            // Video embeds break out of the reader column so they sit big.
            return (
              <div key={b._key ?? i} className="my-8 -mx-2 sm:-mx-[140px]">
                <MediaEmbed url={b.url} title={b.caption ?? "video"} />
                {b.caption && (
                  <div className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 mt-2 text-center">
                    ▶ {b.caption}
                  </div>
                )}
              </div>
            );
          }
          if (b.kind === "soundcloud" && b.url) {
            // SoundCloud uses its own iframe; pass through. Aspect ratio
            // forced to ~8:1 since SC players are short.
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
          <div className="mt-10 pt-6 border-t border-paper/30">
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
