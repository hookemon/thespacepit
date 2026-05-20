import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { YouTubeEmbed } from "../../_components/shared/YouTubeEmbed";
import { FOOTER_LINKS } from "../../_lib/social-links";
import { Lab909Client } from "./Lab909Client";

export const metadata = {
  title: "the 909 room · the lab · thespacepit",
  description:
    "the kick that built house. dial a real TR-909 in your browser while the chicago + detroit story plays. no plugin, no install.",
};

const REFERENCE_RECORDS: { title: string; artist: string; year: string; ytId: string; note: string }[] = [
  {
    title: "Mystery of Love",
    artist: "Mr. Fingers (Larry Heard)",
    year: "1985",
    ytId: "rXxlSlR3sLg",
    note: "the 909 kick at its most patient. that warm thud sitting under heard's deep house pads — the foundation. listen to how little else is going on.",
  },
  {
    title: "Strings of Life",
    artist: "Rhythim Is Rhythim (Derrick May)",
    year: "1987",
    ytId: "p_OBzpwIvK0",
    note: "detroit's answer. tighter kick, more attack. listen for the syncopated kick pattern that pushes the track forward — that's the detroit thing.",
  },
  {
    title: "Acid Tracks",
    artist: "Phuture",
    year: "1987",
    ytId: "Q4OY-FJtmYE",
    note: "the 909 here is just keeping time. the lesson: even when it's not the star, the machine is the floor. (the star is a 303 going feral on top.)",
  },
];

