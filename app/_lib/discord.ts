/**
 * Live Discord server stats.
 *
 * Two strategies, in priority order:
 *
 *   1. Invite endpoint (`/api/v10/invites/{code}?with_counts=true`) —
 *      returns total member count + online count. Works on ANY public invite,
 *      no server config needed. This is the primary path.
 *
 *   2. Widget endpoint (`/api/guilds/{id}/widget.json`) — returns voice channel
 *      list + presence count, but ONLY if "Enable Server Widget" is toggled in
 *      Discord → Server Settings → Widget. Used as a fallback / enrichment for
 *      voice channels.
 *
 * Env:
 *   DISCORD_INVITE_URL  — full invite URL (e.g. https://discord.gg/6qVgUTsVgX).
 *                         Used by both endpoints (we extract the code).
 *   DISCORD_SERVER_ID   — optional. If set, we'll also try the widget endpoint
 *                         to get voice channels. Auto-resolved from the invite
 *                         on the first call if missing — but pinning it in env
 *                         saves a request.
 */

export type DiscordWidget = {
  /** People currently online (presence). */
  presenceCount: number;
  /** Total members in the server. May be undefined if only the widget endpoint succeeded. */
  memberCount?: number;
  inviteUrl: string;
  voiceChannels: { id: string; name: string }[];
};

function extractInviteCode(url: string | undefined): string | null {
  if (!url) return null;
  // Accepts discord.gg/CODE, discord.com/invite/CODE, or a bare CODE.
  const m = url.match(/(?:discord\.gg\/|discord\.com\/invite\/)([A-Za-z0-9-]+)/);
  if (m) return m[1];
  if (/^[A-Za-z0-9-]+$/.test(url)) return url;
  return null;
}

type InviteResponse = {
  guild?: { id: string; name: string };
  approximate_member_count?: number;
  approximate_presence_count?: number;
};

type WidgetResponse = {
  presence_count?: number;
  instant_invite?: string;
  channels?: { id: string; name: string }[];
};

export async function getDiscordWidget(): Promise<DiscordWidget | null> {
  const inviteUrl = process.env.DISCORD_INVITE_URL ?? "";
  const inviteCode = extractInviteCode(inviteUrl);
  const serverId = process.env.DISCORD_SERVER_ID;

  let memberCount: number | undefined;
  let presenceCount: number | undefined;
  let voiceChannels: { id: string; name: string }[] = [];

  // Strategy 1: invite endpoint (primary — works without any server config)
  if (inviteCode) {
    try {
      const res = await fetch(
        `https://discord.com/api/v10/invites/${inviteCode}?with_counts=true`,
        { next: { revalidate: 300 } }
      );
      if (res.ok) {
        const data = (await res.json()) as InviteResponse;
        memberCount = data.approximate_member_count;
        presenceCount = data.approximate_presence_count;
      } else {
        console.warn(`Discord invite fetch failed: ${res.status}`);
      }
    } catch (err) {
      console.warn("Discord invite error:", (err as Error).message);
    }
  }

  // Strategy 2: widget endpoint (optional, for voice channels)
  if (serverId) {
    try {
      const res = await fetch(`https://discord.com/api/guilds/${serverId}/widget.json`, {
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const data = (await res.json()) as WidgetResponse;
        // Prefer widget's presence count if invite didn't return one
        presenceCount = presenceCount ?? data.presence_count;
        voiceChannels = data.channels ?? [];
      }
      // If the widget isn't enabled (403), silently fall through — we still
      // have the invite-endpoint counts.
    } catch (err) {
      console.warn("Discord widget error:", (err as Error).message);
    }
  }

  if (presenceCount === undefined && memberCount === undefined) {
    return null;
  }

  return {
    presenceCount: presenceCount ?? 0,
    memberCount,
    inviteUrl: inviteUrl || "https://discord.com",
    voiceChannels,
  };
}
