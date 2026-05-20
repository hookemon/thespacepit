import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { YouTubeEmbed } from "../../_components/shared/YouTubeEmbed";
import { FOOTER_LINKS } from "../../_lib/social-links";
import { LabBuchlaClient } from "./LabBuchlaClient";

export const metadata = { title: "the Buchla room · the lab · thespacepit", description: "west coast synthesis — complex oscillator + lowpass gate + source of uncertainty. no keyboard." };

const REFS = [
  { title: "Silver Apples of the Moon", artist: "Morton Subotnick", year: "1967", ytId: "i_RoQI1Hbgw",
    note: "first record commissioned for vinyl by a record label that was made entirely on a synthesizer. all 200-series buchla. listen to how the rhythm and the timbre evolve at the same time — that's source of uncertainty doing its job." },
  { title: "Buchla Concerts 1975", artist: "Suzanne Ciani", year: "released 2016", ytId: "MQz0Tut4WLA",
    note: "ciani's live performances on a 200 series, recorded but unreleased for 40 years. zero presets — every patch built live with cables." },
  { title: "Ears", artist: "Kaitlyn Aurelia Smith", year: "2016", ytId: "uBd1FmDuCNw",
    note: "modern west-coast palette. a buchla music easel doing things subotnick wouldn't have imagined." },
];

export default function LabBuchlaPage() {
  return (
    <>
      <TopNav current="spacepit" />
      <main className="flex-1 bg-ink text-paper">
        <header className="relative overflow-hidden px-5 sm:px-8 pt-12 pb-8 border-b-2 border-paper">
          <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(circle at 25% 30%, rgba(201,185,232,0.22), transparent 55%), radial-gradient(circle at 80% 80%, rgba(122,251,13,0.10), transparent 55%)" }} />
          <div className="relative">
            <Link href="/lessons" className="font-mono text-[11px] tracking-[.16em] uppercase text-lamp no-underline">← the lab</Link>
            <div className="font-mono text-[11px] tracking-[.14em] uppercase mt-3 mb-1 flex items-center gap-2" style={{ color: "#C9B9E8" }}>
              <span className="w-2 h-2 rounded-full sp-pulse" style={{ background: "#C9B9E8" }} />
              <span>ROOM 06 · BUCHLA · BERKELEY + MILLS COLLEGE</span>
            </div>
            <h1 className="font-display font-bold uppercase m-0" style={{ fontSize: "clamp(54px, 10vw, 132px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}>the synth that<br />refused the piano</h1>
            <p className="font-serif italic text-[19px] mt-4 max-w-[760px] text-paper-2 leading-snug">
              when bob moog was selling his synthesizer to keyboard players in new york, don buchla
              was in berkeley making the opposite argument. <em>why a piano keyboard? why fixed pitches?
              why scales at all?</em> his synths had touch plates, source-of-uncertainty random voltage,
              complex oscillators with FM built in, lowpass gates instead of separate filters and amps.
              this room is buchla&apos;s argument as an interface.
            </p>
          </div>
        </header>

        <section className="px-5 sm:px-8 py-8"><LabBuchlaClient /></section>

        <section className="px-5 sm:px-8 py-12 border-t border-paper/30 bg-ink-2">
          <div className="max-w-[860px]">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase mb-2" style={{ color: "#C9B9E8" }}>THE STORY</div>
            <h2 className="font-display font-bold uppercase m-0 mb-5" style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92 }}>two coasts, two ideas</h2>
            <div className="font-serif text-[17px] leading-[1.55] text-paper-2 space-y-4">
              <p>moog built the synth as an extension of the keyboard tradition. buchla built it as a rejection of it. by 1967, when subotnick made <em>silver apples of the moon</em> on a 200-series buchla, the machine was already philosophically opposite to a moog: no keyboard, no presets you'd actually save, no fixed pitches, lots of random voltage, an interface that demanded you patch your own signal path.</p>
              <p>the lowpass gate is the hero. on a moog, the VCF (filter) and VCA (amp) are separate, each with its own envelope. on a buchla, they're combined: one envelope opens both at once. so a "bonk" happens when the LPG snaps open and shut — bright when loud, dark when quiet. you can't disconnect the two. it sounds like nothing else and you can't fake it on a subtractive synth.</p>
              <p>suzanne ciani turned this rejection into a career. she made every commercial sound effect you remember from 1980s television on this thing — coca-cola pours, AT&T jingles, atari boot-up sounds. live performances were her playing the patch cables.</p>
              <p className="font-serif italic text-paper">try this: load <em>silver-apples</em>, hit the DRONE plate, then turn RANDOM up to 100%. don&apos;t touch anything else for 30 seconds. that&apos;s the buchla compositional ethos: set up a system, let it play itself.</p>
            </div>
          </div>
        </section>

        <section className="px-5 sm:px-8 py-12 border-t border-paper/30">
          <div className="flex justify-between items-end mb-6 border-b-2 border-paper pb-3 flex-wrap gap-4">
            <div>
              <div className="font-mono text-[11px] tracking-[.14em] uppercase" style={{ color: "#C9B9E8" }}>REFERENCE</div>
              <h2 className="font-display font-bold uppercase m-0" style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92 }}>go listen</h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {REFS.map((r) => (
              <div key={r.ytId} className="border border-paper bg-ink-2 p-4">
                <div className="aspect-video mb-3 bg-ink overflow-hidden border border-paper/30">
                  <YouTubeEmbed url={`https://www.youtube.com/watch?v=${r.ytId}`} title={`${r.title} — ${r.artist}`} />
                </div>
                <div className="font-mono text-[9px] tracking-[.16em] uppercase text-on-dark mb-1">{r.year}</div>
                <div className="font-display font-bold uppercase text-[20px] leading-tight">{r.title}</div>
                <div className="font-mono text-[11px] uppercase text-paper-2 mt-0.5">{r.artist}</div>
                <p className="font-serif italic text-[14px] text-paper-2 leading-snug mt-3">{r.note}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer theme="dark" signoff="see u in the pit" meta="thespacepit · the lab · buchla room" links={[...FOOTER_LINKS.spacepit]} />
    </>
  );
}
