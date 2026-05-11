import { defineField, defineType } from "sanity";

export const pack = defineType({
  name: "pack",
  title: "Pack",
  type: "document",
  description:
    "Sample packs, preset packs, templates, tutorials — anything you can drop on a piece of gear. Link to one or more gear docs so it shows up on those gear pages.",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "kind",
      type: "string",
      validation: (r) => r.required(),
      initialValue: "sample-pack",
      options: {
        list: [
          { title: "Sample pack", value: "sample-pack" },
          { title: "Preset pack", value: "preset-pack" },
          { title: "Template / project file", value: "template" },
          { title: "Tutorial / walkthrough", value: "tutorial" },
          { title: "Loop pack", value: "loop-pack" },
          { title: "Drum kit", value: "drum-kit" },
        ],
      },
    }),
    defineField({
      name: "gear",
      title: "Gear this pack is for",
      type: "array",
      of: [{ type: "reference", to: [{ type: "gear" }] }],
      description: "Pick one or more pieces of gear. The pack will appear on each of those gear pages.",
    }),
    defineField({
      name: "releases",
      title: "Releases this pack is tied to",
      type: "array",
      of: [{ type: "reference", to: [{ type: "release" }] }],
      description: "Optional. e.g. the WYGD pack ties to the What You Gonna Do release. Shows up in the JAM section of that release page.",
    }),
    defineField({ name: "tagline", title: "Short descriptor (one line)", type: "string" }),
    defineField({
      name: "description",
      type: "array",
      of: [{ type: "block" }],
      description: "Long-form notes — what's in it, who it's for, how to use.",
    }),
    defineField({ name: "cover", type: "image", options: { hotspot: true } }),
    defineField({ name: "releaseDate", title: "Release date", type: "date" }),
    defineField({ name: "year", type: "number" }),
    defineField({
      name: "downloadUrl",
      title: "Download / buy URL",
      type: "url",
      description: "Bandcamp, Splice, Gumroad, your own link — wherever people grab it.",
    }),
    defineField({ name: "price", title: "Price (display string)", type: "string", description: 'e.g. "$15", "free", "name your price"' }),
    defineField({
      name: "youtubeUrl",
      title: "Walkthrough video URL (optional)",
      type: "url",
    }),
    defineField({ name: "featured", title: "Pin to top", type: "boolean", initialValue: false }),
  ],
  preview: {
    select: { title: "name", kind: "kind", media: "cover" },
    prepare({ title, kind, media }) {
      return { title, subtitle: kind, media };
    },
  },
  orderings: [
    { name: "newest", title: "Newest first", by: [{ field: "releaseDate", direction: "desc" }, { field: "year", direction: "desc" }] },
  ],
});
