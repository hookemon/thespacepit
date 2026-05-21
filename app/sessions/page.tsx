import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { BookingForm } from "../_components/shared/BookingForm";
import { NewsletterSection } from "../_components/shared/NewsletterSection";
import { SOCIALS, FOOTER_LINKS } from "../_lib/social-links";

export const metadata = {
  title: "sessions — pop-up · creative sessions with nick hook · thespacepit",
  description:
    "$60/hr creative sessions thru jun 1. production, mixing, feedback, workflow, mentorship, just hang and work. pull up.",
};

const FORMSPREE_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT ?? null;

type FormFields = Parameters<typeof BookingForm>[0]["fields"];

const SESSION_FIELDS: FormFields = [
  { name: "name", label: "your name", required: true },
  { name: "email", label: "email", type: "email", required: true },
  {
    name: "format",
    label: "format",
    placeholder: "remote · in-pit (brooklyn) · async (send a session)",
  },
  {
    name: "project",
    label: "what we're working on",
    type: "textarea",
    required: true,
    placeholder:
      "your beat, your mix, a track you're stuck on, workflow, career stuff — whatever needs unsticking",
  },
  { name: "when", label: "when you're free", placeholder: "this week / next week / dates" },
  { name: "hours", label: "how many hours", placeholder: "1 · 2 · a few" },
];

type Kind = { eyebrow: string; title: string; body: string };
const KINDS: Kind[] = [
  {
    eyebrow: "PRODUCTION",
    title: "work on your beat",
    body: "we open your session and dig in together — sounds, arrangement, where it wants to go next.",
  },
  {
    eyebrow: "MIXING",
    title: "sharpen the mix",
    body: "pull up the rough, walk through choices together. you leave with notes + a sharper bounce.",
  },
  {
    eyebrow: "FEEDBACK",
    title: "async walkthrough",
    body: "send a track ahead. i record a video walking it back — what's working, what to push, what i'd try.",
  },
  {
    eyebrow: "WORKFLOW",
    title: "your tools, unstuck",
    body: "move · TE · ableton · sp-1200 · push · whatever. real workflow for the gear you actually have.",
  },
  {
    eyebrow: "MENTORSHIP",
    title: "career talk",
    body: "labels, releases, what to chase, what to skip. 20yrs of doing this — yours for an hour.",
  },
  {
    eyebrow: "JUST HANG",
    title: "we both work",
    body: "pull up to the pit, work on yours. i'll be in mine. studio energy, two heads in the room.",
  },
];

const CRED_TAGS = [
  "RUN THE JEWELS",
  "ACTION BRONSON",
  "BIG BOI",
  "YOUNG THUG",
  "GANGSTA BOO",
  "FLATBUSH ZOMBIES",
  "TE MENTOR",
];

