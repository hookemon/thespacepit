import Link from "next/link";
import { getRosterArtists } from "../../_lib/sanity-queries";
import { urlFor } from "../../_lib/sanity";

const FALLBACK = [
  { _id: "f1", slug: "nick-hook", name: "Nick Hook", city: "new york · ny", tagline: "the waviest resident. producer/dj/founder." },
  { _id: "f2", slug: "spiritual-friendship", name: "Spiritual Friendship", city: "new york · new york", tagline: "nick + gareth jones. drones, beats, nothing judged." },
  { _id: "f3", slug: "electrogenetic", name: "Electrogenetic", city: "london · uk", tagline: "gareth's solo noise-maker project." },
  { _id: "f4", slug: "quazzy", name: "Quazzy", city: "brooklyn · ny", tagline: "guided meditation + la burbuja." },
  { _id: "f5", slug: "super-hero-killer", name: "Super Hero Killer", city: "st louis · mo", tagline: "old friends, forever on the label." },
  { _id: "f6", slug: "sinister-dane", name: "Sinister Dane", city: "st louis · mo", tagline: "hometown heat." },
];

export async function CCArtistRoster() {
  const artists = await getRosterArtists();
  const list = artists.length > 0 ? artists : FALLBACK;

  return (
    <section id="artists" className="px-5 sm:px-8 py-16 bg-collect text-paper">
      <div className="font-mono text-[11px] tracking-[.14em] uppercase text-calllm mb-2">THE FAM</div>
      <h2
        className="font-display font-bold uppercase m-0 mb-9"
        style={{ fontSize: "clamp(44px, 6vw, 72px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
      >
        artists
      </h2>
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {list.map((a) => {
          // Respect the per-artist displayInitials flag — same toggle the artist
          // detail page uses. When ON, the roster card shows the lit
          // amber-on-ink initials block instead of the portrait.
          const useInitials = "displayInitials" in a && a.displayInitials === true;
          const portraitUrl =
            !useInitials && "portrait" in a && a.portrait
              ? urlFor(a.portrait).width(480).height(480).fit("crop").url()
              : null;
          return (
            <Link
              key={a._id}
              href={`/artists/${a.slug}`}
              className="group border border-paper p-5 flex flex-col gap-2 no-underline text-paper transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#C9B9E8]"
            >
              <div
                className="aspect-square border border-paper mb-2 overflow-hidden flex items-center justify-center"
                style={{ background: useInitials ? "#F2B705" : portraitUrl ? "#0B0B0B" : "rgba(244,239,230,0.06)" }}
              >
                {useInitials ? (
                  <RosterInitials name={a.name} />
                ) : portraitUrl ? (
                  <img src={portraitUrl} alt={a.name} className="w-full h-full object-cover" />
                ) : (
                  <RosterPlaceholder name={a.name} />
                )}
              </div>
              <div className="font-display font-bold text-[28px] uppercase tracking-[-0.01em] leading-none">{a.name}</div>
              {a.city && <div className="font-mono text-[11px] tracking-[.12em] uppercase text-calllm">{a.city}</div>}
              {a.tagline && <div className="font-serif italic text-[16px] leading-snug mt-2 text-paper-2">{a.tagline}</div>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// Lit initials block for artists who opted in via displayInitials — same
// design treatment as the artist detail page (lamp amber bg, ink-black NH).
function RosterInitials({ name }: { name: string }) {
  const parts = name.replace(/[\(\[\{].*?[\)\]\}]/g, "").split(/\s+/).filter(Boolean);
  const initials =
    parts.length === 0 ? "·" :
    parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() :
    (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (
    <span
      className="font-display font-black uppercase text-ink select-none leading-none"
      style={{ fontSize: "clamp(72px, 9vw, 140px)", letterSpacing: "-0.04em" }}
      aria-label={name}
    >
      {initials}
    </span>
  );
}

// Initials-based placeholder so every roster card has a square, even before
// a portrait gets uploaded. Uses up to 2 letters from the name.
function RosterPlaceholder({ name }: { name: string }) {
  const initials = name
    .replace(/[^A-Za-z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="w-full h-full flex items-center justify-center select-none">
      <span
        className="font-display font-bold uppercase text-paper-2"
        style={{ fontSize: "clamp(40px, 5vw, 72px)", letterSpacing: "-0.04em", lineHeight: 1 }}
      >
        {initials || "·"}
      </span>
    </div>
  );
}
