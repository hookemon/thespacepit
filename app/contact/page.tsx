import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { BookingForm } from "../_components/shared/BookingForm";
import { SOCIALS, FOOTER_LINKS } from "../_lib/social-links";

export const metadata = {
  title: "contact — nick hook · thespacepit · calm + collect",
  description: "booking, label demos, press, partnerships. all the inboxes.",
};

const FORMSPREE_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT ?? null;

type Channel = { label: string; href: string; detail?: string };

type FormFields = Parameters<typeof BookingForm>[0]["fields"];

type Section = {
  id: string;
  eyebrow: string;
  title: string;
  copy: string;
  // Either a form OR a primary action — sections that take real submissions
  // get a form; others get a single mailto/link.
  form?: { subjectPrefix: string; submitLabel: string; fields: FormFields };
  primary?: Channel;
  also?: Channel[];
};

const BOOK_ME_FIELDS: FormFields = [
  { name: "name", label: "your name", required: true },
  { name: "email", label: "email", type: "email", required: true },
  { name: "city", label: "city / venue", placeholder: "where" },
  { name: "date", label: "date", type: "date" },
  { name: "fee", label: "budget / fee range" },
  { name: "details", label: "tell us about it", type: "textarea", required: true, placeholder: "what's the show / project / vibe?" },
];

const BOOK_STUDIO_FIELDS: FormFields = [
  { name: "name", label: "your name", required: true },
  { name: "email", label: "email", type: "email", required: true },
  { name: "studio", label: "which studio", placeholder: "thespacepit (brooklyn) / la burbuja (medellín) / either" },
  { name: "dates", label: "dates / window" },
  { name: "project", label: "what we're cutting", required: true, placeholder: "tracking, mixing, mastering, residency, etc." },
  { name: "details", label: "anything else", type: "textarea", placeholder: "gear needs, references, story" },
];

const SECTIONS: Section[] = [
  {
    id: "book-me",
    eyebrow: "BOOKING · DJ + LIVE A/V + PRODUCTION",
    title: "book me",
    copy: "shows, festivals, residencies, club nights, brand gigs, production work. brooklyn, medellín, anywhere.",
    form: { subjectPrefix: "booking", submitLabel: "send booking request", fields: BOOK_ME_FIELDS },
  },
  {
    id: "book-studio",
    eyebrow: "STUDIO TIME · BROOKLYN + MEDELLÍN",
    title: "book the studio",
    copy: "thespacepit in brooklyn or la burbuja in medellín. tracking, mixing, mastering, sessions, residencies. tell us what you're cutting.",
    form: { subjectPrefix: "studio booking", submitLabel: "send studio request", fields: BOOK_STUDIO_FIELDS },
  },
  {
    id: "label",
    eyebrow: "CALM + COLLECT · LABEL",
    title: "demos · distribution · press",
    copy: "send demos with a sentence about who you are. press inquiries about the catalogue. distribution and licensing too.",
    primary: { label: "submit / write in", href: `mailto:${SOCIALS.bookingEmail}?subject=calm%20%2B%20collect%20%E2%80%94%20`, detail: "until we set up a label inbox, all roads go through coleman" },
    also: [
      { label: "bandcamp →", href: SOCIALS.bandcampLabel },
      { label: "instagram →", href: SOCIALS.instagramLabel },
    ],
  },
  {
    id: "discord",
    eyebrow: "THESPACEPIT · COMMUNITY",
    title: "pull up to the discord",
    copy: "the easiest way to be in the room — gear chat, samples, now-playing, the whole thing. no replies needed; just hang.",
    primary: { label: "join the discord →", href: SOCIALS.discordInvite },
    also: [
      { label: "youtube →", href: SOCIALS.youtubeChannel },
      { label: "instagram →", href: SOCIALS.instagramSpacepit },
    ],
  },
  {
    id: "partnership",
    eyebrow: "GEAR · LABELS · COLLABS",
    title: "partnerships",
    copy: "gear collabs (teenage engineering crowd, hardware brands), label x label things, residencies, capsule drops.",
    primary: { label: "write in", href: `mailto:${SOCIALS.bookingEmail}?subject=partnership%20%E2%80%94%20`, detail: SOCIALS.bookingEmail },
  },
];

