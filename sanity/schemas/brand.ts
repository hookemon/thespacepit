import { defineField, defineType } from "sanity";

export const brand = defineType({
  name: "brand",
  title: "Brand / Partnership",
  type: "document",
  description: "Brands Nick works with — Teenage Engineering, Ableton, etc.",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "relationship",
      title: "Relationship",
      type: "string",
      options: { list: ["artist mentor", "official artist", "collaborator", "ambassador", "endorsement", "occasional"] },
    }),
    defineField({ name: "tagline", title: "Short descriptor", type: "string" }),
    defineField({
      name: "story",
      title: "The story",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({ name: "logo", title: "Logo (transparent PNG preferred)", type: "image", options: { hotspot: false } }),
    defineField({
      name: "backgroundImage",
      title: "Background photo (full-bleed behind the logo)",
      type: "image",
      options: { hotspot: true },
      description: "A photo of the gear / a session / a partnership moment. Sits behind the logo on the partners page.",
    }),
    defineField({ name: "logoColor", title: "Fallback bg color when no photo (hex)", type: "string", description: 'e.g. "#F4EFE6". Only used if no background photo is set.' }),
    defineField({ name: "websiteUrl", title: "Website URL", type: "url" }),
    defineField({
      name: "youtubePlaylistId",
      title: "YouTube playlist (auto-syncs videos)",
      type: "string",
      description:
        'Paste the playlist ID — the part after "list=" in the URL (e.g. PLMXEKDUSbulOqivbH-7JV42wBDZJ4Mw3D). All videos in the playlist will appear on this brand\'s page automatically. Use the field below for IG reels / one-offs that aren\'t in a playlist.',
    }),
    defineField({
      name: "videos",
      title: "Videos & reels (one-offs)",
      description:
        "YouTube, Instagram reel, Vimeo, TikTok — paste any link. For lots of YouTube videos, use the playlist field above instead.",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "title", type: "string", title: "Caption (optional)" },
            // Inner field name kept as `youtubeUrl` for backward compat with
            // existing data — the input now accepts any video URL.
            { name: "youtubeUrl", type: "url", title: "Video URL (YouTube · IG reel · Vimeo · TikTok)", validation: (r) => r.required() },
          ],
          preview: { select: { title: "title", subtitle: "youtubeUrl" } },
        },
      ],
    }),
    defineField({
      name: "gear",
      title: "Gear from this brand (free text list)",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({ name: "featured", title: "Pin to top", type: "boolean", initialValue: false }),
  ],
  preview: {
    select: { title: "name", subtitle: "relationship", media: "logo" },
  },
  orderings: [
    { name: "featured", title: "Featured first", by: [{ field: "featured", direction: "desc" }, { field: "name", direction: "asc" }] },
  ],
});
