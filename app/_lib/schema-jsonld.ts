/**
 * Schema.org JSON-LD builders.
 *
 * These return plain objects that get rendered inside
 * <script type="application/ld+json"> tags on the page. Google reads them
 * and produces rich snippets in search results — album art for releases,
 * artist info for /artists pages, price tags for packs, etc.
 *
 * Why a separate file: keeps the schema specifics out of page components
 * and lets us reuse builders across release / artist / brand / pack pages.
 *
 * Spec: https://schema.org/MusicAlbum, /MusicGroup, /Person, /Product.
 */
import type { ReleaseDetail, ArtistDetail } from "./sanity-queries";

const ORIGIN = "https://thespacepit.com";

// ── shared helpers ─────────────────────────────────────────────────────────

function artistRef(name: string, slug?: string) {
  return {
    "@type": "MusicGroup",
    name,
    ...(slug ? { url: `${ORIGIN}/artists/${slug}` } : {}),
  };
}

// ── release → MusicAlbum ───────────────────────────────────────────────────

export function buildMusicAlbumJsonLd(
  release: ReleaseDetail,
  opts: { coverUrl?: string | null }
): Record<string, unknown> {
  const url = `${ORIGIN}/releases/${release.slug}`;
  const byArtist = release.artists.map((a) => artistRef(a.name, a.slug));
  const tracks = (release.tracklist ?? []).map((t, i) => ({
    "@type": "MusicRecording",
    "@id": `${url}#track-${i + 1}`,
    name: t.title,
    position: i + 1,
    ...(t.duration ? { duration: t.duration } : {}),
    byArtist,
  }));

  // Map our format → schema.org's albumProductionType vocabulary.
  const productionType: Record<string, string> = {
    LP: "StudioAlbum",
    EP: "EPRelease",
    Single: "SingleRelease",
    "DJ Mix": "DJMixAlbum",
    Mixtape: "MixtapeAlbum",
    Remix: "RemixAlbum",
    Compilation: "CompilationAlbum",
  };

  return {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    "@id": url,
    name: release.title,
    url,
    byArtist,
    ...(opts.coverUrl ? { image: opts.coverUrl } : {}),
    ...(release.releaseDate ? { datePublished: release.releaseDate } : (release.year ? { datePublished: String(release.year) } : {})),
    ...(release.label ? { recordLabel: { "@type": "MusicLabel", name: release.label } } : {}),
    ...(release.format && productionType[release.format] ? { albumProductionType: `https://schema.org/${productionType[release.format]}` } : {}),
    ...(release.tagline ? { description: release.tagline } : {}),
    ...(tracks.length > 0
      ? { numTracks: tracks.length, track: tracks }
      : {}),
  };
}

// ── artist → MusicGroup or Person ──────────────────────────────────────────

export function buildArtistJsonLd(
  artist: ArtistDetail,
  opts: { portraitUrl?: string | null }
): Record<string, unknown> {
  const url = `${ORIGIN}/artists/${artist.slug}`;
  // MusicGroup is the safer default for collaborative project artist docs;
  // Person is technically right for solo acts but Google handles MusicGroup
  // fine for both. Stick with MusicGroup so the schema is uniform.
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "@id": url,
    name: artist.name,
    url,
    ...(opts.portraitUrl ? { image: opts.portraitUrl } : {}),
    ...(artist.tagline ? { description: artist.tagline } : {}),
    ...(artist.city ? { foundingLocation: { "@type": "Place", name: artist.city } } : {}),
    ...(artist.spotifyUrl || artist.bandcampUrl || artist.instagramUrl || artist.websiteUrl
      ? {
          sameAs: [artist.spotifyUrl, artist.bandcampUrl, artist.instagramUrl, artist.websiteUrl].filter(
            (u): u is string => !!u,
          ),
        }
      : {}),
    ...(artist.releases && artist.releases.length > 0
      ? {
          album: artist.releases.map((r) => ({
            "@type": "MusicAlbum",
            "@id": `${ORIGIN}/releases/${r.slug}`,
            name: r.title,
            url: `${ORIGIN}/releases/${r.slug}`,
          })),
        }
      : {}),
  };
}

// ── pack → Product ─────────────────────────────────────────────────────────

export function buildPackJsonLd(pack: {
  name: string;
  slug?: string;
  tagline?: string;
  price?: string;
  downloadUrl?: string;
  coverUrl?: string | null;
}): Record<string, unknown> {
  // Price string → number when possible. "free" / "name your price" → no
  // structured price (we just omit). $7 etc. → 7.
  const priceMatch = pack.price?.match(/\$\s*(\d+(?:\.\d+)?)/);
  const offers = pack.downloadUrl
    ? {
        offers: {
          "@type": "Offer",
          url: pack.downloadUrl,
          availability: "https://schema.org/InStock",
          ...(priceMatch
            ? { price: priceMatch[1], priceCurrency: "USD" }
            : (/free/i.test(pack.price ?? "")
                ? { price: "0", priceCurrency: "USD" }
                : {})),
        },
      }
    : {};

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pack.name,
    ...(pack.tagline ? { description: pack.tagline } : {}),
    ...(pack.coverUrl ? { image: pack.coverUrl } : {}),
    brand: { "@type": "Brand", name: "Calm + Collect" },
    ...offers,
  };
}

// ── collection (collabs chapter / index) → CollectionPage ──────────────────

/**
 * CollectionPage schema for /collabs/<slug> subworld hubs. These pages
 * group every record from a given collaboration era (RTJ, MWC, CZ, Boo).
 * Tells Google "this is an editorial collection of multiple works."
 *
 * `items` is the list of release URLs in the collection — Google uses
 * this to render carousel-style rich results when available.
 */
export function buildCollectionJsonLd(opts: {
  url: string;
  name: string;
  description?: string;
  items?: Array<{ url: string; name: string }>;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": opts.url,
    name: opts.name,
    url: opts.url,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.items && opts.items.length > 0
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: opts.items.length,
            itemListElement: opts.items.map((it, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: it.url,
              name: it.name,
            })),
          },
        }
      : {}),
  };
}

// ── brand → Organization ───────────────────────────────────────────────────

export function buildBrandJsonLd(brand: {
  name: string;
  slug: string;
  tagline?: string;
  websiteUrl?: string;
  logoUrl?: string | null;
}): Record<string, unknown> {
  const url = `${ORIGIN}/partners/${brand.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": url,
    name: brand.name,
    url,
    ...(brand.tagline ? { description: brand.tagline } : {}),
    ...(brand.websiteUrl ? { sameAs: [brand.websiteUrl] } : {}),
    ...(brand.logoUrl ? { logo: brand.logoUrl } : {}),
  };
}

/**
 * Render the JSON-LD as a string suitable for a <script type="application/ld+json">.
 * Strips undefineds and pretty-prints (Google ignores whitespace; humans like
 * being able to View Source).
 */
export function jsonLdScript(obj: Record<string, unknown>): string {
  return JSON.stringify(obj);
}
