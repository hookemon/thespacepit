import { defineField, defineType } from "sanity";

export const pack = defineType({
  name: "pack",
  title: "Pack",
  type: "document",
  description:
    "Sample packs, preset packs, templates, tutorials — anything you can drop on a piece of gear. Link to one or more gear docs so it shows up on those gear pages.",
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
      type: "string",
      validation: (r) => r.required(),
      initialValue: "sample-pack",
      options: {
        list: [
          { title: "Sample pack", value: "sample-pack" },
          { title: "Preset pack", value: "preset-pack" },
          { title: "Template / project file", value: "template" },
          { title: "Tutorial / walkthrough", value: "tutorial" },
          { title: "Loop pack", value: "loop-pack" },
          { title: "Drum kit", value: "drum-kit" },
        ],
      },
    }),
    defineField({
      name: "gear",
      title: "Gear this pack is for",
      type: "array",
      of: [{ type: "reference", to: [{ type: "gear" }] }],
      description: "Pick one or more pieces of gear. The pack will appear on each of those gear pages.",
    }),
    defineField({
      name: "releases",
      title: "Releases this pack is tied to",
      type: "array",
      of: [{ type: "reference", to: [{ type: "release" }] }],
      description: "Optional. e.g. the WYGD pack ties to the What You Gonna Do release. Shows up in the JAM section of that release page.",
    }),
    defineField({ name: "tagline", title: "Short descriptor (one line)", type: "string" }),
    defineField({
      name: "description",
      type: "array",
      of: [{ type: "block" }],
      description: "Long-form notes — what's in it, who it's for, how to use.",
    }),
    defineField({ name: "cover", type: "image", options: { hotspot: true } }),
    defineField({ name: "releaseDate", title: "Release date", type: "date" }),
    defineField({ name: "year", type: "number" }),
    defineField({
      name: "access",
      title: "Access tier",
      type: "string",
      initialValue: "free",
      description:
        "Who can get this pack? FREE = public download. VAULT = patreon/supporter unlock only. PURCHASE = one-time pay (gumroad, bandcamp).",
      options: {
        list: [
          { value: "free",     title: "Free · public download" },
          { value: "vault",    title: "Vault · supporter unlock (patreon, etc.)" },
          { value: "purchase", title: "Purchase · one-time pay (gumroad, bandcamp)" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "downloadUrl",
      title: "Direct download / buy URL",
      type: "url",
      description:
        "FREE packs: a direct download link. PURCHASE: gumroad/bandcamp listing. (Leave blank for vault packs — those use vaultUrl instead.)",
    }),
    defineField({
      name: "vaultUrl",
      title: "Vault unlock URL",
      type: "url",
      description:
        "For VAULT access only — the patreon post URL (or similar) where supporters claim it. Public visitors see a 🔒 + this link as 'unlock with patreon'.",
    }),
    defineField({
      name: "previewUrl",
      title: "Preview audio URL (optional)",
      type: "url",
      description:
        "30s-1m taste of the pack — surfaces on the listing so visitors hear something before unlocking. Bandcamp/Soundcloud/direct mp3 all fine.",
    }),
    defineField({ name: "price", title: "Price (display string)", type: "string", description: 'e.g. "$15", "free", "name your price", "patreon $5+"' }),
    defineField({
      name: "youtubeUrl",
      title: "Walkthrough video URL (optional)",
      type: "url",
    }),
    defineField({ name: "featured", title: "Pin to top", type: "boolean", initialValue: false }),
  ],
  preview: {
    select: { title: "name", kind: "kind", media: "cover" },
    prepare({ title, kind, media }) {
      return { title, subtitle: kind, media };
    },
  },
  orderings: [
    { name: "newest", title: "Newest first", by: [{ field: "releaseDate", direction: "desc" }, { field: "year", direction: "desc" }] },
  ],
});
