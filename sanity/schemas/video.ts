import { defineField, defineType } from "sanity";

/**
 * A YouTube video in the spacepit catalog. Synced from the channel via
 * scripts/sync-youtube.ts (idempotent — keys on youtubeId). Tags + relations
 * are editable in /studio so a sync overwrites metadata but keeps curation.
 */
export const video = defineType({
  name: "video",
  title: "Video (YouTube)",
  type: "document",
  fields: [
    defineField({
      name: "youtubeId",
      title: "YouTube video ID",
      type: "string",
      description: 'The 11-char ID, e.g. "dQw4w9WgXcQ"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 4,
      description: "Auto-pulled from YouTube. Edit freely; the sync only writes here when blank.",
    }),
    defineField({
      name: "publishedAt",
      title: "Published date",
      type: "datetime",
    }),
    defineField({
      name: "thumbnail",
      title: "Thumbnail (image)",
      type: "image",
      description: "Auto-pulled from YouTube high-res thumb. Override here to use a custom poster.",
      options: { hotspot: true },
    }),
    defineField({
      name: "thumbnailUrl",
      title: "Thumbnail (URL fallback)",
      type: "url",
      description: "YouTube-hosted thumb URL. Used when no image upload exists.",
    }),
    defineField({
      name: "duration",
      type: "string",
      description: 'Human-readable, e.g. "12:34"',
    }),
    defineField({
      name: "viewCount",
      type: "number",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [
        {
          type: "string",
          options: {
            list: [
              { value: "gear-demo",         title: "Gear demo" },
              { value: "live-set",          title: "Live set / DJ (short performance)" },
              { value: "livestream",        title: "Livestream (long-form, unedited)" },
              { value: "studio-session",    title: "Studio session / jam" },
              { value: "music-video",       title: "Music video" },
              { value: "behind-the-scenes", title: "Behind the scenes" },
              { value: "interview",         title: "Interview / talk" },
              { value: "tutorial",          title: "Tutorial / walkthrough" },
              { value: "chakra",            title: "Chakra / meditation" },
              { value: "rbma",              title: "Red Bull Music Academy" },
              { value: "rtj",               title: "Run The Jewels" },
              { value: "dam-funk",          title: "DāM-FunK" },
              { value: "mwc",               title: "Men Women & Children" },
              { value: "cubic-zirconia",    title: "Cubic Zirconia" },
              { value: "spiritual-friendship", title: "Spiritual Friendship" },
              { value: "brillstein",        title: "Brillstein" },
              { value: "sample-pack",       title: "Sample pack / drop" },
              { value: "mix",               title: "Mixtape / radio" },
              { value: "jam",               title: "Jam (modular / improv)" },
              { value: "vlog",              title: "Vlog / studio diary" },
              { value: "spacepit",          title: "thespacepit moment" },
              { value: "medellin",          title: "Medellín / la burbuja" },
            ],
          },
        },
      ],
      options: { layout: "tags" },
    }),
    defineField({
      name: "relatedRelease",
      title: "Related release",
      type: "reference",
      to: [{ type: "release" }],
      description: "If this video is for / about a specific release, link it. Surfaces on the release page.",
    }),
    defineField({
      name: "relatedEra",
      title: "Related era",
      type: "reference",
      to: [{ type: "project" }],
      description: "Surfaces on the era page.",
    }),
    defineField({
      name: "relatedArtist",
      title: "Related artist (primary)",
      type: "reference",
      to: [{ type: "artist" }],
      description: "Primary artist for the video — when set, the video surfaces under their page as a main credit.",
    }),
    defineField({
      name: "relatedArtists",
      title: "Other artists in the video",
      type: "array",
      of: [{ type: "reference", to: [{ type: "artist" }] }],
      description:
        "Additional people in the room. Surfaces on each of their artist pages too. Use for crew / collaborators / featured guests beyond the primary artist.",
    }),
    defineField({
      name: "relatedBrand",
      title: "Related partner / brand",
      type: "reference",
      to: [{ type: "brand" }],
      description: "Surfaces on the partner page.",
    }),
    defineField({
      name: "relatedGear",
      title: "Related gear / instrument",
      type: "reference",
      to: [{ type: "gear" }],
      description: "Pin a video to a specific piece of gear (e.g. OP-XY) — surfaces on that gear's page.",
    }),
    defineField({
      name: "featured",
      type: "boolean",
      description: "Pin to the top of /watch.",
      initialValue: false,
    }),
    defineField({
      name: "hidden",
      type: "boolean",
      description: "Hide from /watch and any auto-surfacing without deleting the doc.",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "duration", media: "thumbnail" },
    prepare({ title, subtitle, media }) {
      return { title, subtitle: subtitle ?? "—", media };
    },
  },
});
