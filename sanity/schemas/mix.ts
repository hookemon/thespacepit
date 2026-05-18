import { defineField, defineType } from "sanity";

export const mix = defineType({
  name: "mix",
  title: "DJ Mix",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "date", type: "date", description: "Original date the mix was recorded / released." }),
    defineField({
      name: "era",
      title: "Era",
      type: "string",
      description: 'Free text. Examples: "cubic zirconia / 2009", "calm + collect / 2018", "medellín".',
    }),
    defineField({
      name: "mixcloudUrl",
      title: "Mixcloud URL",
      type: "url",
      description: "The full Mixcloud page URL. Used to render the embedded player.",
    }),
    defineField({ name: "soundcloudUrl", title: "SoundCloud URL", type: "url" }),
    defineField({ name: "youtubeUrl", title: "YouTube URL", type: "url" }),
    defineField({
      name: "audio",
      title: "Audio file (direct upload)",
      type: "file",
      options: { accept: "audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/wav" },
      description: "Optional. Direct upload of the mix file — used when the mix isn't (yet) on Mixcloud / SoundCloud. Plays via the global MiniPlayer when the mix is opened.",
    }),
    defineField({ name: "duration", title: "Duration (e.g. 1:24:11)", type: "string" }),
    defineField({ name: "cover", title: "Cover art", type: "image", options: { hotspot: true } }),
    defineField({
      name: "description",
      title: "Notes",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "tracklist",
      title: "Tracklist (one per line)",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({ name: "featured", title: "Pin to top", type: "boolean", initialValue: false }),
  ],
  preview: {
    select: { title: "title", subtitle: "era", media: "cover" },
  },
  orderings: [
    { name: "dateDesc", title: "Date, newest first", by: [{ field: "date", direction: "desc" }] },
    { name: "dateAsc", title: "Date, oldest first", by: [{ field: "date", direction: "asc" }] },
  ],
});
