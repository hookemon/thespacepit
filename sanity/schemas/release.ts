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
    defineField({
      name: "status",
      title: "Release status",
      type: "string",
      options: {
        list: [
          { title: "Out — public, in catalog", value: "out" },
          { title: "Dropping — distro pitch / promo phase", value: "dropping" },
          { title: "Upcoming — early planning, no public page yet", value: "upcoming" },
        ],
        layout: "radio",
      },
      initialValue: "out",
      description: '"Dropping" turns the page into a pitch one-sheet (DROPPING badge, stream chips hidden, private listening). "Upcoming" is internal-only. Use alongside `withdrawn` for delisted-after-release.',
    }),
    defineField({ name: "cover", title: "Cover art", type: "image", options: { hotspot: true } }),
    defineField({
      name: "promoAudio",
      title: "Promo audio (private MP3)",
      type: "file",
      description:
        "Upload a single MP3 to render an in-page player right below the cover — for biz/press/DSP folks to listen instantly without click-outs. Hosted on Sanity's CDN. Use for pre-release/private listening; public catalog still uses Bandcamp/streaming URLs further down the page.",
      options: { accept: "audio/mp3,audio/mpeg,audio/wav" },
    }),
    defineField({
      name: "promoAudioUrl",
      title: "Promo audio URL (external)",
      type: "url",
      description: "Fallback if the MP3 lives on an external CDN (Dropbox direct link, Drive direct, etc.) instead of being uploaded to Sanity.",
    }),
    defineField({
      name: "promoAudioAlt",
      title: "Promo audio · alternate (instrumental, dub, etc.)",
      type: "file",
      description:
        "Optional second track in the player — typically the instrumental. Renders a tiny toggle between this and the main promoAudio.",
      options: { accept: "audio/mp3,audio/mpeg,audio/wav,audio/mp4" },
    }),
    defineField({
      name: "promoAudioAltUrl",
      title: "Promo audio · alternate URL (external)",
      type: "url",
      description: "External-CDN fallback for the alternate track.",
    }),
    defineField({
      name: "promoAudioAltLabel",
      title: "Alternate track label",
      type: "string",
      description: 'Default "instrumental" — could be "dub", "radio edit", "acapella", etc.',
      initialValue: "instrumental",
    }),
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
    defineField({ name: "youtubeMusicUrl", title: "YouTube Music URL", type: "url" }),
    defineField({ name: "tidalUrl", title: "Tidal URL", type: "url" }),
    defineField({ name: "amazonMusicUrl", title: "Amazon Music URL", type: "url" }),
    defineField({ name: "deezerUrl", title: "Deezer URL", type: "url" }),
    defineField({ name: "soundcloudUrl", title: "SoundCloud URL", type: "url" }),
    defineField({
      name: "mainVideoUrl",
      title: "Main music video URL (YouTube · Vimeo unlisted · IG reel)",
      type: "url",
      description: "Hero video shown at the top of the release page when in pitch mode. Paste any platform URL — YouTube/Vimeo unlisted is best for distro pitches (no public exposure pre-release).",
    }),
    defineField({
      name: "mainVideoFile",
      title: "Main music video — direct upload (alternative to URL)",
      type: "file",
      options: { accept: "video/*" },
      description: "Optional fallback: upload the video file directly to Sanity. Use this for private distro pitches when you don't want the video on YouTube/Vimeo yet. Will render as a native <video> player.",
    }),
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
            { name: "feature", type: "string", title: "feat. (legacy single string)", description: "LEGACY — kept so old data renders. New entries should use the `features` array below for multi-feature support; this single-string field is auto-derived if blank." },
            {
              name: "features",
              title: "Featured artists (multi)",
              type: "array",
              of: [{ type: "string" }],
              options: { layout: "tags" },
              description: 'Multiple featured artists, one per chip. e.g. ["21 Savage", "Bulletproof Dolphin"]. Renders as "feat. 21 Savage, Bulletproof Dolphin" on the tracklist row. Falls back to the legacy single-string `feature` field if empty.',
            },
            {
              name: "remixer",
              title: "Remixer (if a remix)",
              type: "string",
              description: 'For remix versions — who did the remix. e.g. "DJ Earl Remix" rows on the Head EP, "Tommy Trash Remix" rows on Darko.',
            },
            {
              name: "isrc",
              title: "ISRC",
              type: "string",
              description: 'International Standard Recording Code — your label\'s per-track unique ID. e.g. QMSDU1600242 for Relationships track 1. Auto-imported from delivery metadata; no need to type by hand.',
            },
            {
              name: "writers",
              title: "Writers / songwriters",
              type: "array",
              of: [{ type: "string" }],
              options: { layout: "tags" },
              description: 'Songwriting credits per track. e.g. for CZ "Follow Your Heart" tracks: ["Daud Sturdivant", "Tiombe Lockhart", "Nicholas Conceller"]. Order in the array reflects the BMI-registered order.',
            },
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
            select: { title: "title", subtitle: "duration", feature: "feature", features: "features", remixer: "remixer", videoUrl: "videoUrl" },
            prepare({ title, subtitle, feature, features, remixer, videoUrl }) {
              // Prefer the multi-features array; fall back to legacy single string.
              const ftList = Array.isArray(features) && features.length > 0 ? features.join(", ") : feature;
              const parts: string[] = [];
              if (subtitle) parts.push(subtitle);
              if (ftList)   parts.push(`feat. ${ftList}`);
              if (remixer)  parts.push(`(${remixer})`);
              return { title: `${videoUrl ? "▶ " : ""}${title}`, subtitle: parts.join("  ·  ") };
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
                  // Visual / artwork credits — surface in the credits room
                  // AND as a small tag on the release page meta.
                  { title: "Cover art", value: "Cover art" },
                  { title: "Photography", value: "Photography" },
                  { title: "Art direction", value: "Art direction" },
                  { title: "Layout / design", value: "Layout / design" },
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
            {
              name: "instrument",
              type: "string",
              title: "Instrument / detail (optional)",
              description: 'For performance roles — e.g. "vintage Wurlitzer", "DW Collector\'s with K Custom hats", "modular w/ Buchla LEM-1". Adds texture to the credit line.',
            },
            {
              name: "tracks",
              type: "array",
              of: [{ type: "string" }],
              title: "Track scope (optional)",
              description: 'When this credit only applies to specific tracks, list the track titles (or "track 1", "track 2"). Empty = album-wide. Used for things like "Mike Mogis produced tracks 2, 6, 8, 9, 10, 11" on the MWC self-titled.',
              options: { layout: "tags" },
            },
          ],
          preview: {
            select: { title: "name", personName: "person.name", subtitle: "role", instrument: "instrument", tracks: "tracks" },
            prepare({ title, personName, subtitle, instrument, tracks }) {
              const sub = [
                subtitle,
                instrument,
                Array.isArray(tracks) && tracks.length > 0 ? `${tracks.length} track${tracks.length === 1 ? "" : "s"}` : null,
              ].filter(Boolean).join("  ·  ");
              return { title: personName ?? title ?? "?", subtitle: sub };
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
      name: "linerNotes",
      title: "Liner notes (scans)",
      type: "array",
      description: 'Phone-photograph or scan the printed liner notes (front + back of the sleeve, gatefold, inner inserts, hand-written track scribbles, sticker sheet, etc.). Renders on the release page as "the physical" — full-bleed lightbox-able gallery, the way you would lay them on a table.',
      of: [{
        type: "object",
        name: "linerNotePage",
        fields: [
          { name: "image", type: "image", title: "Page scan", options: { hotspot: true }, validation: (r) => r.required() },
          { name: "caption", type: "string", title: "Caption (optional)", description: 'e.g. "Gatefold left panel", "Back cover", "Insert — handwritten thank-yous"' },
        ],
        preview: { select: { title: "caption", media: "image" }, prepare({ title, media }) { return { title: title || "Liner note page", media }; } },
      }],
    }),
    defineField({
      name: "physicalArtifacts",
      title: "Physical artifacts",
      type: "array",
      description: "Things you would hand someone — test pressings, vinyl jackets, cassette J-cards, RIAA plaques, hand-written tracklists, master DAT, etc. Different kind than `linerNotes` because these are the OBJECTS, not the printed pages.",
      of: [{
        type: "object",
        name: "physicalArtifact",
        fields: [
          { name: "image", type: "image", title: "Photo of the artifact", options: { hotspot: true }, validation: (r) => r.required() },
          { name: "title", type: "string", title: "Title", description: 'e.g. "Test pressing #001", "Cassette J-card", "Hand-written tracklist (back of the napkin)"' },
          {
            name: "kind",
            type: "string",
            title: "Kind",
            options: {
              list: [
                { title: "Test pressing",          value: "test-pressing" },
                { title: "Vinyl jacket",           value: "vinyl-jacket" },
                { title: "CD jewel case",          value: "cd-jewel" },
                { title: "Cassette / J-card",      value: "cassette" },
                { title: "Master tape / DAT",      value: "master-tape" },
                { title: "Hand-written notes",     value: "handwritten" },
                { title: "RIAA / award plaque",    value: "plaque" },
                { title: "Other",                  value: "other" },
              ],
            },
          },
          { name: "note", type: "text", rows: 2, title: "Note (optional)", description: "Story behind the artifact — when, where, who handed it to you, etc." },
        ],
        preview: { select: { title: "title", subtitle: "kind", media: "image" } },
      }],
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
