/**
 * /collabs — the index. A door per collab world. Each subworld (RTJ, MWC,
 * Cubic Zirconia, Gangsta Boo) already has its own deep page; this index
 * exists so /collabs isn't a 404. It also surfaces the network at a glance.
 *
 * Auto-extends: drop a new folder in app/collabs/<slug>/ with a page.tsx and
 * add it to the COLLABS array below. No Sanity coupling — these are
 * editorial subworlds Nick has hand-built, not data-driven.
 */
import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { FOOTER_LINKS } from "../_lib/social-links";

export const metadata = {
  title: "collabs — nick hook",
  description:
    "the deep collab worlds. RTJ. Men Women + Children. Cubic Zirconia. Gangsta Boo. Each one's a full chapter.",
};

const COLLABS: {
  slug: string;
  title: string;
  subtitle: string;
  years: string;
  blurb: string;
  accent: string;     // hex
  blockColor: string; // text color when on the accent
}[] = [
  {
    slug: "run-the-jewels",
    title: "Run The Jewels",
    subtitle: "El-P · Killer Mike · Nick Hook (engineer)",
    years: "2013 → today",
    blurb: "Every record, every show, every video. 4 LPs, the Cu4tro Mexico cumbia rework, a documentary, world tours.",
    accent: "#E83A1C",
    blockColor: "#F4EFE6",
  },
  {
    slug: "men-women-children",
    title: "Men Women & Children",
    subtitle: "Reprise / Warner — Nick's first band",
    years: "2004 → 2008",
    blurb: "20-year anniversary in 2026. The whole press archive, the videos, the tour history — already documented.",
    accent: "#F2B705",
    blockColor: "#0B0B0B",
  },
  {
    slug: "cubic-zirconia",
    title: "Cubic Zirconia",
    subtitle: "Tiombe Lockhart × Nick Hook · Brooklyn",
    years: "2009 → 2012",
    blurb: "9 releases (FUCK WORK → Darko), 34 documented shows, club circuit. Sub-imprint with Lockhart Dynasty.",
    accent: "#4B2E83",
    blockColor: "#F2C84B",
  },
  {
    slug: "gangsta-boo",
    title: "Gangsta Boo",
    subtitle: "Three 6 → Brooklyn — sessions, drops, the August single",
    years: "2010s → 2026",
    blurb: "The whole Boo run — radio drops, unreleased takes, the Qoqeca remix dropping August 2026.",
    accent: "#FF6FB5",
    blockColor: "#0B0B0B",
  },
];

export default function CollabsIndex() {
  return (
    <>
      <TopNav current="nick" />
      <main className="flex-1 bg-ink text-paper">
        <header className="px-5 sm:px-8 pt-16 pb-10 border-b-2 border-paper">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase text-redline mb-2">
            THE WHOLE NETWORK · LONG-FORM CHAPTERS
          </div>
          <h1
            className="font-display font-bold uppercase m-0 text-paper"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            collabs
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[680px] text-paper-2">
            the deep worlds. each one a chapter — its own page with every record, every show, every video,
            every press piece. drop in.
          </p>
        </header>

        <section className="px-5 sm:px-8 py-14">
          <div
            className="grid gap-6 md:gap-8"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))" }}
          >
            {COLLABS.map((c) => (
              <Link
                key={c.slug}
                href={`/collabs/${c.slug}`}
                className="group block no-underline text-paper border-2 border-paper relative overflow-hidden transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px]"
                style={{
                  background: c.accent,
                  color: c.blockColor,
                  minHeight: 320,
                  boxShadow: "0 0 0 transparent",
                }}
              >
                <div
                  className="absolute inset-0 transition-shadow duration-150 group-hover:[box-shadow:6px_6px_0_var(--color-paper)]"
                  aria-hidden
                />
                <div className="relative p-7 flex flex-col h-full justify-between" style={{ minHeight: 320 }}>
                  <div>
                    <div
                      className="font-mono text-[10px] tracking-[.18em] uppercase mb-2"
                      style={{ opacity: 0.7 }}
                    >
                      {c.years}
                    </div>
                    <div
                      className="font-display font-bold uppercase leading-[0.95]"
                      style={{
                        fontSize: "clamp(36px, 5vw, 64px)",
                        letterSpacing: "-0.015em",
                        color: c.blockColor,
                      }}
                    >
                      {c.title}
                    </div>
                    <div
                      className="font-mono text-[12px] tracking-[.1em] uppercase mt-2"
                      style={{ opacity: 0.85 }}
                    >
                      {c.subtitle}
                    </div>
                  </div>
                  <div className="font-serif italic text-[15px] mt-4 leading-snug" style={{ opacity: 0.95 }}>
                    {c.blurb}
                  </div>
                  <div
                    className="font-mono text-[10px] tracking-[.18em] uppercase mt-5 inline-flex items-center gap-2 group-hover:underline underline-offset-4"
                  >
                    enter the world →
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <p className="font-serif italic text-[15px] text-paper-2 mt-12 max-w-[640px]">
            more chapters coming — Boys Noize · Drop The Lime · Spiritual Friendship · SPORTS · the Trouble & Bass run.
            email <a href="mailto:coleman@smooth-loop.com" className="text-paper underline">coleman@smooth-loop.com</a> if you want first look.
          </p>
        </section>
      </main>
      <Footer
        theme="dark"
        signoff="see u in the pit 🌱"
        meta="booking · coleman@smooth-loop.com"
        links={[...FOOTER_LINKS.nick]}
      />
    </>
  );
}
