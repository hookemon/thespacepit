import { defineField, defineType } from "sanity";

export const artist = defineType({
  name: "artist",
  title: "Artist",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "city", title: "City / location", type: "string" }),
    defineField({ name: "tagline", title: "Short note (italic, on roster card)", type: "string" }),
    defineField({
      name: "bio",
      title: "Long bio",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({ name: "portrait", title: "Portrait image", type: "image", options: { hotspot: true } }),
    defineField({
      name: "gallery",
      title: "Photo gallery",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({ name: "bandcampUrl", title: "Bandcamp URL", type: "url" }),
    defineField({ name: "instagramUrl", title: "Instagram URL", type: "url" }),
    defineField({ name: "spotifyUrl", title: "Spotify URL", type: "url" }),
    defineField({ name: "websiteUrl", title: "Website URL", type: "url" }),
    defineField({
      name: "onLabel",
      title: "On Calm + Collect roster?",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "city", media: "portrait" },
  },
});
