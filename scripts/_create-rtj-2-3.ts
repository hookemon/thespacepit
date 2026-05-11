import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const ALBUMS = [
  {
    _id: "release-ext-run-the-jewels-2-2014",
    title: "Run The Jewels 2",
    slug: "run-the-jewels-2",
    releaseDate: "2014-10-24",
    year: 2014,
    label: "Mass Appeal Records",
  },
  {
    _id: "release-ext-run-the-jewels-3-2016",
    title: "Run The Jewels 3",
    slug: "run-the-jewels-3",
    releaseDate: "2016-12-23",
    year: 2016,
    label: "Run The Jewels Inc.",
  },
];

(async () => {
  for (const a of ALBUMS) {
    await c.createIfNotExists({
      _id: a._id,
      _type: "release",
      title: a.title,
      slug: { _type: "slug", current: a.slug },
      year: a.year,
      releaseDate: a.releaseDate,
      label: "Other",
      artists: [
        { _type: "reference", _ref: "artist-ext-run-the-jewels", _key: "a-1" },
      ],
      credits: [
        { _key: "cr-0", role: "engineer", person: { _type: "reference", _ref: "artist-nick-hook" } },
      ],
    });
    // Re-patch to ensure fields sync on re-runs
    await c.patch(a._id).set({
      title: a.title,
      year: a.year,
      releaseDate: a.releaseDate,
      label: "Other",
      artists: [{ _type: "reference", _ref: "artist-ext-run-the-jewels", _key: "a-1" }],
      credits: [{ _key: "cr-0", role: "engineer", person: { _type: "reference", _ref: "artist-nick-hook" } }],
    }).commit();
    console.log(`✓ ${a.title}  ${a.releaseDate}  /releases/${a.slug}`);
  }
})();
