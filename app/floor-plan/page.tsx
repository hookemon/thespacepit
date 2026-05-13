import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { FOOTER_LINKS } from "../_lib/social-links";
import { sanityFetch } from "../_lib/sanity";
import { groq } from "next-sanity";

export const revalidate = 300;

export const metadata = {
  title: "the floor plan — every room in the spacepit",
  description:
    "every page on the site, every room in the studio. the door directory. instead of asking what URL is what.",
};

/**
 * The floor plan — a literal map of every room (every page) on the site.
 * Built so Nick (or anyone) can land on one URL and see every door.
 *
 * Sections are grouped by what each room IS, not by URL alphabet:
 *   · LISTENING ROOMS — where you press play (radio, tv, watch, jam, etc.)
 *   · THE CATALOG — the records, the eras, the artists
 *   · THE PROFILE — pages about specific worlds (nick-hook, calm-collect, the spacepit)
 *   · THE STUDIO — gear, places, sessions, partners, manuals
 *   · THE DOOR — contact, map (globe), discord, links out
 *
 * Dynamic counts (releases, artists, eras, etc.) are pulled live from Sanity
 * so the floor plan stays honest as the site grows.
 */
export default async function FloorPlanPage() {
  // Live counts — keeps the floor plan honest as content lands.
  const counts = await sanityFetch<{
    releases: number;
    artists: number;
    eras: number;
    mixes: number;
    sessions: number;
    shows: number;
    pressQuotes: number;
    videos: number;
    photos: number;
    flyers: number;
    gear: number;
    partners: number;
    studios: number;
    places: number;
    packs: number;
  }>(groq`{
    "releases":   count(*[_type == "release" && (withdrawn != true)]),
    "artists":    count(*[_type == "artist"]),
    "eras":       count(*[_type == "project"]),
    "mixes":      count(*[_type == "mix"]),
    "sessions":   count(*[_type == "studioSession"]),
    "shows":      count(*[_type == "liveDate"]),
    "pressQuotes": count(*[_type == "pressQuote"]),
    "videos":     count(*[_type == "video" && hidden != true]),
    "photos":     count(*[_type == "photo" && hidden != true]),
    "flyers":     count(*[_type == "flyer"]),
    "gear":       count(*[_type == "gear"]),
    "partners":   count(*[_type == "brand"]),
    "studios":    count(*[_type == "studio"]),
    "places":     count(*[_type == "place"]),
    "packs":      count(*[_type == "pack"]),
  }`);

  type Door = { href: string; label: string; sub?: string; n?: number };
  type Room = { eyebrow: string; title: string; copy?: string; doors: Door[] };

  const ROOMS: Room[] = [
    {
      eyebrow: "PRESS PLAY",
      title: "the listening rooms",
      copy: "where the speakers live. press play, lean back.",
      doors: [
        { href: "/jam",       label: "/jam",       sub: "stems · pads · live remix in the browser" },
        { href: "/radio",     label: "/radio",     sub: "3-stream radio · crate + catalog + videos" },
        { href: "/tv",        label: "/tv",        sub: "the channel · always on" },
        { href: "/watch",     label: "/watch",     sub: "every video, tag-filtered", n: counts.videos },
        { href: "/mixes",     label: "/mixes",     sub: "dj mixes + radio sessions", n: counts.mixes },
        { href: "/listening", label: "/listening", sub: "what's playing right now" },
      ],
    },
    {
      eyebrow: "EVERY RECORD",
      title: "the catalog",
      copy: "everything you've been on, every record cut.",
      doors: [
        { href: "/catalog",   label: "/catalog",   sub: "everything nick's been on", n: counts.releases },
        { href: "/releases",  label: "/releases",  sub: "the calm + collect imprint catalog" },
        { href: "/eras",      label: "/eras",      sub: "MWC · CZ · spiritual friendship · RTJ · etc.", n: counts.eras },
        { href: "/artists",   label: "/artists",   sub: "the roster + the studio circle", n: counts.artists },
        { href: "/collabs",   label: "/collabs",   sub: "every cross-pollination" },
        { href: "/packs",     label: "/packs",     sub: "sample packs you've put out", n: counts.packs },
      ],
    },
    {
      eyebrow: "THREE WORLDS",
      title: "the profile pages",
      copy: "one site, three doors in. nick · the spacepit · calm + collect.",
      doors: [
        { href: "/nick-hook",    label: "/nick-hook",    sub: "the artist hub · bio · press wall" },
        { href: "/",             label: "/",             sub: "thespacepit (home)" },
        { href: "/calm-collect", label: "/calm-collect", sub: "the label · roster · calllm" },
      ],
    },
    {
      eyebrow: "THE ROOMS",
      title: "the studio",
      copy: "the gear. the rooms. the people who sat in.",
      doors: [
        { href: "/studios",  label: "/studios",  sub: "the rooms — brooklyn + medellín + others", n: counts.studios },
        { href: "/studio",   label: "/studio",   sub: "studio sessions log", n: counts.sessions },
        { href: "/gear",     label: "/gear",     sub: "every piece in the room", n: counts.gear },
        { href: "/places",   label: "/places",   sub: "venues · festivals · favorite spots", n: counts.places },
        { href: "/partners", label: "/partners", sub: "brands · gear collabs · sponsors", n: counts.partners },
        { href: "/shows",    label: "/shows",    sub: "every gig played", n: counts.shows },
        { href: "/wall",     label: "/wall",     sub: "the flyer wall — every poster, every show invite", n: counts.flyers },
        { href: "/press",    label: "/press",    sub: "every interview, review, mention", n: counts.pressQuotes },
      ],
    },
    {
      eyebrow: "OUT THE DOOR",
      title: "contact + the world",
      copy: "say hey. find the spots. get on the list.",
      doors: [
        { href: "/contact", label: "/contact", sub: "book a show · book the studio · demos" },
        { href: "/map",     label: "/map",     sub: "the globe · every spot pinned" },
      ],
    },
  ];

  // Era-page short aliases — the kind of URL Nick types when he's testing
  // ("is it /cubiczirconia or /cubic-zirconia?"). Surfaced here so he never
  // has to guess again.
  const ERA_ALIASES: Door[] = [
    { href: "/eras/cubic-zirconia",       label: "/eras/cubic-zirconia",       sub: "Cubic Zirconia" },
    { href: "/eras/men-women-children",   label: "/eras/men-women-children",   sub: "Men Women & Children" },
    { href: "/eras/calm-collect",         label: "/eras/calm-collect",         sub: "Calm + Collect" },
    { href: "/eras/run-the-jewels-tour-2017", label: "/eras/run-the-jewels-tour-2017", sub: "Run The Jewels Tour 2017" },
    { href: "/eras/rtj-10th-anniversary", label: "/eras/rtj-10th-anniversary", sub: "RTJ 10th Anniversary" },
    { href: "/eras/grand-theft-auto",     label: "/eras/grand-theft-auto",     sub: "Grand Theft Auto" },
    { href: "/eras/gangsta-boo-live-studio", label: "/eras/gangsta-boo-live-studio", sub: "Gangsta Boo · live + studio" },
    { href: "/eras/red-bull-rbma",        label: "/eras/red-bull-rbma",        sub: "Red Bull / RBMA" },
    { href: "/eras/solo-dj-live",         label: "/eras/solo-dj-live",         sub: "Solo DJ + Live" },
    { href: "/eras/s-nar",                label: "/eras/s-nar",                sub: "Sónar" },
  ];

  return (
    <>
      <TopNav current="nick" />
      <main className="flex-1 bg-paper text-ink">
        <header className="px-5 sm:px-8 pt-16 pb-10 border-b-2 border-ink">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">EVERY ROOM · EVERY DOOR</div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            the floor plan
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[760px]">
            every page on the site, every room in the studio. the door directory. instead of asking what URL is what.
          </p>
        </header>

        {/* The rooms — each section is a grid of doors. Cards are tactile,
            slightly framed, with a count chip when the room has a live tally. */}
        <div className="px-5 sm:px-8 py-12 max-w-[1180px] mx-auto space-y-14">
          {ROOMS.map((r) => (
            <section key={r.title}>
              <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-1">{r.eyebrow}</div>
              <h2
                className="font-display font-bold uppercase m-0"
                style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.95, letterSpacing: "-0.015em" }}
              >
                {r.title}
              </h2>
              {r.copy && (
                <p className="font-serif italic text-[16px] text-ink-3 mt-2 max-w-[640px]">{r.copy}</p>
              )}

              <div
                className="mt-6 grid gap-3"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
              >
                {r.doors.map((d) => (
                  <Link
                    key={d.href}
                    href={d.href}
                    className="group block border border-ink p-4 transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0_#E83A1C] no-underline text-ink"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-mono text-[13px] tracking-[.06em] text-ink group-hover:text-redline transition-colors truncate">
                        {d.label}
                      </div>
                      {typeof d.n === "number" && (
                        <span className="font-mono text-[10px] tracking-[.14em] uppercase text-ink-3 shrink-0">
                          {d.n.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {d.sub && (
                      <div className="font-serif italic text-[13px] text-ink-3 mt-1 leading-snug">
                        {d.sub}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {/* Era page direct-links — the URLs people guess when they want to
              jump straight to one universe (cubic-zirconia, MWC, etc.) */}
          <section>
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-1">JUMP STRAIGHT IN</div>
            <h2
              className="font-display font-bold uppercase m-0"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.95, letterSpacing: "-0.015em" }}
            >
              every era page · direct
            </h2>
            <p className="font-serif italic text-[16px] text-ink-3 mt-2 max-w-[640px]">
              the URL for each era (eras/[slug]). all live. tomorrow we'll add short aliases (/cubic-zirconia → here) so guessing works.
            </p>
            <div
              className="mt-6 grid gap-3"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
            >
              {ERA_ALIASES.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  className="group block border border-ink p-4 transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0_#0E4B3A] no-underline text-ink"
                >
                  <div className="font-mono text-[13px] tracking-[.06em] text-ink group-hover:text-collect transition-colors truncate">
                    {d.label}
                  </div>
                  {d.sub && (
                    <div className="font-serif italic text-[13px] text-ink-3 mt-1 leading-snug">{d.sub}</div>
                  )}
                </Link>
              ))}
            </div>
          </section>

          {/* Live data summary at the bottom — at-a-glance pulse of what's
              actually in the room right now. Same numbers feed the doors. */}
          <section>
            <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-1">PULSE</div>
            <h2
              className="font-display font-bold uppercase m-0"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.95, letterSpacing: "-0.015em" }}
            >
              what's in the room right now
            </h2>
            <div className="mt-6 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
              {[
                { n: counts.releases,    label: "releases" },
                { n: counts.eras,        label: "eras" },
                { n: counts.artists,     label: "artists" },
                { n: counts.shows,       label: "shows" },
                { n: counts.videos,      label: "videos" },
                { n: counts.mixes,       label: "mixes" },
                { n: counts.sessions,    label: "sessions" },
                { n: counts.pressQuotes, label: "press pieces" },
                { n: counts.photos,      label: "photos" },
                { n: counts.flyers,      label: "flyers" },
                { n: counts.gear,        label: "gear pieces" },
                { n: counts.partners,    label: "partners" },
                { n: counts.studios,     label: "studio rooms" },
                { n: counts.places,      label: "places" },
                { n: counts.packs,       label: "sample packs" },
              ].map((s) => (
                <div key={s.label} className="border border-ink p-4">
                  <div
                    className="font-display font-bold tabular-nums leading-none"
                    style={{ fontSize: "clamp(36px, 4vw, 56px)", letterSpacing: "-0.02em" }}
                  >
                    {(s.n ?? 0).toLocaleString()}
                  </div>
                  <div className="font-mono text-[10px] tracking-[.14em] uppercase text-ink-3 mt-2">{s.label}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer
        theme="dark"
        signoff="see u in the pit 🌱"
        meta="floor plan · live counts · refreshes every 5 min"
        links={[...FOOTER_LINKS.nick]}
      />
    </>
  );
}
