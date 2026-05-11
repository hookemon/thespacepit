import { defineField, defineType } from "sanity";

export const release = defineType({
  name: "release",
  title: "Release",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "artists",
      title: "Artist(s)",
      type: "array",
      of: [{ type: "reference", to: [{ type: "artist" }] }],
      validation: (r) => r.min(1),
    }),
    defineField({ name: "catalogNumber", title: "Catalog # (e.g. C+C–024)", type: "string" }),
    defineField({ name: "year", type: "number", description: "Year of original release. Used as a fallback when releaseDate isn't set." }),
    defineField({
      name: "releaseDate",
      title: "Original release date",
      type: "date",
      description: "The actual day the record came out (NOT the Bandcamp re-upload date for reissues). Day-precision. Used as the canonical chronological sort key.",
    }),
    defineField({
      name: "originalLabel",
      title: "Original record label (if different from current)",
      type: "string",
      description: 'For reissued/reclaimed catalog. e.g. "Hookemon", "Lockhart Dynasty". Leave blank if this release came out on its current label originally.',
    }),
    defineField({
      name: "originalReleaseNote",
      title: "Re-release note (one line)",
      type: "string",
      description: 'Optional. e.g. "originally released 2013 on Hookemon · reclaimed and reissued 2018".',
    }),
    defineField({
      name: "format",
      type: "string",
      options: { list: ["LP", "EP", "Single", '7"', '12"', "Cassette", "Digital", "Compilation", "Remix", "Mixtape", "DJ Mix", "Podcast"] },
    }),
    defineField({
      name: "label",
      type: "string",
      options: {
        list: [
          "Calm + Collect",
          "Calm + Collect Instrumental",
          "Calllm",
          "Lockhart Dynasty × Calm + Collect",
          "Hookemon",
          "Other",
        ],
      },
      initialValue: "Calm + Collect",
    }),
    defineField({
      name: "withdrawn",
      title: "No longer in catalog?",
      type: "boolean",
      initialValue: false,
      description: "Mark true if removed/delisted (e.g. CC008).",
    }),
    defineField({ name: "cover", title: "Cover art", type: "image", options: { hotspot: true } }),
    defineField({
      name: "coverColor",
      title: "Fallback cover color (if no art yet)",
      type: "string",
      description: "Hex code like #E83A1C — used as a colored placeholder card before cover art is uploaded.",
    }),
    defineField({
      name: "tagline",
      title: "Short tagline / chip text",
      type: "string",
      description: 'Like "drone", "co-exec", "💿 gold". Shown on the card.',
    }),
    defineField({
      name: "bandcampUrl",
      title: "Bandcamp URL",
      type: "url",
      description: "Full URL of the Bandcamp release page. Used to render the embed.",
    }),
    defineField({ name: "bandcampAlbumId", title: "Bandcamp album ID", type: "string", description: "Numeric ID for the album embed (find via Bandcamp Share/Embed)." }),
    defineField({ name: "bandcampTrackId", title: "Bandcamp track ID", type: "string", description: "Use this instead of album ID when the release is a single track inside someone else's album page." }),
    defineField({ name: "spotifyUrl", title: "Spotify URL", type: "url" }),
    defineField({ name: "appleMusicUrl", title: "Apple Music URL", type: "url" }),
    defineField({ name: "youtubeUrl", title: "YouTube URL (full release/playlist)", type: "url" }),
    defineField({ name: "soundcloudUrl", title: "SoundCloud URL", type: "url" }),
    defineField({
      name: "youtubePlaylistId",
      title: "YouTube playlist (auto-syncs every video)",
      type: "string",
      description:
        'Paste the playlist ID — the part after "list=" in the URL. Use this for things like a Rap Monument-style album where every track has a video. Manual one-offs go below.',
    }),
    defineField({
      name: "videos",
      title: "Music videos & clips",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "title", type: "string", title: "Caption (optional)" },
            { name: "youtubeUrl", type: "url", title: "Video URL (YouTube · IG reel · Vimeo · TikTok)", validation: (r) => r.required() },
          ],
          preview: { select: { title: "title", subtitle: "youtubeUrl" } },
        },
      ],
      description: "Music videos, behind-the-scenes, performance clips. Paste any video URL — YouTube, Instagram reel, Vimeo, TikTok.",
    }),
    defineField({
      name: "stems",
      title: "Stem room (interactive multitrack)",
      type: "array",
      description:
        "Upload individual stems for a track here — visitors get an interactive mixer on the release page (play/pause/mute/solo/volume per stem). Best to keep files under ~15MB each for fast loading; export at MP3 320 or short loops.",
      of: [
        {
          type: "object",
          name: "stem",
          fields: [
            { name: "label", type: "string", title: "Stem name (e.g. drums, bass, vox)", validation: (r) => r.required() },
            {
              name: "audio",
              type: "file",
              title: "Audio file (MP3/WAV)",
              options: { accept: "audio/*" },
              validation: (r) => r.required(),
            },
            {
              name: "color",
              type: "string",
              title: "Channel color (hex, optional)",
              description: 'e.g. "#F2B705". If blank, we auto-pick from the palette.',
            },
            { name: "muteByDefault", type: "boolean", title: "Start muted?", initialValue: false },
          ],
          preview: {
            select: { title: "label", subtitle: "audio.asset.originalFilename" },
          },
        },
      ],
    }),
    defineField({
      name: "stemsTrackTitle",
      title: "Stem room — track title (which track these stems are from)",
      type: "string",
      description: 'Shown above the mixer. e.g. "Lokah (LP version)". Leave blank if obvious from the release.',
    }),
    defineField({
      name: "oneshots",
      title: "Pads — one-shot samples (max 16)",
      type: "array",
      description:
        "Short audio samples (drum hits, vocal stabs, FX, vox chops) that visitors can trigger over the stems. Keyboard-mapped 1–8 / Q-W-E-R-T-Y-U-I. Keep each under ~2MB for snappy playback.",
      validation: (r) => r.max(16),
      of: [
        {
          type: "object",
          name: "pad",
          fields: [
            { name: "label", type: "string", title: "Pad name (e.g. kick, vox chop)", validation: (r) => r.required() },
            {
              name: "audio",
              type: "file",
              title: "Sample (MP3/WAV — short)",
              options: { accept: "audio/*" },
              validation: (r) => r.required(),
            },
            {
              name: "color",
              type: "string",
              title: "Pad color (hex, optional)",
              description: 'e.g. "#F2B705".',
            },
          ],
          preview: {
            select: { title: "label", subtitle: "audio.asset.originalFilename" },
          },
        },
      ],
    }),
    defineField({
      name: "tracklist",
      title: "Tracklist",
      type: "array",
      of: [
        {
          type: "object",
          name: "track",
          fields: [
            { name: "title", type: "string", title: "Track title", validation: (r) => r.required() },
            { name: "duration", type: "string", title: "Duration (e.g. 3:42)" },
            { name: "feature", type: "string", title: "feat. (optional)" },
            { name: "note", type: "string", title: "Note (optional)" },
            {
              name: "videoUrl",
              type: "url",
              title: "Music video URL (YouTube · Vimeo · IG reel · TikTok)",
              description: "If this song has a music video, drop the URL here. A play button appears on the tracklist row.",
            },
            {
              name: "audioPreviewUrl",
              type: "url",
              title: "Audio preview (30s clip) — auto-scraped from Bandcamp",
              description: "Don't fill this in manually — the scraper sets it. If empty, no play button on the row.",
            },
          ],
          preview: {
            select: { title: "title", subtitle: "duration", feature: "feature", videoUrl: "videoUrl" },
            prepare({ title, subtitle, feature, videoUrl }) {
              const sub = feature ? `${subtitle ?? ""}  ·  feat. ${feature}` : subtitle;
              return { title: `${videoUrl ? "▶ " : ""}${title}`, subtitle: sub };
            },
          },
        },
      ],
    }),
    defineField({
      name: "notes",
      title: "Liner notes / story",
      type: "array",
      of: [{ type: "block" }],
      description: "Long-form text about the release, how it came together, etc.",
    }),
    defineField({
      name: "credits",
      type: "array",
      description:
        "Who played what. Pick a Person where possible — that turns the name into a clickable link to their world. Fall back to the plain Name field for guests we don't have an artist page for yet.",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "role",
              type: "string",
              title: "Role",
              description: "Pick a common role from the list or type your own.",
              options: {
                list: [
                  // Production
                  { title: "Produced by", value: "Produced by" },
                  { title: "Co-produced by", value: "Co-produced by" },
                  { title: "Executive producer", value: "Executive producer" },
                  { title: "Co-executive producer", value: "Co-executive producer" },
                  { title: "Additional production", value: "Additional production" },
                  // Engineering
                  { title: "Mixed by", value: "Mixed by" },
                  { title: "Co-mixed by", value: "Co-mixed by" },
                  { title: "Recorded by", value: "Recorded by" },
                  { title: "Tracking engineer", value: "Tracking engineer" },
                  { title: "Vocal engineer", value: "Vocal engineer" },
                  { title: "Mastered by", value: "Mastered by" },
                  // Performance
                  { title: "Vocals", value: "Vocals" },
                  { title: "Backing vocals", value: "Backing vocals" },
                  { title: "Bass", value: "Bass" },
                  { title: "Guitar", value: "Guitar" },
                  { title: "Drums", value: "Drums" },
                  { title: "Keys", value: "Keys" },
                  { title: "Synth", value: "Synth" },
                  { title: "Strings", value: "Strings" },
                  { title: "Programming", value: "Programming" },
                  { title: "Beats", value: "Beats" },
                  // Writing / other
                  { title: "Written by", value: "Written by" },
                  { title: "Sampled", value: "Sampled" },
                  { title: "Remix", value: "Remix" },
                  { title: "Featured artist", value: "Featured artist" },
                  { title: "Guest appearance", value: "Guest appearance" },
                  // Visual / package
                  { title: "Cover art", value: "Cover art" },
                  { title: "Photography", value: "Photography" },
                  { title: "Design", value: "Design" },
                  { title: "Video direction", value: "Video direction" },
                  // Org
                  { title: "A&R", value: "A&R" },
                  { title: "Management", value: "Management" },
                ],
                // `direct` keeps the input as a free-text field with the list
                // available as suggestions — Nick can type anything.
              },
            },
            {
              name: "person",
              type: "reference",
              title: "Person (preferred — links to their page)",
              to: [{ type: "artist" }],
            },
            { name: "name", type: "string", title: "Name (fallback if no Person doc exists yet)" },
          ],
          preview: {
            select: { title: "name", personName: "person.name", subtitle: "role" },
            prepare({ title, personName, subtitle }) {
              return { title: personName ?? title ?? "?", subtitle };
            },
          },
        },
      ],
    }),
    defineField({
      name: "gallery",
      title: "Photo gallery",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "relatedSession",
      title: "Linked studio session",
      type: "reference",
      to: [{ type: "studioSession" }],
      description: "If this release came out of a specific session, link it here.",
    }),
    defineField({ name: "featured", type: "boolean", initialValue: false, description: "Pin this release to the top of grids." }),
  ],
  preview: {
    select: { title: "title", subtitle: "catalogNumber", media: "cover" },
  },
  orderings: [
    { name: "yearDesc", title: "Year, newest first", by: [{ field: "year", direction: "desc" }] },
    { name: "catalogDesc", title: "Catalog #, newest first", by: [{ field: "catalogNumber", direction: "desc" }] },
  ],
});
