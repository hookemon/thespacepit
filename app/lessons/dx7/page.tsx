import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { YouTubeEmbed } from "../../_components/shared/YouTubeEmbed";
import { FOOTER_LINKS } from "../../_lib/social-links";
import { LabDX7Client } from "./LabDX7Client";

export const metadata = {
  title: "the DX7 room · the lab · thespacepit",
  description: "frequency modulation in your browser. the bell, the e-piano, the slap bass — the entire 80s in 4 operators.",
};

const REFERENCE_RECORDS = [
  { title: "Greatest Love of All", artist: "Whitney Houston", year: "1985", ytId: "IYzlVDlE72w",
    note: "the DX7 bell intro. textbook FM — high-ratio cascade, fast attack, no sustain." },
  { title: "Take On Me", artist: "a-ha", year: "1985", ytId: "djV11Xbc914",
    note: "the lead synth is a DX7 patch. parallel algorithm, ratio 1 + ratio 2 carriers." },
  { title: "Apollo: Atmospheres", artist: "Brian Eno", year: "1983",  ytId: "tIdIqbv7SPo",
    note: "eno doing breath-pad FM textures years before everyone else. slow attack, long sustain, low op levels." },
];

export default function LabDX7Page() {
  return (
    <>
      <TopNav current="spacepit" />
      <main className="flex-1 bg-ink text-paper">
        <header className="relative overflow-hidden px-5 sm:px-8 pt-12 pb-8 border-b-2 border-paper">
          <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 30%, rgba(201,185,232,0.22), transparent 55%), radial-gradient(circle at 80% 80%, rgba(242,183,5,0.10), transparent 55%)" }} />
          <div className="relative">
            <Link href="/lessons" className="font-mono text-[11px] tracking-[.16em] uppercase text-lamp hover:text-redline no-underline">← the lab</Link>
            <div className="font-mono text-[11px] tracking-[.14em] uppercase mt-3 mb-1 flex items-center gap-2" style={{ color: "#C9B9E8" }}>
              <span className="w-2 h-2 rounded-full sp-pulse" style={{ background: "#C9B9E8" }} />
              <span>ROOM 04 · DX7 · 80S POP + NEW JACK</span>
            </div>
            <h1 className="font-display font-bold uppercase m-0" style={{ fontSize: "clamp(54px, 10vw, 132px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}>
              every bell on<br />every radio
            </h1>
            <p className="font-serif italic text-[19px] mt-4 max-w-[760px] text-paper-2 leading-snug">
              the DX7 wasn&apos;t a normal synth — it was a math problem you played with a piano keyboard.
              yamaha licensed FM synthesis from john chowning at stanford in 1973, sat on it for a decade,
              then shipped the DX7 in 1983 and sold 200,000 of them. for the next 7 years it was the default
              keyboard on every record made.
            </p>
          </div>
        </header>

        <section className="px-5 sm:px-8 py-8"><LabDX7Client /></section>

        <section className="px-5 sm:px-8 py-12 border-t border-paper/30 bg-ink-2">
          <div className="max-w-[860px]">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase mb-2" style={{ color: "#C9B9E8" }}>THE STORY</div>
            <h2 className="font-display font-bold uppercase m-0 mb-5" style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92 }}>fm = math you can hear</h2>
            <div className="font-serif text-[17px] leading-[1.55] text-paper-2 space-y-4">
              <p>subtractive synthesis (the moog next door) starts with a rich sound and filters away what you don&apos;t want. FM synthesis does the opposite: it starts with a pure sine wave and uses ANOTHER sine wave to modulate the first one&apos;s frequency. modulate fast enough and you get harmonic sidebands — overtones that didn&apos;t exist in either oscillator on its own.</p>
              <p>the DX7 had 6 of these operators. you can wire them in 32 different patterns (algorithms). this room has 4 operators + 3 algorithms — enough to make all the famous patches, not enough to get lost.</p>
              <p>what to do: load <em>bell</em>. play one note, hold it, listen to the decay. now go to OP4 and turn its LEVEL down — watch the bell get softer. now turn its RATIO down from 14 toward 1 — listen to the bell turn into something simpler, then into a pure tone. you just learned what FM modulators do.</p>
              <p className="font-serif italic text-paper">try this: load <em>e.piano</em>, switch the algorithm to <em>fan</em>. completely different patch from the same operators — that&apos;s why algorithms mattered so much.</p>
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
            {REFERENCE_RECORDS.map((r) => (
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
      <Footer theme="dark" signoff="see u in the pit" meta="thespacepit · the lab · dx7 room" links={[...FOOTER_LINKS.spacepit]} />
    </>
  );
}
