import { defineField, defineType } from "sanity";

/**
 * A photo in the spacepit archive.
 *
 * Same waterfall pattern as videos + press: tag a photo to a release / era /
 * artist / brand / gear and it auto-surfaces on that page. Plus master /photos
 * gallery with kind + tag filters.
 *
 * Bulk-ingested via scripts/import-photos.ts which pulls from Drive folders
 * and auto-creates docs with sensible defaults (kind, tags, captions).
 */
export const photo = defineType({
  name: "photo",
  title: "Photo",
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
      name: "caption",
      title: "Caption",
      type: "string",
      fieldset: "core",
      description: 'Short description shown under the photo. e.g. "Large Pro holding the SP-1200, NYC 2018" or "Press shot, 2024".',
    }),
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      fieldset: "core",
      options: {
        list: [
          { title: "Press shot",     value: "press" },
          { title: "Studio session", value: "session" },
          { title: "Live performance", value: "live" },
          { title: "Portrait",       value: "portrait" },
          { title: "Behind the scenes", value: "bts" },
          { title: "Gear",           value: "gear" },
          { title: "Studio space",   value: "studio" },
          { title: "Travel / on the road", value: "travel" },
          { title: "Group / crew",   value: "crew" },
          { title: "Cover art / artwork", value: "artwork" },
          { title: "Other",          value: "other" },
        ],
      },
      initialValue: "press",
    }),
    // === context ===
    defineField({
      name: "date",
      title: "Date taken (or year)",
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
      name: "photographer",
      title: "Photographer / credit",
      type: "string",
      fieldset: "context",
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      fieldset: "context",
      description: 'e.g. "Brooklyn, NYC", "Medellín", "MoogFest 2018".',
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
              { value: "press-shot", title: "Press shot" },
              { value: "epk",        title: "EPK" },
              { value: "session",    title: "Session" },
              { value: "live",       title: "Live" },
              { value: "studio",     title: "Studio (room)" },
              { value: "spacepit",   title: "thespacepit" },
              { value: "medellin",   title: "Medellín" },
              { value: "rooftop",    title: "Rooftop" },
              { value: "gear",       title: "Gear" },
              { value: "tour",       title: "Tour" },
              { value: "festival",   title: "Festival" },
              { value: "mwc",        title: "Men Women & Children" },
              { value: "cubic-zirconia", title: "Cubic Zirconia" },
              { value: "spiritual-friendship", title: "Spiritual Friendship" },
              { value: "brillstein", title: "Brillstein" },
              { value: "rtj",        title: "Run The Jewels" },
              { value: "dam-funk",   title: "DāM-FunK" },
              { value: "teenage-engineering", title: "Teenage Engineering" },
            ],
          },
        },
      ],
      options: { layout: "tags" },
    }),
    // === relations — same field names as video schema for consistency ===
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
    defineField({
      name: "relatedGear",
      title: "Related gear",
      type: "reference",
      to: [{ type: "gear" }],
      fieldset: "relations",
    }),
    defineField({
      name: "relatedPress",
      title: "Related press piece",
      type: "reference",
      to: [{ type: "pressQuote" }],
      fieldset: "relations",
      description: 'e.g. the photo that ran with the Sound on Sound piece — link to that pressQuote doc.',
    }),
    // === ops ===
    defineField({
      name: "featured",
      title: "Pin to /photos top",
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
      title: "Source URL (Drive / external link)",
      type: "url",
      fieldset: "ops",
      description: 'Where the photo came from in Drive — used to dedupe on re-imports.',
    }),
  ],
  preview: {
    select: { title: "caption", subtitle: "kind", media: "image", year: "year" },
    prepare({ title, subtitle, media, year }) {
      return {
        title: title || "(no caption)",
        subtitle: [subtitle, year].filter(Boolean).join(" · "),
        media,
      };
    },
  },
  orderings: [
    { name: "dateDesc", title: "Date (newest)", by: [{ field: "date", direction: "desc" }, { field: "year", direction: "desc" }] },
    { name: "kindAsc",  title: "Kind", by: [{ field: "kind", direction: "asc" }, { field: "date", direction: "desc" }] },
  ],
});
