/**
 * /medellin — Nick's Medellín world hub.
 *
 * Cross-domain aggregator page: studio, writing camp, party, scene, people,
 * incoming, the footage. Pulls live from the catalog rather than maintaining
 * a separate doc — every section is automatically populated by data tagged
 * `medellin` (videos), city = Medellín / Colombia (places, artists), or
 * linked into the place doc for La Burbuja / MMW.
 *
 * Design notes:
 *  - First-class route, NOT nested under /places (place schema is for map
 *    pins with lat/lng — a city hub needs a different shape).
 *  - Warm terracotta + sunset accent palette specific to this page so it
 *    feels distinctly Medellín, not a generic catalog template.
 *  - Antonio display headlines as on the rest of the site, but loosened
 *    a touch (less compressed) to feel like sun-warmed billboards.
 */
import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { sanityFetch, urlFor } from "../_lib/sanity";
import { FOOTER_LINKS } from "../_lib/social-links";
import { groq } from "next-sanity";

export const revalidate = 3600;

export const metadata = {
  title: "medellín — thespacepit",
  description:
    "the second city. studio at la burbuja, calm + collect nights, medellín music week writing camps, the paisa scene. everything from the colombia side of the spacepit.",
};

// ── Medellín palette — warm earth + sunset, used ONLY on this page so it
// reads distinctly from the dark-ink + cream rest-of-site. Hexes match the
// general design system family but lean sunward.
const PAL = {
  ink: "#1A0D08",          // deep terracotta-black
  paper: "#F4EDD8",        // warm cream
  ember: "#E8541F",        // sunset / sacral
  paisa: "#C84B2C",        // muted terracotta
  marigold: "#F2B705",     // lamp amber (shared system color)
  jade: "#3E8E5A",         // chakra-heart green (shared)
  shadow: "#0F0604",
};

// ── Queries — keep them all here at the top so the page-level data flow
// is legible at a glance.
const Q_VIDEOS = groq`
  *[_type == "video" && "medellin" in tags && hidden != true]{
    _id, title, youtubeId,
    "thumbnailUrl": "https://i.ytimg.com/vi/" + youtubeId + "/hqdefault.jpg",
    tags
  } | order(title)
`;
const Q_PLACES = groq`
  *[_type == "place" && (city match "*Medell*" || country match "*Colomb*")]{
    _id, name, "slug": slug.current, kind, tagline, city, country,
    "heroUrl": hero.asset->url
  }
`;
const Q_ARTISTS = groq`
  *[_type == "artist" && (city match "*Medell*" || city match "*Bogot*" || city match "*Colomb*") && name != "Nick Hook"]{
    _id, name, "slug": slug.current, city, tagline, portrait
  } | order(name)
`;
const Q_INCOMING = groq`
  *[_type == "release" && (
    notes[].children[].text match "*Medell*" ||
    notes[].children[].text match "*Colomb*" ||
    tagline match "*Medell*" || tagline match "*Colomb*"
  )]{
    _id, title, "slug": slug.current, year, tagline, cover, status
  } | order(year desc)
`;

type Video = {
  _id: string;
  title: string;
  youtubeId: string;
  thumbnailUrl: string;
  tags: string[];
};
type Place = {
  _id: string;
  name: string;
  slug: string;
  kind: string;
  tagline?: string;
  city?: string;
  country?: string;
  heroUrl?: string;
};
type Artist = {
  _id: string;
  name: string;
  slug: string;
  city?: string;
  tagline?: string;
  portrait?: any;
};
type Incoming = {
  _id: string;
  title: string;
  slug: string;
  year?: number;
  tagline?: string;
  cover?: any;
  status?: string;
};

// Sub-bucket videos by intent so the page can tell sub-stories. Title
// keywords + tag overlap drive the bucket; "everything else" lands in the
// archive.
function bucket(videos: Video[]) {
  const t = (v: Video) => v.title.toLowerCase();
  const writingCamp = videos.filter(
    (v) => /writing camp|teenage engineering|TE|eternal research|demon box|music week/i.test(v.title),
  );
  const party = videos.filter(
    (v) =>
      /calm \+ collect presents|este jueves|loosies|kid kreep|logo no logo|live session/i.test(v.title) &&
      !writingCamp.includes(v),
  );
  const studio = videos.filter(
    (v) =>
      /from the studio|live from|burbuja|rio claro|caves|improv/i.test(v.title) &&
      !writingCamp.includes(v) &&
      !party.includes(v),
  );
  const usedIds = new Set([...writingCamp, ...party, ...studio].map((v) => v._id));
  const rest = videos.filter((v) => !usedIds.has(v._id));
  return { writingCamp, party, studio, rest };
}

