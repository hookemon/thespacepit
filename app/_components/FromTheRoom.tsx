import { getStudioDocPhotos } from "../_lib/sanity-queries";
import { urlFor } from "../_lib/sanity";

/**
 * "From the room" — a mosaic of thespacepit studio photos pulled from the
 * 89+ studio-doc images we ingested from the JaySounds drive (period 2014-17
 * console + session + room shots).
 *
 * Renders on the spacepit homepage between StudioClients and DiscordStrip.
 * Each tile is a real moment from the room — late-night Pro Tools sessions,
 * gear close-ups, collaborators sitting in. Click any tile (post-MVP) for a
 * fullscreen lightbox.
 *
 * Pulls live from Sanity so as more studio photos come in (the eventual
 * PIT-PHYSICAL workflow, or future shoots), the mosaic grows automatically.
 */
export async function FromTheRoom() {
  const photos = await getStudioDocPhotos(36);
  if (photos.length === 0) return null;

  const tiles = photos.map((p, i) => ({
    id: p._id,
    src: urlFor(p.image).width(800).fit("max").url(),
    caption: p.caption ?? "",
    // Brick-masonry-ish: every 5th tile is double-wide for visual rhythm
    span: i % 5 === 0 ? 2 : 1,
  }));

  return (
    <section className="px-5 sm:px-8 py-16 bg-paper text-ink border-t-2 border-ink">
      <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp-deep mb-2">FROM THE ROOM</div>
      <h2
        className="font-display font-bold uppercase m-0 mb-3"
        style={{ fontSize: "clamp(44px, 6vw, 80px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
      >
        inside the spacepit
      </h2>
      <p className="font-serif italic text-[18px] mt-2 mb-8 max-w-[640px] text-ink-3">
        late-night console shots, monitors in tungsten, collaborators sitting in. the room speaks for itself.
      </p>

      {/* Tile grid — varied sizes for visual rhythm. Slight rotation per tile
          (deterministic from index, never shuffles) so it reads as taped-up
          contact-sheet artifacts not a UI grid. */}
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gridAutoRows: "200px",
        }}
      >
        {tiles.map((t, i) => {
          const rot = ((i * 13) % 7 - 3) / 5; // -0.6°..+0.6°
          return (
            <figure
              key={t.id}
              className="overflow-hidden border border-ink/10 hover:border-ink transition-colors group"
              style={{
                gridColumn: t.span === 2 ? "span 2" : undefined,
                gridRow: t.span === 2 ? "span 2" : undefined,
                transform: `rotate(${rot}deg)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.src}
                alt={t.caption}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </figure>
          );
        })}
      </div>
    </section>
  );
}
