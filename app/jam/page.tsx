import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { StemPlayer } from "../_components/shared/StemPlayer";
import { PadGrid } from "../_components/shared/PadGrid";
import { sanityFetch } from "../_lib/sanity";
import { groq } from "next-sanity";
import { urlFor } from "../_lib/sanity";
import { FOOTER_LINKS } from "../_lib/social-links";
import type { Stem, Pad, SanityImage } from "../_lib/sanity-queries";

export const metadata = {
  title: "the jam · thespacepit",
  description: "stems + pads. press play, mute, solo, layer. the live remix room.",
};

type JamRelease = {
  _id: string;
  title: string;
  slug: string;
  cover?: SanityImage;
  coverColor?: string;
  stemCount: number;
  padCount: number;
  stemsTrackTitle?: string;
};

type FeaturedJam = JamRelease & {
  stems: Stem[];
  oneshots: Pad[];
  artistText?: string;
};

// Pull every release that has stems and/or oneshots populated. The most
// recently dated one becomes the featured jam at the top; the rest go into
// a secondary grid the visitor can tap into.
async function getJams() {
  const list = await sanityFetch<JamRelease[]>(groq`
    *[_type == "release" && (withdrawn != true)
      && (count(stems) > 0 || count(oneshots) > 0)
    ] | order(releaseDate desc, year desc) {
      _id, title, "slug": slug.current, cover, coverColor,
      "stemCount": count(stems), "padCount": count(oneshots),
      stemsTrackTitle
    }
  `);
  if (list.length === 0) return { featured: null as FeaturedJam | null, others: [] as JamRelease[] };

  const featuredId = list[0]._id;
  const featured = await sanityFetch<FeaturedJam | null>(groq`
    *[_id == $id][0]{
      _id, title, "slug": slug.current, cover, coverColor,
      stemsTrackTitle,
      "stemCount": count(stems), "padCount": count(oneshots),
      "stems": stems[]{ label, color, muteByDefault, "audioUrl": audio.asset->url },
      "oneshots": oneshots[]{ label, color, "audioUrl": audio.asset->url },
      "artistText": array::join(artists[]->name, " · ")
    }
  `, { id: featuredId });

  return { featured, others: list.slice(1) };
}

