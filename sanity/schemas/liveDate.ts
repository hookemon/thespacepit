import { defineField, defineType } from "sanity";

export const liveDate = defineType({
  name: "liveDate",
  title: "Live Date",
  type: "document",
  fields: [
    defineField({ name: "date", type: "date", validation: (r) => r.required() }),
    defineField({ name: "city", type: "string", validation: (r) => r.required() }),
    defineField({ name: "venue", type: "string" }),
    defineField({
      name: "ticketUrl",
      title: "Ticket / RSVP URL",
      type: "url",
    }),
    defineField({
      name: "ticketLabel",
      title: "Button label",
      type: "string",
      options: { list: ["tix", "RSVP", "soon", "sold out", "free"] },
      initialValue: "tix",
    }),
    defineField({
      name: "showType",
      title: "Show type",
      type: "string",
      options: { list: ["AV show", "DJ set", "Live PA", "Workshop", "Other"] },
    }),
    defineField({ name: "notes", type: "text", rows: 2 }),
  ],
  preview: {
    select: { date: "date", city: "city", venue: "venue" },
    prepare({ date, city, venue }) {
      return { title: `${city ?? ""} — ${venue ?? ""}`.trim(), subtitle: date };
    },
  },
  orderings: [
    { name: "dateAsc", title: "Date, soonest first", by: [{ field: "date", direction: "asc" }] },
    { name: "dateDesc", title: "Date, newest first", by: [{ field: "date", direction: "desc" }] },
  ],
});
