import { groq } from "next-sanity";
import { sanityFetch } from "./sanity";

export type SanityImage = { asset: { _ref: string }; alt?: string };

export type ReleaseListItem = {
  _id: string;
  title: string;
  slug: string;
  catalogNumber?: string;
  year?: number;
  /** Day-precision ISO date (YYYY-MM-DD). Canonical chronological key. */
  releaseDate?: string;
  format?: string;
  tagline?: string;
  cover?: SanityImage;
  coverColor?: string;
  artists: { name: string; slug: string }[];
  bandcampUrl?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  featured?: boolean;
  label?: string;
  /** If the release was originally on a different imprint (reclaimed catalog). */
  originalLabel?: string;
  originalReleaseNote?: string;
};

export type Track = {
  title: string;
  duration?: string;
  feature?: string;
  note?: string;
  videoUrl?: string;
  audioPreviewUrl?: string;
};

export type ReleaseCredit = {
  role: string;
  /** Free-text fallback for guests we don't have a doc for yet. */
  name?: string;
  /** Resolved person doc (when the credit was wired up via reference). */
  person?: { name: string; slug: string; portrait?: SanityImage };
};

export type Stem = {
  label: string;
  audioUrl: string;
  color?: string;
  muteByDefault?: boolean;
};

export type Pad = {
  label: string;
  audioUrl: string;
  color?: string;
};

export type ReleaseDetail = ReleaseListItem & {
  notes?: unknown[];
  credits?: ReleaseCredit[];
  gallery?: SanityImage[];
  bandcampAlbumId?: string;
  youtubeUrl?: string;
  soundcloudUrl?: string;
  youtubePlaylistId?: string;
  videos?: { title?: string; youtubeUrl: string }[];
  tracklist?: Track[];
  stems?: Stem[];
  stemsTrackTitle?: string;
  oneshots?: Pad[];
  bandcampTrackId?: string;
  relatedSession?: { title: string; slug: string; date: string; gallery?: SanityImage[] };
};

export type ArtistListItem = {
  _id: string;
  name: string;
  slug: string;
  city?: string;
  tagline?: string;
  portrait?: SanityImage;
  onLabel?: boolean;
};

export type ArtistAppearance = {
  release: ReleaseListItem;
  /** Which roles this artist is credited with on the release. */
  roles: string[];
};

export type ArtistDetail = ArtistListItem & {
  bio?: unknown[];
  gallery?: SanityImage[];
  bandcampUrl?: string;
  instagramUrl?: string;
  spotifyUrl?: string;
  websiteUrl?: string;
  /** Releases where they're a primary artist. */
  releases: ReleaseListItem[];
  /** Bands / projects / eras they're a member of. */
  bands: { _id: string; name: string; slug: string; yearStart?: number; yearEnd?: number; kind?: string }[];
  /** Releases where they appear in credits[] but aren't a primary artist. */
  appearsOn: ArtistAppearance[];
};

export type PressQuoteItem = {
  _id: string;
  quote: string;
  source: string;
  url?: string;
  year?: number;
  // === new fields (all optional for backwards compat with legacy quote-only docs) ===
  kind?: "review" | "interview" | "feature" | "profile" | "mention" | "list-inclusion" | "premiere";
  headline?: string;
  excerpt?: string;
  outlet?: string;
  author?: string;
  date?: string;  // YYYY-MM-DD
  image?: SanityImage;
  featured?: boolean;
  /** Resolved era reference for press attached to MWC, CZ, etc. */
  era?: { name: string; slug: string };
  /** Resolved release if this piece reviews a specific record. */
  release?: { _id: string; title: string; slug: string };
};

export type LiveDateItem = {
  _id: string;
  date: string;
  city: string;
  venue?: string;
  ticketUrl?: string;
  ticketLabel?: string;
  showType?: string;
};

export type MixListItem = {
  _id: string;
  title: string;
  slug: string;
  date?: string;
  era?: string;
  cover?: SanityImage;
  duration?: string;
  featured?: boolean;
};

export type MixDetail = MixListItem & {
  mixcloudUrl?: string;
  soundcloudUrl?: string;
  youtubeUrl?: string;
  description?: unknown[];
  tracklist?: string[];
};