export default async function JamPage() {
  const { featured, others } = await getJams();
  const isEmpty = !featured;

  return (
    <>
      <TopNav current="spacepit" />
      <main className="flex-1 bg-ink text-paper">
        {/* HERO STRIP */}
        <header className="relative overflow-hidden px-8 pt-16 pb-10 border-b-2 border-paper">
          <img
            src="/epk/spacepit-3-0.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "50% 35%" }}
          />
          <div aria-hidden className="absolute inset-0 bg-ink/72" />
          <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,11,11,0.15) 0%, rgba(11,11,11,0.6) 100%)" }} />
          <div className="relative">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-redline sp-pulse" />
              <span>THESPACEPIT · LIVE REMIX ROOM</span>
            </div>
            <h1
              className="font-display font-bold uppercase m-0"
              style={{ fontSize: "clamp(56px, 11vw, 160px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
            >
              the jam
            </h1>
            <p className="font-serif italic text-[20px] mt-4 max-w-[680px] text-paper-2 leading-snug">
              {isEmpty
                ? "stems + pads, in your browser. press play to sync the stems, then tap the pads to layer one-shots on top. nothing loaded yet — drop audio onto a release in /studio and this room comes alive."
                : "stems + pads, in your browser. press play to sync the stems, then tap the pads (or use your keys) to layer one-shots on top."}
            </p>
          </div>
        </header>

        {/* FEATURED JAM (or empty state) */}
        {isEmpty ? (
          <section className="px-8 py-20">
            <div className="max-w-[760px] border border-paper/40 p-10 bg-ink-2">
              <div className="font-mono text-[11px] tracking-[.16em] uppercase text-on-dark mb-3">EMPTY ROOM · 0 STEM PACKS LOADED</div>
              <div
                className="font-display font-bold uppercase leading-tight"
                style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.01em" }}
              >
                no jam loaded yet
              </div>
              <p className="font-serif italic text-[18px] text-paper-2 mt-4 leading-snug">
                the room exists. the player is wired. it just needs source material. open <span className="font-mono text-[15px]">/studio</span>, pick a release, drop audio files into its <span className="font-mono text-[15px]">stems</span> array (vocal · drums · bass · keys), and optionally fill the <span className="font-mono text-[15px]">oneshots</span> rack — the moment a release has stems, it becomes the jam.
              </p>
              <div className="flex gap-3 mt-7 flex-wrap">
                <Link
                  href="/studio"
                  className="font-display font-semibold text-[15px] tracking-[.04em] uppercase px-5 py-3 border border-paper bg-redline text-paper hover:bg-paper hover:text-ink transition-colors no-underline"
                >
                  open /studio →
                </Link>
                <Link
                  href="/releases"
                  className="font-display font-semibold text-[15px] tracking-[.04em] uppercase px-5 py-3 border border-paper bg-transparent text-paper hover:bg-paper hover:text-ink transition-colors no-underline"
                >
                  browse the catalogue
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="px-8 py-12">
            <div className="flex justify-between items-end mb-6 border-b-2 border-paper pb-3 flex-wrap gap-4">
              <div>
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline">FEATURED JAM</div>
                <h2
                  className="font-display font-bold uppercase m-0"
                  style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
                >
                  {featured.stemsTrackTitle ?? featured.title}
                </h2>
                {featured.artistText && (
                  <div className="font-mono text-[11px] tracking-[.12em] uppercase text-on-dark mt-1">{featured.artistText}</div>
                )}
              </div>
              <Link
                href={`/releases/${featured.slug}`}
                className="font-mono text-[11px] tracking-[.16em] uppercase text-paper-2 hover:text-redline transition-colors no-underline"
              >
                see the release →
              </Link>
            </div>

            {(featured.stems?.length ?? 0) > 0 && (
              <div className="mb-12">
                <StemPlayer stems={featured.stems!} trackTitle={featured.stemsTrackTitle ?? featured.title} />
              </div>
            )}
            {(featured.oneshots?.length ?? 0) > 0 && <PadGrid pads={featured.oneshots!} />}
          </section>
        )}

        {/* OTHER JAMS */}
        {others.length > 0 && (
          <section className="px-8 py-12 border-t border-paper/30">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">OTHER JAMS</div>
            <h3
              className="font-display font-bold uppercase m-0 mb-7"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.01em" }}
            >
              swap the room
            </h3>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {others.map((j) => {
                const cover = j.cover ? urlFor(j.cover).width(440).height(440).fit("crop").url() : null;
                return (
                  <Link
                    key={j._id}
                    href={`/releases/${j.slug}`}
                    className="group bg-ink border border-paper p-3.5 transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#E83A1C] no-underline text-paper"
                  >
                    <div
                      className="aspect-square border border-paper mb-3 flex items-center justify-center relative overflow-hidden"
                      style={{ background: j.coverColor ?? "#1C1A17" }}
                    >
                      {cover ? (
                        <img src={cover} alt={j.title} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <span className="font-display font-bold text-[20px] uppercase text-center px-3" style={{ transform: "rotate(-3deg)" }}>{j.title}</span>
                      )}
                    </div>
                    <div className="font-display font-bold text-[18px] uppercase tracking-[-0.005em] leading-tight">{j.title}</div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {j.stemCount > 0 && <span className="font-mono text-[10px] tracking-[.08em] uppercase border border-paper rounded-full px-2 py-0.5">{j.stemCount} stems</span>}
                      {j.padCount > 0 && <span className="font-mono text-[10px] tracking-[.08em] uppercase border border-paper rounded-full px-2 py-0.5">{j.padCount} pads</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
      <Footer
        theme="dark"
        signoff="see u in the pit 🌱"
        meta="thespacepit · the jam room"
        links={[...FOOTER_LINKS.spacepit]}
      />
    </>
  );
}
