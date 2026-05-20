import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { YouTubeEmbed } from "../../_components/shared/YouTubeEmbed";
import { FOOTER_LINKS } from "../../_lib/social-links";
import { LabSP1200Client } from "./LabSP1200Client";

export const metadata = {
  title: "the sp-1200 room · the lab · thespacepit",
  description:
    "12-bit 26kHz crunch. drop your own samples, pitch them up to fit, sequence the beat. the machine premier, large pro, rza and pete rock all sat at — in your browser.",
};

const REFERENCE_RECORDS = [
  {
    title: "Mecca and the Soul Brother",
    artist: "Pete Rock & CL Smooth",
    year: "1992",
    ytId: "Q1F0jejnRzM",
    note: "the textbook. pete rock + an SP. listen for how each drum hit has its own little crunch around the edges — that's 12-bit talking. open up the kit page on Wikipedia later if you want the literal sample sources.",
  },
  {
    title: "Daily Operation",
    artist: "Gang Starr",
    year: "1992",
    ytId: "tQwxYNd6kkk",
    note: "premier's whole production style for two decades sat in this box. the boom-bap snare is doing things no other machine made sound exactly like.",
  },
  {
    title: "The Infamous",
    artist: "Mobb Deep",
    year: "1995",
    ytId: "5OoBKvujfTI",
    note: "havoc on the SP. the grimiest possible use of this machine. queens, basement, eternal.",
  },
];

export default function LabSP1200Page() {
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
                "radial-gradient(circle at 18% 25%, rgba(122,251,13,0.16), transparent 55%), radial-gradient(circle at 80% 80%, rgba(232,58,28,0.12), transparent 55%)",
            }}
          />
          <div className="relative">
            <Link
              href="/lab"
              className="font-mono text-[11px] tracking-[.16em] uppercase text-lamp hover:text-redline transition-colors no-underline"
            >
              ← the lab
            </Link>
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-slime mt-3 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slime sp-pulse" />
              <span>ROOM 03 · SP-1200 · NYC GOLDEN ERA</span>
            </div>
            <h1
              className="font-display font-bold uppercase m-0"
              style={{ fontSize: "clamp(54px, 10vw, 132px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
            >
              the grit of
              <br />
              the golden era
            </h1>
            <p className="font-serif italic text-[19px] mt-4 max-w-[760px] text-paper-2 leading-snug">
              12-bit, 26.04 kHz, 10 seconds of memory. so producers pitched
              everything up — fitting a 20-second sample by playing it at 2× speed,
              then chopping it back down to size. that constraint became a sound,
              and the sound became new york in 1992. drop your own WAVs on a pad,
              pitch them up, sequence the result.
            </p>
          </div>
        </header>

        {/* THE MACHINE */}
        <section className="px-5 sm:px-8 py-8">
          <LabSP1200Client />
        </section>

        {/* STORY */}
        <section className="px-5 sm:px-8 py-12 border-t border-paper/30 bg-ink-2">
          <div className="max-w-[860px]">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-slime mb-2">
              THE STORY
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-5"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.01em" }}
            >
              why the constraint became the sound
            </h2>
            <div className="font-serif text-[17px] leading-[1.55] text-paper-2 space-y-4">
              <p>
                E-mu shipped the SP-1200 in 1987 as a workhorse sampler-sequencer
                aimed at hip-hop. 12 bits of dynamic range, 26.04 kHz sample rate,
                ten seconds of memory total. by mid-90s standards it was already
                obsolete on paper — but in queens, brooklyn, and the bronx, producers
                figured out that those exact limits sounded like nothing else.
              </p>
              <p>
                pitch the sample up to make it fit, and the 26 kHz lowpass smears
                the high end into a warm, dusty wash. the 12-bit converter adds a
                quantization noise floor that sits behind everything you do. every
                kick has a little crunch around the transient. every snare hits with
                an inexplicable weight that doesn&apos;t exist on a 24-bit
                interface.
              </p>
              <p>
                premier built two decades of production out of this box. pete rock,
                large pro, rza, havoc, q-tip, the entire golden era — all sat at an
                SP at some point. the machine itself sold for $2,700 in 1987; the
                used ones sell for ten times that now.
              </p>
              <p className="font-serif italic text-paper">
                what to do in this room: hit a pad — you&apos;ll hear the starter
                kit (rendered from the 909 voices next door, so they sound similar
                but immediately crunchier). drop one of your own WAVs onto an empty
                pad and trigger it. then crank the pitch up by 12 semitones and
                hear how a vocal becomes a chipmunk hi-hat. that&apos;s the move.
              </p>
            </div>
          </div>
        </section>

        {/* RECORDS */}
        <section className="px-5 sm:px-8 py-12 border-t border-paper/30">
          <div className="flex justify-between items-end mb-6 border-b-2 border-paper pb-3 flex-wrap gap-4">
            <div>
              <div className="font-mono text-[11px] tracking-[.14em] uppercase text-slime">REFERENCE</div>
              <h2
                className="font-display font-bold uppercase m-0"
                style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
              >
                go listen
              </h2>
            </div>
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-paper-2 max-w-[320px]">
              three records that show three different uses of the same machine.
              listen for the crunch behind every drum.
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
                <div className="font-mono text-[11px] tracking-[.06em] uppercase text-paper-2 mt-0.5">{r.artist}</div>
                <p className="font-serif italic text-[14px] text-paper-2 leading-snug mt-3">{r.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WHAT'S NEXT */}
        <section className="px-5 sm:px-8 py-12 border-t border-paper/30 bg-ink-2">
          <div className="max-w-[760px]">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-slime mb-2">COMING TO THIS ROOM</div>
            <h2
              className="font-display font-bold uppercase m-0 mb-4"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.01em" }}
            >
              next on the punch list
            </h2>
            <ul className="font-serif text-[16px] leading-[1.55] text-paper-2 space-y-2 list-none pl-0">
              <li>· pull samples directly from the spacepit sample bank (no drag-drop needed)</li>
              <li>· chop mode — drop a long sample, the room slices it into 8 evenly-timed pieces</li>
              <li>· per-pad mini envelope (attack + hold + release, the actual SP shape)</li>
              <li>· export to WAV / stems / kit (same buttons as the 909)</li>
              <li>· "dial in pete rock" lesson — chop a sample, build a pattern</li>
              <li>· MIDI in for triggering pads from external pad controllers</li>
            </ul>
            <div className="mt-6 flex gap-3 flex-wrap">
              <Link
                href="/lab"
                className="font-display font-semibold text-[14px] tracking-[.04em] uppercase px-4 py-2.5 border-2 border-paper text-paper hover:bg-paper hover:text-ink transition-colors no-underline"
              >
                ← back to the lab
              </Link>
              <Link
                href="/lab/909"
                className="font-display font-semibold text-[14px] tracking-[.04em] uppercase px-4 py-2.5 border-2 border-lamp text-lamp hover:bg-lamp hover:text-ink transition-colors no-underline"
              >
                the 909 room →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer
        theme="dark"
        signoff="see u in the pit"
        meta="thespacepit · the lab · sp-1200 room"
        links={[...FOOTER_LINKS.spacepit]}
      />
    </>
  );
}
