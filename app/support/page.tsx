import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { FOOTER_LINKS, SOCIALS } from "../_lib/social-links";

export const revalidate = 300;

export const metadata = {
  title: "support thespacepit — paywall + tiers + tip jar",
  description:
    "support the pit. monthly tiers unlock the vault: cu4tro paperwork, boo sessions, sample packs, behind-the-scenes from every session. or drop a one-time tip.",
};

/**
 * /support — the tier ladder + one-time tip CTAs. Designed as a STATIC page
 * for now: the actual payment plumbing lives on Patreon / Bandcamp / Ko-fi.
 * thespacepit acts as the storefront + funnel.
 *
 * When we're ready to go native with Memberful / Stripe Checkout, only the
 * `unlockUrl` per tier needs to change.
 */
const TIERS: Tier[] = [
  {
    key: "free",
    name: "the open door",
    price: "free",
    color: "#7BD3A8",
    badge: "you're already in",
    pitch: "the whole site is open. no ads, no signup, no algorithm. enjoy.",
    perks: [
      "every release, video, mix, show",
      "the full gear log",
      "all 3 worlds — nick hook / thespacepit / calm + collect",
      "discord — the open rooms",
    ],
    cta: "thanks for being here 🪐",
    ctaHref: null,
  },
  {
    key: "patron",
    name: "the vault",
    price: "$5/mo",
    color: "#F2B705",
    badge: "the listener",
    pitch: "a monthly drop from the room. one stem, one story, one sample. plus every vault pack — forever.",
    perks: [
      "monthly vault drop · stems · samples · sessions",
      "every vault sample pack (yours to keep, even if you cancel)",
      "7-day early access on every new release",
      "patron-only discord channels",
      "your name in the credits of one annual c+c release",
    ],
    cta: "join the vault →",
    ctaHref: "https://www.patreon.com/nickhook",
  },
  {
    key: "inner",
    name: "the inner circle",
    price: "$25/mo",
    color: "#E83A1C",
    badge: "the producer",
    pitch: "the deep cuts. paperwork, decks, session tapes. the stuff i'd only show the artists in the room. capped at 50.",
    perks: [
      "everything in the vault tier",
      "the archive — cu4tro paperwork, decks, agreements, session notes",
      "boo vault sessions (rolling out from the hard drive)",
      "uncut livestreams — the ones that never made youtube",
      "30-min 1-on-1 office hours, every month (ableton / hardware / process)",
      "first dibs on limited drops — capsule, vinyl, mezcal",
    ],
    cta: "join the inner circle →",
    ctaHref: "https://www.patreon.com/nickhook",
  },
];

type Tier = {
  key: string;
  name: string;
  price: string;
  color: string;
  badge: string;
  pitch: string;
  perks: string[];
  cta: string;
  ctaHref: string | null;
};

const TIP_OPTIONS: { label: string; href: string; note: string; color: string }[] = [
  {
    label: "ko-fi · one-time tip",
    href: "https://ko-fi.com/nickhook",
    note: "send a few bucks. no signup needed. the lowest-friction way to throw a dollar in the jar.",
    color: "#65C7F7",
  },
  {
    label: "bandcamp · name your price",
    href: SOCIALS.bandcampNickHook ?? "https://nickhook.bandcamp.com",
    note: "support a specific record. name your price on Relationships Instrumentals + select drops.",
    color: "#7BD3A8",
  },
  {
    label: "venmo · @nickhook",
    href: "https://account.venmo.com/u/nickhook",
    note: "the homie way. for if you wanna tip after a workshop or a show.",
    color: "#F2B705",
  },
];

