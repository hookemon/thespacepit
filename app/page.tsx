// Root landing = the pop-up campaign splash. Visitors hit thespacepit.com
// and see the pop-up info first; an "ENTER →" CTA at the top of the hero
// takes them to /the-pit (the full spacepit world home).
//
// This is the campaign-mode setup — when the pop-up winds down, swap this
// file's contents with /the-pit's and the routing inverts.
import Link from "next/link";
import { TopNav } from "./_components/shared/TopNav";
import { Footer } from "./_components/shared/Footer";
import { NewsletterSection } from "./_components/shared/NewsletterSection";
import { FOOTER_LINKS } from "./_lib/social-links";

export const metadata = {
  title: "thespacepit · in-person pop-up · brooklyn",
  description:
    "an in-person pop-up at thespacepit — late may, brooklyn. the room, the rig, the records, coffee. small group, low key. date dropping to the list first.",
};

export default function SpacepitLanding() {
  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        {/* HERO — with the ENTER CTA top right so anyone who's already a
            regular can bypass the pop-up info and get into the full site
            in one click. */}
        <header className="px-5 sm:px-8 pt-16 pb-12 border-b border-paper relative">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-lamp animate-pulse" />
            POP-UP · BROOKLYN · DATE TBA
          </div>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <h1
              className="font-display font-bold uppercase m-0"
              style={{ fontSize: "clamp(56px, 11vw, 160px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
            >
              come thru
              <br />
              <span className="text-lamp">the pit.</span>
            </h1>
            {/* ENTER CTA — links into the full site for repeat / known visitors */}
            <Link
              href="/the-pit"
              className="font-mono text-[12px] tracking-[.22em] uppercase px-5 py-3 border-2 border-paper bg-paper text-ink hover:bg-lamp hover:border-lamp transition-colors no-underline shrink-0 self-start mt-2"
            >
              enter the pit →
            </Link>
          </div>
          <p className="font-serif italic text-[20px] sm:text-[22px] mt-6 max-w-[680px] text-paper leading-snug">
            an in-person pop-up at thespacepit — late may, brooklyn. the room, the rig, the records, coffee. small group, low key. pull up, see the studio, work on whatever you&apos;re working on.
          </p>
        </header>

        {/* WHAT'S INSIDE */}
        <section className="px-5 sm:px-8 py-14 border-b border-paper/20">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-2">
            WHAT'S INSIDE
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-[1080px] mt-6">
            {[
              {
                kicker: "THE ROOM",
                title: "see the rig",
                body: "the wall, the modular, the sp-1200, the move, the desk where the records actually get made. open studio walk-thru.",
              },
              {
                kicker: "THE COFFEE",
                title: "stay a minute",
                body: "good coffee, casual hang. bring a project, bring nothing, bring whoever — small enough we can actually talk.",
              },
              {
                kicker: "THE PACK",
                title: "first dibs",
                body: "everyone who shows leaves with the Move Song Starters Vol 1 sample pack on a usb. real one, not the download.",
              },
            ].map((card) => (
              <article key={card.kicker} className="border border-paper p-6 bg-ink-2">
                <div className="font-mono text-[10px] tracking-[.18em] uppercase text-lamp">
                  {card.kicker}
                </div>
                <h3 className="font-display font-bold uppercase text-[22px] tracking-[-0.005em] leading-tight mt-1.5">
                  {card.title}
                </h3>
                <p className="font-serif italic text-[15px] text-paper-2 leading-snug mt-3">
                  {card.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* THE LIST */}
        <section className="px-5 sm:px-8 py-16 border-b border-paper/20 bg-ink-2">
          <div className="max-w-[760px]">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-2">
              FIRST IN LINE
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-3"
              style={{ fontSize: "clamp(40px, 7vw, 80px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
            >
              get the date.
            </h2>
            <p className="font-serif italic text-[18px] text-paper-2 mb-6 leading-snug">
              cap is small — likely 10-15 people. drop your email and we&apos;ll send the date + the rsvp link before it goes public. no spam, just the date and a couple of follow-ups.
            </p>
            <NewsletterSection
              source="pop-up"
              heading=""
              blurb=""
            />
          </div>
        </section>

        {/* FAQ-LITE */}
        <section className="px-5 sm:px-8 py-14 border-b border-paper/20">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-6">
            QUICK ANSWERS
          </div>
          <div className="grid md:grid-cols-2 gap-x-10 gap-y-6 max-w-[1080px]">
            {[
              {
                q: "is this for producers only?",
                a: "no. producers, fans, friends of the spacepit, people curious about the room. all welcome.",
              },
              {
                q: "is it free?",
                a: "yes — free to attend. small donation jar for coffee if you wanna chip in.",
              },
              {
                q: "what should i bring?",
                a: "nothing required. headphones if you have them. a laptop if you wanna work on something.",
              },
              {
                q: "can i bring someone?",
                a: "yes, but tell us when you rsvp so we can plan space.",
              },
              {
                q: "out of town — will you do more cities?",
                a: "if this one goes well: yes. medellín first, then maybe la. let us know where you are when you sign up.",
              },
              {
                q: "what if i can't make it?",
                a: "the date is dropping to the list before it goes public. if it doesn't work, we'll send you the next one.",
              },
            ].map((row) => (
              <div key={row.q}>
                <div className="font-display font-semibold text-[18px] uppercase tracking-[-0.005em] mb-1">
                  {row.q}
                </div>
                <p className="font-serif italic text-[14.5px] text-paper-2 leading-snug">{row.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECONDARY ENTER — at the bottom for anyone who scrolled all the way */}
        <section className="px-5 sm:px-8 py-16">
          <div className="max-w-[640px]">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-2">
              KEEP LOOKING AROUND
            </div>
            <p className="font-serif italic text-[20px] text-paper-2 mb-5 leading-snug">
              the rest of the site is here — fifteen years of records, the studio, the catalog, the gear, the crew. pull up.
            </p>
            <Link
              href="/the-pit"
              className="inline-flex items-center gap-2 font-mono text-[12px] tracking-[.22em] uppercase px-6 py-4 border-2 border-lamp bg-lamp text-ink hover:bg-paper hover:border-paper transition-colors no-underline"
            >
              enter the pit →
            </Link>
          </div>
        </section>
      </main>
      <Footer
        theme="paper"
        heptagon="fill-white"
        signoff="see u in the pit 🪐"
        meta="brooklyn · medellín · since 2011"
        links={[...FOOTER_LINKS.spacepit]}
      />
    </div>
  );
}
