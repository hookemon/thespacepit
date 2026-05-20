import Link from "next/link";

type Site = "nick" | "spacepit" | "label";

// Routing note: / is a random-world router (server-side redirects to one
// of the three world homes per request). Each world is reachable directly
// at its own URL — that's what the toggle below points to.
const ROUTES: Record<Site, string> = {
  nick: "/nick-hook",
  spacepit: "/the-pit",
  label: "/calm-collect",
};

const NAV_LINKS: Record<Site, { href: string; label: string }[]> = {
  nick: [
    { href: "/catalog", label: "catalog" },
    // /watch is unified across all 3 worlds — deep-link with ?filter=music-video
    // so visitors landing from nick-hook see his performances first, then can
    // clear the chip to see everything else.
    { href: "/watch?filter=music-video", label: "watch" },
    // /tv + /radio are also cross-platform — same channels, same crate,
    // exposed to nick-hook visitors so they can lean back on his content.
    { href: "/tv", label: "tv" },
    { href: "/radio", label: "radio" },
    { href: "/mixes", label: "mixes" },
    { href: "/shows", label: "shows" },
    { href: "/partners", label: "partners" },
    { href: "/press", label: "press" },
    { href: "/contact", label: "contact" },
  ],
  spacepit: [
    { href: "/watch", label: "watch" },
    { href: "/tv", label: "tv" },
    { href: "/radio", label: "radio" },
    { href: "/mixes", label: "mixes" },
    { href: "/listening", label: "listening" },
    { href: "/lessons", label: "lessons" },
    { href: "/packs", label: "packs" },
    { href: "/vault", label: "vault" },
    { href: "/map", label: "map" },
    { href: "/studios", label: "studios" },
    { href: "/gear", label: "gear" },
    { href: "/the-pit#clients", label: "in the room" },
    { href: "/crew", label: "crew" },
    { href: "/press", label: "press" },
    { href: "/pop-up", label: "pop-up" },
    { href: "/the-pit#discord", label: "discord" },
    { href: "/support", label: "support" },
    { href: "/contact", label: "contact" },
  ],
  label: [
    { href: "/releases", label: "releases" },
    // CC nav: same /watch + tv + radio. Pre-filter watch to music-videos
    // since CC's content is largely the visual side of the catalog.
    { href: "/watch?filter=music-video", label: "watch" },
    { href: "/tv", label: "tv" },
    { href: "/radio", label: "radio" },
    { href: "/calm-collect#artists", label: "artists" },
    { href: "/calm-collect#calllm", label: "calllm" },
    { href: "/press", label: "press" },
    { href: "/contact", label: "contact" },
  ],
};

export function TopNav({ current }: { current: Site }) {
  const isDark = current === "nick";
  const activeColor =
    current === "nick" ? "text-redline" : current === "spacepit" ? "text-lamp-deep" : "text-collect";

  const wrapClasses = isDark
    ? "sticky top-0 z-10 flex items-center justify-between px-5 sm:px-8 py-3.5 bg-ink/85 backdrop-blur-md border-b border-paper text-paper"
    : "sticky top-0 z-10 flex items-center justify-between px-5 sm:px-8 py-3.5 bg-paper/90 backdrop-blur-md border-b border-ink text-ink";

  const slashClasses = isDark ? "text-on-dark font-medium" : "text-mute font-medium";

  const heptagonSrc =
    current === "nick" ? "/heptagon-paper.png" :
    current === "label" ? "/heptagon-fill-black.png" :
    "/heptagon-transparent.png";

  return (
    <nav className={wrapClasses}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 w-full">
        {/* TOP ROW: brand — all 3 sites navigable, just tighter on mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 font-display font-bold uppercase tracking-tight">
          <img src={heptagonSrc} alt="" className="w-[22px] h-[22px] heptagon-spin shrink-0" />
          {/* MOBILE: nick + c+c abbreviate, but thespacepit ALWAYS reads as
              "thespacepit" — that's the brand wordmark, one word, lowercase,
              never shortened. */}
          <div className="flex sm:hidden items-center gap-1.5 text-[13px]">
            <SiteLink site="nick" current={current} activeColor={activeColor}>nick</SiteLink>
            <span className={slashClasses}>/</span>
            <SiteLink site="spacepit" current={current} activeColor={activeColor}>thespacepit</SiteLink>
            <span className={slashClasses}>/</span>
            <SiteLink site="label" current={current} activeColor={activeColor}>c+c</SiteLink>
          </div>
          {/* DESKTOP: full 3-site row */}
          <div className="hidden sm:flex items-center gap-2.5 text-xl">
            <SiteLink site="nick" current={current} activeColor={activeColor}>nick hook</SiteLink>
            <span className={slashClasses}>/</span>
            <SiteLink site="spacepit" current={current} activeColor={activeColor}>thespacepit</SiteLink>
            <span className={slashClasses}>/</span>
            <SiteLink site="label" current={current} activeColor={activeColor}>calm + collect</SiteLink>
          </div>
        </div>

        {/* NAV LINKS: horizontally scrollable on mobile, wraps on desktop.
            -mx + px shifts the scroll edges flush with the page padding so
            it feels like an iOS-style "scroll for more" strip. */}
        <div className="flex flex-nowrap sm:flex-wrap sm:justify-end gap-3 sm:gap-5 font-mono text-[10px] sm:text-[11px] uppercase tracking-[.12em] overflow-x-auto sm:overflow-x-visible -mx-5 sm:mx-0 px-5 sm:px-0 pb-0.5 sm:pb-0 scrollbar-hide">
          {NAV_LINKS[current].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="hover:opacity-70 transition-opacity whitespace-nowrap shrink-0"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

/**
 * Each of the three worlds gets a tiny real-image glyph next to its name in
 * the nav — pinhole-size little artifacts that pack each world into ~12px.
 *
 *   ◐ nick hook        the Relationships LP cover (his solo statement)
 *   ◐ thespacepit      a sliver of the modular wall — gear = the pit
 *   ◐ calm + collect   the c+c mark (the label logo)
 *
 * All rendered as rounded-full <img> at the requested size with object-cover
 * so we get a clean circular postage-stamp slice. objectPosition tunes the
 * crop where it matters (the gear photo wants the left modular, not Nick's
 * face). Active state is conveyed by the wordmark text color next to it —
 * we don't try to tint the images.
 */
function SiteIcon({ site, size = 12 }: { site: Site; size?: number }) {
  const src =
    site === "nick"     ? "/relationships-cover.jpg" :
    site === "spacepit" ? "/epk/nick-6-0.jpg" :
                          "/calmcollect-mark.png";
  // The gear shot has Nick on the right; pull the crop hard-left to land on
  // the modular's patch cables — instantly reads as "gear" at thumbnail size.
  const objectPosition = site === "spacepit" ? "15% 35%" : "center";
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className="inline-block shrink-0 rounded-full object-cover"
      style={{ width: size, height: size, objectPosition }}
    />
  );
}

function SiteLink({
  site,
  current,
  activeColor,
  children,
}: {
  site: Site;
  current: Site;
  activeColor: string;
  children: React.ReactNode;
}) {
  if (site === current) {
    return (
      <span className={`${activeColor} inline-flex items-baseline gap-1.5`}>
        <SiteIcon site={site} />
        {children}
      </span>
    );
  }
  return (
    <Link href={ROUTES[site]} className="hover:opacity-70 transition-opacity inline-flex items-baseline gap-1.5">
      <SiteIcon site={site} />
      {children}
    </Link>
  );
}
