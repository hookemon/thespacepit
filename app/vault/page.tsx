import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getPacks, getVaultDrops, type VaultDropListItem } from "../_lib/sanity-queries";
import { urlFor } from "../_lib/sanity";
import { FOOTER_LINKS } from "../_lib/social-links";

export const revalidate = 300;

export const metadata = {
  title: "the vault — exclusive drops + archive · thespacepit",
  description:
    "the vault: supporter-only sample packs, behind-the-scenes from sessions, the deep archive (cu4tro paperwork, boo vault tapes, decks). unlock with patreon.",
};

/**
 * /vault — the storefront for everything supporter-gated. PULLS:
 *   1. Every Sanity `pack` with access === "vault"  (the live drops)
 *   2. Hard-coded "archive shelves" — coming-soon placeholders for the deep
 *      content that's not yet ingested but Nick wants to advertise as a perk
 *      of supporting (paperwork archives, vault sessions, deck PDFs).
 *
 * Public visitors see thumbnails + tease text + a 🔒 "unlock with patreon"
 * CTA. The actual unlock destination is the pack's vaultUrl (set per pack)
 * or the global /support page if not configured.
 */

const ARCHIVE_SHELVES: Shelf[] = [
  {
    key: "cu4tro",
    eyebrow: "CU4TRO · 2022 · RTJ × LATAM",
    title: "the cu4tro paperwork archive",
    blurb:
      "the 27-page deck. session agreements (sanitized). nick's track-by-track notes from medellín. every collaborator's role, every recording location, the full vision doc.",
    coverHint: "/cu4tro/cover.jpg",
    status: "coming",
    tier: "inner circle",
  },
  {
    key: "boo",
    eyebrow: "GANGSTA BOO + HOOK · 2017–2022",
    title: "the boo vault sessions",
    blurb:
      "every session we sat down. 19 vault recordings + voice memos + jam tapes. some never left the hard drive. dropping when nick has the time to curate it for the room.",
    coverHint: "/boo/halloween-hero.jpg",
    status: "coming",
    tier: "inner circle",
  },
  {
    key: "livestreams",
    eyebrow: "THESPACEPIT · 2020–2026",
    title: "uncut livestream archive",
    blurb:
      "the long-form versions of every twitch + youtube stream — the parts that got cut before youtube upload. raw, unedited, the actual studio rhythm.",
    coverHint: null,
    status: "coming",
    tier: "vault",
  },
  {
    key: "stems",
    eyebrow: "RELATIONSHIPS · INSTRUMENTALS · 2018",
    title: "the relationships stems",
    blurb:
      "every track, broken out into individual stems. drums, keys, bass, vocals, fx. drop them in ableton and remix the whole record. monthly drop.",
    coverHint: null,
    status: "coming",
    tier: "vault",
  },
  {
    key: "decks",
    eyebrow: "ARCHIVES · 2008–2024",
    title: "tour books · decks · ephemera",
    blurb:
      "the MWC tour book. the CZ press kit. the cu4tro vision deck. the rtj pitch decks. the artifacts behind 20 years of records.",
    coverHint: null,
    status: "coming",
    tier: "inner circle",
  },
];

type Shelf = {
  key: string;
  eyebrow: string;
  title: string;
  blurb: string;
  coverHint: string | null;
  status: "live" | "coming";
  tier: "vault" | "inner circle";
};

