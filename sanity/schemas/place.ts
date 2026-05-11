import { defineField, defineType } from "sanity";

export const place = defineType({
  name: "place",
  title: "Place (Map Pin)",
  type: "document",
  description:
    "A pin on the world map — a venue, studio, club, restaurant, hotel, record store, or just a vibe. Coordinates are lat/lng decimal degrees (look them up on Google Maps).",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "kind",
      title: "What kind of place?",
      type: "string",
      validation: (r) => r.required(),
      options: {
        list: [
          { title: "Studio", value: "studio" },
          { title: "Show / Venue", value: "show" },
          { title: "Club", value: "club" },
          { title: "Festival", value: "festival" },
          { title: "Session / Pop-up", value: "session" },
          { title: "Party", value: "party" },
          { title: "Workshop / Class", value: "workshop" },
          { title: "Restaurant", value: "restaurant" },
          { title: "Bar / Café", value: "bar" },
          { title: "Hotel", value: "hotel" },
          { title: "Record store", value: "record-store" },
          { title: "Vibe / Hangout", value: "vibe" },
          { title: "Moment / Incident", value: "moment" },
        ],
        layout: "dropdown",
      },
    }),
    defineField({ name: "city", type: "string", description: 'e.g. "Brooklyn", "Medellín"' }),
    defineField({ name: "country", type: "string", description: 'e.g. "USA", "Colombia"' }),
    defineField({
      name: "lat",
      title: "Latitude",
      type: "number",
      description: "Decimal degrees, north positive (e.g. 40.7128 for Brooklyn)",
      validation: (r) => r.required().min(-90).max(90),
    }),
    defineField({
      name: "lng",
      title: "Longitude",
      type: "number",
      description: "Decimal degrees, east positive (e.g. -73.9857 for Brooklyn)",
      validation: (r) => r.required().min(-180).max(180),
    }),
    defineField({
      name: "tagline",
      title: "Short descriptor",
      type: "string",
      description: 'e.g. "the studio", "where the RTJ tour kicked off", "best bandeja paisa"',
    }),
    defineField({
      name: "story",
      title: "Travel guide entry",
      type: "array",
      of: [{ type: "block" }],
      description: "The story / why this place matters. Show up if you can.",
    }),
    defineField({
      name: "hero",
      title: "Hero photo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "gallery",
      title: "Photo gallery",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({ name: "websiteUrl", title: "Website URL", type: "url" }),
    defineField({ name: "googleMapsUrl", title: "Google Maps URL", type: "url" }),
    defineField({
      name: "year",
      title: "Year (when this place became part of Nick's world)",
      type: "number",
    }),
    defineField({
      name: "featured",
      title: "Pin to top of the map",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "city", kind: "kind", media: "hero" },
    prepare({ title, subtitle, kind, media }) {
      return {
        title,
        subtitle: kind ? `${kind} · ${subtitle ?? ""}` : subtitle,
        media,
      };
    },
  },
});