export type ProjectListItem = {
  _id: string;
  name: string;
  slug: string;
  yearStart?: number;
  yearEnd?: number;
  kind?: string;
  tagline?: string;
  color?: string;
  cover?: SanityImage;
  featured?: boolean;
};

export type TourHighlight = {
  year?: number;
  title: string;
  note?: string;
  kind?: "festival" | "support" | "headline" | "incident" | "moment" | "tour";
};

export type Milestone = {
  year: number;
  month?: string;
  milestone: string;
};

export type ProjectDetail = ProjectListItem & {
  story?: unknown[];
  gallery?: SanityImage[];
  members: { name: string; slug: string }[];
  releases: ReleaseListItem[];
  mixes: MixListItem[];
  pressQuotes: PressQuoteItem[];
  tourHighlights: TourHighlight[];
  timeline: Milestone[];
  bandcampUrl?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
};

export type BrandListItem = {
  _id: string;
  name: string;
  slug: string;
  relationship?: string;
  tagline?: string;
  logo?: SanityImage;
  backgroundImage?: SanityImage;
  logoColor?: string;
  websiteUrl?: string;
  featured?: boolean;
};

// One block of a brand's embedded article. The article body is stored as an
// ordered array of these on the brand doc so the partner page can render it
// as an inline reader instead of just linking out.
export type ArticleBodyBlock = {
  _key?: string;
  kind: "h2" | "h3" | "p" | "video" | "soundcloud";
  text?: string;
  url?: string;
  caption?: string;
};

export type BrandDetail = BrandListItem & {
  story?: unknown[];
  youtubePlaylistId?: string;
  videos?: { title?: string; youtubeUrl: string }[];
  gear?: string[];
  articleUrl?: string;
  articleTitle?: string;
  articleImage?: SanityImage;
  articleQuote?: string;
  articleBody?: ArticleBodyBlock[];
  productsUsed?: {
    name: string;
    url?: string;
    image?: SanityImage;
    note?: string;
  }[];
  workshops?: {
    date?: string;
    yearOnly?: boolean;
    city?: string;
    country?: string;
    venue?: string;
    kind?: string;
    note?: string;
    url?: string;
  }[];
};

export type StudioListItem = {
  _id: string;
  name: string;
  slug: string;
  city?: string;
  country?: string;
  yearOpened?: number;
  tagline?: string;
  hero?: SanityImage;
  color?: string;
  featured?: boolean;
};

export type StudioDetail = StudioListItem & {
  story?: unknown[];
  gallery?: SanityImage[];
  gear?: string[];
  address?: string;
  instagramUrl?: string;
  youtubePlaylistId?: string;
  videos?: { title?: string; youtubeUrl: string }[];
};

const releaseListProjection = `
  _id,
  title,
  "slug": slug.current,
  catalogNumber,
  year,
  releaseDate,
  format,
  tagline,
  cover,
  coverColor,
  bandcampUrl,
  spotifyUrl,
  appleMusicUrl,
  featured,
  label,
  originalLabel,
  originalReleaseNote,
  "artists": artists[]->{ name, "slug": slug.current }
`;

// Imprint display order: main label first, then sub-imprints, then partner imprints.
const LABEL_PRIORITY = `select(
  label == "Calm + Collect" => 1,
  label == "Calm + Collect Instrumental" => 2,
  label == "Calllm" => 3,
  label == "Hookemon" => 4,
  label == "Lockhart Dynasty × Calm + Collect" => 5,
  99
)`;

export async function getReleases(limit = 60): Promise<ReleaseListItem[]> {
  // Catalog number IS the canonical release order — Nick assigned them
  // sequentially as records came out. Year/releaseDate are unreliable for
  // reclaimed catalog (Bandcamp re-upload dates won the scrape), so sort by
  // catalog # as primary. Label priority groups the imprints (C+C → CC INST
  // → CALLLM → Hookemon → LDCC).
  return sanityFetch<ReleaseListItem[]>(groq`
    *[_type == "release" && (withdrawn != true) && label != "Other"]
      | order(featured desc, ${LABEL_PRIORITY} asc, catalogNumber desc) [0...$limit] {
      ${releaseListProjection}
    }
  `, { limit });
}