export default function ContactPage() {
  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="nick" />
      <main className="flex-1">
        <header className="relative overflow-hidden px-8 pt-16 pb-12 border-b-2 border-paper">
          {/* atmospheric photo behind the heading — picks up the studio energy */}
          <img
            src="/epk/spacepit-3-5.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "50% 35%" }}
          />
          <div aria-hidden className="absolute inset-0 bg-ink/72" />
          <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,11,11,0.2) 0%, rgba(11,11,11,0.6) 100%)" }} />
          <div className="relative">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">SAY HEY · WE OUT HERE</div>
            <h1
              className="font-display font-bold uppercase m-0"
              style={{ fontSize: "clamp(56px, 11vw, 160px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
            >
              contact
            </h1>
            <p className="font-serif italic text-[22px] mt-5 max-w-[720px] text-paper-2">
              book a show. book the studio. send a demo. join the discord. one inbox at a time.
            </p>
            <nav className="flex flex-wrap gap-2.5 mt-7">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="font-mono text-[10px] tracking-[.14em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline"
                >
                  {s.id} →
                </a>
              ))}
            </nav>
          </div>
        </header>

        {SECTIONS.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            className={`px-8 py-16 ${i % 2 === 0 ? "bg-ink" : "bg-ink-2"} border-b border-ink-3`}
          >
            <div className="max-w-[1180px] mx-auto grid gap-10 md:grid-cols-[minmax(280px,1fr)_1.2fr] items-start">
              <div>
                <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline">{s.eyebrow}</div>
                <h2
                  className="font-display font-bold uppercase m-0 mt-2"
                  style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
                >
                  {s.title}
                </h2>
                <p className="font-serif italic text-[18px] leading-snug text-paper-2 mt-4 max-w-[420px]">{s.copy}</p>
              </div>

              <div>
                {s.form ? (
                  <BookingForm
                    toEmail={SOCIALS.bookingEmail}
                    subjectPrefix={s.form.subjectPrefix}
                    submitLabel={s.form.submitLabel}
                    fields={s.form.fields}
                    formspreeEndpoint={FORMSPREE_ENDPOINT}
                  />
                ) : s.primary ? (
                  <>
                    <a
                      href={s.primary.href}
                      target={/^https?:\/\//.test(s.primary.href) ? "_blank" : undefined}
                      rel={/^https?:\/\//.test(s.primary.href) ? "noopener noreferrer" : undefined}
                      className="inline-block font-display font-semibold text-[20px] sm:text-[24px] tracking-[.02em] uppercase px-7 py-4 border border-paper bg-redline text-paper rounded-none cursor-pointer hover:bg-paper hover:text-ink transition-colors no-underline"
                    >
                      {s.primary.label}
                    </a>
                    {s.primary.detail && (
                      <div className="font-mono text-[11px] tracking-[.1em] uppercase text-on-dark mt-3">{s.primary.detail}</div>
                    )}
                  </>
                ) : null}

                {s.also && s.also.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6">
                    {s.also.map((c) => (
                      <a
                        key={c.label}
                        href={c.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] tracking-[.1em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline"
                      >
                        {c.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        ))}

        <section className="px-8 py-16">
          <div className="max-w-[1180px] mx-auto">
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-3">FROM THE ROOM</div>
            <h2
              className="font-display font-bold uppercase m-0"
              style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
            >
              brooklyn · medellín
            </h2>
            <p className="font-serif italic text-[20px] mt-4 max-w-[640px] text-paper-2">
              the spacepit lives in two places — brooklyn studio + the garden in medellín. nothing turned off, ever.
            </p>

            {/* Two big rooms — let the rooms speak. Swap srcs in /public/epk to retune. */}
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {[
                { src: "/epk/spacepit-3-0.jpg", eyebrow: "BROOKLYN · THE PIT", title: "the room with the yellow walls", note: "tracking · mixing · sessions · residencies" },
                { src: "/epk/spacepit-4-0.png", eyebrow: "MEDELLÍN · LA BURBUJA", title: "the garden room", note: "the garden in medellín · sessions + writing camps" },
              ].map((r) => (
                <figure key={r.src} className="relative overflow-hidden border border-paper aspect-[4/3] group">
                  <img
                    src={r.src}
                    alt={r.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div aria-hidden className="absolute inset-0 bg-ink/15 group-hover:bg-ink/0 transition-colors duration-300" />
                  <figcaption
                    className="absolute left-0 right-0 bottom-0 p-5 text-paper"
                    style={{ background: "linear-gradient(180deg, rgba(11,11,11,0) 0%, rgba(11,11,11,0.78) 65%)" }}
                  >
                    <div className="font-mono text-[10px] tracking-[.16em] uppercase text-paper-2 mb-1">{r.eyebrow}</div>
                    <div
                      className="font-display font-semibold uppercase leading-tight"
                      style={{ fontSize: "clamp(20px, 2.4vw, 28px)", letterSpacing: "-0.005em" }}
                    >
                      {r.title}
                    </div>
                    <div className="font-mono text-[10px] tracking-[.12em] uppercase text-on-dark mt-1.5">{r.note}</div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer
        theme="dark"
        signoff="see u in the pit 🌱"
        meta="booking · coleman@smooth-loop.com"
        links={[...FOOTER_LINKS.nick]}
      />
    </div>
  );
}