export default function Lab909Page() {
  return (
    <>
      <TopNav current="spacepit" />
      <main className="flex-1 bg-ink text-paper">
        {/* HERO */}
        <header className="relative overflow-hidden px-5 sm:px-8 pt-12 pb-8 border-b-2 border-paper">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 20% 30%, rgba(232,58,28,0.22), transparent 55%), radial-gradient(circle at 80% 80%, rgba(242,183,5,0.14), transparent 55%)",
            }}
          />
          <div className="relative">
            <Link
              href="/lessons"
              className="font-mono text-[11px] tracking-[.16em] uppercase text-lamp hover:text-redline transition-colors no-underline"
            >
              ← the lab
            </Link>
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mt-3 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-redline sp-pulse" />
              <span>ROOM 01 · TR-909 · CHICAGO + DETROIT</span>
            </div>
            <h1
              className="font-display font-bold uppercase m-0"
              style={{ fontSize: "clamp(54px, 10vw, 132px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
            >
              the kick that
              <br />
              built house
            </h1>
            <p className="font-serif italic text-[19px] mt-4 max-w-[760px] text-paper-2 leading-snug">
              roland shipped the TR-909 in 1983 and it flopped. by 1985 chicago kids were
              pulling them out of pawn shops at $50 each. by 1987 the same box was the heart
              of house music. you&apos;re about to dial in the actual voices — analog circuit
              models, not samples — and hear why this exact machine sounds like it does.
            </p>
          </div>
        </header>

        {/* THE MACHINE */}
        <section className="px-5 sm:px-8 py-8">
          <Lab909Client />
        </section>

        {/* STORY + CONTEXT */}
        <section className="px-5 sm:px-8 py-12 border-t border-paper/30 bg-ink-2">
          <div className="max-w-[860px]">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">
              THE STORY
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-5"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.01em" }}
            >
              why this machine sounds like this
            </h2>
            <div className="font-serif text-[17px] leading-[1.55] text-paper-2 space-y-4">
              <p>
                roland built the 909 trying to make a better 808 — they wanted realistic drums.
                they put real sampled cymbals on it (the hats, the crash, the ride) and modeled
                the kicks/snares/toms with analog circuits. but the analog parts were a
                <em> compromise</em>: cheaper opamp circuits, faster envelopes, brighter than the
                808. compared to a real drummer they sounded fake. compared to anything else
                that existed, they sounded like the <em>future</em>.
              </p>
              <p>
                in chicago, frankie knuckles, ron hardy, larry heard, and a generation of dj-producers
                were looking for a sound that wasn&apos;t disco. cheap 909s from failed studios let
                them program their own. the 4-on-the-floor kick became the foundation. the
                offbeat open hat became the engine. that&apos;s house music.
              </p>
              <p>
                in detroit, juan atkins, derrick may, and kevin saunderson were doing something
                related but different — same machine, more syncopation, more sci-fi, more
                kraftwerk in the dna. the same 909 became techno. one box, two cities, two
                genres, both born within a year of each other.
              </p>
              <p className="font-serif italic text-paper">
                what to do in this room: play with the kick first. tune up and down — hear it
                go from sub to tom to a high pop. then move to the open hat, lengthen its
                decay until it&apos;s holding 16th notes between the kicks. you just rebuilt the
                house music drum line from scratch.
              </p>
            </div>
          </div>
        </section>

        {/* RECORDS */}
        <section className="px-5 sm:px-8 py-12 border-t border-paper/30">
          <div className="flex justify-between items-end mb-6 border-b-2 border-paper pb-3 flex-wrap gap-4">
            <div>
              <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp">REFERENCE</div>
              <h2
                className="font-display font-bold uppercase m-0"
                style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
              >
                go listen
              </h2>
            </div>
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-paper-2 max-w-[320px]">
              three records that show the machine doing different jobs. listen with the lab
              open. try to match the drums.
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {REFERENCE_RECORDS.map((r) => (
              <div key={r.ytId} className="border border-paper bg-ink-2 p-4">
                <div className="aspect-video mb-3 bg-ink overflow-hidden border border-paper/30">
                  <YouTubeEmbed url={`https://www.youtube.com/watch?v=${r.ytId}`} title={`${r.title} — ${r.artist}`} />
                </div>
                <div className="font-mono text-[9px] tracking-[.16em] uppercase text-on-dark mb-1">{r.year}</div>
                <div className="font-display font-bold uppercase text-[20px] leading-tight">{r.title}</div>
                <div className="font-mono text-[11px] tracking-[.06em] uppercase text-paper-2 mt-0.5">
                  {r.artist}
                </div>
                <p className="font-serif italic text-[14px] text-paper-2 leading-snug mt-3">
                  {r.note}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* WHAT'S NEXT */}
        <section className="px-5 sm:px-8 py-12 border-t border-paper/30 bg-ink-2">
          <div className="max-w-[760px]">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">
              COMING TO THIS ROOM
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-4"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.01em" }}
            >
              next on the punch list
            </h2>
            <ul className="font-serif text-[16px] leading-[1.55] text-paper-2 space-y-2 list-none pl-0">
              <li>· export pattern to WAV (then to ableton .als + move kit)</li>
              <li>· per-pattern memory — save your own patterns alongside the presets</li>
              <li>· web MIDI out → trigger your move / TE rig from the browser</li>
              <li>· accent / shuffle / flam controls per voice (the real 909 had them)</li>
              <li>· lesson progression: 5 guided steps from kick → full pattern, unlocking as you go</li>
              <li>· demonstrate mode: type "phuture acid kick" → the app dials the patch and explains what it did</li>
            </ul>
            <div className="mt-6 flex gap-3 flex-wrap">
              <Link
                href="/lessons"
                className="font-display font-semibold text-[14px] tracking-[.04em] uppercase px-4 py-2.5 border-2 border-paper text-paper hover:bg-paper hover:text-ink transition-colors no-underline"
              >
                ← back to the lab
              </Link>
              <Link
                href="/packs"
                className="font-display font-semibold text-[14px] tracking-[.04em] uppercase px-4 py-2.5 border-2 border-lamp text-lamp hover:bg-lamp hover:text-ink transition-colors no-underline"
              >
                sample packs →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer
        theme="dark"
        signoff="see u in the pit"
        meta="thespacepit · the lab · 909 room"
        links={[...FOOTER_LINKS.spacepit]}
      />
    </>
  );
}
