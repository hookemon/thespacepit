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

  // Other
  beatport: null as string | null, // TODO: ask Nick — calm + collect on beatport?
  spotifyArtist: "https://open.spotify.com/artist/4ICbI408d4uYagVEL3xf7S",
} as const;

// Per-site footer link sets — keep order intentional.
export const FOOTER_LINKS = {
  nick: [
    { href: SOCIALS.bandcampNickHook, label: "bandcamp" },
    { href: SOCIALS.spotifyArtist, label: "spotify" },
    { href: SOCIALS.youtubeChannel, label: "youtube" },
    { href: SOCIALS.mixcloud, label: "mixcloud" },
    { href: SOCIALS.discordInvite, label: "discord" },
    { href: SOCIALS.instagramNick, label: "ig" },
    { href: "/contact", label: "contact" },
  ],
  spacepit: [
    { href: SOCIALS.youtubeChannel, label: "youtube" },
    { href: SOCIALS.discordInvite, label: "discord" },
    { href: SOCIALS.instagramSpacepit, label: "ig" },
    { href: SOCIALS.bandcampLabel, label: "bandcamp" },
    { href: "/contact", label: "contact" },
  ],
  label: [
    { href: SOCIALS.bandcampLabel, label: "bandcamp" },
    { href: SOCIALS.instagramLabel, label: "ig" },
    { href: "/contact", label: "contact" },
  ],
} as const;
