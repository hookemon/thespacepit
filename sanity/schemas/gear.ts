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
          { title: "Sequencer (Cirklon-class)", value: "sequencer" },
          { title: "Outboard (rack FX / comp / EQ / reverb / preamp)", value: "outboard" },
          { title: "Pedal (stompbox)", value: "pedal" },
          { title: "Mic", value: "mic" },
          { title: "Controller (MIDI)", value: "controller" },
          { title: "Interface (audio / MIDI / soundcard / CV)", value: "interface" },
          { title: "Monitoring (speakers / headphones)", value: "monitor" },
          { title: "Guitar / bass", value: "guitar" },
          { title: "Amp", value: "amp" },
          { title: "Piano (electric / acoustic)", value: "piano" },
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

    // ── Practice link — deep-link from this gear page into the right
    //    /practice/ module + city/world so you can play the thing.
    defineField({
      name: "practiceLink",
      title: "Play in practice",
      type: "object",
      description: "Deep-link from this gear page into the practice app. If omitted, falls back by category (synth → chords, drum machine → drums, etc.).",
      fields: [
        {
          name: "module",
          type: "string",
          options: {
            list: [
              { title: "Hop Chords (chord generator)", value: "chords" },
              { title: "Hop Pyramid (melodic game)", value: "pyramid" },
              { title: "Finger Drum (drum patterns)", value: "drums" },
              { title: "Garden (per-city plants)", value: "garden" },
              { title: "Language (flashcards)", value: "lang" },
              { title: "Studio (dub mixer)", value: "studio" },
              { title: "Be Here Now (presence)", value: "here" },
            ],
          },
        },
        {
          name: "world",
          title: "World / City",
          type: "string",
          description: "Optional. If set, deep-links to that city's variant of the chosen module.",
          options: {
            list: [
              { title: "Brooklyn",   value: "brooklyn" },
              { title: "St. Louis",  value: "stlouis" },
              { title: "Mexico City", value: "mexico" },
              { title: "Oaxaca",     value: "oaxaca" },
              { title: "Tulum",      value: "tulum" },
              { title: "Medellín",   value: "medellin" },
              { title: "Paris",      value: "paris" },
              { title: "Madrid",     value: "madrid" },
              { title: "Berlin",     value: "berlin" },
              { title: "Rishikesh",  value: "rishikesh" },
              { title: "Varanasi",   value: "varanasi" },
              { title: "Bombay",     value: "bombay" },
              { title: "Tokyo",      value: "tokyo" },
            ],
          },
        },
      ],
    }),

    // ── External media — articles, videos, movies, related links ──
    defineField({
      name: "links",
      title: "Links (article / video / movie / interview)",
      type: "array",
      description: "External media this gear shows up in. e.g. a Reverb article, a YouTube demo, a movie scene.",
      of: [
        {
          type: "object",
          name: "gearLink",
          fields: [
            {
              name: "kind",
              type: "string",
              validation: (r) => r.required(),
              options: {
                list: [
                  { title: "Article", value: "article" },
                  { title: "Video", value: "video" },
                  { title: "Movie / film scene", value: "movie" },
                  { title: "Interview", value: "interview" },
                  { title: "Podcast", value: "podcast" },
                  { title: "Other", value: "other" },
                ],
              },
            },
            { name: "title", type: "string", validation: (r) => r.required() },
            { name: "url", type: "url", validation: (r) => r.required() },
            { name: "source", type: "string", description: 'e.g. "Reverb", "YouTube", "Pitchfork".' },
            { name: "note", type: "text", rows: 2, description: "What it is, why it matters." },
          ],
          preview: {
            select: { title: "title", subtitle: "kind", source: "source" },
            prepare({ title, subtitle, source }) {
              return { title, subtitle: source ? `${subtitle} · ${source}` : subtitle };
            },
          },
        },
      ],
    }),

    defineField({
      name: "gallery",
      title: "Gallery (extra photos)",
      type: "array",
      description: "Additional photos — gear in context, with collaborators, in the rack, on the road. Each can have a caption.",
      of: [
        {
          type: "object",
          name: "galleryPhoto",
          fields: [
            { name: "image", type: "image", options: { hotspot: true }, validation: (r) => r.required() },
            { name: "caption", type: "string", description: 'e.g. "Large Pro holding the SP-1200, NYC 2018".' },
          ],
          preview: {
            select: { media: "image", title: "caption" },
            prepare({ media, title }) {
              return { media, title: title || "(no caption)" };
            },
          },
        },
      ],
    }),
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
