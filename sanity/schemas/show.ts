import { defineField, defineType } from "sanity";

export const show = defineType({
  name: "show",
  title: "Show (archive)",
  type: "document",
  description: "Past + upcoming shows. Use 'Live Date' instead for the upcoming-tour list.",
  fields: [
    defineField({ name: "title", type: "string", description: "e.g. 'Live at Sónar 2024'", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
    }),
    defineField({ name: "date", type: "date", validation: (r) => r.required() }),
    defineField({ name: "city", type: "string" }),
    defineField({ name: "venue", type: "string" }),
    defineField({
      name: "performers",
      title: "Roster artists who performed",
      type: "array",
      of: [{ type: "reference", to: [{ type: "artist" }] }],
    }),
    defineField({
      name: "guests",
      title: "Other performers (free text)",
      type: "array",
      of: [{ type: "string" }],
      description: "Names of people who aren't on the roster.",
    }),
    defineField({
      name: "setlist",
      title: "Setlist (free text)",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "notes",
      title: "Notes / story",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "gallery",
      title: "Photos",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({ name: "audioRecordingUrl", title: "Audio recording URL (Bandcamp / SoundCloud)", type: "url" }),
    defineField({ name: "videoUrl", title: "Video URL (YouTube)", type: "url" }),
  ],
  preview: {
    select: { title: "title", subtitle: "date" },
  },
  orderings: [{ name: "dateDesc", title: "Date, newest first", by: [{ field: "date", direction: "desc" }] }],
});
