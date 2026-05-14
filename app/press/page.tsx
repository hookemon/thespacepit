import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getAllPress } from "../_lib/sanity-queries";
import { urlFor } from "../_lib/sanity";
import { FOOTER_LINKS } from "../_lib/social-links";
import { PressClient } from "./PressClient";

export const revalidate = 300;

export const metadata = {
  title: "press — nick hook",
  description:
    "every review, interview, feature, profile, and mention — from men women & children to today. filterable by era + publication.",
};

export default async function PressPage() {
  const all = await getAllPress();

  // Prepare card-ready data (URL-resolved image, normalized year for sort).
  // Image precedence: scraped article og:image > linked release cover art >
  // null (tile falls back to a colored title-block). The cover-fallback is
  // why so many pre-scrape press tiles light up immediately — every release-
  // attached piece (Pitchfork review of Relationships, etc.) shows the album
  // square instead of an empty card.
  const items = all.map((p) => {
    const year = p.date ? parseInt(p.date.slice(0, 4), 10) : p.year;
    const articleImageUrl = p.image
      ? urlFor(p.image).width(640).height(480).fit("crop").url()
      : null;
    const coverImageUrl = p.release?.cover
      ? urlFor(p.release.cover).width(640).height(640).fit("crop").url()
      : null;
    const imageUrl = articleImageUrl ?? coverImageUrl;
    const imageKind: "article" | "cover" | null =
      articleImageUrl ? "article" : (coverImageUrl ? "cover" : null);
    // Build a clean display source: prefer outlet + author, fall back to legacy `source`.
    const outletDisplay = p.outlet
      ? (p.author ? `${p.author} · ${p.outlet}` : p.outlet)
      : p.source;
    return {
      _id: p._id,
      kind: p.kind ?? "mention",
      headline: p.headline,
      quote: p.quote,
      excerpt: p.excerpt,
      outletDisplay,
      outlet: p.outlet ?? p.source,
      url: p.url,
      year,
      date: p.date,
      imageUrl,
      imageKind,
      coverColor: p.release?.coverColor,
      eraSlug: p.era?.slug,
      eraName: p.era?.name,
      releaseSlug: p.release?.slug,
      releaseTitle: p.release?.title,
      featured: p.featured === true,
    };
  });

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="nick" />
      <main className="flex-1">
        <header className="px-5 sm:px-8 pt-16 pb-8 border-b-2 border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">
            EVERY REVIEW · INTERVIEW · FEATURE · MENTION
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            press
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[760px] text-paper-2">
            {items.length === 0
              ? "no press yet — paste links to the press script and they'll appear here."
              : "from men women & children to today. every piece, in order. filterable by era + kind."}
          </p>
          {items.length === 0 && (
            <Link
              href="/nick-hook#press"
              className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 hover:text-redline mt-3 inline-block no-underline"
            >
              the homepage press wall is still live →
            </Link>
          )}
        </header>

        {items.length > 0 && <PressClient items={items} />}
      </main>
      <Footer
        theme="dark"
        signoff="see u in the pit 🌱"
        meta="booking · coleman@smooth-loop.com"
        links={[...FOOTER_LINKS.nick]}
      />
    </div>
  );
}
