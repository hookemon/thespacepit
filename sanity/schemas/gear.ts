import { defineField, defineType } from "sanity";

export const gear = defineType({
  name: "gear",
  title: "Gear",
  type: "document",
  description: "One doc per piece of gear in the rack — drum machines, synths, samplers, outboard, mics, all of it.",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "category",
      type: "string",
      validation: (r) => r.required(),
      options: {
        list: [
          { title: "Drum machine", value: "drum-machine" },
          { title: "Synth", value: "synth" },
          { title: "Sampler", value: "sampler" },
          { title: "Modular / eurorack", value: "modular" },
          { title: "Outboard (FX / comp / EQ / reverb)", value: "outboard" },
          { title: "Mic", value: "mic" },
          { title: "Controller", value: "controller" },
          { title: "Monitoring", value: "monitor" },
          { title: "DJ", value: "dj" },
          { title: "Software / plugin", value: "software" },
        ],
      },
    }),
    defineField({
      name: "status",
      type: "string",
      initialValue: "active",
      options: {
        list: [
          { title: "Active (patched in)", value: "active" },
          { title: "Shelf (at the studio, not patched)", value: "shelf" },
          { title: "Travel (medellín / road kit)", value: "travel" },
          { title: "Wishlist", value: "wishlist" },
          { title: "Retired / sold", value: "retired" },
        ],
      },
    }),
    defineField({ name: "manufacturer", type: "string", description: 'e.g. "Roland", "Teenage Engineering", "Akai".' }),
    defineField({ name: "note", type: "text", description: "The story. Where it came from, why it matters, what it sounds like.", rows: 3 }),
    defineField({ name: "yearAcquired", title: "Year acquired", type: "number" }),
    defineField({ name: "photo", type: "image", options: { hotspot: true } }),
    defineField({ name: "pinned", title: "Pin to homepage teaser", type: "boolean", initialValue: false }),
  ],
  preview: {
    select: { title: "name", category: "category", status: "status", media: "photo" },
    prepare({ title, category, status, media }) {
      return { title, subtitle: `${category}${status ? ` · ${status}` : ""}`, media };
    },
  },
  orderings: [
    { name: "name", title: "Name", by: [{ field: "name", direction: "asc" }] },
    { name: "category", title: "Category", by: [{ field: "category", direction: "asc" }, { field: "name", direction: "asc" }] },
  ],
});