export default async function MedellinPage() {
  const [videos, places, artists, incoming] = await Promise.all([
    sanityFetch<Video[]>(Q_VIDEOS),
    sanityFetch<Place[]>(Q_PLACES),
    sanityFetch<Artist[]>(Q_ARTISTS),
    sanityFetch<Incoming[]>(Q_INCOMING),
  ]);

  const { writingCamp, party, studio, rest } = bucket(videos as Video[]);
  const burbuja = (places as Place[]).find((p: Place) => p.slug.includes("burbuja"));
  // mmw reserved for a future "music week" section — referenced in copy
  // but not rendered as its own block yet.
  void (places as Place[]).find((p: Place) => p.name.toLowerCase().includes("music week"));

  return (
    <div className="min-h-screen flex flex-col flex-1" style={{ background: PAL.ink, color: PAL.paper }}>
      <TopNav current="spacepit" />

      <main className="flex-1">
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden border-b-2"
          style={{ borderColor: PAL.paper, background: PAL.shadow }}
        >
          {/* Background — stylized topo of the Aburrá Valley + Cordillera
              Central. Pure SVG, no third-party map tiles. Contour rings
              are elongated N-S to mirror the actual valley geometry; line
              opacity ramps from center outward to suggest elevation. */}
          <AburraTopo />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 35%, transparent 0%, rgba(15,6,4,0.4) 55%, rgba(15,6,4,0.85) 100%)`,
            }}
          />

          <div className="relative px-5 sm:px-8 pt-24 pb-20 sm:pt-32 sm:pb-28">
            <div className="max-w-[1200px] mx-auto">
              <div
                className="font-mono text-[11px] tracking-[.22em] uppercase mb-4"
                style={{ color: PAL.marigold }}
              >
                ◌ THE SECOND CITY · LA SEGUNDA CASA · {videos.length} TRANSMISSIONS
              </div>
              <h1
                className="font-display font-black m-0 lowercase"
                style={{
                  fontSize: "clamp(72px, 13vw, 220px)",
                  lineHeight: 0.85,
                  letterSpacing: "-0.035em",
                  color: PAL.paper,
                  textShadow: `0 4px 24px ${PAL.shadow}`,
                }}
              >
                medellín
              </h1>
              <p
                className="font-serif italic mt-6 max-w-[680px]"
                style={{ fontSize: "clamp(20px, 2.2vw, 28px)", lineHeight: 1.3, color: PAL.paper }}
              >
                cu4tro pulled me down. I stayed. the studio at la burbuja, the writing
                camps at music week, the calm + collect nights, the paisa scene that
                rewrote the way I work.
              </p>

              {/* Quick-jump anchor chips */}
              <div className="mt-10 flex flex-wrap gap-2.5">
                {[
                  ["#studio", "the studio"],
                  ["#writing-camp", "writing camp"],
                  ["#the-party", "the party"],
                  ["#the-people", "the people"],
                  ["#incoming", "incoming"],
                  ["#archive", "archive"],
                ].map(([href, label]) => (
                  <a
                    key={href}
                    href={href}
                    className="font-mono text-[10px] tracking-[.16em] uppercase px-3 py-1.5 rounded-full no-underline transition-colors"
                    style={{
                      border: `1px solid ${PAL.paper}55`,
                      color: PAL.paper,
                      background: "transparent",
                    }}
                  >
                    {label} ↓
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── THE STUDIO ───────────────────────────────────────────── */}
        <Section id="studio" eyebrow="01" title="the studio" subtitle="la burbuja · el bunker · live from the room">
          {burbuja && (
            <Link
              href={`/places/${burbuja.slug}`}
              className="block no-underline text-paper mb-8"
            >
              <div
                className="relative overflow-hidden border-2 aspect-[16/8]"
                style={{ borderColor: PAL.paper, background: PAL.shadow }}
              >
                {burbuja.heroUrl && (
                  <img
                    src={burbuja.heroUrl}
                    alt={burbuja.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                  />
                )}
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, rgba(15,6,4,0) 0%, rgba(15,6,4,0) 45%, rgba(15,6,4,0.85) 100%)`,
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <div className="font-mono text-[10px] tracking-[.18em] uppercase" style={{ color: PAL.marigold }}>
                    ◌ STUDIO · MEDELLÍN
                  </div>
                  <div
                    className="font-display font-black uppercase lowercase mt-1"
                    style={{ fontSize: "clamp(36px, 5vw, 64px)", letterSpacing: "-0.02em", color: PAL.paper }}
                  >
                    {burbuja.name}
                  </div>
                  {burbuja.tagline && (
                    <p className="font-serif italic text-[15px] sm:text-[17px] mt-2 max-w-[640px]" style={{ color: PAL.paper }}>
                      {burbuja.tagline}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          )}
          {/* Video grid intentionally hidden for now — top 4 footage tiles
              live in one consolidated section below to keep this page from
              feeling like a YouTube channel page. */}
        </Section>

        {/* ── WRITING CAMP ─────────────────────────────────────────── */}
        <Section
          id="writing-camp"
          eyebrow="02"
          title="writing camp"
          subtitle="medellín music week · teenage engineering · eternal research"
        >
          <p
            className="font-serif italic mb-8 max-w-[680px]"
            style={{ fontSize: 18, lineHeight: 1.5, color: PAL.paper }}
          >
            TE flew the OP-1 fleet down for the MMW residency. Demon Box from Eternal
            Research handled the room. Days of writing, nights at the party. The
            playbook that the rest of the year is built on.
          </p>
          {/* Video grid hidden for now — top 4 consolidated below. */}
        </Section>

        {/* ── THE PARTY ────────────────────────────────────────────── */}
        <Section
          id="the-party"
          eyebrow="03"
          title="the party"
          subtitle="calm + collect presents · faker · kid kreep · tozha · felisa · tambor · lrel"
        >
          <p
            className="font-serif italic mb-8 max-w-[680px]"
            style={{ fontSize: 18, lineHeight: 1.5, color: PAL.paper }}
          >
            the recurring jueves. local crew on the bill. always different, always the
            same energy. the night that ties everything else together.
          </p>
          {/* Video grid hidden for now — top 4 consolidated below. */}
        </Section>

        {/* ── THE PEOPLE ───────────────────────────────────────────── */}
        <Section
          id="the-people"
          eyebrow="04"
          title="the people"
          subtitle={`${artists.length} colombian collaborators · the scene`}
        >
          {artists.length === 0 ? (
            <p className="font-serif italic" style={{ color: PAL.paper, opacity: 0.7 }}>
              roster's being filled in — kid kreep, tozha, lrel, logo no logo, faker,
              felisa, tambor, lao, missil, foryfive, yoga fire and on. needs artist
              docs with city: medellín.
            </p>
          ) : (
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {(artists as Artist[]).map((a: Artist) => {
                const portrait = a.portrait ? urlFor(a.portrait).width(480).height(480).fit("crop").url() : null;
                return (
                  <Link
                    key={a._id}
                    href={`/artists/${a.slug}`}
                    className="group block no-underline transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px]"
                    style={{ color: PAL.paper }}
                  >
                    <div
                      className="aspect-square overflow-hidden border-2 transition-shadow group-hover:shadow-[4px_4px_0]"
                      style={{
                        borderColor: PAL.paper,
                        background: PAL.shadow,
                        ["--ember" as string]: PAL.ember,
                        boxShadow: undefined,
                      }}
                    >
                      {portrait ? (
                        <img src={portrait} alt={a.name} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center font-display font-black uppercase"
                          style={{ background: `linear-gradient(135deg, ${PAL.paisa}, ${PAL.shadow})`, fontSize: 36, letterSpacing: "-0.02em" }}
                        >
                          {a.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <div
                        className="font-mono text-[9px] tracking-[.18em] uppercase"
                        style={{ color: PAL.marigold }}
                      >
                        ◌ {a.city}
                      </div>
                      <div className="font-display font-semibold text-[17px] uppercase tracking-[-0.005em] mt-0.5 lowercase" style={{ color: PAL.paper }}>
                        {a.name}
                      </div>
                      {a.tagline && (
                        <div className="font-serif italic text-[13px] mt-0.5 line-clamp-2" style={{ color: PAL.paper, opacity: 0.7 }}>
                          {a.tagline}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Section>

        {/* ── INCOMING ─────────────────────────────────────────────── */}
        {incoming.length > 0 && (
          <Section
            id="incoming"
            eyebrow="05"
            title="incoming"
            subtitle="forthcoming records with the medellín side"
          >
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
              {incoming.map((r) => {
                const coverUrl = r.cover ? urlFor(r.cover).width(720).height(720).fit("crop").url() : null;
                return (
                  <Link
                    key={r._id}
                    href={`/releases/${r.slug}`}
                    className="group block no-underline transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px]"
                    style={{ color: PAL.paper }}
                  >
                    <div
                      className="aspect-square border-2 overflow-hidden"
                      style={{ borderColor: PAL.paper, background: PAL.shadow }}
                    >
                      {coverUrl ? (
                        <img src={coverUrl} alt={r.title} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center font-display font-black uppercase text-center px-4"
                          style={{ background: PAL.paisa, fontSize: 22, letterSpacing: "-0.02em" }}
                        >
                          {r.title}
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="font-mono text-[10px] tracking-[.16em] uppercase" style={{ color: PAL.marigold }}>
                        {r.status === "upcoming" ? "◌ INCOMING" : `◌ ${r.year ?? ""}`}
                      </div>
                      <div className="font-display font-semibold text-[18px] uppercase tracking-[-0.005em] mt-0.5 lowercase" style={{ color: PAL.paper }}>
                        {r.title}
                      </div>
                      {r.tagline && (
                        <div className="font-serif italic text-[13px] mt-0.5 line-clamp-3" style={{ color: PAL.paper, opacity: 0.7 }}>
                          {r.tagline}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── THE FOOTAGE (top 4) ──────────────────────────────────── */}
        {/* One curated row of 4 video tiles instead of section-by-section
            grids. Pulls 1 representative clip from each bucket so the four
            tiles tell the arc: writing camp → party → studio → archive.
            Per-bucket video sections above are intentionally text-only for
            now. Full archive of ${videos.length} clips lives at /watch
            filtered to the medellin tag. */}
        <Section
          id="archive"
          eyebrow="06"
          title="the footage"
          subtitle={`top 4 · ${videos.length} more in the archive`}
        >
          {(() => {
            // 1 from each bucket, then fill any blanks from the rest.
            const picks: Video[] = [];
            const tryAdd = (v: Video | undefined) => {
              if (v && !picks.find((p) => p._id === v._id)) picks.push(v);
            };
            tryAdd(writingCamp[0]);
            tryAdd(party[0]);
            tryAdd(studio[0]);
            tryAdd(rest[0]);
            // Fallback fill from the full set if buckets came up short.
            for (const v of videos) {
              if (picks.length >= 4) break;
              tryAdd(v);
            }
            return <VideoGrid videos={picks.slice(0, 4)} pal={PAL} />;
          })()}
          <div className="mt-8">
            <Link
              href="/watch?filter=medellin"
              className="font-mono text-[11px] tracking-[.16em] uppercase no-underline border-b transition-colors"
              style={{ color: PAL.paper, borderColor: `${PAL.paper}55` }}
            >
              ↗ see all {videos.length} clips on /watch
            </Link>
          </div>
        </Section>
      </main>

      <Footer
        theme="dark"
        signoff="nos vemos en la pit 🌶️"
        meta="brooklyn · medellín · since 2022"
        links={[...FOOTER_LINKS.spacepit]}
      />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ───────────────────────────────────────────────────────────────────

function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="px-5 sm:px-8 py-16 sm:py-24 border-b"
      style={{ borderColor: `${PAL.paper}22` }}
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-10">
          <div
            className="font-mono text-[10px] tracking-[.22em] uppercase mb-3"
            style={{ color: PAL.ember }}
          >
            /{eyebrow}
          </div>
          <h2
            className="font-display font-black m-0 lowercase"
            style={{
              fontSize: "clamp(40px, 6vw, 80px)",
              lineHeight: 0.92,
              letterSpacing: "-0.025em",
              color: PAL.paper,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <div
              className="font-mono text-[11px] tracking-[.14em] uppercase mt-3"
              style={{ color: PAL.paper, opacity: 0.55 }}
            >
              {subtitle}
            </div>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function VideoGrid({ videos, pal }: { videos: Video[]; pal: typeof PAL }) {
  if (videos.length === 0) {
    return (
      <p className="font-serif italic" style={{ color: pal.paper, opacity: 0.5 }}>
        none in this bucket yet.
      </p>
    );
  }
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
    >
      {videos.map((v) => (
        <a
          key={v._id}
          href={`https://www.youtube.com/watch?v=${v.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group block no-underline transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px]"
          style={{ color: pal.paper }}
        >
          <div
            className="aspect-video overflow-hidden border-2 relative"
            style={{ borderColor: pal.paper, background: pal.shadow }}
          >
            <img
              src={v.thumbnailUrl}
              alt={v.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
            <div
              aria-hidden
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `${pal.shadow}55` }}
            >
              <span
                className="font-display font-black text-[28px]"
                style={{ color: pal.paper, textShadow: `0 2px 8px ${pal.shadow}` }}
              >
                ▶
              </span>
            </div>
          </div>
          <div
            className="mt-2 font-mono text-[11px] tracking-[.04em] line-clamp-2 leading-snug"
            style={{ color: pal.paper }}
          >
            {v.title}
          </div>
        </a>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// ABURRÁ TOPO — the hero map
// ───────────────────────────────────────────────────────────────────
// A stylized topographic survey of the Valle de Aburrá. Pure SVG
// generated client-side. Contour rings expand outward from the city
// marker, elongated N-S to mirror the actual valley geometry (the
// Aburrá runs ~70km long, ~5–10km wide between two ridges of the
// Cordillera Central). Each ring carries tiny per-angle perturbations
// so they read as organic landforms rather than perfect ellipses.
//
// Survey-map ornaments — compass, lat/lng, department callout,
// elevation tags — sell the "this is a real map" vibe without anyone
// needing to recognize the actual coordinates.
function AburraTopo() {
  const cx = 800;
  const cy = 450;
  const rings = 14;

  function contourPath(i: number): string {
    const baseScale = 50 + i * 55;
    const scaleX = baseScale * 0.55; // narrower E-W
    const scaleY = baseScale;        // taller N-S → valley shape
    const points = 64;
    const segs: string[] = [];
    for (let j = 0; j < points; j++) {
      const angle = (j / points) * Math.PI * 2;
      // Two layered sin perturbations so the rings look hand-drawn,
      // not algorithmic.
      const p1 = Math.sin(angle * 3 + i * 0.7) * 0.06;
      const p2 = Math.sin(angle * 5 + i * 1.3) * 0.03;
      const r = 1 + p1 + p2;
      // Slight per-ring offset — real topo isn't perfectly nested.
      const ox = Math.sin(i * 0.3) * 8;
      const oy = Math.cos(i * 0.5) * 4;
      const x = cx + ox + Math.cos(angle) * scaleX * r;
      const y = cy + oy + Math.sin(angle) * scaleY * r;
      segs.push(`${j === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return segs.join(" ") + " Z";
  }

  const monoFont = '"JetBrains Mono", ui-monospace, monospace';

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <radialGradient id="topo-wash" cx="50%" cy="40%" r="80%">
          <stop offset="0%"  stopColor={PAL.paisa}  stopOpacity="0.28" />
          <stop offset="55%" stopColor={PAL.shadow} stopOpacity="0.55" />
          <stop offset="100%" stopColor={PAL.shadow} stopOpacity="1" />
        </radialGradient>
        <radialGradient id="topo-glow" cx="50%" cy="50%" r="32%">
          <stop offset="0%"   stopColor={PAL.ember} stopOpacity="0.32" />
          <stop offset="100%" stopColor={PAL.ember} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* base + wash */}
      <rect width="1600" height="900" fill={PAL.shadow} />
      <rect width="1600" height="900" fill="url(#topo-wash)" />
      <rect width="1600" height="900" fill="url(#topo-glow)" />

      {/* contour rings — outermost first (drawn first, so inner ones
          stack on top with stronger opacity) */}
      <g fill="none" stroke={PAL.marigold} strokeLinejoin="round">
        {Array.from({ length: rings }, (_, idx) => {
          // Reverse so we walk inner→outer for stroke math
          const i = rings - 1 - idx;
          const opacity = Math.max(0.08, 0.55 - i * 0.035);
          const strokeWidth = Math.max(0.5, 1.5 - i * 0.07);
          return (
            <path
              key={i}
              d={contourPath(i)}
              opacity={opacity}
              strokeWidth={strokeWidth}
            />
          );
        })}
      </g>

      {/* MEDELLÍN — city marker */}
      <g transform={`translate(${cx} ${cy})`}>
        <circle r="24" fill="none" stroke={PAL.ember} strokeWidth="1" opacity="0.45" />
        <line x1="-16" y1="0" x2="16" y2="0" stroke={PAL.paper} strokeWidth="1" opacity="0.9" />
        <line x1="0" y1="-16" x2="0" y2="16" stroke={PAL.paper} strokeWidth="1" opacity="0.9" />
        <circle r="5" fill={PAL.ember} />
      </g>

      {/* Labels — survey-map ornament */}
      <g fill={PAL.paper} style={{ fontFamily: monoFont }} opacity="0.6">
        {/* City callout (right of marker) */}
        <text x={cx + 38} y={cy - 8} fontSize="12" letterSpacing="2.5">MEDELLÍN</text>
        <text x={cx + 38} y={cy + 7} fontSize="9" letterSpacing="1.5" opacity="0.7">06°14′52″ N</text>
        <text x={cx + 38} y={cy + 19} fontSize="9" letterSpacing="1.5" opacity="0.7">75°33′56″ W</text>
        <text x={cx + 38} y={cy + 33} fontSize="9" letterSpacing="1.5" opacity="0.55">ELEV 1495 M</text>

        {/* Valley name — running along the valley axis */}
        <text
          x={cx - 290}
          y={cy + 260}
          fontSize="11"
          letterSpacing="7"
          opacity="0.4"
        >
          VALLE DE ABURRÁ
        </text>

        {/* Cordillera — labeled to the east */}
        <text
          x={cx + 200}
          y={cy - 230}
          fontSize="11"
          letterSpacing="7"
          opacity="0.4"
        >
          CORDILLERA CENTRAL
        </text>

        {/* Department callout — top left */}
        <text x={52} y={52} fontSize="12" letterSpacing="3.5">
          ANTIOQUIA · COLOMBIA
        </text>
        <text x={52} y={70} fontSize="9" letterSpacing="2" opacity="0.55">
          ABURRÁ VALLEY SURVEY · DEPT 05
        </text>
        <text x={52} y={86} fontSize="9" letterSpacing="2" opacity="0.4">
          SCALE 1:25 000 · CONTOUR INTERVAL 100M
        </text>
      </g>

      {/* Compass — top right */}
      <g transform="translate(1510 78)">
        <circle r="26" fill="none" stroke={PAL.paper} strokeWidth="0.7" opacity="0.55" />
        <circle r="2" fill={PAL.paper} opacity="0.7" />
        <polygon points="0,-26 -5,-2 0,0 5,-2" fill={PAL.paper} opacity="0.85" />
        <polygon points="0,26 -5,2 0,0 5,2" fill={PAL.paper} opacity="0.35" />
        <text
          x="0" y="-32" fontSize="10" letterSpacing="2" textAnchor="middle"
          fill={PAL.paper} opacity="0.7"
          style={{ fontFamily: monoFont }}
        >
          N
        </text>
      </g>

      {/* Elevation tags — placed on a few of the contours */}
      <g
        fill={PAL.marigold}
        fontSize="9"
        letterSpacing="1.5"
        opacity="0.5"
        style={{ fontFamily: monoFont }}
      >
        <text x={cx - 100} y={cy + 110}>1500</text>
        <text x={cx + 135} y={cy - 115}>2000</text>
        <text x={cx - 210} y={cy + 215}>2500</text>
        <text x={cx + 260} y={cy - 200}>3000</text>
      </g>
    </svg>
  );
}
