import { defineField, defineType } from "sanity";

/**
 * A flyer / poster / show invite / sticker in the spacepit archive.
 *
 * The thing you'd find taped to the wall in the studio — every gig night,
 * every release party, every tour stop, every mixtape sleeve, every sticker
 * traded at SXSW. Same waterfall pattern as photos / videos / press: tag a
 * flyer to a release / era / show / artist / city and it auto-surfaces on
 * those pages.
 *
 * Bulk-ingested via scripts/import-flyers-bulk.ts which walks JaySounds drive
 * folders + Dropbox flyer folders + (eventually) Gmail attachments.
 *
 * Renders on /wall as a literal graffiti wall — full-bleed grid, slight per-
 * tile rotation, sticker overlap. Embeds behind /jam stem player so when you
 * play stems the wall is the room you're in.
 */
export const flyer = defineType({
  name: "flyer",
  title: "Flyer / Poster",
  type: "document",
  fieldsets: [
    { name: "core", title: "Core" },
    { name: "context", title: "Context" },
    { name: "relations", title: "Where it shows up" },
    { name: "ops", title: "Ops / display" },
  ],
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      fieldset: "core",
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "title",
      title: "Title / event name",
      type: "string",
      fieldset: "core",
      description: 'Short, e.g. "Razzmatazz Fuego — Nick + Gangsta Boo, Oct 18 2019" or "Collage v.1 NYC Release Party".',
    }),
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      fieldset: "core",
      options: {
        list: [
          { title: "Show flyer (gig)",         value: "show" },
          { title: "Tour poster (multi-stop)", value: "tour-poster" },
          { title: "Release party invite",     value: "release-party" },
          { title: "Sticker / merch",          value: "sticker" },
          { title: "Mixtape sleeve",           value: "mixtape" },
          { title: "Festival",                 value: "festival" },
          { title: "Workshop / talk",          value: "workshop" },
          { title: "Other",                    value: "other" },
        ],
      },
      initialValue: "show",
    }),
    // === context ===
    defineField({
      name: "date",
      title: "Date of the event",
      type: "date",
      fieldset: "context",
    }),
    defineField({
      name: "year",
      title: "Year (fallback if no full date)",
      type: "number",
      fieldset: "context",
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      fieldset: "context",
      description: 'e.g. "Brooklyn, NYC", "Barcelona", "Mexico City"',
    }),
    defineField({
      name: "venue",
      title: "Venue",
      type: "string",
      fieldset: "context",
      description: 'e.g. "Razzmatazz", "Nitehawk Cinema", "Verboten"',
    }),
    defineField({
      name: "designer",
      title: "Designer / credit",
      type: "string",
      fieldset: "context",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      fieldset: "context",
      of: [
        {
          type: "string",
          options: {
            list: [
              { value: "spacepit",          title: "thespacepit" },
              { value: "calm-collect",      title: "Calm + Collect" },
              { value: "fools-gold",        title: "Fool's Gold" },
              { value: "rtj",               title: "Run The Jewels" },
              { value: "rtj-cu4tro",        title: "RTJ CU4TRO" },
              { value: "cubic-zirconia",    title: "Cubic Zirconia" },
              { value: "mwc",               title: "Men Women & Children" },
              { value: "spiritual-friendship", title: "Spiritual Friendship" },
              { value: "boo",               title: "Gangsta Boo" },
              { value: "collage",           title: "Collage v.1" },
              { value: "relationships",     title: "Relationships LP" },
              { value: "50-backwoods",      title: "50 Backwoods" },
              { value: "halloween",         title: "Halloween" },
              { value: "rbma",              title: "RBMA" },
              { value: "boiler-room",       title: "Boiler Room" },
              { value: "sxsw",              title: "SXSW" },
              { value: "sonar",             title: "Sónar" },
              { value: "moma-ps1-warm-up",  title: "MoMA PS1 Warm Up" },
              { value: "mexico",            title: "Mexico" },
              { value: "europe",            title: "Europe" },
              { value: "uk",                title: "UK" },
              { value: "asia",              title: "Asia" },
              { value: "tour",              title: "Tour" },
              { value: "release-party",     title: "Release party" },
            ],
          },
        },
      ],
      options: { layout: "tags" },
    }),
    // === relations ===
    defineField({
      name: "relatedRelease",
      title: "Related release",
      type: "reference",
      to: [{ type: "release" }],
      fieldset: "relations",
    }),
    defineField({
      name: "relatedEra",
      title: "Related era / project",
      type: "reference",
      to: [{ type: "project" }],
      fieldset: "relations",
    }),
    defineField({
      name: "relatedShow",
      title: "Related show (liveDate)",
      type: "reference",
      to: [{ type: "liveDate" }],
      fieldset: "relations",
    }),
    defineField({
      name: "relatedArtist",
      title: "Related artist",
      type: "reference",
      to: [{ type: "artist" }],
      fieldset: "relations",
    }),
    defineField({
      name: "relatedBrand",
      title: "Related partner / brand",
      type: "reference",
      to: [{ type: "brand" }],
      fieldset: "relations",
    }),
    // === ops ===
    defineField({
      name: "featured",
      title: "Pin to /wall top",
      type: "boolean",
      fieldset: "ops",
      initialValue: false,
    }),
    defineField({
      name: "hidden",
      title: "Hide from public",
      type: "boolean",
      fieldset: "ops",
      initialValue: false,
    }),
    defineField({
      name: "sourceUrl",
      title: "Source URL (Drive / Dropbox / Gmail thread)",
      type: "url",
      fieldset: "ops",
      description: 'Where the flyer came from — used to dedupe on re-imports.',
    }),
  ],
  preview: {
    select: { title: "title", date: "date", year: "year", city: "city", media: "image" },
    prepare({ title, date, year, city, media }) {
      return {
        title: title || "(untitled flyer)",
        subtitle: [date ?? year, city].filter(Boolean).join(" · "),
        media,
      };
    },
  },
  orderings: [
    { name: "dateDesc", title: "Date (newest)", by: [{ field: "date", direction: "desc" }, { field: "year", direction: "desc" }] },
    { name: "kindAsc",  title: "Kind", by: [{ field: "kind", direction: "asc" }, { field: "date", direction: "desc" }] },
  ],
});