export async function getReleasesByArtist(artistSlug: string): Promise<ReleaseListItem[]> {
  // Chronological by releaseDate (newest first), then year as fallback for
  // releases without day-precision, then catalog # as final tiebreaker.
  // This unifies in-house + external work into one timeline so the
  // prolific years stand visibly in a row.
  return sanityFetch<ReleaseListItem[]>(groq`
    *[_type == "release" && (withdrawn != true) && $slug in artists[]->slug.current]
      | order(releaseDate desc, year desc, catalogNumber desc) {
      ${releaseListProjection}
    }
  `, { slug: artistSlug });
}

export async function getReleaseBySlug(slug: string): Promise<ReleaseDetail | null> {
  return sanityFetch<ReleaseDetail | null>(groq`
    *[_type == "release" && slug.current == $slug][0] {
      ${releaseListProjection},
      notes,
      "credits": credits[]{
        role,
        name,
        "person": person->{ name, "slug": slug.current, portrait }
      },
      gallery,
      bandcampAlbumId,
      bandcampTrackId,
      youtubeUrl,
      soundcloudUrl,
      youtubePlaylistId,
      videos,
      tracklist,
      stemsTrackTitle,
      "stems": stems[]{
        label,
        color,
        muteByDefault,
        "audioUrl": audio.asset->url
      },
      "oneshots": oneshots[]{
        label,
        color,
        "audioUrl": audio.asset->url
      },
      "relatedSession": relatedSession->{ title, "slug": slug.current, date, gallery }
    }
  `, { slug });
}

export async function getReleaseSlugs(): Promise<{ slug: string }[]> {
  return sanityFetch<{ slug: string }[]>(groq`
    *[_type == "release" && defined(slug.current)] { "slug": slug.current }
  `);
}

export type ExternalCredit = ReleaseListItem & {
  /** Roles Nick (or whoever) holds on this external release. */
  roles: string[];
};

// External production work — releases where the given person is credited but
// the release is on someone else's label (label == "Other").
export async function getExternalCreditsForArtist(slug: string): Promise<ExternalCredit[]> {
  return sanityFetch<ExternalCredit[]>(groq`
    *[
      _type == "release"
      && label == "Other"
      && (withdrawn != true)
      && count(credits[person->slug.current == $slug]) > 0
    ] | order(releaseDate desc, year desc) {
      ${releaseListProjection},
      "roles": credits[person->slug.current == $slug].role
    }
  `, { slug });
}

