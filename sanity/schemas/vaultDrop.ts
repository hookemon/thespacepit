import { defineField, defineType } from "sanity";

/**
 * A vault drop = one Patreon post (or any supporter-gated piece of content).
 *
 * Synced from Patreon by scripts/sync-patreon.ts. The sync is IDEMPOTENT —
 * it keys on `patreonPostId` so re-running won't dupe. Anything edited in
 * /studio survives a re-sync EXCEPT the fields explicitly overwritten
 * (title, content, publishedAt, patreonUrl, isPaid, minCentsPledged) — those
 * always reflect what's on Patreon.
 *
 * `relatedX` references are CURATION fields: hand-tag a drop to a release,
 * era, brand, artist, or gear in /studio so it auto-surfaces on those pages
 * (e.g. a "Cu4tro paperwork archive" drop auto-shows on /collabs/run-the-jewels).
 */
export const vaultDrop = defineType({
  name: "vaultDrop",
  title: "Vault drop (supporter unlock)",
  type: "document",
  description:
    "A Patreon post or any supporter-gated content. Synced from Patreon, but you can edit and add curation refs here.",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
    }),
    defineField({
      name: "patreonPostId",
      title: "Patreon post ID",
      type: "string",
      description: "The Patreon API post ID. Used to dedupe on sync. Don't edit unless you know what you're doing.",
      readOnly: true,
    }),
    defineField({
      name: "patreonUrl",
      title: "Patreon post URL",
      type: "url",
      description: "Where supporters land to unlock this drop. Auto-populated from sync.",
    }),
    defineField({
      name: "publishedAt",
      title: "Published date",
      type: "datetime",
    }),
    defineField({
      name: "isPaid",
      title: "Patron-only?",
      type: "boolean",
      initialValue: true,
      description: "TRUE = locked behind Patreon (vault). FALSE = public preview / teaser (will show without the lock).",
    }),
    defineField({
      name: "minCentsPledged",
      title: "Minimum tier (cents)",
      type: "number",
      description: 'Patreon\'s "min_cents_pledged_to_view". 500 = $5 tier, 2500 = $25 tier, etc. Used to show a tier badge.',
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt / teaser",
      type: "text",
      rows: 3,
      description: "1-3 sentences the public sees BEFORE unlocking. The hook that makes people want to subscribe.",
    }),
    defineField({
      name: "contentHtml",
      title: "Full content (HTML)",
      type: "text",
      rows: 12,
      description: "Auto-pulled from Patreon. Locked content — only patrons see the post on Patreon, but we keep a copy here for reference.",
    }),
    defineField({
      name: "cover",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
      description: "Upload manually OR drop a Patreon post image here. Drives the vault grid thumbnail.",
    }),
    defineField({
      name: "coverUrl",
      title: "Cover URL (fallback)",
      type: "url",
      description: "Patreon-hosted image URL — used if no image upload exists.",
    }),
    defineField({
      name: "kind",
      title: "Drop kind",
      type: "string",
      initialValue: "post",
      options: {
        list: [
          { value: "post",          title: "Post / story" },
          { value: "video",         title: "Video" },
          { value: "audio",         title: "Audio / stems / loop pack" },
          { value: "pdf",           title: "PDF / deck / paperwork" },
          { value: "sample-pack",   title: "Sample pack" },
          { value: "session",       title: "Studio session footage" },
          { value: "office-hours",  title: "Office hours / 1-on-1" },
        ],
      },
    }),
    defineField({
      name: "tags",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
        list: [
          "rtj", "cu4tro", "gangsta-boo", "cubic-zirconia", "mwc",
          "ableton-move", "op-xy", "ko-ii", "sp-404",
          "stems", "behind-the-scenes", "archive", "deck",
          "medellin", "brooklyn",
        ],
      },
    }),
    defineField({
      name: "relatedRelease",
      title: "Linked release",
      type: "reference",
      to: [{ type: "release" }],
    }),
    defineField({
      name: "relatedEra",
      title: "Linked era / project",
      type: "reference",
      to: [{ type: "project" }],
    }),
    defineField({
      name: "relatedArtist",
      title: "Linked artist",
      type: "reference",
      to: [{ type: "artist" }],
    }),
    defineField({
      name: "relatedBrand",
      title: "Linked partner / brand",
      type: "reference",
      to: [{ type: "brand" }],
    }),
    defineField({
      name: "relatedGear",
      title: "Linked gear",
      type: "reference",
      to: [{ type: "gear" }],
    }),
    defineField({
      name: "featured",
      type: "boolean",
      description: "Pin to the top of /vault.",
      initialValue: false,
    }),
    defineField({
      name: "hidden",
      type: "boolean",
      description: "Hide from /vault without deleting (e.g. obsolete drops).",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "title", kind: "kind", isPaid: "isPaid", media: "cover" },
    prepare({ title, kind, isPaid, media }) {
      return {
        title,
        subtitle: `${isPaid ? "🔒" : "🆓"}  ${kind}`,
        media,
      };
    },
  },
  orderings: [
    {
      name: "newest",
      title: "Newest first",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
});
