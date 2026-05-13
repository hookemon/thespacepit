import { defineField, defineType } from "sanity";

export const project = defineType({
  name: "project",
  title: "Project / Era",
  type: "document",
  description: "An era or band/project Nick was a part of (Cubic Zirconia, Men Women + Children, Drop the Lime, etc).",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "yearStart", title: "Year started", type: "number" }),
    defineField({ name: "yearEnd", title: "Year ended (blank if ongoing)", type: "number" }),
    defineField({
      name: "kind",
      title: "Type",
      type: "string",
      options: { list: ["band", "label era", "imprint era", "production era", "residency", "other"] },
      initialValue: "band",
    }),
    defineField({ name: "tagline", title: "Short descriptor", type: "string" }),
    defineField({ name: "color", title: "Bubble color (hex)", type: "string", description: "Used for the era pill on /nick-hook." }),
    defineField({
      name: "layoutVariant",
      title: "Page layout variant",
      type: "string",
      description: "Default = the standard era page. Horizontal-journey = left-to-right snap-scroll panels (e.g. Cubic Zirconia). Collage = scrapbook / vault wall (e.g. Gangsta Boo memorial vault).",
      options: {
        list: [
          { title: "Default — vertical scroll", value: "default" },
          { title: "Horizontal journey — left-to-right snap panels", value: "horizontal-journey" },
          { title: "Collage — scrapbook / vault wall", value: "collage" },
        ],
      },
      initialValue: "default",
    }),
    defineField({
      name: "story",
      title: "The story",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({ name: "cover", title: "Hero image", type: "image", options: { hotspot: true } }),
    defineField({ name: "gallery", title: "Photos", type: "array", of: [{ type: "image", options: { hotspot: true } }] }),
    defineField({
      name: "members",
      title: "Members / collaborators",
      type: "array",
      of: [{ type: "reference", to: [{ type: "artist" }] }],
    }),
    defineField({
      name: "releases",
      title: "Linked releases",
      type: "array",
      of: [{ type: "reference", to: [{ type: "release" }] }],
    }),
    defineField({
      name: "mixes",
      title: "Linked mixes",
      type: "array",
      of: [{ type: "reference", to: [{ type: "mix" }] }],
    }),
    defineField({
      name: "pressQuotes",
      title: "Press quotes (era-specific)",
      type: "array",
      of: [{ type: "reference", to: [{ type: "pressQuote" }] }],
      description: "Pull quotes that appear on this era's page. Independent of the artist-site press wall (use the pressQuote.featured flag for that).",
    }),
    defineField({
      name: "tourHighlights",
      title: "Tour highlights",
      type: "array",
      description: "Notable shows, tours, festival slots, road incidents. Render as a card grid on the era page.",
      of: [
        {
          type: "object",
          name: "tourHighlight",
          fields: [
            { name: "year", type: "number", title: "Year" },
            { name: "title", type: "string", title: "Title", validation: (r) => r.required() },
            { name: "note", type: "string", title: "Note (optional)" },
            {
              name: "kind",
              type: "string",
              title: "Kind (optional)",
              options: { list: ["festival", "support", "headline", "incident", "moment", "tour"] },
            },
          ],
          preview: {
            select: { title: "title", subtitle: "year", note: "note" },
            prepare({ title, subtitle, note }) {
              return { title, subtitle: [subtitle, note].filter(Boolean).join(" · ") };
            },
          },
        },
      ],
    }),
    defineField({
      name: "timeline",
      title: "Timeline",
      type: "array",
      description: "Year-by-year milestones. Renders as a vertical timeline on the era page.",
      of: [
        {
          type: "object",
          name: "milestone",
          fields: [
            { name: "year", type: "number", title: "Year", validation: (r) => r.required() },
            { name: "month", type: "string", title: "Month (optional)" },
            { name: "milestone", type: "text", rows: 2, title: "Milestone", validation: (r) => r.required() },
          ],
          preview: {
            select: { title: "milestone", subtitle: "year", month: "month" },
            prepare({ title, subtitle, month }) {
              return { title, subtitle: month ? `${month} ${subtitle}` : `${subtitle}` };
            },
          },
        },
      ],
    }),
    defineField({ name: "bandcampUrl", title: "Bandcamp URL", type: "url" }),
    defineField({ name: "spotifyUrl", title: "Spotify URL", type: "url" }),
    defineField({ name: "youtubeUrl", title: "YouTube URL", type: "url" }),
    defineField({ name: "websiteUrl", title: "Website URL", type: "url" }),
    defineField({ name: "featured", title: "Pin to top of /nick-hook eras strip", type: "boolean", initialValue: false }),
  ],
  preview: {
    select: { title: "name", subtitle: "tagline", media: "cover" },
  },
  orderings: [
    { name: "yearAsc", title: "Year, oldest first", by: [{ field: "yearStart", direction: "asc" }] },
    { name: "yearDesc", title: "Year, newest first", by: [{ field: "yearStart", direction: "desc" }] },
  ],
});
