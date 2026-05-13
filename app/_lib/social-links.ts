/**
 * Single source of truth for all external links across the three sites.
 * When you have a real URL to add (or want to change one), edit it here —
 * every footer, nav, and CTA on the site picks it up automatically.
 *
 * `null` = "we don't have one yet" — components should hide the link when null.
 */

export const SOCIALS = {
  // Email + phone
  bookingEmail: "coleman@smooth-loop.com",
  generalEmail: null as string | null, // TODO: ask Nick
  spacepitEmail: "thespacepit@gmail.com",

  // Discord (also used by env DISCORD_INVITE_URL — kept here for client-side links)
  discordInvite: "https://discord.gg/6qVgUTsVgX",

  // YouTube
  youtubeChannel: "https://www.youtube.com/@thespacepit",

  // Instagram — placeholders, swap to real handles
  instagramNick: "https://www.instagram.com/nickhook/",
  instagramSpacepit: "https://www.instagram.com/thespacepit/",
  instagramLabel: "https://www.instagram.com/calmandcollectrecords/",

  // Bandcamp (per artist + the label storefront)
  bandcampLabel: "https://calmcollect.bandcamp.com",
  bandcampNickHook: "https://nickhook.bandcamp.com",
  bandcampSpiritualFriendship: "https://spiritualfriendship.bandcamp.com",

  // Mixcloud
  mixcloud: "https://www.mixcloud.com/nickhook/",

  // Gumroad — Nick's storefront. Houses the "Ask Doctor Nick" book
  // (compiled from his XLR8R advice column) plus future drops (sample
  // packs, gear cheat sheets, manuals, etc.). Surfaces in every footer.
  gumroadNick: "https://nickhook.gumroad.com" as string | null,

  // Other
  beatport: null as string | null, // TODO: ask Nick — calm + collect on beatport?
  spotifyArtist: "https://open.spotify.com/artist/4ICbI408d4uYagVEL3xf7S",
} as const;

// Drop entries with a null href — lets us pre-wire links (gumroad, beatport,
// etc.) so they appear in the footer the moment the URL gets filled in,
// without rendering broken `href="null"` anchors in the meantime.
type LinkRow = { href: string | null; label: string };
function live<T extends LinkRow>(arr: T[]): Array<T & { href: string }> {
  return arr.filter((l): l is T & { href: string } => typeof l.href === "string" && l.href.length > 0);
}

// Per-site footer link sets — keep order intentional.
export const FOOTER_LINKS = {
  nick: live<LinkRow>([
    { href: SOCIALS.bandcampNickHook, label: "bandcamp" },
    { href: SOCIALS.gumroadNick, label: "gumroad" },
    { href: SOCIALS.spotifyArtist, label: "spotify" },
    { href: SOCIALS.youtubeChannel, label: "youtube" },
    { href: SOCIALS.mixcloud, label: "mixcloud" },
    { href: SOCIALS.discordInvite, label: "discord" },
    { href: SOCIALS.instagramNick, label: "ig" },
    { href: "/contact", label: "contact" },
  ]),
  spacepit: live<LinkRow>([
    { href: SOCIALS.youtubeChannel, label: "youtube" },
    { href: SOCIALS.discordInvite, label: "discord" },
    { href: SOCIALS.instagramSpacepit, label: "ig" },
    { href: SOCIALS.bandcampLabel, label: "bandcamp" },
    { href: SOCIALS.gumroadNick, label: "gumroad" },
    { href: "/contact", label: "contact" },
  ]),
  label: live<LinkRow>([
    { href: SOCIALS.bandcampLabel, label: "bandcamp" },
    { href: SOCIALS.gumroadNick, label: "gumroad" },
    { href: SOCIALS.instagramLabel, label: "ig" },
    { href: "/contact", label: "contact" },
  ]),
} as const;
