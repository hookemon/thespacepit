import { defineField, defineType } from "sanity";

export const brand = defineType({
  name: "brand",
  title: "Brand / Partnership",
  type: "document",
  description: "Brands Nick works with — Teenage Engineering, Ableton, etc.",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "relationship",
      title: "Relationship",
      type: "string",
      options: { list: ["artist mentor", "official artist", "collaborator", "ambassador", "endorsement", "occasional"] },
    }),
    defineField({ name: "tagline", title: "Short descriptor", type: "string" }),
    defineField({
      name: "story",
      title: "The story",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({ name: "logo", title: "Logo (transparent PNG preferred)", type: "image", options: { hotspot: false } }),
    defineField({
      name: "backgroundImage",
      title: "Background photo (full-bleed behind the logo)",
      type: "image",
      options: { hotspot: true },
      description: "A photo of the gear / a session / a partnership moment. Sits behind the logo on the partners page.",
    }),
    defineField({ name: "logoColor", title: "Fallback bg color when no photo (hex)", type: "string", description: 'e.g. "#F4EFE6". Only used if no background photo is set.' }),
    defineField({ name: "websiteUrl", title: "Website URL", type: "url" }),
    defineField({
      name: "featuredVideoUrl",
      title: "Featured video (renders LARGE at top of brand page)",
      type: "url",
      description: 'Hero video for this brand page — paste a YouTube/Vimeo URL. Renders as a big inline player above the story. Use for "the one video" — like the Eventide H3000 fire demo.',
    }),
    defineField({
      name: "samplePackUrl",
      title: "Sample pack / freebie download URL",
      type: "url",
      description: 'Direct download link to a sample pack Nick made FOR this brand (e.g. the Eventide Nick Hook samples). Renders as a prominent CTA button on the brand page.',
    }),
    defineField({
      name: "samplePackTitle",
      title: "Sample pack label (optional)",
      type: "string",
      description: 'Short label for the download CTA. Default: "Download Nick\'s sample pack".',
    }),
    defineField({
      name: "youtubePlaylistId",
      title: "YouTube playlist (auto-syncs videos)",
      type: "string",
      description:
        'Paste the playlist ID — the part after "list=" in the URL (e.g. PLMXEKDUSbulOqivbH-7JV42wBDZJ4Mw3D). All videos in the playlist will appear on this brand\'s page automatically. Use the field below for IG reels / one-offs that aren\'t in a playlist.',
    }),
    defineField({
      name: "videos",
      title: "Videos & reels (one-offs)",
      description:
        "YouTube, Instagram reel, Vimeo, TikTok — paste any link. For lots of YouTube videos, use the playlist field above instead.",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "title", type: "string", title: "Caption (optional)" },
            // Inner field name kept as `youtubeUrl` for backward compat with
            // existing data — the input now accepts any video URL.
            { name: "youtubeUrl", type: "url", title: "Video URL (YouTube · IG reel · Vimeo · TikTok)", validation: (r) => r.required() },
          ],
          preview: { select: { title: "title", subtitle: "youtubeUrl" } },
        },
      ],
    }),
    defineField({
      name: "gear",
      title: "Gear from this brand (free text list)",
      type: "array",
      of: [{ type: "string" }],
    }),
    // === Featured article — interview / profile written about Nick ===
    defineField({
      name: "articleUrl",
      title: "Featured article URL",
      type: "url",
      description: 'A press piece written about Nick by this brand (e.g. Ableton "Collaborator in Chief").',
    }),
    defineField({ name: "articleTitle", title: "Article title", type: "string" }),
    defineField({
      name: "articleImage",
      title: "Article hero image",
      type: "image",
      options: { hotspot: true },
      description: "Pull the hero image off the article page and upload it here. Used as the brand-page hero background.",
    }),
    defineField({
      name: "articleQuote",
      title: "Pull quote from the article",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "articleBody",
      title: "Article body (inline reader)",
      description:
        "The full article content, rendered big on the brand page like an embedded version of the original. Each block is a paragraph, heading, video, or soundcloud embed — in document order. Auto-populated by `scripts/seed-ableton-brand.ts` (and similar).",
      type: "array",
      of: [
        {
          type: "object",
          name: "block",
          fields: [
            {
              name: "kind",
              type: "string",
              options: { list: ["h2", "h3", "p", "video", "soundcloud"] },
              validation: (r) => r.required(),
            },
            { name: "text", type: "text", rows: 3, description: "For h2/h3/p" },
            { name: "url", type: "url", description: "For video / soundcloud" },
            { name: "caption", type: "string", description: "For video (the line that precedes the embed)" },
          ],
          preview: {
            select: { kind: "kind", text: "text", url: "url" },
            prepare({ kind, text, url }) {
              return { title: `[${kind}] ${(text ?? url ?? "").slice(0, 80)}` };
            },
          },
        },
      ],
    }),
    // === Products used — the specific products from this brand that Nick uses ===
    defineField({
      name: "productsUsed",
      title: "Products used",
      type: "array",
      description: "The brand's products Nick actually uses on records / live.",
      of: [
        {
          type: "object",
          fields: [
            { name: "name", type: "string", validation: (r) => r.required() },
            { name: "url", type: "url", title: "Product page URL" },
            { name: "image", type: "image", options: { hotspot: true } },
            { name: "note", type: "string", description: "One-line: how Nick uses it." },
          ],
          preview: { select: { title: "name", subtitle: "note", media: "image" } },
        },
      ],
    }),
    // === Workshops / talks / residencies Nick has done with the brand ===
    defineField({
      name: "workshops",
      title: "Workshops / talks / residencies",
      type: "array",
      description: "Each entry is one event. India, NYC Music Hall, Medellín, college visits, etc.",
      of: [
        {
          type: "object",
          fields: [
            { name: "date", type: "date", title: "Date (or just year)" },
            { name: "yearOnly", type: "boolean", title: "Year-only?", description: "Tick if you don't know the exact day." },
            { name: "city", type: "string" },
            { name: "country", type: "string" },
            { name: "venue", type: "string", description: 'e.g. "Music Hall of Williamsburg" or "NYU".' },
            { name: "kind", type: "string", options: { list: ["workshop", "masterclass", "panel", "residency", "college visit", "interview"] }, initialValue: "workshop" },
            { name: "note", type: "text", rows: 2, title: "Note (optional)" },
            { name: "url", type: "url", title: "Link (recap / clip / IG post)" },
          ],
          preview: {
            select: { date: "date", city: "city", venue: "venue", kind: "kind" },
            prepare({ date, city, venue, kind }) {
              const left = [venue, city].filter(Boolean).join(" · ");
              return { title: left || kind || "workshop", subtitle: date ?? "" };
            },
          },
        },
      ],
    }),
    defineField({ name: "featured", title: "Pin to top", type: "boolean", initialValue: false }),
  ],
  preview: {
    select: { title: "name", subtitle: "relationship", media: "logo" },
  },
  orderings: [
    { name: "featured", title: "Featured first", by: [{ field: "featured", direction: "desc" }, { field: "name", direction: "asc" }] },
  ],
});
