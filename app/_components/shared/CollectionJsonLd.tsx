import { buildCollectionJsonLd, jsonLdScript } from "../../_lib/schema-jsonld";

/**
 * Drop-in JSON-LD <script> for a CollectionPage. Use on hub pages like
 * /collabs/<slug> where the page surfaces a curated set of releases.
 *
 * Pass:
 *   path: "/collabs/run-the-jewels"
 *   name: "Run The Jewels + Nick Hook"
 *   description: 1-2 sentence summary for search snippets
 *   releaseSlugs: slugs of every release surfaced on the page (in order)
 *   releaseTitles: matching titles
 */
export function CollectionJsonLd({
  path,
  name,
  description,
  items,
}: {
  path: string;
  name: string;
  description?: string;
  items: { slug: string; title: string; kind?: "release" | "video" | "show" }[];
}) {
  const url = `https://thespacepit.com${path}`;
  const jsonLd = buildCollectionJsonLd({
    url,
    name,
    description,
    items: items.map((it) => ({
      url:
        it.kind === "video"
          ? it.slug // assume already a full URL for video
          : `https://thespacepit.com/releases/${it.slug}`,
      name: it.title,
    })),
  });
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
    />
  );
}
