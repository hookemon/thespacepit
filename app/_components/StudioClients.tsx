import Link from "next/link";
import { STUDIO_CLIENTS } from "../_lib/studio-clients";
import { resolveArtistSlugs } from "../_lib/sanity-queries";

export async function StudioClients() {
  // Look up Sanity artist docs for each studio client name. Linked names
  // become portals; unlinked names render as plain text.
  const links = await resolveArtistSlugs(STUDIO_CLIENTS);
  const linkedCount = links.size;

  return (
    <section id="clients" className="px-8 py-16 bg-paper text-ink border-y border-ink">
      <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp-deep mb-2">
        RECORDED HERE · BROOKLYN + MEDELLÍN · 2011 → TODAY
      </div>
      <h2
        className="font-display font-bold uppercase m-0 mb-8"
        style={{ fontSize: "clamp(44px, 8vw, 96px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
      >
        in the room
      </h2>
      <p className="font-serif italic text-[20px] leading-snug max-w-[680px] mb-10">
        a partial list. brooklyn → medellín, since 2011.
        {linkedCount > 0 && (
          <>
            {" "}
            <span className="not-italic text-[14px] font-mono uppercase tracking-[.1em] text-ink-3">
              · {linkedCount} have their own world
            </span>
          </>
        )}
      </p>
      <div
        className="flex flex-wrap gap-x-5 gap-y-2 font-display uppercase font-semibold leading-none"
        style={{ fontSize: "clamp(20px, 2.4vw, 32px)", letterSpacing: "-0.005em" }}
      >
        {STUDIO_CLIENTS.map((name, i) => {
          const link = links.get(name);
          return (
            <span key={`${name}-${i}`} className="whitespace-nowrap">
              {link ? (
                <Link
                  href={`/artists/${link.slug}`}
                  className="hover:text-lamp-deep transition-colors no-underline border-b border-transparent hover:border-lamp-deep"
                >
                  {name}
                </Link>
              ) : (
                <span>{name}</span>
              )}
              {i < STUDIO_CLIENTS.length - 1 && (
                <span className="ml-5 text-mute font-normal">·</span>
              )}
            </span>
          );
        })}
      </div>
    </section>
  );
}
