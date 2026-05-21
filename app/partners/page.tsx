import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getBrands } from "../_lib/sanity-queries";
import { urlFor } from "../_lib/sanity";
import { FOOTER_LINKS } from "../_lib/social-links";

export const revalidate = 3600;

export const metadata = {
  title: "partners — nick hook",
  description: "brands i work with. teenage engineering, ableton, and the rest.",
};

// Visual tier colors. Maps `relationship` → accent stripe + chip background
// so a glance at the card tells you how deep the partnership runs.
const RELATIONSHIP_COLORS: Record<string, string> = {
  "artist mentor":   "#F2B705", // lamp — top-tier (TE, Moog)
  "ambassador":      "#E83A1C", // redline — official brand voice (Roland)
  "official artist": "#0E4B3A", // collect green — endorsed (Serato)
  "collaborator":    "#7AFB0D", // slime — deep working relationship (Ableton, Boiler Room)
  "artist":          "#C9B9E8", // calllm — they're an artist Nick has worked with (Eventide)
  "alumnus":         "#F2B705", // lamp — RBMA
  "documented":      "#8C8677", // mute — covered by them (Vice/Noisey)
  "endorsement":     "#F2B705",
  "occasional":      "#8C8677",
};

function relColor(r?: string) {
  return (r && RELATIONSHIP_COLORS[r]) || "#F4EFE6";
}

export default async function PartnersIndex() {
  const brands = await getBrands(60);
  const featured = brands.filter((b: any) => b.featured);
  const rest = brands.filter((b: any) => !b.featured);

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="nick" />
      <main className="flex-1">

        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <header className="px-5 sm:px-8 pt-16 pb-8 border-b-2 border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">
            PARTNERS · GEAR · FAMILY · {brands.length} BRANDS
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            partners
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[640px] text-paper-2">
            the brands and teams i work with closely. mentor, collaborator, ambassador, family.
            each one has a page with the story + videos.
          </p>
        </header>

        {/* ── FEATURED RAIL ─────────────────────────────────────────────── */}
        {featured.length > 0 && (
          <section className="px-5 sm:px-8 pt-12 pb-6">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-5 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-lamp" aria-hidden />
              FEATURED · {featured.length} OF {brands.length}
            </div>

            <div className="grid gap-5 sm:gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))" }}>
              {featured.map((b: any) => <FeaturedCard key={b._id} b={b} />)}
            </div>
          </section>
        )}

        {/* ── THE REST ──────────────────────────────────────────────────── */}
        {rest.length > 0 && (
          <section className="px-5 sm:px-8 pt-10 pb-16 border-t border-paper/15 mt-6">
            <div className="font-mono text-[11px] tracking-[.18em] uppercase text-paper-2 mb-5">
              THE WIDER FAMILY · {rest.length}
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
              {rest.map((b: any) => <SmallCard key={b._id} b={b} />)}
            </div>
          </section>
        )}
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

/**
 * Featured card — magazine-style: wide aspect (3:2), full-bleed bg, logo
 * sized to ~55% in the upper half, relationship-color accent stripe at
 * top, copy slab at the bottom (always visible).
 */
