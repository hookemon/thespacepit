/**
 * Stub a release doc for the upcoming Young Thug remix single. Nick fills in
 * the real details (title, music video URL, stems, pads, gallery) in /studio.
 *
 * Idempotent — re-running won't duplicate.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const slugify = (s: string) =>
  s.toLowerCase().replace(/['"’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function ensureArtist(name: string, onLabel = false): Promise<string> {
  const slug = slugify(name);
  const _id = `artist-ext-${slug}`;
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "artist" && (slug.current == $slug || lower(name) == $lower)][0]{ _id }`,
    { slug, lower: name.toLowerCase() }
  );
  if (existing) return existing._id;
  await client.createIfNotExists({
    _id,
    _type: "artist",
    name,
    slug: { _type: "slug", current: slug },
    onLabel,
  });
  return _id;
}

async function main() {
  const thug = await ensureArtist("Young Thug");
  const nick = await client.fetch<{ _id: string } | null>(
    `*[_type == "artist" && slug.current == "nick-hook"][0]{ _id }`
  );
  if (!nick) throw new Error("nick-hook artist not found");

  // Generic placeholder. Nick should edit title + slug to the real song name.
  const releaseSlug = "young-thug-nick-hook-remix";
  const releaseId = `release-stub-${releaseSlug}`;

  await client.createIfNotExists({
    _id: releaseId,
    _type: "release",
    title: "Young Thug × Nick Hook Remix",
    slug: { _type: "slug", current: releaseSlug },
    year: new Date().getFullYear(),
    label: "Other",
    tagline: "remix · single",
    format: "Single",
    artists: [
      { _type: "reference", _key: "a-thug", _ref: thug },
      { _type: "reference", _key: "a-nick", _ref: nick._id },
    ],
    credits: [
      {
        _type: "object",
        _key: "c-nick",
        role: "Produced by",
        person: { _type: "reference", _ref: nick._id },
      },
      {
        _type: "object",
        _key: "c-nick-mix",
        role: "Mixed by",
        person: { _type: "reference", _ref: nick._id },
      },
    ],
    coverColor: "#F2B705",
    featured: true,
  });

  console.log(`✓ stubbed release at /releases/${releaseSlug}`);
  console.log(`   edit it: /studio → Release → "Young Thug × Nick Hook Remix"`);
  console.log(`   add: real title, music video URL on the track, stems, pads, cover art, story`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
