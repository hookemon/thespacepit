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
      name: "displayInitials",
      title: "Show initials instead of portrait",
      type: "boolean",
      description: 'When ON, the artist page renders a big monogram (e.g. "NH") instead of the portrait. For when the design-block look hits harder than any photo would.',
      initialValue: false,
    }),
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
    // === TSP Crew / Alumni ===
    // Surfaces this artist on the /crew page — the home for everyone who
    // came up through thespacepit (interns, residents, regulars). Pair
    // with `crewRole` (the snapshot of how they're framed: "the gold-record
    // intern", "the engineer", etc.) and `crewYearStart` (when they first
    // showed up in the room).
    defineField({
      name: "tspCrew",
      title: "TSP Crew / Alumni?",
      type: "boolean",
      description: "If true, this artist appears on /crew — the alumni page.",
      initialValue: false,
    }),
    defineField({
      name: "crewRole",
      title: "Crew role / story tag",
      type: "string",
      description: 'One-line framing for the /crew card. e.g. "gold-record intern", "the engineer", "the producer next door".',
      hidden: ({ document }) => !document?.tspCrew,
    }),
    defineField({
      name: "crewYearStart",
      title: "Year they first showed up at the pit",
      type: "number",
      hidden: ({ document }) => !document?.tspCrew,
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "city", media: "portrait" },
  },
});
