import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

// SanityImageSource is whatever Sanity returns from a query for an image
// field — we don't need the strict type from a deep package path that the
// build env can't resolve. Loose `unknown` is enough; the builder accepts it.
type SanityImageSource = unknown;

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01";

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === "production",
  perspective: "published",
});

const builder = imageUrlBuilder(sanityClient);
export function urlFor(source: SanityImageSource) {
  // builder.image expects the real SanityImageSource from a deep package path
  // we can't reach from this build env (see type alias above). Cast to the
  // builder's declared param shape — the runtime is identical.
  return builder.image(source as Parameters<typeof builder.image>[0]);
}

const REVALIDATE_SECONDS = process.env.NODE_ENV === "production" ? 60 : 0;

export async function sanityFetch<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
  return sanityClient.fetch<T>(query, params, {
    next: { revalidate: REVALIDATE_SECONDS, tags: ["sanity"] },
  });
}
