import { defineField, defineType } from "sanity";

export const studioSession = defineType({
  name: "studioSession",
  title: "Studio Session",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "date", type: "date", validation: (r) => r.required() }),
    defineField({
      name: "location",
      type: "string",
      options: { list: ["the spacepit · Brooklyn", "Medellín · the garden", "Other"] },
    }),
    defineField({
      name: "people",
      title: "Roster artists who were there",
      type: "array",
      of: [{ type: "reference", to: [{ type: "artist" }] }],
    }),
    defineField({
      name: "guests",
      title: "Other guests (free text)",
      type: "array",
      of: [{ type: "string" }],
      description: "Names of people who aren't on the roster.",
    }),
    defineField({
      name: "gear",
      title: "Gear used (free text list)",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "notes",
      title: "Story / what happened",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "gallery",
      title: "Photos",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "becameReleases",
      title: "Releases that came from this",
      type: "array",
      of: [{ type: "reference", to: [{ type: "release" }] }],
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "date" },
  },
  orderings: [{ name: "dateDesc", title: "Date, newest first", by: [{ field: "date", direction: "desc" }] }],
});