// Pick a featured release. Priority:
//   1. Anything tagged featured: true (random pick among them)
//   2. Otherwise random among all releases that have a cover.
// Fully fresh per request — Sanity fetcher uses revalidate: 0 in dev so this
// genuinely rotates on every page load.
export async function getFeaturedRelease(): Promise<ReleaseListItem | null> {
  const featured = await sanityFetch<ReleaseListItem[]>(groq`
    *[_type == "release" && featured == true && (withdrawn != true) && label != "Other"] {
      ${releaseListProjection}
    }
  `);
  let pool = featured;
  if (pool.length === 0) {
    pool = await sanityFetch<ReleaseListItem[]>(groq`
      *[_type == "release" && (withdrawn != true) && label != "Other" && defined(cover)] {
        ${releaseListProjection}
      }
    `);
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

const artistListProjection = `
  _id,
  name,
  "slug": slug.current,
  city,
  tagline,
  portrait,
  onLabel
`;

export async function getRosterArtists(): Promise<ArtistListItem[]> {
  return sanityFetch<ArtistListItem[]>(groq`
    *[_type == "artist" && onLabel == true] | order(name asc) {
      ${artistListProjection}
    }
  `);
}

export async function getArtistBySlug(slug: string): Promise<ArtistDetail | null> {
  return sanityFetch<ArtistDetail | null>(groq`
    *[_type == "artist" && slug.current == $slug][0] {
      ${artistListProjection},
      bio,
      gallery,
      bandcampUrl,
      instagramUrl,
      spotifyUrl,
      websiteUrl,
      "releases": *[_type == "release" && ^._id in artists[]._ref] | order(year desc, releaseDate desc, catalogNumber desc) {
        ${releaseListProjection}
      },
      "bands": *[_type == "project" && ^._id in members[]._ref] | order(yearStart asc) {
        _id, name, "slug": slug.current, yearStart, yearEnd, kind
      },
      "appearsOn": *[
        _type == "release"
        && ^._id in credits[].person._ref
        && !(^._id in coalesce(artists[]._ref, []))
      ] | order(year desc, releaseDate desc, catalogNumber desc) {
        "release": { ${releaseListProjection} },
        "roles": credits[person._ref == ^.^._id].role
      }
    }
  `, { slug });
}

export async function getArtistSlugs(): Promise<{ slug: string }[]> {
  return sanityFetch<{ slug: string }[]>(groq`
    *[_type == "artist" && defined(slug.current)] { "slug": slug.current }
  `);
}

// Projection used by every press query — pulls legacy + new fields plus
// resolved era / release refs in one shot so the page doesn't need a 2nd
// round-trip.
const pressProjection = `
  _id, quote, source, url, year,
  kind, headline, excerpt, outlet, author, date, image, featured,
  "era": relatedEra->{ name, "slug": slug.current },
  "release": relatedRelease->{ _id, title, "slug": slug.current }
`;

export async function getPressQuotes(limit = 8): Promise<PressQuoteItem[]> {
  // Press wall on /nick-hook#press — featured only, top hits.
  return sanityFetch<PressQuoteItem[]>(groq`
    *[_type == "pressQuote" && featured == true] | order(coalesce(date, "0000") desc, year desc) [0...$limit] {
      ${pressProjection}
    }
  `, { limit });
}

/**
 * The master /press list — every piece, newest first, with full metadata
 * so the page can filter by kind / era / outlet.
 */
export async function getAllPress(): Promise<PressQuoteItem[]> {
  return sanityFetch<PressQuoteItem[]>(groq`
    *[_type == "pressQuote"]
      | order(coalesce(date, year + "-01-01", "0000") desc) {
      ${pressProjection}
    }
  `);
}

export async function getPressForRelease(releaseSlug: string): Promise<PressQuoteItem[]> {
  return sanityFetch<PressQuoteItem[]>(groq`
    *[_type == "pressQuote" && relatedRelease->slug.current == $slug]
      | order(coalesce(date, "0000") desc) {
      ${pressProjection}
    }
  `, { slug: releaseSlug });
}

export async function getPressForEra(eraSlug: string): Promise<PressQuoteItem[]> {
  return sanityFetch<PressQuoteItem[]>(groq`
    *[_type == "pressQuote" && relatedEra->slug.current == $slug]
      | order(coalesce(date, "0000") desc) {
      ${pressProjection}
    }
  `, { slug: eraSlug });
}

export async function getUpcomingLiveDates(limit = 12): Promise<LiveDateItem[]> {
  return sanityFetch<LiveDateItem[]>(groq`
    *[_type == "liveDate" && date >= $today] | order(date asc) [0...$limit] {
      _id, date, city, venue, ticketUrl, ticketLabel, showType
    }
  `, { today: new Date().toISOString().slice(0, 10), limit });
}

const mixListProjection = `
  _id,
  title,
  "slug": slug.current,
  date,
  era,
  cover,
  duration,
  featured
`;

// ── Videos (synced from YouTube into Sanity, taggable + linkable) ──

export type VideoListItem = {
  _id: string;
  youtubeId: string;
  title: string;
  publishedAt?: string;
  duration?: string;
  viewCount?: number;
  thumbnailUrl?: string;
  thumbnail?: SanityImage;
  tags?: string[];
  featured?: boolean;
  hidden?: boolean;
};

export async function getVideos(limit = 500): Promise<VideoListItem[]> {
  return sanityFetch<VideoListItem[]>(groq`
    *[_type == "video" && hidden != true]
      | order(featured desc, publishedAt desc) [0...$limit] {
      _id, youtubeId, title, publishedAt, duration, viewCount, thumbnailUrl, thumbnail, tags, featured, hidden
    }
  `, { limit });
}

export async function getVideosForRelease(releaseSlug: string): Promise<VideoListItem[]> {
  return sanityFetch<VideoListItem[]>(groq`
    *[_type == "video" && hidden != true && relatedRelease->slug.current == $slug]
      | order(publishedAt desc) {
      _id, youtubeId, title, publishedAt, duration, viewCount, thumbnailUrl, thumbnail, tags, featured
    }
  `, { slug: releaseSlug });
}

export async function getVideosForEra(projectSlug: string): Promise<VideoListItem[]> {
  return sanityFetch<VideoListItem[]>(groq`
    *[_type == "video" && hidden != true && relatedEra->slug.current == $slug]
      | order(publishedAt desc) {
      _id, youtubeId, title, publishedAt, duration, viewCount, thumbnailUrl, thumbnail, tags, featured
    }
  `, { slug: projectSlug });
}

export async function getVideosForBrand(brandSlug: string): Promise<VideoListItem[]> {
  return sanityFetch<VideoListItem[]>(groq`
    *[_type == "video" && hidden != true && relatedBrand->slug.current == $slug]
      | order(publishedAt desc) {
      _id, youtubeId, title, publishedAt, duration, viewCount, thumbnailUrl, thumbnail, tags, featured
    }
  `, { slug: brandSlug });
}

export async function getVideosForArtist(artistSlug: string): Promise<VideoListItem[]> {
  return sanityFetch<VideoListItem[]>(groq`
    *[_type == "video" && hidden != true && relatedArtist->slug.current == $slug]
      | order(publishedAt desc) {
      _id, youtubeId, title, publishedAt, duration, viewCount, thumbnailUrl, thumbnail, tags, featured
    }
  `, { slug: artistSlug });
}

export async function getVideosForGear(gearSlug: string): Promise<VideoListItem[]> {
  return sanityFetch<VideoListItem[]>(groq`
    *[_type == "video" && hidden != true && relatedGear->slug.current == $slug]
      | order(publishedAt desc) {
      _id, youtubeId, title, publishedAt, duration, viewCount, thumbnailUrl, thumbnail, tags, featured
    }
  `, { slug: gearSlug });
}

export async function getMixes(limit = 60): Promise<MixListItem[]> {
  return sanityFetch<MixListItem[]>(groq`
    *[_type == "mix"] | order(featured desc, date desc) [0...$limit] {
      ${mixListProjection}
    }
  `, { limit });
}

export async function getMixBySlug(slug: string): Promise<MixDetail | null> {
  return sanityFetch<MixDetail | null>(groq`
    *[_type == "mix" && slug.current == $slug][0] {
      ${mixListProjection},
      mixcloudUrl,
      soundcloudUrl,
      youtubeUrl,
      description,
      tracklist
    }
  `, { slug });
}

export async function getMixSlugs(): Promise<{ slug: string }[]> {
  return sanityFetch<{ slug: string }[]>(groq`
    *[_type == "mix" && defined(slug.current)] { "slug": slug.current }
  `);
}

const projectListProjection = `
  _id,
  name,
  "slug": slug.current,
  yearStart,
  yearEnd,
  kind,
  tagline,
  color,
  cover,
  featured
`;

export async function getProjects(limit = 30): Promise<ProjectListItem[]> {
  return sanityFetch<ProjectListItem[]>(groq`
    *[_type == "project"] | order(featured desc, yearStart asc) [0...$limit] {
      ${projectListProjection}
    }
  `, { limit });
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  return sanityFetch<ProjectDetail | null>(groq`
    *[_type == "project" && slug.current == $slug][0] {
      ${projectListProjection},
      story,
      gallery,
      bandcampUrl,
      spotifyUrl,
      youtubeUrl,
      websiteUrl,
      "members": members[]->{ name, "slug": slug.current },
      "releases": releases[]->{ ${releaseListProjection} },
      "mixes": mixes[]->{ ${mixListProjection} },
      "pressQuotes": pressQuotes[]->{ _id, quote, source, url, year } | order(year asc),
      "tourHighlights": tourHighlights[]{ year, title, note, kind },
      "timeline": timeline[]{ year, month, milestone }
    }
  `, { slug });
}

export async function getProjectSlugs(): Promise<{ slug: string }[]> {
  return sanityFetch<{ slug: string }[]>(groq`
    *[_type == "project" && defined(slug.current)] { "slug": slug.current }
  `);
}

const brandListProjection = `
  _id,
  name,
  "slug": slug.current,
  relationship,
  tagline,
  logo,
  backgroundImage,
  logoColor,
  websiteUrl,
  featured
`;

export async function getBrands(limit = 30): Promise<BrandListItem[]> {
  return sanityFetch<BrandListItem[]>(groq`
    *[_type == "brand"] | order(featured desc, name asc) [0...$limit] {
      ${brandListProjection}
    }
  `, { limit });
}

export async function getBrandBySlug(slug: string): Promise<BrandDetail | null> {
  return sanityFetch<BrandDetail | null>(groq`
    *[_type == "brand" && slug.current == $slug][0] {
      ${brandListProjection},
      story,
      youtubePlaylistId,
      videos,
      gear,
      articleUrl,
      articleTitle,
      articleImage,
      articleQuote,
      articleBody,
      productsUsed,
      workshops
    }
  `, { slug });
}

export async function getBrandSlugs(): Promise<{ slug: string }[]> {
  return sanityFetch<{ slug: string }[]>(groq`
    *[_type == "brand" && defined(slug.current)] { "slug": slug.current }
  `);
}

const studioListProjection = `
  _id,
  name,
  "slug": slug.current,
  city,
  country,
  yearOpened,
  tagline,
  hero,
  color,
  featured
`;

export async function getStudios(): Promise<StudioListItem[]> {
  return sanityFetch<StudioListItem[]>(groq`
    *[_type == "studio"] | order(featured desc, yearOpened asc) {
      ${studioListProjection}
    }
  `);
}

export async function getStudioBySlug(slug: string): Promise<StudioDetail | null> {
  return sanityFetch<StudioDetail | null>(groq`
    *[_type == "studio" && slug.current == $slug][0] {
      ${studioListProjection},
      story,
      gallery,
      gear,
      address,
      instagramUrl,
      youtubePlaylistId,
      videos
    }
  `, { slug });
}

export async function getStudioSlugs(): Promise<{ slug: string }[]> {
  return sanityFetch<{ slug: string }[]>(groq`
    *[_type == "studio" && defined(slug.current)] { "slug": slug.current }
  `);
}

export type PlaceKind =
  | "studio" | "show" | "club" | "festival" | "session" | "party" | "workshop"
  | "restaurant" | "bar" | "hotel" | "record-store" | "vibe" | "moment";

export type PlaceListItem = {
  _id: string;
  name: string;
  slug: string;
  kind: PlaceKind;
  city?: string;
  country?: string;
  lat: number;
  lng: number;
  tagline?: string;
  year?: number;
  featured?: boolean;
  hero?: SanityImage;
  websiteUrl?: string;
  googleMapsUrl?: string;
};

export type PlaceDetail = PlaceListItem & {
  story?: unknown[];
  gallery?: SanityImage[];
};

const placeListProjection = `
  _id,
  name,
  "slug": slug.current,
  kind,
  city,
  country,
  lat,
  lng,
  tagline,
  year,
  featured,
  hero,
  websiteUrl,
  googleMapsUrl
`;

export async function getPlaces(): Promise<PlaceListItem[]> {
  return sanityFetch<PlaceListItem[]>(groq`
    *[_type == "place" && defined(lat) && defined(lng)] | order(featured desc, name asc) {
      ${placeListProjection}
    }
  `);
}

export async function getPlaceBySlug(slug: string): Promise<PlaceDetail | null> {
  return sanityFetch<PlaceDetail | null>(groq`
    *[_type == "place" && slug.current == $slug][0] {
      ${placeListProjection},
      story,
      gallery
    }
  `, { slug });
}

/**
 * Given a list of artist names (free-text), return the ones that match a
 * Sanity artist doc and the slugs we can link to. Case-insensitive name match.
 */
export type GearCategoryRef =
  | "drum-machine" | "synth" | "sampler" | "modular" | "sequencer"
  | "outboard" | "pedal" | "mic" | "controller" | "interface"
  | "monitor" | "guitar" | "amp" | "piano" | "dj" | "software";

export type GearStatusRef =
  | "active" | "shelf" | "travel" | "wishlist" | "retired";

export type GearItem = {
  _id: string;
  name: string;
  slug: string;
  category: GearCategoryRef;
  status: GearStatusRef;
  manufacturer?: string;
  note?: string;
  yearAcquired?: number;
  photo?: SanityImage;
  pinned?: boolean;
  /** Count of YouTube `video` docs that have relatedGear → this doc.
   *  Used to highlight gear cards that have associated demos / livestreams,
   *  so visitors can spot "has videos" at a glance on the rack grid. */
  videoCount?: number;
};

export async function getGear(): Promise<GearItem[]> {
  return sanityFetch<GearItem[]>(groq`
    *[_type == "gear"] | order(category asc, name asc) {
      _id,
      name,
      "slug": slug.current,
      category,
      status,
      manufacturer,
      note,
      yearAcquired,
      photo,
      pinned,
      "videoCount": count(*[_type == "video" && relatedGear._ref == ^._id && hidden != true])
    }
  `);
}

export async function getGearSlugs(): Promise<{ slug: string }[]> {
  return sanityFetch<{ slug: string }[]>(groq`
    *[_type == "gear" && defined(slug.current)] { "slug": slug.current }
  `);
}

/**
 * Pull every gear doc whose manufacturer matches the brand name. Used on
 * the partner page to auto-populate "the full rack from {brand}" without
 * requiring Nick to manually re-list every piece in productsUsed[].
 *
 * Fuzzy match: we accept exact equality on lowercased manufacturer, plus
 * a name-fragment match (so "TE" / "Teenage Engineering" both surface the
 * same items). Case-insensitive everywhere.
 */
export async function getGearForBrand(brandName: string): Promise<GearItem[]> {
  // GROQ is case-sensitive, so normalize both sides to lower in the query.
  // Match either: exact lowercased equality, OR brand-name-tokens substring
  // (handles "Teenage Engineering" matching "TE" notes too).
  return sanityFetch<GearItem[]>(groq`
    *[_type == "gear" && defined(manufacturer) && (
      lower(manufacturer) == lower($name) ||
      lower(manufacturer) match (lower($name) + "*") ||
      lower($name) match (lower(manufacturer) + "*")
    )]
      | order(pinned desc, status asc, name asc) {
      _id, name, "slug": slug.current, category, status, manufacturer, note, yearAcquired, photo, pinned,
      "videoCount": count(*[_type == "video" && relatedGear._ref == ^._id && hidden != true])
    }
  `, { name: brandName });
}

export type PackKind =
  | "sample-pack" | "preset-pack" | "template" | "tutorial" | "loop-pack" | "drum-kit";

export type PackListItem = {
  _id: string;
  name: string;
  slug: string;
  kind: PackKind;
  tagline?: string;
  cover?: SanityImage;
  releaseDate?: string;
  year?: number;
  downloadUrl?: string;
  price?: string;
  youtubeUrl?: string;
  featured?: boolean;
};

const packListProjection = `
  _id,
  name,
  "slug": slug.current,
  kind,
  tagline,
  cover,
  releaseDate,
  year,
  downloadUrl,
  price,
  youtubeUrl,
  featured
`;

export type GearLink = {
  kind: "article" | "video" | "movie" | "interview" | "podcast" | "other";
  title: string;
  url: string;
  source?: string;
  note?: string;
};

export type GearGalleryPhoto = {
  image: SanityImage;
  caption?: string;
};

export type GearDetail = GearItem & {
  packs: PackListItem[];
  links?: GearLink[];
  gallery?: GearGalleryPhoto[];
};

export async function getPacks(): Promise<PackListItem[]> {
  return sanityFetch<PackListItem[]>(groq`
    *[_type == "pack"] | order(featured desc, releaseDate desc, year desc, name asc) {
      ${packListProjection}
    }
  `);
}

export async function getPacksForRelease(slug: string): Promise<PackListItem[]> {
  return sanityFetch<PackListItem[]>(groq`
    *[_type == "pack" && count(releases[@->slug.current == $slug]) > 0]
      | order(featured desc, releaseDate desc, year desc) {
      ${packListProjection}
    }
  `, { slug });
}

export async function getGearBySlug(slug: string): Promise<GearDetail | null> {
  return sanityFetch<GearDetail | null>(groq`
    *[_type == "gear" && slug.current == $slug][0] {
      _id,
      name,
      "slug": slug.current,
      category,
      status,
      manufacturer,
      note,
      yearAcquired,
      photo,
      pinned,
      links,
      "gallery": gallery[]{ image, caption },
      "packs": *[_type == "pack" && ^._id in gear[]._ref] | order(featured desc, releaseDate desc, year desc) {
        ${packListProjection}
      }
    }
  `, { slug });
}

export async function resolveArtistSlugs(
  names: string[]
): Promise<Map<string, { name: string; slug: string }>> {
  if (names.length === 0) return new Map();
  const lowered = names.map((n) => n.toLowerCase());
  const matches = await sanityFetch<{ name: string; slug: string }[]>(groq`
    *[_type == "artist" && lower(name) in $lowered] {
      name, "slug": slug.current
    }
  `, { lowered });
  const byLower = new Map<string, { name: string; slug: string }>();
  for (const m of matches) byLower.set(m.name.toLowerCase(), m);
  // Build a lookup keyed on the ORIGINAL input string (preserves the caller's spelling).
  const out = new Map<string, { name: string; slug: string }>();
  for (const n of names) {
    const hit = byLower.get(n.toLowerCase());
    if (hit) out.set(n, hit);
  }
  return out;
}

export type CatalogItem = ReleaseListItem & {
  roleSet: "label" | "production" | "mix" | "appearance" | "remix" | "djmix";
  roleLabel: string; // human label e.g. "produced", "mixed", "co-exec"
  /** Roles from credits[] when the person appears via credits rather than primary. */
  creditRoles?: string[];
};

/**
 * Unified chronological catalog for a person — everything they've ever been
 * part of, label releases AND outside production credits combined.
 *
 * Categorization rules:
 *   - Primary artist on a C+C label release  → "label"
 *   - Credited with "Producer"/"Co-producer" → "production"
 *   - Credited with "Mixed by"               → "mix"
 *   - Credited with "Remix"                  → "remix"
 *   - Credited with "Appearance"             → "appearance"
 *
 * Sorted newest first by year, then catalog number.
 */
export async function getCatalogForArtist(slug: string): Promise<CatalogItem[]> {
  // Skip any release with a blank/garbage title (single chars, only symbols, etc).
  const titleGuard = "&& defined(title) && length(title) >= 2";

  const primary = await sanityFetch<ReleaseListItem[]>(groq`
    *[
      _type == "release"
      && (withdrawn != true)
      ${titleGuard}
      && $slug in artists[]->slug.current
    ] | order(year desc, releaseDate desc, catalogNumber desc) {
      ${releaseListProjection}
    }
  `, { slug });

  const credited = await sanityFetch<(ReleaseListItem & { creditRoles: string[] })[]>(groq`
    *[
      _type == "release"
      && (withdrawn != true)
      ${titleGuard}
      && !($slug in artists[]->slug.current)
      && count(credits[person->slug.current == $slug]) > 0
    ] | order(year desc, releaseDate desc, catalogNumber desc) {
      ${releaseListProjection},
      "creditRoles": credits[person->slug.current == $slug].role
    }
  `, { slug });

  const out: CatalogItem[] = [];

  for (const r of primary) {
    // DJ Mix / Podcast formats land in their own bucket so they don't dilute
    // the album catalog.
    const isMixFormat = r.format === "DJ Mix" || r.format === "Podcast";
    out.push({
      ...r,
      roleSet: isMixFormat ? "djmix" : (r.label === "Other" ? "production" : "label"),
      roleLabel: isMixFormat ? "dj mix" : (r.label === "Other" ? "primary artist" : "label release"),
    });
  }

  for (const r of credited) {
    const roles = (r.creditRoles ?? []).filter(Boolean);
    const lower = roles.map((s) => s.toLowerCase());
    const isMixFormat = r.format === "DJ Mix" || r.format === "Podcast";
    let roleSet: CatalogItem["roleSet"];
    if (isMixFormat) roleSet = "djmix";
    else if (lower.some((rr) => /remix/.test(rr))) roleSet = "remix";
    else if (lower.some((rr) => /produc/.test(rr))) roleSet = "production";
    else if (lower.some((rr) => /mix/.test(rr))) roleSet = "mix";
    else roleSet = "appearance";
    out.push({
      ...r,
      roleSet,
      roleLabel: isMixFormat ? "dj mix" : (roles.join(" + ") || "credited"),
      creditRoles: roles,
    });
  }

  // Sort by year desc, then catalog number desc as tiebreaker
  out.sort((a, b) => {
    const ya = a.year ?? 0;
    const yb = b.year ?? 0;
    if (yb !== ya) return yb - ya;
    return (b.catalogNumber ?? "").localeCompare(a.catalogNumber ?? "");
  });

  return out;
}
