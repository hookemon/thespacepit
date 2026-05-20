import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { YouTubeEmbed } from "../../_components/shared/YouTubeEmbed";
import { FOOTER_LINKS } from "../../_lib/social-links";
import { LabMoogClient } from "./LabMoogClient";

export const metadata = {
  title: "the moog room · the lab · thespacepit",
  description:
    "the bass that bernie built. subtractive synthesis in your browser — flash light, stevie, cabaret voltaire. dial the cutoff and hear an entire decade rebuild itself.",
};

const REFERENCE_RECORDS = [
  {
    title: "Flash Light",
    artist: "Parliament",
    year: "1977",
    ytId: "1f-OAegJF-A",
    note: "the moog bassline that retired all the other bassists. bernie worrell played a square + sub through a fast filter envelope. you can hear the cutoff opening every single note. listen with the patch loaded — that's why it's the default.",
  },
  {
    title: "I Wish",
    artist: "Stevie Wonder",
    year: "1976",
    ytId: "FmJSpQdz7TY",
    note: "stevie's clavinet is upstairs; the synth bass under it is downstairs. tight envelope, square wave. once you hear the difference between the clav and the synth you can't unhear it. (the synth is the one with the perfectly clean attack — no hammer.)",
  },
  {
    title: "Red Mecca",
    artist: "Cabaret Voltaire",
    year: "1981",
    ytId: "vKbX5Z6P-V0",
    note: "sheffield industrial. same architecture as worrell's bass — saw + lowpass — used for an entirely different purpose. slow attack, long sustain, filter sweeping. the cabaret-drone preset is wired for this.",
  },
];

export default function LabMoogPage() {
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
                "radial-gradient(circle at 18% 35%, rgba(242,183,5,0.18), transparent 55%), radial-gradient(circle at 80% 80%, rgba(232,58,28,0.12), transparent 55%)",
            }}
          />
          <div className="relative">
            <Link
              href="/lessons"
              className="font-mono text-[11px] tracking-[.16em] uppercase text-lamp hover:text-redline transition-colors no-underline"
            >
              ← the lab
            </Link>
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mt-3 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lamp sp-pulse" />
              <span>ROOM 02 · MOOG · DETROIT + SHEFFIELD</span>
            </div>
            <h1
              className="font-display font-bold uppercase m-0"
              style={{ fontSize: "clamp(54px, 10vw, 132px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
            >
              the bass that
              <br />
              bernie built
            </h1>
            <p className="font-serif italic text-[19px] mt-4 max-w-[760px] text-paper-2 leading-snug">
              one oscillator. one filter. one envelope. that&apos;s it — and it&apos;s the entire
              vocabulary of P-funk leads, stevie wonder textures, and the sheffield industrial
              tradition that came after. you&apos;re about to dial in a subtractive synth voice
              the same way bernie worrell did on flash light, then hear it.
            </p>
          </div>
        </header>

        {/* THE MACHINE */}
        <section className="px-5 sm:px-8 py-8">
          <LabMoogClient />
        </section>

        {/* STORY */}
        <section className="px-5 sm:px-8 py-12 border-t border-paper/30 bg-ink-2">
          <div className="max-w-[860px]">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">
              THE STORY
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-5"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.01em" }}
            >
              why subtractive is the foundation
            </h2>
            <div className="font-serif text-[17px] leading-[1.55] text-paper-2 space-y-4">
              <p>
                bob moog built the first commercial synthesizer in 1964 around an idea that was
                already old in the analog studios: take a harmonically-rich oscillator, then
                <em> remove</em> the harmonics you don&apos;t want. the moog ladder filter — four
                stages of opamp lowpass with feedback — was the killer feature. it sounded warm,
                it self-oscillated at high resonance, and it could be modulated.
              </p>
              <p>
                bernie worrell met one in the early 70s. as the keys player for parliament-
                funkadelic, he turned the moog bass into an instrument unto itself — not playing
                like a bassist with a keyboard, playing like a moog. <em>flash light</em> (1977) is
                the bass line that retired everyone else: tight square + sub, fast filter
                envelope, no glide, all funk.
              </p>
              <p>
                stevie wonder had moogs in his rig from <em>music of my mind</em> (1972) onward.
                the &quot;songs in the key of life&quot; era is dense with subtractive textures
                that aren&apos;t solos — they&apos;re *roles*. stevie&apos;s synths sit in the
                arrangement like horns or like backing vocals.
              </p>
              <p>
                across the atlantic, sheffield was busy figuring out the opposite use: not warm
                funk, but cold industrial. cabaret voltaire, the human league, early heaven 17 —
                same circuits, completely different intent. that lineage runs straight into early
                detroit techno (juan atkins owned a minimoog) and back through bristol trip-hop.
              </p>
              <p className="font-serif italic text-paper">
                what to do in this room: load flash-light bass, hold a note, and stab the
                envelope amount. then drop the cutoff. then push resonance past 70 and hear the
                filter start to sing. then load cabaret-drone, hold the same note, and feel how
                the same circuit becomes a completely different instrument.
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
              three records that show subtractive in three completely different jobs. listen with
              the room open. play along.
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
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">COMING TO THIS ROOM</div>
            <h2
              className="font-display font-bold uppercase m-0 mb-4"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.01em" }}
            >
              next on the punch list
            </h2>
            <ul className="font-serif text-[16px] leading-[1.55] text-paper-2 space-y-2 list-none pl-0">
              <li>· 2nd + 3rd oscillator (true minimoog stacking)</li>
              <li>· LFO with destination matrix (cutoff / pitch / amp)</li>
              <li>· true 4-pole ladder filter via AudioWorklet (we&apos;re cascading biquads for v0)</li>
              <li>· pattern record + MIDI export, plus play-with-the-909 mode</li>
              <li>· WAV export of held notes / sweeps</li>
            </ul>
            <div className="mt-6 flex gap-3 flex-wrap">
              <Link
                href="/lessons"
                className="font-display font-semibold text-[14px] tracking-[.04em] uppercase px-4 py-2.5 border-2 border-paper text-paper hover:bg-paper hover:text-ink transition-colors no-underline"
              >
                ← back to the lab
              </Link>
              <Link
                href="/lessons/909"
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
        signoff="dial it in"
        meta="thespacepit · the lab · moog room"
        links={[...FOOTER_LINKS.spacepit]}
      />
    </>
  );
}