export default function SupportPage() {
  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        {/* HERO */}
        <header className="px-5 sm:px-8 pt-16 pb-12 border-b border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">
            SUPPORT · BROOKLYN → MEDELLÍN · SINCE 2011
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 11vw, 160px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
          >
            support
            <br />
            <span className="text-lamp">the pit.</span>
          </h1>
          <p className="font-serif italic text-[20px] sm:text-[22px] mt-6 max-w-[680px] text-paper leading-snug">
            this whole site is open. always will be. supporters get the drops i don&apos;t put out for free — monthly stems, sample packs, the archive of fifteen years in the room.
          </p>
          <p className="font-serif italic text-[16px] mt-3 max-w-[680px] text-paper-2 leading-snug">
            nick hook · run the jewels co-prod · gold records · the spacepit · calm + collect. you've been here for the music. this is how to be in the room.
          </p>
        </header>

        {/* TIER LADDER */}
        <section className="px-5 sm:px-8 py-14">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-2">
            THE LADDER
          </div>
          <h2
            className="font-display font-bold uppercase m-0 mb-8"
            style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
          >
            pick your tier
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-[1200px]">
            {TIERS.map((t) => (
              <article
                key={t.key}
                className="border border-paper bg-ink-2 p-6 flex flex-col"
                style={{ borderColor: t.color }}
              >
                <div
                  className="font-mono text-[10px] tracking-[.18em] uppercase mb-2"
                  style={{ color: t.color }}
                >
                  {t.badge}
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <h3
                    className="font-display font-bold uppercase m-0"
                    style={{ fontSize: "clamp(24px, 3vw, 32px)", lineHeight: 0.95, letterSpacing: "-0.015em" }}
                  >
                    {t.name}
                  </h3>
                  <span className="font-mono text-[14px] tracking-[.06em] ml-auto" style={{ color: t.color }}>
                    {t.price}
                  </span>
                </div>
                <p className="font-serif italic text-[15px] text-paper-2 leading-snug mb-4">
                  {t.pitch}
                </p>
                <ul className="list-none p-0 m-0 grid gap-1.5 mb-6">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-baseline gap-2 font-mono text-[11px] tracking-[.02em] text-paper leading-snug">
                      <span className="shrink-0 mt-0.5" style={{ color: t.color }} aria-hidden>·</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  {t.ctaHref ? (
                    <a
                      href={t.ctaHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center font-mono text-[12px] tracking-[.18em] uppercase px-4 py-3 border-2 transition-colors"
                      style={{
                        borderColor: t.color,
                        background: t.color,
                        color: "#0B0B0B",
                      }}
                    >
                      {t.cta}
                    </a>
                  ) : (
                    <div className="block w-full text-center font-mono text-[12px] tracking-[.18em] uppercase px-4 py-3 border-2 border-paper-2/30 text-paper-2/60">
                      {t.cta}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
          <p className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2/70 mt-6 max-w-[760px] leading-relaxed">
            paid tiers run on patreon · cancel anytime, one click · downloads stay yours · all $ goes back into the room: gear, sessions, vault drops, keeping it open
          </p>
        </section>

        {/* TIP JAR */}
        <section className="px-5 sm:px-8 py-14 border-t border-paper/20 bg-ink-2">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase text-collect mb-2">
            THE TIP JAR
          </div>
          <h2
            className="font-display font-bold uppercase m-0 mb-3"
            style={{ fontSize: "clamp(32px, 4.5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
          >
            one-time tip · no commitment
          </h2>
          <p className="font-serif italic text-[16px] text-paper-2 max-w-[680px] mb-8">
            not into a monthly thing? throw a dollar in the jar. every bit keeps the pit running. no perks, no obligations — just gratitude.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-[1080px]">
            {TIP_OPTIONS.map((t) => (
              <a
                key={t.label}
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-paper p-5 bg-ink hover:-translate-x-[2px] hover:-translate-y-[2px] transition-transform no-underline text-paper"
                style={{ boxShadow: `4px 4px 0 ${t.color}` }}
              >
                <div className="font-mono text-[10px] tracking-[.18em] uppercase mb-2" style={{ color: t.color }}>
                  one-time
                </div>
                <div className="font-display font-semibold text-[18px] uppercase tracking-[-0.005em] leading-tight mb-2">
                  {t.label}
                </div>
                <p className="font-serif italic text-[13px] text-paper-2 leading-snug">{t.note}</p>
                <div className="font-mono text-[10px] tracking-[.14em] uppercase mt-3" style={{ color: t.color }}>
                  open ↗
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* WHAT THE MONEY ACTUALLY DOES */}
        <section className="px-5 sm:px-8 py-14 border-t border-paper/20">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-2">
            TRANSPARENCY
          </div>
          <h2
            className="font-display font-bold uppercase m-0 mb-4"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.95, letterSpacing: "-0.015em" }}
          >
            where the money goes
          </h2>
          <ul className="list-none p-0 m-0 grid sm:grid-cols-2 gap-x-8 gap-y-3 max-w-[960px] font-mono text-[13px] tracking-[.02em] text-paper leading-snug">
            {[
              "hosting + domain + sanity for thespacepit (this site)",
              "new pieces of gear for the room (the rack keeps growing)",
              "session musicians + collaborators in the vault drops",
              "travel for medellín / nyc / brooklyn / global sessions",
              "monthly sample-pack production (mics, time, mastering)",
              "the mezcal · the discord · the burbuja · keeping it open",
            ].map((line) => (
              <li key={line} className="flex items-baseline gap-2 border-b border-paper/15 pb-2">
                <span className="text-lamp" aria-hidden>·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ-LITE */}
        <section className="px-5 sm:px-8 py-14 border-t border-paper/20 bg-ink-2">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-2">
            QUICK ANSWERS
          </div>
          <h2
            className="font-display font-bold uppercase m-0 mb-6"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.95, letterSpacing: "-0.015em" }}
          >
            stuff people ask
          </h2>
          <div className="grid md:grid-cols-2 gap-x-10 gap-y-6 max-w-[1080px]">
            {[
              { q: "do i need an account?", a: "for the free stuff: no. for the vault: a free patreon account (they handle the lock). the site itself stays open — no signup gates." },
              { q: "can i cancel anytime?", a: "yes. patreon handles it — one click. no questions, no clawback, your downloads stay." },
              { q: "is this only for producers?", a: "no. the music + behind-the-scenes lives are for anyone who likes the work. producer-specific perks (stems, sample packs) are bonuses if you want them." },
              { q: "what about the archive?", a: "the deep archive — paperwork from cu4tro, vault sessions from boo, decks from old projects — that's the inner circle tier. it's the stuff i normally only share in the room." },
              { q: "do paid tiers ever go down?", a: "no — once you're locked in at $5/mo or $25/mo, you stay at that price forever. only new joiners hit any future price change." },
              { q: "what if i can't pay?", a: "everything that's public stays public — the whole site is free, no ads, no algorithm. the vault is the bonus. if it's not in the budget, you're not missing the pit." },
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

        {/* CLOSING — quick link to /vault for the curious */}
        <section className="px-5 sm:px-8 py-16 border-t border-paper/30">
          <div className="max-w-[720px]">
            <p className="font-serif italic text-[20px] text-paper-2 mb-4">
              curious what's actually inside the vault?
            </p>
            <Link
              href="/vault"
              className="inline-flex items-center gap-2 font-mono text-[12px] tracking-[.18em] uppercase px-5 py-3 border-2 border-lamp text-lamp hover:bg-lamp hover:text-ink transition-colors"
            >
              <span>peek at the vault →</span>
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
