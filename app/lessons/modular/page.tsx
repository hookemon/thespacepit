import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { YouTubeEmbed } from "../../_components/shared/YouTubeEmbed";
import { FOOTER_LINKS } from "../../_lib/social-links";
import { LabModularClient } from "./LabModularClient";

export const metadata = { title: "the Modular room · the lab · thespacepit", description: "patch programming — six modules, three patches, infinite voices." };

const REFS = [
  { title: "Plays the Synthesizer", artist: "Pauline Oliveros", year: "1965", ytId: "5UkVeJtxYwM",
    note: "buchla-adjacent pioneer recording at the san francisco tape music center. listen to her treat the modular not as an instrument but as a system." },
  { title: "Modular Sessions", artist: "Surgeon", year: "2010s", ytId: "_v0FqEABxYY",
    note: "techno producer running entirely on eurorack. the patch IS the track. nothing's pre-sequenced — he's playing the system as it evolves." },
  { title: "Eurorack Live", artist: "Hainbach", year: "2020s", ytId: "RuFV8I-OCdQ",
    note: "demonstration of how modern modular composers work. four cables and twenty minutes." },
];

export default function LabModularPage() {
  return (
    <>
      <TopNav current="spacepit" />
      <main className="flex-1 bg-ink text-paper">
        <header className="relative overflow-hidden px-5 sm:px-8 pt-12 pb-8 border-b-2 border-paper">
          <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(circle at 25% 30%, rgba(232,58,28,0.2), transparent 55%), radial-gradient(circle at 80% 80%, rgba(242,183,5,0.15), transparent 55%)" }} />
          <div className="relative">
            <Link href="/lessons" className="font-mono text-[11px] tracking-[.16em] uppercase text-lamp no-underline">← the lab</Link>
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mt-3 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-redline sp-pulse" />
              <span>ROOM 07 · MODULAR · PATCH PROGRAMMING</span>
            </div>
            <h1 className="font-display font-bold uppercase m-0" style={{ fontSize: "clamp(54px, 10vw, 132px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}>earn the<br />patch cable</h1>
            <p className="font-serif italic text-[19px] mt-4 max-w-[760px] text-paper-2 leading-snug">
              every other room in the lab gave you a fixed signal flow + a bunch of knobs.
              modular gives you the modules and lets you decide what connects to what. once
              subtractive, FM, west-coast all live in your hands, the patch bay opens up. six
              modules. three pre-built routings. swap between them to feel how the same modules
              make completely different instruments.
            </p>
          </div>
        </header>

        <section className="px-5 sm:px-8 py-8"><LabModularClient /></section>

        <section className="px-5 sm:px-8 py-12 border-t border-paper/30 bg-ink-2">
          <div className="max-w-[860px]">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">THE STORY</div>
            <h2 className="font-display font-bold uppercase m-0 mb-5" style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92 }}>the patch is the instrument</h2>
            <div className="font-serif text-[17px] leading-[1.55] text-paper-2 space-y-4">
              <p>a hardwired synth (any of the other rooms) decides for you what an oscillator is supposed to feed into. modular says: <em>you decide</em>. VCO output is a 1V/oct signal. So is LFO output. The synth doesn&apos;t know what's a "pitch source" and what's a "modulation source" — it&apos;s the same voltage, the patch cable defines the meaning.</p>
              <p>this room has 6 modules — VCO1, VCO2, LFO, VCF, ENV, VCA. Three pre-built routings: <em>BASIC</em> (classic subtractive), <em>FM LEAD</em> (VCO2 modulates VCO1 — same FM math as the DX7 next door), <em>PULSE PAD</em> (LFO sweeps the filter). Swap between them and the SAME knobs do completely different things.</p>
              <p>that&apos;s the modular lesson. <em>the patch is the instrument.</em> the modules are just objects. (eventually we&apos;ll open this up to live patch cable dragging — the v0 limits you to the three pre-built routings, which is honest about the v0 state of the modeling.)</p>
              <p className="font-serif italic text-paper">try this: load <em>BASIC</em>, set VCO2 LEVEL to 0, play. Now switch to <em>FM LEAD</em>, turn VCO2 LEVEL up to 50, ratio to 3.5. Same exact synth, completely different instrument — and it&apos;s the same architecture trick the DX7 uses, just one operator pair instead of six.</p>
            </div>
          </div>
        </section>

        <section className="px-5 sm:px-8 py-12 border-t border-paper/30">
          <div className="flex justify-between items-end mb-6 border-b-2 border-paper pb-3 flex-wrap gap-4">
            <div>
              <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline">REFERENCE</div>
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
      <Footer theme="dark" signoff="see u in the pit" meta="thespacepit · the lab · modular room" links={[...FOOTER_LINKS.spacepit]} />
    </>
  );
}
