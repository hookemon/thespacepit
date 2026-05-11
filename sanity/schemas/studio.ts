import { defineField, defineType } from "sanity";

export const studio = defineType({
  name: "studio",
  title: "Studio",
  type: "document",
  description: "thespacepit (Brooklyn), la burbuja (Medellín), or any future room.",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "city", type: "string" }),
    defineField({ name: "country", type: "string" }),
    defineField({ name: "yearOpened", type: "number" }),
    defineField({ name: "tagline", type: "string" }),
    defineField({ name: "story", title: "The story", type: "array", of: [{ type: "block" }] }),
    defineField({ name: "hero", title: "Hero photo", type: "image", options: { hotspot: true } }),
    defineField({ name: "gallery", title: "Photo gallery", type: "array", of: [{ type: "image", options: { hotspot: true } }] }),
    defineField({ name: "gear", title: "Gear that lives here (free text list)", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "color", title: "Accent color (hex)", type: "string" }),
    defineField({ name: "address", title: "Public address (optional)", type: "string" }),
    defineField({ name: "instagramUrl", title: "Instagram URL", type: "url" }),
    defineField({
      name: "youtubePlaylistId",
      title: "YouTube playlist (auto-syncs videos)",
      type: "string",
      description:
        'Paste the playlist ID — the part after "list=" in the URL. All videos auto-appear on the studio page.',
    }),
    defineField({
      name: "videos",
      title: "Videos & reels (one-offs)",
      description: "YouTube, Instagram reel, Vimeo, TikTok — paste any link.",
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
    }),
    defineField({ name: "featured", title: "Pin to top", type: "boolean", initialValue: true }),
  ],
  preview: {
    select: { title: "name", subtitle: "city", media: "hero" },
  },
});
