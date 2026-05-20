import Link from "next/link";
import { TopNav } from "../../_components/shared/TopNav";
import { Footer } from "../../_components/shared/Footer";
import { YouTubeEmbed } from "../../_components/shared/YouTubeEmbed";
import { FOOTER_LINKS } from "../../_lib/social-links";
import { LabSIDClient } from "./LabSIDClient";

export const metadata = { title: "the SID room · the lab · thespacepit", description: "3-voice C64 chip music in your browser." };

const REFS = [
  { title: "Monty on the Run", artist: "Rob Hubbard", year: "1985", ytId: "Ed_W7t0Yj_w",
    note: "the song that proved you could make actual *music* on a video game chip. arp running so fast it sounds like a chord." },
  { title: "Wizball", artist: "Martin Galway", year: "1987", ytId: "DJgnH-WzKfM",
    note: "galway pioneered layered SID textures. listen for how each voice is a different instrument, not a different note." },
  { title: "Last Ninja", artist: "Ben Daglish", year: "1987", ytId: "TWfsAvshcgQ",
    note: "japanese-folk melodies on a chip designed by an analog engineer. the noise channel is the percussion." },
];

export default function LabSIDPage() {
  return (
    <>
      <TopNav current="spacepit" />
      <main className="flex-1 bg-ink text-paper">
        <header className="relative overflow-hidden px-5 sm:px-8 pt-12 pb-8 border-b-2 border-paper">
          <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 30%, rgba(101,199,247,0.22), transparent 55%), radial-gradient(circle at 80% 80%, rgba(122,251,13,0.10), transparent 55%)" }} />
          <div className="relative">
            <Link href="/lessons" className="font-mono text-[11px] tracking-[.16em] uppercase text-lamp no-underline">← the lab</Link>
            <div className="font-mono text-[11px] tracking-[.14em] uppercase mt-3 mb-1 flex items-center gap-2" style={{ color: "#65C7F7" }}>
              <span className="w-2 h-2 rounded-full sp-pulse" style={{ background: "#65C7F7" }} />
              <span>ROOM 05 · SID 6581 · C64 DEMOSCENE</span>
            </div>
            <h1 className="font-display font-bold uppercase m-0" style={{ fontSize: "clamp(54px, 10vw, 132px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}>the chip that<br />was a band</h1>
            <p className="font-serif italic text-[19px] mt-4 max-w-[760px] text-paper-2 leading-snug">
              bob yannes designed the SID 6581 in 1982 as a sound chip for the commodore 64.
              he was an analog engineer who didn&apos;t know he was making the most expressive video game
              sound chip ever shipped. 3 oscillators, one filter, a ring mod, ADSR — for the cost of
              eight transistors. rob hubbard, martin galway, ben daglish, and the rest of the demoscene
              took those eight transistors and built a sub-genre that&apos;s still being made today.
            </p>
          </div>
        </header>

        <section className="px-5 sm:px-8 py-8"><LabSIDClient /></section>

        <section className="px-5 sm:px-8 py-12 border-t border-paper/30 bg-ink-2">
          <div className="max-w-[860px]">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase mb-2" style={{ color: "#65C7F7" }}>THE STORY</div>
            <h2 className="font-display font-bold uppercase m-0 mb-5" style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92 }}>three voices, infinite chord</h2>
            <div className="font-serif text-[17px] leading-[1.55] text-paper-2 space-y-4">
              <p>the SID has only three voices. that should mean three-note polyphony max. except rob hubbard figured out that if you cycle ONE voice through three different pitches at chip rate (around 50Hz), your ear hears a chord — your brain can&apos;t resolve them individually. that&apos;s an SID arpeggio, and it&apos;s the sound of c64 music.</p>
              <p>in this room: turn ARP RATE up to about 30Hz. you&apos;ll hear one note become a chord. drop it back to 0 — single voice again. that&apos;s the trick that defined a decade of chip music.</p>
              <p>the fourth voice is the noise channel. galway used it for hi-hats; hubbard used it for snares. it&apos;s how SID composers built drum parts without sample memory.</p>
              <p className="font-serif italic text-paper">try this: load <em>hubbard-lead</em>, hold a note, slowly drop ARP RATE down to 0. listen for the moment the chord falls apart into a single note.</p>
            </div>
          </div>
        </section>

        <section className="px-5 sm:px-8 py-12 border-t border-paper/30">
          <div className="flex justify-between items-end mb-6 border-b-2 border-paper pb-3 flex-wrap gap-4">
            <div>
              <div className="font-mono text-[11px] tracking-[.14em] uppercase" style={{ color: "#65C7F7" }}>REFERENCE</div>
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
      <Footer theme="dark" signoff="see u in the pit" meta="thespacepit · the lab · sid room" links={[...FOOTER_LINKS.spacepit]} />
    </>
  );
}
