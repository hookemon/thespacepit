import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { FOOTER_LINKS } from "../_lib/social-links";
import { ROOMS, type Room } from "./_lib/rooms";

export const metadata = {
  title: "the lab · thespacepit",
  description:
    "a synth school disguised as a synth. each room is a machine + an era + a scene — dial the knobs and the music history unlocks with the sound.",
};

const STATUS_LABEL: Record<Room["status"], string> = {
  live: "OPEN",
  next: "NEXT UP",
  soon: "SOON",
};

export default function LabIndex() {
  return (
    <>
      <TopNav current="spacepit" />
      <main className="flex-1 bg-ink text-paper">
        {/* HERO */}
        <header className="relative overflow-hidden px-5 sm:px-8 pt-16 pb-12 border-b-2 border-paper">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 18% 20%, rgba(232,58,28,0.18), transparent 50%), radial-gradient(circle at 82% 75%, rgba(242,183,5,0.12), transparent 55%)",
            }}
          />
          <div className="relative">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lamp sp-pulse" />
              <span>THESPACEPIT · SYNTH SCHOOL</span>
            </div>
            <h1
              className="font-display font-bold uppercase m-0"
              style={{ fontSize: "clamp(56px, 11vw, 160px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
            >
              the lab
            </h1>
            <p className="font-serif italic text-[20px] mt-4 max-w-[720px] text-paper-2 leading-snug">
              a synth school that synthesizes for you. each room is a machine, an era, a scene.
              dial the knobs and the story unlocks with the sound — 909 in chicago, moog in
              detroit, SP-1200 in queens, buchla in berkeley. practice mode for technique,
              free mode for what you actually make.
            </p>
            <div className="mt-6 flex items-center gap-3 flex-wrap font-mono text-[11px] tracking-[.14em] uppercase text-on-dark">
              <span className="border border-paper/40 px-2 py-1">{ROOMS.length} rooms planned</span>
              <span className="border border-paper/40 px-2 py-1">
                {ROOMS.filter((r) => r.status === "live").length} rooms live
              </span>
              <span className="border border-paper/40 px-2 py-1">browser audio · no plugin</span>
            </div>
          </div>
        </header>

        {/* ROOM MAP */}
        <section className="px-5 sm:px-8 py-12">
          <div className="flex justify-between items-end mb-6 border-b-2 border-paper pb-3 flex-wrap gap-4">
            <div>
              <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp">ROOM MAP</div>
              <h2
                className="font-display font-bold uppercase m-0"
                style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
              >
                pick a machine
              </h2>
            </div>
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-paper-2 max-w-[320px]">
              one room is open right now. the rest are wired and waiting — each one its own
              synthesis paradigm tied to a scene.
            </div>
          </div>

          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
          >
            {ROOMS.map((room) => {
              const open = room.status === "live";
              const Card = (
                <div
                  className={`relative border-2 p-5 bg-ink-2 h-full flex flex-col transition-all ${
                    open
                      ? "border-paper hover:border-lamp hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[5px_5px_0_var(--color-lamp)]"
                      : "border-paper/30 opacity-70"
                  }`}
                >
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <div
                      className="font-mono text-[10px] tracking-[.16em] uppercase font-bold px-2 py-1 border"
                      style={{
                        color: open ? room.accent : "#8C8677",
                        borderColor: open ? room.accent : "#8C8677",
                      }}
                    >
                      {STATUS_LABEL[room.status]}
                    </div>
                    <div className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark text-right">
                      {room.era}
                    </div>
                  </div>

                  <div
                    className="font-display font-bold uppercase leading-[0.92]"
                    style={{ fontSize: "44px", letterSpacing: "-0.02em", color: open ? room.accent : "#C8C2B4" }}
                  >
                    {room.title}
                  </div>
                  <div className="font-mono text-[11px] tracking-[.14em] uppercase text-paper-2 mt-1">
                    {room.scene}
                  </div>

                  <div className="font-display font-semibold text-[16px] uppercase tracking-[-0.005em] mt-4 leading-tight">
                    {room.hero}
                  </div>
                  <p className="font-serif italic text-[14px] text-paper-2 mt-2 leading-snug flex-1">
                    {room.blurb}
                  </p>

                  <div className="mt-4 pt-3 border-t border-paper/20">
                    <div className="font-mono text-[9px] tracking-[.16em] uppercase text-on-dark mb-1.5">
                      RECORDS YOU&apos;LL HEAR
                    </div>
                    <ul className="font-mono text-[11px] text-paper-2 leading-snug space-y-0.5">
                      {room.records.slice(0, 3).map((r) => (
                        <li key={r}>· {r}</li>
                      ))}
                    </ul>
                  </div>

                  {open && (
                    <div className="mt-4 font-display font-semibold text-[14px] tracking-[.04em] uppercase text-lamp">
                      enter the room →
                    </div>
                  )}
                </div>
              );

              return open ? (
                <Link key={room.slug} href={`/lessons/${room.slug}`} className="no-underline text-paper">
                  {Card}
                </Link>
              ) : (
                <div key={room.slug} className="cursor-not-allowed">
                  {Card}
                </div>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="px-5 sm:px-8 py-12 border-t border-paper/30 bg-ink-2">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">HOW IT WORKS</div>
          <h2
            className="font-display font-bold uppercase m-0 mb-6"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.92, letterSpacing: "-0.01em" }}
          >
            two modes per room
          </h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-[920px]">
            <div className="border border-paper p-5 bg-ink">
              <div className="font-mono text-[10px] tracking-[.16em] uppercase text-redline mb-2">
                PRACTICE
              </div>
              <h3 className="font-display font-bold uppercase text-[24px] leading-tight mb-2">
                recreate the canon
              </h3>
              <p className="font-serif italic text-[15px] text-paper-2 leading-snug">
                each room ships with a set of canonical patches — the kick from <em>mystery of love</em>,
                the bass from <em>flash light</em>, the snare from <em>strings of life</em>. dial yours in
                until it matches. story + audio reference + target sound.
              </p>
            </div>
            <div className="border border-paper p-5 bg-ink">
              <div className="font-mono text-[10px] tracking-[.16em] uppercase text-lamp mb-2">
                FREE
              </div>
              <h3 className="font-display font-bold uppercase text-[24px] leading-tight mb-2">
                build whatever
              </h3>
              <p className="font-serif italic text-[15px] text-paper-2 leading-snug">
                same machine, no target. sequence, jam, export to WAV (and eventually move kit + ableton
                project). everything you learn in practice transfers — same knobs, same sound.
              </p>
            </div>
          </div>
        </section>

        {/* COLLAB NOTE */}
        <section className="px-5 sm:px-8 py-12 border-t border-paper/30">
          <div className="max-w-[720px]">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-on-dark mb-2">
              UNDER CONSTRUCTION · 2026-05-20
            </div>
            <p className="font-serif italic text-[18px] text-paper-2 leading-snug">
              this is room one of seven. real audio in your browser — no plugin, no download. if a
              room you want isn&apos;t live yet, it&apos;s next.{" "}
              <Link href="/lessons/909" className="text-lamp hover:text-redline transition-colors no-underline border-b border-lamp">
                start with the 909
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer
        theme="dark"
        signoff="dial it in"
        meta="thespacepit · the lab"
        links={[...FOOTER_LINKS.spacepit]}
      />
    </>
  );
}
