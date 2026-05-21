import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { NewsletterSection } from "../_components/shared/NewsletterSection";
import { FOOTER_LINKS } from "../_lib/social-links";

export const metadata = {
  title: "pop-up · thespacepit",
  description:
    "an in-person pop-up at thespacepit. coffee, the room, the records, the rig. date dropping soon — get on the list to hear first.",
};

/**
 * /pop-up — landing page for the in-person event Nick is planning.
 *
 * Live before the date is locked: heavy email-capture surface so RSVPs are
 * routed through Mailchimp (source: "pop-up") and Nick can drop the date to
 * the right segment of the list later. Once the date confirms, swap the
 * placeholder eyebrow + add specifics (address, time, what's inside).
 *
 * Stays useful AFTER the first pop-up too — repurpose for the next one.
 */
export default function PopUpPage() {
  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        {/* HERO */}
        <header className="px-5 sm:px-8 pt-16 pb-12 border-b border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-lamp animate-pulse" />
            POP-UP · BROOKLYN · DATE TBA
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 11vw, 160px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
          >
            come thru
            <br />
            <span className="text-lamp">the pit.</span>
          </h1>
          <p className="font-serif italic text-[20px] sm:text-[22px] mt-6 max-w-[680px] text-paper leading-snug">
            an in-person pop-up at thespacepit — late may, brooklyn. the room, the rig, the records, coffee. small group, low key. pull up, see the studio, work on whatever you&apos;re working on.
          </p>
        </header>

        {/* WHAT'S INSIDE — three plain cards. Edit copy when the details lock. */}
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

        {/* THE LIST — primary CTA. source=pop-up so signups land in their own
            Mailchimp tag — when the date locks, blast that segment first. */}
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

        {/* FAQ-LITE — soft answers to anticipated questions */}
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
      </main>
      <Footer
        theme="paper"
        heptagon="fill-white"
        signoff="see u in the pit 🪐"
        meta="brooklyn · medellín · since 2011"
        links={[...FOOTER_LINKS.spacepit]}
        newsletter={false}
      />
    </div>
  );
}
