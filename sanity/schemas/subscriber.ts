import { defineField, defineType } from "sanity";

/**
 * Newsletter subscriber — system-of-record write target for every signup
 * the site captures. Lives independently from any ESP integration; the
 * `/api/newsletter` route writes here FIRST, then opportunistically pushes
 * to Mailchimp (or whichever ESP is wired) on top.
 *
 * Why this exists: ESPs come and go (Mailchimp credentials lost, plan
 * change, switching to ConvertKit later). Sanity is our source of truth.
 * Export to CSV anytime, import to the ESP of the week.
 *
 * Doc ID is a SHA-1 hash of the lowercased email — keeps PII out of URLs
 * and gives us automatic dedupe via createIfNotExists.
 */
export const subscriber = defineType({
  name: "subscriber",
  title: "Newsletter subscriber",
  type: "document",
  description: "Captured email signups. Don't edit manually — use /studio to view, the API to write.",
  fields: [
    defineField({
      name: "email",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "source",
      title: "Source page / tag",
      type: "string",
      description: 'Where they signed up — "home", "sessions", "pop-up", "the-pit", etc.',
    }),
    defineField({
      name: "pathname",
      title: "Submitted from path",
      type: "string",
      description: "Raw URL path the form was on. Useful for attribution after the fact.",
    }),
    defineField({
      name: "subscribedAt",
      title: "First seen",
      type: "datetime",
      description: "Set on initial signup; doesn't change on re-submission.",
    }),
    defineField({
      name: "lastSeenAt",
      title: "Last submission",
      type: "datetime",
      description: "Updated every time they submit again — for re-engagement tracking.",
    }),
    defineField({
      name: "sentToMailchimp",
      type: "boolean",
      description: "Did the Mailchimp push succeed for this email? FALSE means we owe them a retry / manual add.",
      initialValue: false,
    }),
    defineField({
      name: "mailchimpError",
      title: "Mailchimp last error",
      type: "string",
      description: "If the ESP push failed, what came back. Empty when sentToMailchimp is true.",
    }),
    defineField({
      name: "unsubscribed",
      type: "boolean",
      description: "Hide from active counts + future blasts. Manual flag.",
      initialValue: false,
    }),
    defineField({
      name: "notes",
      type: "text",
      rows: 2,
      description: "Free-form. e.g. 'met at corona capital', 'old industry friend'.",
    }),
  ],
  preview: {
    select: {
      email: "email",
      source: "source",
      subscribedAt: "subscribedAt",
      synced: "sentToMailchimp",
    },
    prepare({ email, source, subscribedAt, synced }) {
      const date = subscribedAt ? new Date(subscribedAt as string).toLocaleDateString() : "—";
      return {
        title: email as string,
        subtitle: `${synced ? "✓" : "○"}  ${source ?? "?"}  ·  ${date}`,
      };
    },
  },
  orderings: [
    {
      name: "newest",
      title: "Newest first",
      by: [{ field: "subscribedAt", direction: "desc" }],
    },
  ],
});
