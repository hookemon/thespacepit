import { defineField, defineType } from "sanity";

export const pressQuote = defineType({
  name: "pressQuote",
  title: "Press Quote",
  type: "document",
  fields: [
    defineField({ name: "quote", type: "text", rows: 3, validation: (r) => r.required() }),
    defineField({ name: "source", title: "Source (e.g. 'El-P · Pitchfork')", type: "string", validation: (r) => r.required() }),
    defineField({ name: "url", title: "Link to article (optional)", type: "url" }),
    defineField({ name: "year", type: "number" }),
    defineField({ name: "featured", type: "boolean", initialValue: true, description: "Show on the artist site press wall." }),
  ],
  preview: {
    select: { title: "quote", subtitle: "source" },
    prepare({ title, subtitle }) {
      return { title: typeof title === "string" ? `"${title.slice(0, 50)}..."` : "Quote", subtitle };
    },
  },
});
