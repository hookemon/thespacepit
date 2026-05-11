import { getChannelStats } from "../_lib/youtube";
import { getDiscordWidget } from "../_lib/discord";

const SPACEPIT_FOUNDED = 2011;

// Hero background photo — the actual spacepit hallway, lifted from the EPK.
// Yellow graffiti walls signed by every artist who's recorded here.
const HERO_BG_IMAGE: string | null = "/spacepit-hallway.jpg";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export async function Hero() {
  // Fire both in parallel; both gracefully return null if not configured.
  const [yt, discord] = await Promise.all([getChannelStats(), getDiscordWidget()]);

  const yearsSince = new Date().getFullYear() - SPACEPIT_FOUNDED;

  const stats = [
    {
      num: yt ? String(yt.videoCount) : "—",
      lbl: "videos posted",
    },
    {
      num: yt ? formatCount(yt.subscriberCount) : "—",
      lbl: "fam on yt",
    },
    {
      // Prefer total member count (more meaningful for community size); fall
      // back to online presence if member count is unavailable.
      num: discord
        ? formatCount(discord.memberCount ?? discord.presenceCount)
        : "—",
      lbl: discord
        ? discord.memberCount !== undefined
          ? "in the discord"
          : "online in the discord"
        : "in the discord",
    },
    {
      num: `${yearsSince}yr`,
      lbl: "since we started",
    },
  ];

  const hasBg = !!HERO_BG_IMAGE;

  return (
    <section
      className={`relative overflow-hidden px-8 pt-20 pb-16 border-b border-ink ${hasBg ? "text-paper" : "bg-paper text-ink"}`}
    >
      {hasBg && (
        <>
          <img
            src={HERO_BG_IMAGE!}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-ink/55" />
        </>
      )}
      <div className={`relative flex items-center gap-3 mb-4 font-mono text-[11px] tracking-[.14em] uppercase ${hasBg ? "text-paper-2" : "text-ink-3"}`}>
        <span className="w-2.5 h-2.5 rounded-full bg-redline sp-pulse" />
        <span>LIVE · recording now · brooklyn</span>
      </div>
      <h1
        className="relative font-display font-bold uppercase m-0 break-words"
        style={{ fontSize: "clamp(48px, 14vw, 200px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
      >
        pull up to
        <br />
        <span style={{ color: "#F2B705", WebkitTextStroke: hasBg ? "1px #0B0B0B" : "2px #0B0B0B" }}>thespacepit</span>
      </h1>
      <p
        className={`relative font-serif italic mt-5 max-w-[640px] leading-snug ${hasBg ? "text-paper-2" : ""}`}
        style={{ fontSize: "clamp(20px, 2vw, 26px)" }}
      >
        the studio. the youtube channel. the discord. gear demos, live jams, after-midnight sessions — brooklyn to the garden in medellín. we out here 🌱
      </p>
      <div className={`relative grid grid-cols-2 md:grid-cols-4 mt-10 border-t ${hasBg ? "border-paper" : "border-ink"}`}>
        {stats.map((s, i) => {
          const borderC = hasBg ? "border-paper" : "border-ink";
          const labelC = hasBg ? "text-paper-2" : "text-ink-3";
          return (
            <div
              key={s.lbl}
              className={`px-4.5 py-4 ${i < stats.length - 1 ? `md:border-r ${borderC}` : ""} ${i % 2 === 0 ? `border-r md:border-r ${borderC}` : ""}`}
            >
              <div className="font-display font-bold text-[40px] leading-none tracking-tight">{s.num}</div>
              <div className={`font-mono text-[10px] tracking-[.12em] uppercase mt-1.5 ${labelC}`}>{s.lbl}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
