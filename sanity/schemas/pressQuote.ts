import { defineField, defineType } from "sanity";

/**
 * A press piece — review, interview, feature, mention, profile.
 *
 * Originally just a "quote" doc for the homepage press wall. Expanded so a
 * single doc can be:
 *   · a chronological entry on /press
 *   · pinned-quote on /nick-hook
 *   · attached to a release (review pulls onto that release's page)
 *   · attached to an era (MWC press goes on /eras/men-women-children)
 *   · attached to an artist (cross-discovery)
 *
 * Legacy field names (`quote`, `source`, `year`) preserved so existing data
 * keeps working; new fields are additive.
 */
export const pressQuote = defineType({
  name: "pressQuote",
  title: "Press piece",
  type: "document",
  fieldsets: [
    { name: "core",       title: "Core" },
    { name: "publication", title: "Publication" },
    { name: "links",      title: "Links / image" },
    { name: "relations",  title: "Where it shows up" },
  ],
  fields: [
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      fieldset: "core",
      options: { list: ["review", "interview", "feature", "profile", "mention", "list-inclusion", "premiere"] },
      initialValue: "review",
    }),
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
      fieldset: "core",
      description: 'The article title. Auto-pulled from og:title when ingested via the press script.',
    }),
    defineField({
      name: "quote",
      title: "Pull quote",
      type: "text",
      rows: 3,
      fieldset: "core",
      validation: (r) => r.required(),
      description: "The standout line. Used on the press wall + as fallback when there's no excerpt.",
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt (longer)",
      type: "text",
      rows: 4,
      fieldset: "core",
      description: 'Optional. A paragraph of context for the master /press page. Falls back to "quote" if blank.',
    }),
    // === publication ===
    defineField({
      name: "outlet",
      title: "Outlet",
      type: "string",
      fieldset: "publication",
      description: 'Just the publication name — e.g. "Pitchfork", "FACT", "Sound on Sound". Distinct from "source" below.',
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "string",
      fieldset: "publication",
      description: 'Who wrote the piece (or whose quote this is). Optional.',
    }),
    defineField({
      name: "source",
      title: "Source (legacy display)",
      type: "string",
      fieldset: "publication",
      description: 'Legacy field — old docs use this as "El-P · Pitchfork". New docs should fill outlet + author separately; this is auto-derived if blank.',
    }),
    defineField({
      name: "date",
      title: "Publish date",
      type: "date",
      fieldset: "publication",
      description: "Full date if you have it — used to sort the master press page chronologically.",
    }),
    defineField({
      name: "year",
      title: "Year (legacy / fallback)",
      type: "number",
      fieldset: "publication",
    }),
    // === links / image ===
    defineField({
      name: "url",
      title: "Article URL",
      type: "url",
      fieldset: "links",
    }),
    defineField({
      name: "image",
      title: "Article image",
      type: "image",
      fieldset: "links",
      options: { hotspot: true },
      description: "Auto-pulled from og:image when ingested via the press script. Optional.",
    }),
    // === relations ===
    defineField({
      name: "relatedRelease",
      title: "Related release",
      type: "reference",
      to: [{ type: "release" }],
      fieldset: "relations",
      description: "If this is a review of a specific record, link it here. Surfaces on that release's page.",
    }),
    defineField({
      name: "relatedEra",
      title: "Related era / project",
      type: "reference",
      to: [{ type: "project" }],
      fieldset: "relations",
      description: 'MWC = "men-women-children", CZ = "cubic-zirconia", etc.',
    }),
    defineField({
      name: "relatedArtist",
      title: "Related artist",
      type: "reference",
      to: [{ type: "artist" }],
      fieldset: "relations",
    }),
    defineField({
      name: "featured",
      title: "Pin to the press wall",
      type: "boolean",
      initialValue: false,
      description: "Show on /nick-hook#press top-of-page wall. Only the strongest 6–8 quotes should be pinned.",
    }),
  ],
  orderings: [
    { name: "dateDesc", title: "Date (newest first)", by: [{ field: "date", direction: "desc" }, { field: "year", direction: "desc" }] },
    { name: "dateAsc",  title: "Date (oldest first)", by: [{ field: "date", direction: "asc" },  { field: "year", direction: "asc" }] },
  ],
  preview: {
    select: { quote: "quote", headline: "headline", outlet: "outlet", source: "source", year: "year", date: "date", media: "image" },
    prepare({ quote, headline, outlet, source, year, date, media }) {
      const title = headline ?? (typeof quote === "string" ? `"${quote.slice(0, 60)}..."` : "Press piece");
      const sub = [outlet ?? source, date ?? year].filter(Boolean).join(" · ");
      return { title, subtitle: sub, media };
    },
  },
});
