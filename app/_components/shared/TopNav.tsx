import Link from "next/link";

type Site = "nick" | "spacepit" | "label";

const ROUTES: Record<Site, string> = {
  nick: "/nick-hook",
  spacepit: "/",
  label: "/calm-collect",
};

const NAV_LINKS: Record<Site, { href: string; label: string }[]> = {
  nick: [
    { href: "/catalog", label: "catalog" },
    { href: "/mixes", label: "mixes" },
    { href: "/shows", label: "shows" },
    { href: "/partners", label: "partners" },
    { href: "/nick-hook#press", label: "press" },
    { href: "/contact", label: "contact" },
  ],
  spacepit: [
    { href: "/watch", label: "watch" },
    { href: "/mixes", label: "mixes" },
    { href: "/listening", label: "listening" },
    { href: "/radio", label: "radio" },
    { href: "/packs", label: "packs" },
    { href: "/map", label: "map" },
    { href: "/studios", label: "studios" },
    { href: "/gear", label: "gear" },
    { href: "/#clients", label: "in the room" },
    { href: "/#discord", label: "discord" },
    { href: "/contact", label: "contact" },
  ],
  label: [
    { href: "/releases", label: "releases" },
    { href: "/calm-collect#artists", label: "artists" },
    { href: "/calm-collect#calllm", label: "calllm" },
    { href: "/contact", label: "contact" },
  ],
};

export function TopNav({ current }: { current: Site }) {
  const isDark = current === "nick";
  const activeColor =
    current === "nick" ? "text-redline" : current === "spacepit" ? "text-lamp-deep" : "text-collect";

  const wrapClasses = isDark
    ? "sticky top-0 z-10 flex items-center justify-between px-8 py-3.5 bg-ink/85 backdrop-blur-md border-b border-paper text-paper"
    : "sticky top-0 z-10 flex items-center justify-between px-8 py-3.5 bg-paper/90 backdrop-blur-md border-b border-ink text-ink";

  const slashClasses = isDark ? "text-on-dark font-medium" : "text-mute font-medium";

  const heptagonSrc =
    current === "nick" ? "/heptagon-paper.png" :
    current === "label" ? "/heptagon-fill-black.png" :
    "/heptagon-transparent.png";

  return (
    <nav className={wrapClasses}>
      <div className="flex items-center gap-2.5 font-display font-bold text-xl uppercase tracking-tight">
        <img src={heptagonSrc} alt="" className="w-[22px] h-[22px] heptagon-spin" />
        <SiteLink site="nick" current={current} activeColor={activeColor}>nick hook</SiteLink>
        <span className={slashClasses}>/</span>
        <SiteLink site="spacepit" current={current} activeColor={activeColor}>thespacepit</SiteLink>
        <span className={slashClasses}>/</span>
        <SiteLink site="label" current={current} activeColor={activeColor}>calm + collect</SiteLink>
      </div>
      <div className="flex flex-wrap justify-end gap-3 sm:gap-5 font-mono text-[11px] uppercase tracking-[.12em]">
        {NAV_LINKS[current].map((l) => (
          <a key={l.href} href={l.href} className="hover:opacity-70 transition-opacity">{l.label}</a>
        ))}
      </div>
    </nav>
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
    return <span className={activeColor}>{children}</span>;
  }
  return (
    <Link href={ROUTES[site]} className="hover:opacity-70 transition-opacity">
      {children}
    </Link>
  );
}
