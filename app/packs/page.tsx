import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { NewsletterSection } from "../_components/shared/NewsletterSection";
import { getPacks, type PackKind, type PackAccess } from "../_lib/sanity-queries";
import { urlFor } from "../_lib/sanity";
import { FOOTER_LINKS } from "../_lib/social-links";

export const revalidate = 300;

export const metadata = {
  title: "packs — thespacepit",
  description:
    "sample packs, drum kits, presets, templates. straight from nick's rig. cop on gumroad.",
};

const KIND_LABEL: Record<PackKind, string> = {
  "sample-pack": "sample pack",
  "preset-pack": "preset pack",
  "template":    "template",
  "tutorial":    "tutorial / 1-on-1",
  "loop-pack":   "loop pack",
  "drum-kit":    "drum kit",
};

const KIND_COLOR: Record<PackKind, string> = {
  "sample-pack": "#F2B705",
  "preset-pack": "#C9B9E8",
  "template":    "#7BD3A8",
  "tutorial":    "#E83A1C",
  "loop-pack":   "#65C7F7",
  "drum-kit":    "#FF6FB5",
};

// Per-access UI affordances. FREE packs read green with a download arrow.
// VAULT packs read lamp-amber w/ a lock — "unlock with patreon."
// PURCHASE packs read red w/ a cart — "cop on gumroad/bandcamp."
const ACCESS_META: Record<PackAccess, { label: string; cta: string; color: string; icon: string }> = {
  free:     { label: "free",     cta: "download ↓",    color: "#7BD3A8", icon: "↓" },
  vault:    { label: "vault",    cta: "unlock w/ patreon →", color: "#F2B705", icon: "🔒" },
  purchase: { label: "purchase", cta: "cop ↗",         color: "#E83A1C", icon: "↗" },
};

function resolveAccess(p: { access?: PackAccess }): PackAccess {
  return p.access ?? "free";
}

function resolveHref(p: { access?: PackAccess; vaultUrl?: string; downloadUrl?: string }): string {
  const access = resolveAccess(p);
  if (access === "vault") return p.vaultUrl ?? p.downloadUrl ?? "#";
  return p.downloadUrl ?? p.vaultUrl ?? "#";
}

export default async function PacksPage() {
  const packs = await getPacks();

  // Bucket the packs by access tier so the rails read like a tier ladder:
  // free (try it now) → vault (supporter unlock) → purchase (one-time pay).
  const freePacks     = packs.filter((p) => resolveAccess(p) === "free");
  const vaultPacks    = packs.filter((p) => resolveAccess(p) === "vault");
  const purchasePacks = packs.filter((p) => resolveAccess(p) === "purchase");

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        <header className="px-5 sm:px-8 pt-16 pb-10 border-b border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">
            THE PACKS · FREE + VAULT + COP
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            sample packs
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[720px] text-paper-2">
            sample packs, drum kits, presets, ableton move templates, 1-on-1 sessions. straight from the rig at thespacepit + la burbuja. <Link href="/support" className="underline decoration-lamp underline-offset-4 text-paper hover:text-lamp">support the pit</Link> to unlock the vault.
          </p>
        </header>

        {/* === FREE RAIL — anyone can grab these === */}
        {freePacks.length > 0 && (
          <PackRail
            eyebrow="ON THE HOUSE · FREE"
            title="free packs"
            blurb="straight download. no signup. start chopping."
            packs={freePacks}
          />
        )}

        {/* === VAULT RAIL — supporter unlock === */}
        {vaultPacks.length > 0 && (
          <PackRail
            eyebrow="THE VAULT · SUPPORTER UNLOCK"
            title="vault packs"
            blurb="deeper. weirder. the stuff that wouldn't survive a public release. unlock the vault to get every drop."
            packs={vaultPacks}
            tier="vault"
          />
        )}

        {/* === PURCHASE RAIL — one-time pay === */}
        {purchasePacks.length > 0 && (
          <PackRail
            eyebrow="ON GUMROAD · PURCHASE"
            title="cop a pack"
            blurb="one-time pay. all yours forever."
            packs={purchasePacks}
          />
        )}

        {packs.length === 0 && (
          <p className="px-5 sm:px-8 py-12 font-serif italic text-[20px] text-paper-2">no packs yet.</p>
        )}

        <NewsletterSection
          source="packs"
          blurb="new pack drops, sessions, and behind-the-scenes from the pit — first in your inbox. no spam, no sales."
        />

        {/* === SUPPORT CTA — closes the page with the pitch === */}
        <section className="px-5 sm:px-8 py-16 border-t border-paper/30 bg-ink-2">
          <div className="max-w-[720px]">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-2">
              UNLOCK EVERYTHING
            </div>
            <h2
              className="font-display font-bold uppercase m-0 mb-3"
              style={{ fontSize: "clamp(40px, 7vw, 80px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
            >
              join the pit
            </h2>
            <p className="font-serif italic text-[18px] text-paper-2 mb-6">
              every vault drop + behind-the-scenes from sessions + the archive (RTJ Cu4tro paperwork, Boo vault tapes, decks, stems). monthly support keeps the pit lit.
            </p>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 font-mono text-[12px] tracking-[.18em] uppercase px-5 py-3 border-2 border-lamp bg-lamp text-ink hover:bg-paper hover:border-paper transition-colors"
            >
              <span>support thespacepit</span>
              <span aria-hidden>→</span>
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
        newsletter={false}
      />
    </div>
  );
}

/* =============================================================================
 * Pack rail — section header + grid of pack cards. Reused for free/vault/buy.
 * ========================================================================== */
function PackRail({
  eyebrow, title, blurb, packs, tier,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  packs: Awaited<ReturnType<typeof getPacks>>;
  tier?: "vault";
}) {
  return (
    <section className="px-5 sm:px-8 py-10 border-b border-paper/20">
      <div className="flex items-baseline gap-3 flex-wrap mb-2">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: tier === "vault" ? "#F2B705" : "#7BD3A8" }}
          aria-hidden
        />
        <div className="font-mono text-[11px] tracking-[.18em] uppercase" style={{ color: tier === "vault" ? "#F2B705" : "#7BD3A8" }}>
          {eyebrow}
        </div>
      </div>
      <h2
        className="font-display font-bold uppercase m-0"
        style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
      >
        {title}
      </h2>
      <p className="font-serif italic text-[16px] text-paper-2 mt-2 mb-6 max-w-[680px]">
        {blurb}
      </p>
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {packs.map((p) => <PackCard key={p._id} p={p} />)}
      </div>
    </section>
  );
}

