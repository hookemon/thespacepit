import { defineField, defineType } from "sanity";

/**
 * A career highlight — a festival, a tour, a residency, an experience worth
 * naming on the EPK / nick-hook page. Each one is a doc you can grow over
 * time: start with just the name, add year(s) + city + a story + a photo
 * + a link as memory + assets allow.
 *
 * Three "kinds":
 *   · performance  — festivals + venues you've played (Sónar, MoMA PS1,
 *                    Pitchfork Festival, Movement, Boiler Room, etc.)
 *   · tour         — multi-date runs (RTJ US 2017, India / Asia 2020,
 *                    Machinedrum Vapor City)
 *   · experience   — non-show milestones (Red Bull Music Academy 2011,
 *                    Teenage Engineering mentorship, Bauer doc)
 *
 * Rendered as a grid on /nick-hook#highlights — each card blooms as more
 * fields get filled (image first, then year/city, then story).
 */
export const highlight = defineType({
  name: "highlight",
  title: "Career highlight",
  type: "document",
  description: "Festival, tour, residency or experience that belongs on the EPK / nick-hook page.",
  fieldsets: [
    { name: "core", title: "Core" },
    { name: "context", title: "When + where" },
    { name: "story", title: "The story" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      fieldset: "core",
      validation: (r) => r.required(),
      description: 'e.g. "Sónar", "Run The Jewels US 2017", "Red Bull Music Academy".',
    }),
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      fieldset: "core",
      options: { list: ["performance", "tour", "experience"], layout: "radio" },
      initialValue: "performance",
      validation: (r) => r.required(),
      description: "Which highlight column this lives in on the page.",
    }),
    defineField({
      name: "order",
      title: "Order within column (lower = higher)",
      type: "number",
      fieldset: "core",
      description: "Manual sort within its column. Leave blank for chronological by `yearStart`.",
    }),
    // === context ===
    defineField({
      name: "city",
      title: "City",
      type: "string",
      fieldset: "context",
      description: 'e.g. "Barcelona, ES", "Detroit, MI", "New York, NY".',
    }),
    defineField({
      name: "venue",
      title: "Venue (optional)",
      type: "string",
      fieldset: "context",
      description: 'For specific shows: "Razzmatazz · Fuego", "Music Hall of Williamsburg". Leave blank for festivals/tours.',
    }),
    defineField({
      name: "yearStart",
      title: "Year (or first year)",
      type: "number",
      fieldset: "context",
      description: "e.g. 2014. If you played the festival multiple times, this is the first.",
    }),
    defineField({
      name: "yearEnd",
      title: "Last year (optional)",
      type: "number",
      fieldset: "context",
      description: "Fill in only if this is a multi-year thing (e.g. played Sónar 2012, 2014, 2018 → start=2012, end=2018).",
    }),
    defineField({
      name: "years",
      title: "Specific years (optional)",
      type: "array",
      of: [{ type: "number" }],
      fieldset: "context",
      options: { layout: "tags" },
      description: 'Drop in every year you played this. e.g. [2012, 2014, 2018]. Useful for festivals with multiple appearances. If filled, the card renders "12 · 14 · 18".',
    }),
    // === story / media ===
    defineField({
      name: "note",
      title: "Story / context",
      type: "text",
      rows: 4,
      fieldset: "story",
      description: "Short paragraph — what you did there, who you played with, anything memorable. Renders below the year on the card.",
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      fieldset: "story",
      options: { hotspot: true },
      description: "One strong image — stage shot, festival flyer, ticket, IG post screenshot. Becomes the card hero.",
    }),
    defineField({
      name: "url",
      title: "Link (optional)",
      type: "url",
      fieldset: "story",
      description: "Recap article · IG post · YouTube clip · festival page. Makes the card clickable.",
    }),
    defineField({
      name: "hidden",
      title: "Hide from page",
      type: "boolean",
      initialValue: false,
      description: "Tick to temporarily remove from /nick-hook#highlights without deleting the doc.",
    }),
  ],
  orderings: [
    {
      name: "chronological",
      title: "Chronological (oldest first)",
      by: [{ field: "yearStart", direction: "asc" }, { field: "name", direction: "asc" }],
    },
    {
      name: "byKindThenOrder",
      title: "By kind, then order",
      by: [{ field: "kind", direction: "asc" }, { field: "order", direction: "asc" }, { field: "yearStart", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "name", kind: "kind", yearStart: "yearStart", yearEnd: "yearEnd", years: "years", media: "image", city: "city" },
    prepare({ title, kind, yearStart, yearEnd, years, media, city }) {
      const yearBit =
        years && years.length > 0
          ? years.join(" · ")
          : yearStart && yearEnd
            ? `${yearStart}–${yearEnd}`
            : yearStart
              ? String(yearStart)
              : "";
      const sub = [kind, yearBit, city].filter(Boolean).join("  ·  ");
      return { title: title ?? "Highlight", subtitle: sub, media };
    },
  },
});