export default function SessionsPage() {
  return (
    <div className="bg-paper text-ink min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        {/* ---------- HERO ---------- */}
        <header className="relative px-5 sm:px-8 pt-14 sm:pt-20 pb-14 sm:pb-20 border-b-2 border-ink overflow-hidden">
          <div className="relative max-w-[1280px] mx-auto">
            <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[.14em] uppercase text-ink-3">
              <span aria-hidden className="inline-block w-2.5 h-2.5 rounded-full bg-lamp-deep sp-pulse" />
              POP-UP · MAY–JUN 2026 · LIMITED SLOTS · BROOKLYN + REMOTE
            </div>

            <h1
              className="font-display font-bold uppercase m-0 mt-4 break-words"
              style={{ fontSize: "clamp(64px, 13vw, 200px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
            >
              creative{" "}
              <span
                style={{
                  color: "#F2B705",
                  WebkitTextStroke: "2px #0B0B0B",
                }}
              >
                sessions
              </span>
              .
            </h1>

            <p
              className="font-serif italic mt-6 max-w-[760px] leading-snug"
              style={{ fontSize: "clamp(20px, 2.2vw, 28px)" }}
            >
              i got time right now. let's make something. $60/hr, me + you, your project —
              production, mixes, feedback, workflow, career stuff, or just hang and work.
              whatever needs unsticking. 🌱
            </p>

            {/* price block + CTA */}
            <div className="mt-10 flex flex-wrap items-stretch gap-5">
              <div
                className="bg-lamp text-ink px-7 py-5 border border-ink"
                style={{ boxShadow: "6px 6px 0 var(--color-ink)" }}
              >
                <div
                  className="font-display font-bold flex items-baseline gap-2"
                  style={{ fontSize: "clamp(48px, 7vw, 88px)", lineHeight: 1, letterSpacing: "-0.02em" }}
                >
                  $60
                  <span className="font-mono font-medium text-[14px] tracking-[.12em] uppercase">/ hr</span>
                </div>
                <div className="font-mono text-[10px] tracking-[.14em] uppercase mt-2 text-ink-3">
                  pop-up rate · thru jun 1, 2026
                </div>
              </div>
              <a
                href="#book"
                data-track="session_cta_clicked"
                data-track-props={JSON.stringify({ location: "hero" })}
                className="inline-flex items-center font-display font-semibold tracking-[.04em] uppercase px-7 border border-ink bg-ink text-paper hover:bg-paper hover:text-ink transition-colors no-underline"
                style={{ fontSize: "clamp(20px, 2.4vw, 28px)" }}
              >
                book a session →
              </a>
              <a
                href="#what"
                className="inline-flex items-center font-mono text-[11px] tracking-[.14em] uppercase px-4 border border-ink hover:bg-ink hover:text-paper transition-colors no-underline"
              >
                what's a session ↓
              </a>
            </div>
          </div>
        </header>

        {/* ---------- WHAT (KINDS) ---------- */}
        <section id="what" className="px-5 sm:px-8 py-16 sm:py-20 bg-paper-2 border-b-2 border-ink">
          <div className="max-w-[1280px] mx-auto">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-ink-3">
              WHAT WE CAN DO
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mt-2"
              style={{ fontSize: "clamp(36px, 6vw, 72px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
            >
              six ways to use an hour.
            </h2>
            <p
              className="font-serif italic mt-4 max-w-[640px] text-ink-3"
              style={{ fontSize: 18, lineHeight: 1.35 }}
            >
              one rate, six shapes — pick the one your project needs, or mix.
            </p>

            <div className="mt-10 grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {KINDS.map((k) => (
                <article
                  key={k.eyebrow}
                  className="border border-ink bg-paper p-6 transition-all duration-200 ease-out hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[6px_6px_0_var(--color-lamp-deep)]"
                >
                  <div className="font-mono text-[10px] tracking-[.16em] uppercase text-lamp-deep">
                    {k.eyebrow}
                  </div>
                  <h3
                    className="font-display font-semibold uppercase m-0 mt-2"
                    style={{ fontSize: 28, lineHeight: 1, letterSpacing: "-0.01em" }}
                  >
                    {k.title}
                  </h3>
                  <p
                    className="font-serif italic mt-3 text-ink-3"
                    style={{ fontSize: 16, lineHeight: 1.4 }}
                  >
                    {k.body}
                  </p>
                </article>
              ))}
            </div>

            <p className="font-mono text-[11px] tracking-[.14em] uppercase mt-8 text-ink-3">
              videos / clips of these soon · subscribe on yt for the drop
            </p>
          </div>
        </section>

        {/* ---------- WHO ---------- */}
        <section className="px-5 sm:px-8 py-14 sm:py-16 bg-ink text-paper border-b-2 border-ink">
          <div className="max-w-[1180px] mx-auto">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp">
              WHO'S TEACHING
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mt-2"
              style={{ fontSize: "clamp(32px, 4.5vw, 56px)", lineHeight: 0.95, letterSpacing: "-0.015em" }}
            >
              nick hook · brooklyn + medellín · 20+ yrs
            </h2>
            <p
              className="font-serif italic mt-5 max-w-[780px] text-on-dark"
              style={{ fontSize: 20, lineHeight: 1.4 }}
            >
              own band on warner. production for run the jewels, action bronson, big boi, young
              thug, gangsta boo, flatbush zombies and more. mentor at teenage
              engineering. two studios — thespacepit (brooklyn) + la burbuja (medellín).
            </p>
            <div className="mt-6 flex flex-wrap gap-2 font-mono text-[10px] sm:text-[11px] tracking-[.14em] uppercase">
              {CRED_TAGS.map((t) => (
                <span key={t} className="px-3 py-1.5 border border-paper rounded-full text-on-dark">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- BOOK ---------- */}
        <section id="book" className="px-5 sm:px-8 py-16 sm:py-20 bg-paper">
          <div className="max-w-[1180px] mx-auto grid gap-10 md:grid-cols-[minmax(280px,1fr)_1.2fr] items-start">
            <div>
              <div className="font-mono text-[11px] tracking-[.14em] uppercase text-ink-3">
                BOOK ONE
              </div>
              <h2
                className="font-display font-bold uppercase m-0 mt-2"
                style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
              >
                let's get on the books.
              </h2>
              <p
                className="font-serif italic mt-4 max-w-[440px] text-ink-3"
                style={{ fontSize: 18, lineHeight: 1.35 }}
              >
                tell me what you wanna work on. i reply with a time + a paypal link. easy.
              </p>
              <div className="font-mono text-[11px] tracking-[.14em] uppercase mt-6 text-ink-3 flex flex-col gap-1">
                <span>$60 / hr · pop-up rate</span>
                <span>thru jun 1, 2026</span>
                <span>brooklyn + remote</span>
              </div>
            </div>

            {/* BookingForm uses dark-themed input styles — wrap in an ink surface */}
            <div
              className="bg-ink text-paper border border-ink p-6 sm:p-8"
              style={{ boxShadow: "6px 6px 0 var(--color-lamp-deep)" }}
            >
              <BookingForm
                toEmail={SOCIALS.spacepitEmail}
                subjectPrefix="sessions"
                submitLabel="send booking"
                fields={SESSION_FIELDS}
                formspreeEndpoint={FORMSPREE_ENDPOINT}
              />
            </div>
          </div>
        </section>
        <NewsletterSection
          source="sessions"
          heading="not ready? get on the list."
          blurb="sessions slots, pack drops, behind-the-scenes — first in your inbox. drop your email when you're ready to pull up later."
        />
      </main>
      <Footer
        theme="paper"
        signoff="see u in the pit 🪐"
        meta={`sessions · ${SOCIALS.spacepitEmail}`}
        links={[...FOOTER_LINKS.spacepit]}
        newsletter={false}
      />
    </div>
  );
}