function PackCard({ p }: { p: Awaited<ReturnType<typeof getPacks>>[number] }) {
  const cover = p.cover ? urlFor(p.cover).width(720).height(720).fit("crop").url() : null;
  const color = KIND_COLOR[p.kind] ?? "#F2B705";
  const access = resolveAccess(p);
  const accessMeta = ACCESS_META[access];
  const href = resolveHref(p);
  const isLocked = access === "vault";
  return (
    <Link
      key={p._id}
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="group block border border-paper bg-ink-2 hover:-translate-x-[3px] hover:-translate-y-[3px] transition-transform duration-150 overflow-hidden no-underline text-paper"
      style={{ boxShadow: "none" }}
      // Inline hover so each card glows in its access color.
    >
      <div className="aspect-square border-b border-paper bg-ink-2 overflow-hidden relative">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={p.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-all ${isLocked ? "blur-[3px] group-hover:blur-0 brightness-75 group-hover:brightness-100" : ""}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center font-display uppercase text-paper-2">
            {p.name}
          </div>
        )}
        {/* Access badge — top right. Always visible. */}
        <div
          className="absolute top-2 right-2 font-mono text-[9px] tracking-[.14em] uppercase px-2 py-0.5 rounded-full flex items-center gap-1"
          style={{
            background: accessMeta.color,
            color: "#0B0B0B",
          }}
        >
          <span aria-hidden>{accessMeta.icon}</span>
          <span>{accessMeta.label}</span>
        </div>
        {p.featured && (
          <div
            className="absolute top-2 left-2 font-mono text-[9px] tracking-[.14em] uppercase px-2 py-0.5 rounded-full"
            style={{ background: color, color: "#0B0B0B" }}
          >
            featured
          </div>
        )}
        {/* Vault overlay — big LOCK + supporter pitch on hover. Makes the
            paywall obvious without burying the cover. */}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-ink/40 group-hover:bg-ink/70 transition-colors pointer-events-none">
            <div className="text-[40px] mb-1" aria-hidden>🔒</div>
            <div className="font-mono text-[10px] tracking-[.18em] uppercase text-lamp">
              vault unlock
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
          <div className="font-mono text-[10px] tracking-[.14em] uppercase" style={{ color }}>
            {KIND_LABEL[p.kind]}
          </div>
          {p.price && (
            <div className="ml-auto font-mono text-[10px] tracking-[.1em] uppercase text-paper-2">
              {p.price}
            </div>
          )}
        </div>
        <div className="font-display font-semibold text-[20px] uppercase tracking-[-0.005em] leading-tight line-clamp-2">
          {p.name}
        </div>
        {p.tagline && (
          <p className="font-serif italic text-[14px] text-paper-2 leading-snug mt-1.5 line-clamp-2">
            {p.tagline}
          </p>
        )}
        <div
          className="font-mono text-[10px] tracking-[.14em] uppercase mt-3 transition-colors"
          style={{ color: accessMeta.color }}
        >
          {accessMeta.cta}
        </div>
      </div>
    </Link>
  );
}
