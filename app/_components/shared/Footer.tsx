type Theme = "dark" | "paper";
type HeptagonVariant = "fill-white" | "fill-black" | "paper" | "transparent";

type Props = {
  theme: Theme;
  signoff: string;
  meta: string;
  links: { href: string; label: string }[];
  id?: string;
  heptagon?: HeptagonVariant;
};

const HEPTAGON_SRC: Record<HeptagonVariant, string> = {
  "fill-white": "/heptagon-fill-white.png",
  "fill-black": "/heptagon-fill-black.png",
  paper: "/heptagon-paper.png",
  transparent: "/heptagon-transparent.png",
};

export function Footer({ theme, signoff, meta, links, id, heptagon }: Props) {
  const wrap = theme === "dark"
    ? "px-5 sm:px-8 py-12 bg-ink text-paper border-t border-paper flex flex-wrap items-center justify-between gap-6"
    : "px-5 sm:px-8 py-12 bg-paper text-ink border-t border-ink flex flex-wrap items-center justify-between gap-6";
  const metaColor = theme === "dark" ? "text-on-dark" : "text-ink-3";
  const heptagonSrc = HEPTAGON_SRC[heptagon ?? (theme === "dark" ? "paper" : "transparent")];

  return (
    <footer id={id} className={wrap}>
      <div className="flex items-center gap-4">
        <img src={heptagonSrc} alt="" className="w-11 h-11 heptagon-spin" />
        <div>
          <div className="font-display font-semibold text-[32px] uppercase tracking-tight leading-none">{signoff}</div>
          <div className={`font-mono text-[11px] tracking-[.1em] uppercase ${metaColor} mt-1`}>{meta}</div>
        </div>
      </div>
      <div className="flex gap-5 font-mono text-[11px] tracking-[.1em] uppercase flex-wrap">
        {links.map((l) => {
          const external = /^https?:\/\//.test(l.href);
          return (
            <a
              key={l.label}
              href={l.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="hover:opacity-70 transition-opacity no-underline"
            >
              {l.label}
            </a>
          );
        })}
      </div>
    </footer>
  );
}