function FeaturedCard({ b }: { b: any }) {
  const logo = b.logo ? urlFor(b.logo).width(800).height(800).fit("max").url() : null;
  const bg = b.backgroundImage ? urlFor(b.backgroundImage).width(1600).height(1066).fit("crop").url() : null;
  const accent = relColor(b.relationship);
  return (
    <Link
      href={`/partners/${b.slug}`}
      className="group block no-underline text-paper transition-transform duration-200 hover:-translate-x-[3px] hover:-translate-y-[3px]"
      style={{ ["--accent" as string]: accent }}
    >
      <article
        className="relative border-2 border-paper overflow-hidden bg-ink-2 transition-shadow group-hover:shadow-[5px_5px_0_var(--accent)]"
        style={{ aspectRatio: "3 / 2", background: bg ? "#0B0B0B" : (b.logoColor ?? "#1C1A17") }}
      >
        {/* Top accent stripe — tier color */}
        <div className="absolute top-0 left-0 right-0 h-[5px] z-[3]" style={{ background: accent }} aria-hidden />

        {/* Background image */}
        {bg && (
          <img
            src={bg}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        )}

        {/* Subtle bottom-to-top dark gradient — ensures the copy slab is always legible */}
        {bg && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(11,11,11,0) 0%, rgba(11,11,11,0) 35%, rgba(11,11,11,0.85) 100%)" }}
          />
        )}

        {/* Logo block — upper 60% of the card. Logos go nearly edge-to-edge
            now (max-w-[94%]) so wide wordmarks like moog / RBMA / lot radio
            land big. object-contain still preserves aspect — nothing
            cropped, just sized up. */}
        <div className="absolute top-[5px] bottom-[42%] left-0 right-0 flex items-center justify-center p-5 sm:p-6">
          {logo ? (
            <img
              src={logo}
              alt={b.name}
              className="max-w-[94%] max-h-full object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]"
              loading="lazy"
            />
          ) : (
            <span
              className="font-display font-black uppercase text-center leading-[0.9] drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] text-paper"
              style={{ fontSize: "clamp(36px, 5vw, 72px)", letterSpacing: "-0.025em" }}
            >
              {b.name}
            </span>
          )}
        </div>

        {/* Copy slab — bottom 40%, always visible. When the logo IS the
            wordmark (most brand logos), printing the brand name again in
            Antonio display below is redundant and competes with the mark
            itself. So if a logo exists we render the name as a tiny mono
            label only; if there's no logo, the Antonio display name comes
            back as the primary brand identifier. */}
        <div className="absolute left-0 right-0 bottom-0 px-5 sm:px-7 py-4 sm:py-5 z-[2]">
          <div
            className="font-mono text-[10px] tracking-[.18em] uppercase mb-2"
            style={{ color: accent }}
          >
            ◌ {b.relationship ?? "partner"}
          </div>
          {!logo && (
            <div
              className="font-display font-bold uppercase leading-[0.95] m-0 text-paper"
              style={{ fontSize: "clamp(22px, 2.5vw, 32px)", letterSpacing: "-0.01em" }}
            >
              {b.name}
            </div>
          )}
          {b.tagline && (
            <div className="font-serif italic text-[14px] sm:text-[15px] text-on-dark mt-1.5 line-clamp-2 max-w-[42ch]">
              {b.tagline}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

/**
 * Small card — tighter aspect (4:5 portrait-leaning), bg + logo + name +
 * relationship label below. No always-visible copy slab — relies on
 * editorial brevity.
 */
function SmallCard({ b }: { b: any }) {
  const logo = b.logo ? urlFor(b.logo).width(640).height(640).fit("max").url() : null;
  const bg = b.backgroundImage ? urlFor(b.backgroundImage).width(960).height(1200).fit("crop").url() : null;
  const accent = relColor(b.relationship);
  return (
    <Link
      href={`/partners/${b.slug}`}
      className="group block no-underline text-paper transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px]"
      style={{ ["--accent" as string]: accent }}
    >
      <article
        className="relative border border-paper overflow-hidden bg-ink-2 transition-shadow group-hover:shadow-[4px_4px_0_var(--accent)]"
        style={{ aspectRatio: "4 / 5", background: bg ? "#0B0B0B" : (b.logoColor ?? "#1C1A17") }}
      >
        {/* Top accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-[3px] z-[3]" style={{ background: accent }} aria-hidden />

        {bg && (
          <img
            src={bg}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        )}

        {/* Soft dark vignette so the logo reads on any bg */}
        {bg && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(11,11,11,0.15) 0%, rgba(11,11,11,0.55) 100%)" }}
          />
        )}

        {/* Logo — let it fill nearly the whole card (logos are square or
            wide wordmarks; either way more room reads better). The card
            below carries the metadata strip; the card itself is just the
            brand mark. */}
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-5">
          {logo ? (
            <img
              src={logo}
              alt={b.name}
              className="max-w-[92%] max-h-[78%] object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
              loading="lazy"
            />
          ) : (
            <span
              className="font-display font-black uppercase text-center leading-[0.9] drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] text-paper"
              style={{ fontSize: "clamp(24px, 4.5vw, 44px)", letterSpacing: "-0.02em" }}
            >
              {b.name}
            </span>
          )}
        </div>
      </article>

      <div className="mt-2.5">
        <div
          className="font-mono text-[9px] tracking-[.16em] uppercase"
          style={{ color: accent }}
        >
          ◌ {b.relationship ?? "partner"}
        </div>
        {/* Below-card brand name: outside the card, this acts as the
            caption / search-target, so we keep it even when the logo is
            present — but smaller so the visual hierarchy reads as
            logo-first, name-as-caption. */}
        <div className="font-display font-semibold text-[16px] uppercase tracking-[-0.005em] leading-tight mt-0.5 text-paper">
          {b.name}
        </div>
        {b.tagline && (
          <div className="font-serif italic text-[13px] text-paper-2 mt-1 line-clamp-2">
            {b.tagline}
          </div>
        )}
      </div>
    </Link>
  );
}
