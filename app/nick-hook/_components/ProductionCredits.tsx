import Link from "next/link";
import { getExternalCreditsForArtist } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";

const ROLE_COLOR: Record<string, string> = {
  Producer: "text-redline",
  "Co-producer": "text-redline",
  "Co-exec producer": "text-redline",
  "Mixed by": "text-lamp",
  Remix: "text-calllm",
  Appearance: "text-on-dark",
};

export async function NHProductionCredits() {
  const credits = await getExternalCreditsForArtist("nick-hook");

  if (credits.length === 0) {
    return null;
  }

  return (
    <section id="credits" className="px-5 sm:px-8 py-16 bg-ink text-paper border-y border-paper/20">
      <div className="font-mono text-[11px] tracking-[.12em] uppercase text-redline mb-2">
        OUTSIDE CREDITS · NOT ON CALM + COLLECT
      </div>
      <h2
        className="font-display font-bold uppercase m-0 mb-2"
        style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
      >
        production credits
      </h2>
      <p className="font-serif italic text-[20px] leading-snug max-w-[680px] mb-10 text-paper-2">
        records nick produced, mixed, remixed, or appeared on for other people. click into any of them — each one is its own world.
      </p>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {credits.map((c) => {
          const cover = c.cover ? urlFor(c.cover).width(440).height(440).fit("crop").url() : null;
          const roleClass = ROLE_COLOR[c.roles?.[0] ?? ""] ?? "text-paper-2";
          const rolesStr = (c.roles ?? []).filter(Boolean).join(" · ");
          const artistsStr = c.artists.map((a) => a.name).join(" · ");
          return (
            <Link
              key={c._id}
              href={`/releases/${c.slug}`}
              className="group block border border-paper/40 p-3.5 transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#E83A1C] no-underline text-paper"
            >
              <div
                className="aspect-square border border-paper/40 mb-3 flex items-center justify-center relative overflow-hidden"
                style={{ background: c.coverColor ?? "#1C1A17" }}
              >
                {cover ? (
                  <img src={cover} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <span
                    className="font-display font-bold uppercase text-center px-3 text-paper"
                    style={{ fontSize: 22, transform: "rotate(-3deg)", letterSpacing: "-0.02em" }}
                  >
                    {c.title}
                  </span>
                )}
              </div>
              <div className="font-mono text-[10px] tracking-[.1em] uppercase text-paper-2 line-clamp-1">
                {artistsStr}
                {c.year && <> · {c.year}</>}
              </div>
              <div className="font-display font-semibold text-[18px] uppercase tracking-[-0.005em] leading-tight mt-1 line-clamp-2">
                {c.title}
              </div>
              {rolesStr && (
                <div className={`font-mono text-[10px] tracking-[.14em] uppercase mt-2 ${roleClass}`}>{rolesStr}</div>
              )}
              {c.tagline && (
                <div className="font-mono text-[9px] tracking-[.1em] uppercase text-on-dark mt-1.5 line-clamp-1">{c.tagline}</div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