export default async function VaultPage() {
  const [allPacks, vaultDrops] = await Promise.all([getPacks(), getVaultDrops()]);
  const vaultPacks = allPacks.filter((p) => p.access === "vault");

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        {/* HERO */}
        <header className="px-5 sm:px-8 pt-16 pb-12 border-b border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2 flex items-center gap-2">
            <span aria-hidden>🔒</span>
            THE VAULT · SUPPORTER UNLOCK
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 11vw, 160px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
          >
            the vault
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[760px] text-paper-2">
            the stuff that doesn't go on the public site. monthly drops, the deep archive, sessions that never left the room. unlock everything for $5/mo. the inner circle ($25/mo) gets the paperwork too.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/support"
              className="font-mono text-[12px] tracking-[.18em] uppercase px-5 py-3 border-2 border-lamp bg-lamp text-ink hover:bg-paper hover:border-paper transition-colors"
            >
              unlock the vault →
            </Link>
            <Link
              href="/packs"
              className="font-mono text-[12px] tracking-[.18em] uppercase px-5 py-3 border-2 border-paper text-paper hover:bg-paper hover:text-ink transition-colors"
            >
              free packs ←
            </Link>
          </div>
        </header>

        {/* LIVE VAULT DROPS — every pack with access === "vault" */}
        {vaultPacks.length > 0 ? (
          <section className="px-5 sm:px-8 py-14 border-b border-paper/20">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-2 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-lamp animate-pulse" />
              LIVE NOW · {vaultPacks.length} {vaultPacks.length === 1 ? "drop" : "drops"}
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-8"
              style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
            >
              vault drops
            </h2>
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {vaultPacks.map((p) => {
                const cover = p.cover ? urlFor(p.cover).width(720).height(720).fit("crop").url() : null;
                const href = p.vaultUrl ?? "/support";
                return (
                  <a
                    key={p._id}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="group block border border-paper bg-ink-2 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#F2B705] transition-all duration-150 overflow-hidden no-underline text-paper"
                  >
                    <div className="aspect-square border-b border-paper bg-ink-2 overflow-hidden relative">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover blur-[3px] group-hover:blur-0 brightness-75 group-hover:brightness-100 transition-all"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center p-4 text-center font-display uppercase text-paper-2">
                          {p.name}
                        </div>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-ink/40 group-hover:bg-ink/70 transition-colors pointer-events-none">
                        <div className="text-[48px]" aria-hidden>🔒</div>
                        <div className="font-mono text-[10px] tracking-[.18em] uppercase text-lamp mt-1">
                          patron unlock
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="font-display font-semibold text-[18px] uppercase tracking-[-0.005em] leading-tight line-clamp-2">
                        {p.name}
                      </div>
                      {p.tagline && (
                        <p className="font-serif italic text-[14px] text-paper-2 leading-snug mt-1.5 line-clamp-2">
                          {p.tagline}
                        </p>
                      )}
                      <div className="font-mono text-[10px] tracking-[.14em] uppercase mt-3 text-lamp">
                        unlock w/ patreon →
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="px-5 sm:px-8 py-14 border-b border-paper/20">
            <p className="font-serif italic text-[18px] text-paper-2 max-w-[680px]">
              first vault drop coming soon. supporters get every drop the day it lands. become a patron now and you'll catch the very first one.
            </p>
          </section>
        )}

        {/* PATREON-SYNCED DROPS — fresh from Patreon, auto-synced */}
        {vaultDrops.length > 0 && (
          <section className="px-5 sm:px-8 py-14 border-b border-paper/20">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-2 flex items-center gap-2">
              <span aria-hidden>◉</span>
              FRESH FROM PATREON · {vaultDrops.length} {vaultDrops.length === 1 ? "drop" : "drops"}
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-8"
              style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
            >
              the feed
            </h2>
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
              {vaultDrops.map((d) => (
                <VaultDropCard key={d._id} d={d} />
              ))}
            </div>
          </section>
        )}

        {/* THE ARCHIVE SHELVES — coming-soon previews */}
        <section className="px-5 sm:px-8 py-14">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase text-collect mb-2">
            THE ARCHIVE · WHAT'S BEING CURATED
          </div>
          <h2
            className="font-display font-bold uppercase m-0 mb-3"
            style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
          >
            what's coming
          </h2>
          <p className="font-serif italic text-[16px] text-paper-2 max-w-[760px] mb-8">
            20 years of records, sessions, tour books, and the stuff that never made the public. nick is opening up the archive one shelf at a time — supporters get first access to everything as it goes up.
          </p>
          <div className="grid md:grid-cols-2 gap-5 max-w-[1180px]">
            {ARCHIVE_SHELVES.map((s) => {
              const tierColor = s.tier === "inner circle" ? "#E83A1C" : "#F2B705";
              return (
                <article
                  key={s.key}
                  className="border border-paper bg-ink-2 overflow-hidden"
                  style={{ borderColor: s.status === "live" ? tierColor : undefined }}
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-[180px] sm:shrink-0 aspect-square sm:aspect-auto bg-ink relative overflow-hidden border-b sm:border-b-0 sm:border-r border-paper">
                      {s.coverHint ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.coverHint}
                          alt=""
                          aria-hidden
                          className="w-full h-full object-cover brightness-50 blur-[2px]"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center font-display uppercase text-paper-2/40 text-2xl">
                          ▦
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[56px]" aria-hidden>🔒</span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="font-mono text-[10px] tracking-[.14em] uppercase mb-1" style={{ color: tierColor }}>
                        {s.eyebrow}
                      </div>
                      <h3 className="font-display font-semibold text-[20px] uppercase tracking-[-0.005em] leading-tight m-0 mb-2">
                        {s.title}
                      </h3>
                      <p className="font-serif italic text-[14px] text-paper-2 leading-snug mb-3 flex-1">
                        {s.blurb}
                      </p>
                      <div className="flex items-center justify-between gap-3 mt-auto">
                        <span
                          className="font-mono text-[9px] tracking-[.18em] uppercase px-2 py-0.5 rounded-full"
                          style={{
                            background: s.status === "live" ? tierColor : "transparent",
                            color: s.status === "live" ? "#0B0B0B" : tierColor,
                            border: `1px solid ${tierColor}`,
                          }}
                        >
                          {s.status === "live" ? "live in vault" : "curating"}
                        </span>
                        <span className="font-mono text-[9px] tracking-[.14em] uppercase text-paper-2">
                          {s.tier}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* CLOSER */}
        <section className="px-5 sm:px-8 py-14 border-t border-paper/30 bg-ink-2">
          <div className="max-w-[720px]">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-2">
              UNLOCK
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-3"
              style={{ fontSize: "clamp(40px, 7vw, 80px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
            >
              come thru
            </h2>
            <p className="font-serif italic text-[18px] text-paper-2 mb-6">
              $5/mo gets you the vault drops + a #vault discord channel. $25/mo gets you the archive too — paperwork, decks, vault sessions, the office hours.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/support"
                className="inline-flex items-center gap-2 font-mono text-[12px] tracking-[.18em] uppercase px-5 py-3 border-2 border-lamp bg-lamp text-ink hover:bg-paper hover:border-paper transition-colors"
              >
                see the tiers →
              </Link>
              <a
                href="https://www.patreon.com/nickhook"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-[12px] tracking-[.18em] uppercase px-5 py-3 border-2 border-paper text-paper hover:bg-paper hover:text-ink transition-colors"
              >
                straight to patreon ↗
              </a>
            </div>
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

/* ============================================================================
 * Vault drop card — renders a single Patreon-synced item. Cover is blurred +
 * dimmed for paid posts (the lock is the headline visual). Public previews
 * (isPaid === false) get the full image clean.
 *
 * Tier badge derives from minCentsPledged:
 *   500   = "$5 tier"   (vault)
 *   2500  = "$25 tier"  (inner circle)
 *   else  = "patrons"   (any tier)
 * ========================================================================== */
function tierLabel(cents: number | null | undefined): { label: string; color: string } {
  if (!cents || cents === 0) return { label: "patrons", color: "#F2B705" };
  if (cents <= 500)          return { label: "$5+ tier", color: "#F2B705" };
  if (cents <= 2500)         return { label: "$25+ tier", color: "#E83A1C" };
  return { label: `$${Math.round(cents / 100)}+ tier`, color: "#E83A1C" };
}

const KIND_LABEL_VD: Record<VaultDropListItem["kind"], string> = {
  "post":         "story",
  "video":        "video",
  "audio":        "audio · stems",
  "pdf":          "pdf · deck",
  "sample-pack":  "sample pack",
  "session":      "session",
  "office-hours": "office hours",
};

function VaultDropCard({ d }: { d: VaultDropListItem }) {
  const isLocked = d.isPaid !== false; // default to locked if unset
  const tier = tierLabel(d.minCentsPledged);
  const cover = d.cover
    ? urlFor(d.cover).width(800).height(450).fit("crop").url()
    : d.coverUrl ?? null;
  const href = d.patreonUrl ?? "/support";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border border-paper bg-ink-2 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#F2B705] transition-all duration-150 overflow-hidden no-underline text-paper"
    >
      <div className="aspect-[16/9] border-b border-paper bg-ink overflow-hidden relative">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={d.title}
            loading="lazy"
            className={`w-full h-full object-cover transition-all ${
              isLocked
                ? "blur-[3px] brightness-50 group-hover:blur-[1px] group-hover:brightness-75"
                : ""
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-display uppercase text-paper-2/30 text-3xl">
            ▦
          </div>
        )}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
            <div className="text-[42px]" aria-hidden>🔒</div>
          </div>
        )}
        {/* Tier badge — top right */}
        <div
          className="absolute top-2 right-2 font-mono text-[9px] tracking-[.14em] uppercase px-2 py-0.5 rounded-full"
          style={{
            background: isLocked ? tier.color : "#7BD3A8",
            color: "#0B0B0B",
          }}
        >
          {isLocked ? tier.label : "preview"}
        </div>
        {/* Kind badge — top left */}
        <div className="absolute top-2 left-2 font-mono text-[9px] tracking-[.14em] uppercase px-2 py-0.5 rounded-full bg-ink/85 backdrop-blur-sm text-paper border border-paper">
          {KIND_LABEL_VD[d.kind]}
        </div>
      </div>
      <div className="p-4">
        <div className="font-display font-semibold text-[18px] uppercase tracking-[-0.005em] leading-tight line-clamp-2">
          {d.title}
        </div>
        {d.excerpt && (
          <p className="font-serif italic text-[14px] text-paper-2 leading-snug mt-1.5 line-clamp-3">
            {d.excerpt}
          </p>
        )}
        <div className="flex items-baseline justify-between gap-3 mt-3">
          {d.publishedAt && (
            <span className="font-mono text-[9px] tracking-[.12em] uppercase text-paper-2/70 tabular-nums">
              {new Date(d.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </span>
          )}
          <span className="font-mono text-[10px] tracking-[.14em] uppercase ml-auto" style={{ color: isLocked ? tier.color : "#7BD3A8" }}>
            {isLocked ? "unlock on patreon →" : "read on patreon →"}
          </span>
        </div>
      </div>
    </a>
  );
}
