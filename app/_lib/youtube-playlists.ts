// YouTube playlist IDs — the curation layer.
//
// Each entry is a real playlist on the @thespacepit YouTube channel.
// Drop a new entry here, the site picks it up automatically.
// (Title pulled from YouTube; we don't duplicate it in code.)

export type PlaylistDef = {
  id: string;
  // The slug shown in URLs + filter chips. Stable; doesn't change if you rename
  // the playlist on YouTube.
  slug: string;
};

export const PLAYLISTS: PlaylistDef[] = [
  {
    id: "PLMXEKDUSbulOqivbH-7JV42wBDZJ4Mw3D",
    slug: "thespacepit",
  },
  {
    id: "PLMXEKDUSbulMkZDRlNKjzUWtQ01d9VcXk",
    slug: "djing",
  },
  {
    id: "PLMXEKDUSbulMePMHTBv3HA4uHM6rYvE75",
    slug: "music-videos",
  },
  {
    id: "PLMXEKDUSbulMtTJ9cv2_gFSHSBzvGs0oT",
    slug: "run-the-jewels",
  },
  {
    id: "PLMXEKDUSbulN4ZNzu3fGM3odbhTvShkdF",
    slug: "rap-monument",
  },
  // Drop in your gear-walkthrough playlist URL here once you have one:
  // { id: "PL...", slug: "gear" },
  // { id: "PL...", slug: "live" },
  // { id: "PL...", slug: "radio" },
];

// The "homepage feature" playlist — what the spacepit landing page rotates
// videos from. Currently "thespacepit" itself; could become its own curated
// "best of" playlist later.
export const FEATURED_PLAYLIST_SLUG = "thespacepit";
