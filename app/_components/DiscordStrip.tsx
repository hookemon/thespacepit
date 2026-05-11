import { getDiscordWidget } from "../_lib/discord";

// Hand-curated channel list shown in the panel. Discord's Widget API only
// returns voice channels, not text — so this list lives in code (or Sanity
// later) until we wire up a bot. Edit here to change.
const CHANNELS = [
  "# general",
  "# gear-chat",
  "# samples-share",
  "# now-playing",
  "# medellín",
  "# calm-and-collect",
];

const FALLBACK_INVITE = process.env.DISCORD_INVITE_URL || "https://discord.com";

export async function DiscordStrip() {
  const widget = await getDiscordWidget();
  const presence = widget?.presenceCount;
  const memberCount = widget?.memberCount;
  const inviteUrl = widget?.inviteUrl ?? FALLBACK_INVITE;

  return (
    <section id="discord" className="px-5 sm:px-8 py-20 bg-lamp text-ink border-t border-b border-ink">
      <div className="grid md:grid-cols-[1.3fr_1fr] gap-12 items-center">
        <div>
          <div className="font-mono text-[11px] tracking-[.14em] uppercase mb-2.5">THE DISCORD</div>
          <h2
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(48px, 8vw, 120px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
          >
            join the fam
          </h2>
          <p className="font-serif italic text-[22px] leading-snug max-w-[540px] mt-5">
            come thru. share what you&apos;re working on. drop your samples. hang in the #medellín channel if you&apos;re down there. we all here to help each other finish.
          </p>
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-display font-semibold text-[18px] uppercase tracking-[.04em] px-6.5 py-4 border border-ink bg-ink text-paper cursor-pointer rounded-none mt-7 hover:bg-paper hover:text-ink transition-colors no-underline"
          >
            join the discord →
          </a>
        </div>
        <div
          className="bg-ink text-paper border border-ink p-4.5 font-mono"
          style={{ boxShadow: "6px 6px 0 #0B0B0B" }}
        >
          <div className="text-[11px] tracking-[.14em] uppercase text-on-dark mb-2 flex justify-between">
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-chakra-heart mr-1.5 sp-pulse" />
              thespacepit · live
            </span>
            <span>
              {memberCount != null && presence != null
                ? `${memberCount.toLocaleString()} members · ${presence.toLocaleString()} online`
                : memberCount != null
                  ? `${memberCount.toLocaleString()} members`
                  : presence != null
                    ? `${presence.toLocaleString()} online`
                    : "live count off"}
            </span>
          </div>
          {CHANNELS.map((name, i) => (
            <div
              key={name}
              className={`flex justify-between py-2 text-[13px] tracking-[.02em] ${i < CHANNELS.length - 1 ? "border-b border-ink-3" : ""}`}
            >
              <span className="text-lamp">{name}</span>
              <span className="text-on-dark tabular-nums">join →</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
