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
  /** Optional full-bleed background image for the release page. Heavily
   *  darkened + tinted so it reads as TEXTURE behind the content (think:
   *  the Boo signature on the Glove page). */
  pageBackgroundImage?: SanityImage;
  coverColor?: string;
  artists: { name: string; slug: string }[];
  bandcampUrl?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  /** Backfilled via MusicBrainz when ISRC is known. */
  tidalUrl?: string;
  deezerUrl?: string;
  youtubeMusicUrl?: string;
  amazonMusicUrl?: string;
  featured?: boolean;
  label?: string;
  /** If the release was originally on a different imprint (reclaimed catalog). */
  originalLabel?: string;
  originalReleaseNote?: string;
  /** Release lifecycle. `dropping` = distro pitch / promo phase (no stream chips,
   *  DROPPING badge). `out` (default when undefined) = public catalog page. */
  status?: "out" | "dropping" | "upcoming";
};

/** A single resolved feature credit. `slug` is set when the featured
 *  artist has a Sanity `artist` doc — the tracklist row renders that as
 *  a clickable Link to /artists/<slug>. When no doc exists yet, the row
 *  still shows the name as plain italic text. */
export type FeatureLink = {
  name: string;
  slug?: string;
};

export type Track = {
  title: string;
  duration?: string;
  /** LEGACY — single string of features ("21 Savage, Bulletproof Dolphin").
   *  New data uses `features[]`; keeping this so old docs render. */
  feature?: string;
  /** Multi-feature array — populated by the credit importer. Each entry is
   *  a raw artist name string (matched at query time against artist docs
   *  to produce `featureLinks`). */
  features?: string[];
  /** Resolved feature credits with optional slug for linkability. Computed
   *  by the GROQ projection in getReleaseBySlug — not a stored field. */
  featureLinks?: FeatureLink[];
  remixer?: string;
  isrc?: string;
  /** Public writer names (display-only). Structured splits info
   *  (`writerCredits` on the schema — name + share % + PRO + IPI/CAE +
   *  publisher) is PRIVATE and intentionally not projected here. */
  writers?: string[];
  note?: string;
  videoUrl?: string;
  audioPreviewUrl?: string;
  /** Sanity-hosted full-track stream URL. Preferred over audioPreviewUrl
   *  (which uses Bandcamp tokens that expire). Resolved by GROQ via
   *  audio.asset->url projection. */
  audioUrl?: string;
  /** Plain-text lyrics. Verse markers ([Verse 1], [Chorus], etc.) are
   *  rendered bold by the tracklist UI. */
  lyrics?: string;
  /** BPM — public, used by sync agents and DSP matching. */
  bpm?: number;
  /** Parental advisory flag — required by DSPs. */
  explicit?: boolean;
};

export type ReleaseCredit = {
  role: string;
  /** Free-text fallback for guests we don't have a doc for yet. */
  name?: string;
  /** Resolved person doc (when the credit was wired up via reference). */
  person?: { name: string; slug: string; portrait?: SanityImage };
  /** Resolved studio doc — only set for "Recorded at" credits when the
   *  free-text `name` matches an existing studio's name (case-insensitive).
   *  Drives the clickable link on the release page. */
  studio?: { name: string; slug: string };
  /** Optional instrument / detail (e.g. "vintage Wurlitzer", "DW Collector's").
   *  For location credits ("Recorded at"), this carries the city. */
  instrument?: string;
  /** Optional per-track scope. When set, this credit applies ONLY to those
   *  track titles. Empty/undefined = album-wide. Used by the per-song
   *  pop-out on the release page tracklist. */
  tracks?: string[];
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

export type LinerNotePage = { image: SanityImage; caption?: string };
export type PhysicalArtifact = { image: SanityImage; title?: string; kind?: string; note?: string };

export type ReleaseDetail = ReleaseListItem & {
  notes?: unknown[];
  credits?: ReleaseCredit[];
  linerNotes?: LinerNotePage[];
  physicalArtifacts?: PhysicalArtifact[];
  gallery?: SanityImage[];
  bandcampAlbumId?: string;
  youtubeUrl?: string;
  soundcloudUrl?: string;
  /** Single hero music video URL — slotted into the release page's HERO
   *  player when set. Distinct from `videos[]` (the secondary grid) and
   *  `youtubePlaylistId` (the auto-fetched playlist). */
  mainVideoUrl?: string;
  youtubePlaylistId?: string;
  videos?: { title?: string; youtubeUrl: string }[];
  tracklist?: Track[];
  stems?: Stem[];
  stemsTrackTitle?: string;
  oneshots?: Pad[];
  bandcampTrackId?: string;
  /** Resolved promo MP3 URL — either the uploaded Sanity asset OR the
   *  external promoAudioUrl fallback. Set by the page projection. Powers
   *  the in-house PromoPlayer that sits right below the cover. */
  promoAudio?: string;
  /** Optional second track (typically the instrumental). Same coalesce
   *  pattern as `promoAudio`. When present the player renders a toggle. */
  promoAudioAlt?: string;
  /** Label for the alternate track in the toggle UI. */
  promoAudioAltLabel?: string;
  relatedSession?: { title: string; slug: string; date: string; gallery?: SanityImage[] };
};

export type ArtistListItem = {
  _id: string;
  name: string;
  slug: string;
  city?: string;
  tagline?: string;
  portrait?: SanityImage;
  /** When true, the artist page (and rosters) render initials instead of the
   *  portrait — e.g. "NH" as a big monogram. Design-block over photo. */
  displayInitials?: boolean;
  onLabel?: boolean;
  /** TSP crew / alumni — surfaces on /crew. */
  tspCrew?: boolean;
  /** One-line framing for the crew card. */
  crewRole?: string;
  /** Year they first showed up at the pit. */
  crewYearStart?: number;
};

export type ArtistAppearance = {
  release: ReleaseListItem;
  /** Which roles this artist is credited with on the release. */
  roles: string[];
};

/**
 * A studio session — one date, one room, the artists who were there, the
 * gear used, what happened, and which records (if any) came out of it.
 * Stored as a `studioSession` doc; surfaces on every artist's page who was
 * referenced in `people`.
 */
export type SessionListItem = {
  _id: string;
  title: string;
  slug: string;
  date: string;
  location?: string;
  guests?: string[];
  gear?: string[];
  notes?: unknown[];
  gallery?: SanityImage[];
  /** Other people on this session (used on artist pages — "you and the rest"). */
  people: { name: string; slug: string }[];
  /** Releases that came from this session. Each is a click-through. */
  becameReleases: { _id: string; title: string; slug: string; year?: number; coverColor?: string }[];
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
  /** OG-scraped image URL (hotlinked) — fallback used when no `image` asset
   *  upload exists. Populated by scripts/scrape-press-og-images.ts. */
  imageUrl?: string;
  featured?: boolean;
  /** Pitchfork Best New Music / Track flag — surfaces a slime-green badge
   *  on the press card. */
  bestNew?: boolean;
  /** Resolved era reference for press attached to MWC, CZ, etc. */
  era?: { name: string; slug: string };
  /** Resolved release if this piece reviews a specific record. Cover +
   *  coverColor pulled in too so the press tile can fall back to the album
   *  art when the article has no og:image. */
  release?: { _id: string; title: string; slug: string; cover?: SanityImage; coverColor?: string };
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
  /** Page layout strategy. "default" = the standard vertical era page.
   *  "horizontal-journey" = full-viewport snap-scroll panels left-to-right
   *  (used by Cubic Zirconia). "collage" = scrapbook / vault wall (used by
   *  Gangsta Boo memorial vault). */
  layoutVariant?: "default" | "horizontal-journey" | "collage";
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
  /** Every photo tagged to this era (via relatedEra ref OR tag string).
   *  Used to render a tiled mosaic background on the era hero when count >= 5. */
  eraPhotos?: { _id: string; image: SanityImage; caption?: string }[];
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
  /** Hero video that renders LARGE at the top of the brand page. Use for
   *  the one signature video (e.g. Eventide H3000 fire demo). */
  featuredVideoUrl?: string;
  /** Direct download to a sample pack Nick made FOR this brand. Renders as
   *  a prominent CTA button. */
  samplePackUrl?: string;
  samplePackTitle?: string;
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
  pageBackgroundImage,
  coverColor,
  bandcampUrl,
  spotifyUrl,
  appleMusicUrl,
  tidalUrl,
  deezerUrl,
  youtubeMusicUrl,
  amazonMusicUrl,
  featured,
  label,
  originalLabel,
  originalReleaseNote,
  status,
  "artists": artists[]->{ name, "slug": slug.current }
`;

// Imprint display order: main label first, then sub-imprints, then partner imprints.
//
// One pinned exception: Color Film "Until You Turn Blue" (CC001) is the
// kickoff Calm + Collect single but chronologically belongs between the
// Hookemon catalog and the LDCC × Cubic Zirconia catalog. Pin it to
// priority 4.5 so the timeline reads cleanly — Without You → Until You
// Turn Blue → Darko — instead of stranding it at the bottom of the
// C+C block.
const LABEL_PRIORITY = `select(
  _id == "release-cc001-until-you-turn-blue" => 4.5,
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
  //
  // Filter: `withdrawn != true` drops delisted records, AND we exclude
  // status in ("dropping","upcoming") so pre-release pitch records stay
  // off the public catalogue listing. They're still reachable by direct
  // URL (Sanity Studio + the gated /calm-collect/upcoming page) — just
  // not advertised on the public surface.
  return sanityFetch<ReleaseListItem[]>(groq`
    *[_type == "release"
      && (withdrawn != true)
      && label != "Other"
      && !(coalesce(status, "out") in ["dropping", "upcoming"])
    ]
      | order(featured desc, ${LABEL_PRIORITY} asc, catalogNumber desc) [0...$limit] {
      ${releaseListProjection}
    }
  `, { limit });
}

/**
 * Releases in distro-pitch / promo phase. These are intentionally hidden from
 * the main catalogue (status='dropping' implies withdrawn=true so they don't
 * surface in /releases) — they're meant to be reached via /calm-collect/upcoming,
 * the dedicated 2026-slate pitch grid. As each record drops, flip its status to
 * 'out' and clear withdrawn — it instantly graduates into the main catalogue.
 *
 * Sort: featured first (manual pin for the lead single), then catalog # ascending
 * so the slate reads in release order rather than reverse.
 */
export async function getUpcomingReleases(): Promise<ReleaseListItem[]> {
  // Coalesce featured: GROQ sorts `null` before `true` on `featured desc`,
  // so an unset field would beat a pinned one. Coalescing to `false` puts
  // the manual pin (true) at the top reliably.
  //
  // Both `dropping` (active distro pitch) and `upcoming` (earlier-stage,
  // known-about-but-not-yet-pitched) surface on the /calm-collect/upcoming
  // page so the full pipeline is visible.
  return sanityFetch<ReleaseListItem[]>(groq`
    *[_type == "release" && status in ["dropping", "upcoming"]]
      | order(coalesce(featured, false) desc, status asc, catalogNumber asc) {
      ${releaseListProjection}
    }
  `);
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

/**
 * Map of era project slug → list of release slugs that belong to that era,
 * derived from `project.releases[]` (an array of references). Used by the
 * STATIONS filter (era-based stations expand to "all releases in this era").
 * Cheap query — one row per era, ~18 eras total.
 */
export async function getEraReleaseMap(): Promise<Record<string, string[]>> {
  type Row = { slug: string; releaseSlugs: string[] };
  const rows = await sanityFetch<Row[]>(groq`
    *[_type == "project" && defined(slug.current)] {
      "slug": slug.current,
      "releaseSlugs": releases[]->slug.current
    }
  `);
  const out: Record<string, string[]> = {};
  for (const r of rows) {
    out[r.slug] = (r.releaseSlugs ?? []).filter(Boolean);
  }
  return out;
}

/**
 * A flat per-SONG view of the catalog — one entry per track in every release
 * where the given artist is a primary. Used by /radio to feed the YouTube
 * search-and-play loop with songs (rather than just release covers).
 *
 * Why we don't just project tracklist on the existing list query: the radio
 * needs MUCH less metadata than the per-release page (no stems / liner notes /
 * credits) but needs PER-TRACK fields the list query doesn't carry. Cleaner
 * to keep this its own slim query.
 */
export type CatalogSong = {
  /** Stable id: `${releaseSlug}#${trackIndex}` */
  id: string;
  releaseId: string;
  releaseSlug: string;
  releaseTitle: string;
  releaseYear?: number;
  releaseLabel?: string;
  releaseCover?: SanityImage;
  releaseCoverColor?: string;
  releaseArtists: { name: string; slug: string }[];
  trackIndex: number;
  title: string;
  duration?: string;
  /** Combined "feat." line — uses features[] if populated, else legacy `feature` string */
  features?: string[];
  remixer?: string;
  /** YouTube search-friendly query: "primary artist · track title (feat. X)". */
  searchQuery: string;
};

export async function getCatalogSongs(artistSlug: string): Promise<CatalogSong[]> {
  type Row = {
    _id: string;
    releaseSlug: string;
    title: string;
    year?: number;
    label?: string;
    cover?: SanityImage;
    coverColor?: string;
    artists: { name: string; slug: string }[];
    tracklist?: {
      title?: string;
      duration?: string;
      feature?: string;
      features?: string[];
      remixer?: string;
    }[];
  };
  const rows = await sanityFetch<Row[]>(groq`
    *[_type == "release" && (withdrawn != true) && $slug in artists[]->slug.current]
      | order(releaseDate desc, year desc, catalogNumber desc) {
      _id,
      "releaseSlug": slug.current,
      title,
      year,
      label,
      cover,
      coverColor,
      "artists": artists[]->{ name, "slug": slug.current },
      tracklist
    }
  `, { slug: artistSlug });
  const out: CatalogSong[] = [];
  for (const r of rows) {
    const tl = r.tracklist ?? [];
    if (tl.length === 0) continue;
    const primaryArtist = r.artists[0]?.name ?? "Nick Hook";
    for (let i = 0; i < tl.length; i += 1) {
      const t = tl[i];
      if (!t || !t.title) continue;
      const features = (t.features && t.features.length > 0)
        ? t.features
        : (t.feature ? [t.feature] : undefined);
      // Build a YouTube search query that prefers a clean "<artist> <title>"
      // shape — adding feat. names sometimes hurts (YT match drift).
      const q = `${primaryArtist} ${t.title}${t.remixer ? ` ${t.remixer}` : ""}`.trim();
      out.push({
        id: `${r.releaseSlug}#${i}`,
        releaseId: r._id,
        releaseSlug: r.releaseSlug,
        releaseTitle: r.title,
        releaseYear: r.year,
        releaseLabel: r.label,
        releaseCover: r.cover,
        releaseCoverColor: r.coverColor,
        releaseArtists: r.artists ?? [],
        trackIndex: i,
        title: t.title,
        duration: t.duration,
        features,
        remixer: t.remixer,
        searchQuery: q,
      });
    }
  }
  return out;
}

export async function getReleaseBySlug(slug: string): Promise<ReleaseDetail | null> {
  const raw = await sanityFetch<(ReleaseDetail & { artistDirectory?: { name: string; slug: string }[] }) | null>(groq`
    *[_type == "release" && slug.current == $slug][0] {
      ${releaseListProjection},
      notes,
      "credits": credits[]{
        role,
        name,
        instrument,
        tracks,
        "person": person->{ name, "slug": slug.current, portrait },
        "studio": *[_type == "studio" && name == ^.name][0]{
          name,
          "slug": slug.current
        }
      },
      gallery,
      linerNotes,
      physicalArtifacts,
      bandcampAlbumId,
      bandcampTrackId,
      youtubeUrl,
      soundcloudUrl,
      youtubePlaylistId,
      videos,
      // Explicit per-track projection. NEW PRIVATE FIELDS (writerCredits)
      // are intentionally OMITTED here — they live on the schema but never
      // ship to the public release page. Server-side dossier / splits-sheet
      // exports use their own queries to read those.
      "tracklist": tracklist[]{
        title,
        duration,
        feature,
        features,
        remixer,
        isrc,
        writers,
        note,
        lyrics,
        videoUrl,
        audioPreviewUrl,
        "audioUrl": coalesce(audio.asset->url, audioPreviewUrl),
        bpm,
        explicit
      },
      // Coalesce the uploaded Sanity file asset (CDN URL via asset deref)
      // OR fall back to the external promoAudioUrl. Page reads "promoAudio"
      // regardless of source.
      "promoAudio": coalesce(promoAudio.asset->url, promoAudioUrl),
      "promoAudioAlt": coalesce(promoAudioAlt.asset->url, promoAudioAltUrl),
      promoAudioAltLabel,
      // Bulk lookup: every artist doc's name → slug. Keyed by LOWERCASED
      // name in JS land so we can resolve feature strings (which are
      // free-text, not refs) to slugs without N round-trips. GROQ's
      // projection-over-string-array doesn't work cleanly so we resolve
      // featureLinks in the page wrapper instead.
      "artistDirectory": *[_type == "artist" && defined(slug.current)]{
        name,
        "slug": slug.current
      },
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

  if (!raw) return null;

  // Resolve featureLinks in JS — for each track's `features[]` (array of
  // strings), look up the matching artist doc by lowercased name and
  // attach featureLinks: [{ name, slug? }] so the tracklist row can render
  // each feature as a clickable Link when an artist doc exists. We do this
  // here instead of in GROQ because GROQ projections over string arrays
  // don't work cleanly (`features[]{...}` returns null per item).
  const directory = new Map<string, string>();
  for (const a of raw.artistDirectory ?? []) {
    if (a?.name && a?.slug) directory.set(a.name.toLowerCase().trim(), a.slug);
  }
  const tracklist = raw.tracklist?.map((t) => {
    const featureLinks: FeatureLink[] = (t.features ?? []).map((name) => ({
      name,
      slug: directory.get(name.toLowerCase().trim()),
    }));
    return { ...t, featureLinks };
  });

  // Strip artistDirectory from the returned object — it was just plumbing.
  const { artistDirectory: _stripped, ...rest } = raw;
  return { ...rest, ...(tracklist ? { tracklist } : {}) };
}

/**
 * PRIVATE structured writer credit — what `writerCredits[]` on a track
 * stores. Stays back-end: never projected by `getReleaseBySlug`. Used by
 * the dossier + splits-sheet exports only.
 */
export type WriterCredit = {
  name: string;
  /** This writer's % of the WRITER royalty. Sum across writers on a track = 100. */
  writerShare?: number;
  /** This publisher's % of the PUBLISHER royalty. Sum across publishers on a track = 100.
   *  Often mirrors writerShare for self-pub setups but can differ — capture what the PRO has on file. */
  publisherShare?: number;
  pro?: string;
  ipiCae?: string;
  publisher?: string;
  publisherPro?: string;
  publisherIpiCae?: string;
};

export type DossierTrack = Track & { writerCredits?: WriterCredit[] };

/**
 * The full back-end view of a release — public fields + private publishing
 * payload (writerCredits per track, internalNotes, copyright lines, UPC,
 * genre, language). Used by `/releases/[slug]/dossier` and the
 * splits-sheet export. NEVER project this onto a public page.
 */
export type ReleaseDossier = ReleaseDetail & {
  upc?: string;
  genre?: string;
  subgenre?: string;
  language?: string;
  pCopyright?: string;
  cCopyright?: string;
  internalNotes?: string;
  tracklist?: DossierTrack[];
};

/**
 * Dossier query — every public field PLUS the private publishing payload.
 * Mirrors `getReleaseBySlug` but adds writerCredits + the release-level
 * admin fields. Server-side use only; never expose this in a client
 * bundle or a public page.
 */
export async function getReleaseDossier(slug: string): Promise<ReleaseDossier | null> {
  const raw = await sanityFetch<(ReleaseDossier & { artistDirectory?: { name: string; slug: string }[] }) | null>(groq`
    *[_type == "release" && slug.current == $slug][0] {
      ${releaseListProjection},
      notes,
      "credits": credits[]{
        role,
        name,
        instrument,
        tracks,
        "person": person->{ name, "slug": slug.current, portrait },
        "studio": *[_type == "studio" && name == ^.name][0]{ name, "slug": slug.current }
      },
      gallery,
      linerNotes,
      physicalArtifacts,
      bandcampAlbumId,
      bandcampTrackId,
      youtubeUrl,
      soundcloudUrl,
      youtubePlaylistId,
      videos,
      // FULL tracklist — includes writerCredits (PRIVATE — for the
      // splits-sheet pull). Don't project this onto a public page.
      "tracklist": tracklist[]{
        title,
        duration,
        feature,
        features,
        remixer,
        isrc,
        writers,
        note,
        lyrics,
        videoUrl,
        audioPreviewUrl,
        "audioUrl": coalesce(audio.asset->url, audioPreviewUrl),
        bpm,
        explicit,
        writerCredits
      },
      "promoAudio": coalesce(promoAudio.asset->url, promoAudioUrl),
      "promoAudioAlt": coalesce(promoAudioAlt.asset->url, promoAudioAltUrl),
      promoAudioAltLabel,
      // Private release-level admin fields.
      upc,
      genre,
      subgenre,
      language,
      pCopyright,
      cCopyright,
      internalNotes,
      "artistDirectory": *[_type == "artist" && defined(slug.current)]{ name, "slug": slug.current },
      stemsTrackTitle,
      "stems": stems[]{ label, color, muteByDefault, "audioUrl": audio.asset->url },
      "oneshots": oneshots[]{ label, color, "audioUrl": audio.asset->url },
      "relatedSession": relatedSession->{ title, "slug": slug.current, date, gallery }
    }
  `, { slug });

  if (!raw) return null;

  const directory = new Map<string, string>();
  for (const a of raw.artistDirectory ?? []) {
    if (a?.name && a?.slug) directory.set(a.name.toLowerCase().trim(), a.slug);
  }
  const tracklist = raw.tracklist?.map((t) => {
    const featureLinks: FeatureLink[] = (t.features ?? []).map((name) => ({
      name,
      slug: directory.get(name.toLowerCase().trim()),
    }));
    return { ...t, featureLinks };
  });
  const { artistDirectory: _stripped, ...rest } = raw;
  return { ...rest, ...(tracklist ? { tracklist } : {}) };
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
  // Excludes dropping / upcoming so the C+C hero never surfaces a pitch
  // record (Just Nico, Glove, the comps, etc.) on the public label page.
  // Matches getReleases()'s public-catalog filter exactly.
  const featured = await sanityFetch<ReleaseListItem[]>(groq`
    *[_type == "release"
      && featured == true
      && (withdrawn != true)
      && label != "Other"
      && !(coalesce(status, "out") in ["dropping", "upcoming"])
    ] {
      ${releaseListProjection}
    }
  `);
  let pool = featured;
  if (pool.length === 0) {
    pool = await sanityFetch<ReleaseListItem[]>(groq`
      *[_type == "release"
        && (withdrawn != true)
        && label != "Other"
        && defined(cover)
        && !(coalesce(status, "out") in ["dropping", "upcoming"])
      ] {
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
  displayInitials,
  onLabel,
  tspCrew,
  crewRole,
  crewYearStart
`;

export async function getRosterArtists(): Promise<ArtistListItem[]> {
  return sanityFetch<ArtistListItem[]>(groq`
    *[_type == "artist" && onLabel == true] | order(name asc) {
      ${artistListProjection}
    }
  `);
}

/**
 * Full artist directory. Powers /artists — the public-facing alphabetical
 * grid of every person/group with a doc in the system. Excludes artist
 * docs explicitly marked hidden (or you can fold in other filters later).
 */
export async function getAllArtists(): Promise<ArtistListItem[]> {
  return sanityFetch<ArtistListItem[]>(groq`
    *[_type == "artist" && hidden != true] | order(name asc) {
      ${artistListProjection}
    }
  `);
}

/**
 * The TSP crew/alumni list — every artist with tspCrew=true. Used to power
 * the /crew page. Sorted by year they came up (oldest residents first =
 * the OGs), with name as the tie-breaker. Also pulls the count of releases
 * + videos each is credited on so the card can show their footprint.
 */
export type CrewMember = ArtistListItem & {
  /** Releases where they appear in credits[]. */
  creditCount: number;
  /** Videos with relatedArtist === this doc OR title-mentions. */
  videoCount: number;
};

export async function getCrew(): Promise<CrewMember[]> {
  return sanityFetch<CrewMember[]>(groq`
    *[_type == "artist" && tspCrew == true] | order(coalesce(crewYearStart, 9999) asc, name asc) {
      ${artistListProjection},
      "creditCount": count(*[_type == "release" && references(^._id)]),
      "videoCount": count(*[_type == "video" && relatedArtist._ref == ^._id])
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
  kind, headline, excerpt, outlet, author, date, image, imageUrl, featured, bestNew,
  "era": relatedEra->{ name, "slug": slug.current },
  "release": relatedRelease->{ _id, title, "slug": slug.current, cover, coverColor }
`;

export async function getPressQuotes(limit = 8): Promise<PressQuoteItem[]> {
  // Press wall on /nick-hook#press — featured only, top hits.
  return sanityFetch<PressQuoteItem[]>(groq`
    *[_type == "pressQuote" && featured == true] | order(coalesce(date, "0000") desc, year desc) [0...$limit] {
      ${pressProjection}
    }
  `, { limit });
}

// === Career highlights (EPK + /nick-hook#highlights) ===
export type HighlightItem = {
  _id: string;
  name: string;
  kind: "performance" | "tour" | "experience";
  order?: number;
  city?: string;
  venue?: string;
  yearStart?: number;
  yearEnd?: number;
  years?: number[];
  note?: string;
  image?: SanityImage;
  url?: string;
};

export async function getHighlights(): Promise<HighlightItem[]> {
  return sanityFetch<HighlightItem[]>(groq`
    *[_type == "highlight" && hidden != true]
      | order(kind asc, order asc, yearStart asc, name asc) {
      _id, name, kind, order, city, venue, yearStart, yearEnd, years, note, image, url
    }
  `);
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

/**
 * Every press piece from a given outlet. Used on the brand/partner pages
 * (/partners/[slug]) to auto-render an "every piece they wrote about me"
 * section — so the brand page becomes a one-stop hub for everything
 * connecting Nick to that outlet (their marquee article + every other
 * mention).
 *
 * Matches the brand name case-insensitively against the press doc's
 * `outlet` field. Falls back to matching `source` (legacy field) too.
 */
export async function getPressByOutlet(outletName: string): Promise<PressQuoteItem[]> {
  return sanityFetch<PressQuoteItem[]>(groq`
    *[_type == "pressQuote" && (
      lower(outlet) == lower($name) ||
      lower(source) == lower($name)
    )] | order(coalesce(date, year + "-01-01", "0000") desc) {
      ${pressProjection}
    }
  `, { name: outletName });
}

/**
 * Press attached to a brand via the explicit `relatedBrand` reference,
 * OR by case-insensitive outlet name match. Used on /partners/[slug]
 * pages so brands surface every piece we have for that outlet.
 *
 * Combining ref + name match means pieces written before we added the
 * brand doc (or before the auto-linker ran) still show up.
 */
export async function getPressForBrand(brandSlug: string, brandName: string): Promise<PressQuoteItem[]> {
  return sanityFetch<PressQuoteItem[]>(groq`
    *[_type == "pressQuote" && (
      relatedBrand->slug.current == $slug ||
      lower(outlet) == lower($name) ||
      lower(source) == lower($name)
    )] | order(coalesce(date, year + "-01-01", "0000") desc) {
      ${pressProjection}
    }
  `, { slug: brandSlug, name: brandName });
}

export async function getPressForRelease(releaseSlug: string): Promise<PressQuoteItem[]> {
  return sanityFetch<PressQuoteItem[]>(groq`
    *[_type == "pressQuote" && relatedRelease->slug.current == $slug]
      | order(coalesce(bestNew, false) desc, coalesce(featured, false) desc, coalesce(date, "0000") desc) {
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

/**
 * Every studio session this artist was in — they're listed under `people`
 * on the session doc. Returns the resolved roster of OTHERS on the same
 * session (so on /artists/a-trak you see "with Nick Hook + Big Boi") plus
 * any releases that came out of it.
 */
export async function getSessionsForArtist(artistSlug: string): Promise<SessionListItem[]> {
  return sanityFetch<SessionListItem[]>(groq`
    *[_type == "studioSession" && count(people[@->slug.current == $slug]) > 0]
      | order(date desc) {
      _id, title, "slug": slug.current, date, location, guests, gear, notes, gallery,
      "people": people[]->{ name, "slug": slug.current },
      "becameReleases": becameReleases[]->{ _id, title, "slug": slug.current, year, coverColor }
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
  featured,
  layoutVariant
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
      "timeline": timeline[]{ year, month, milestone },
      // Pull every photo tagged to this era (via relatedEra ref OR via the
      // tag string matching the era's slug). Used to render a tiled mosaic
      // background on the hero — when the era has 5+ photos, the page
      // becomes a wall of context instead of a generic single-cover hero.
      "eraPhotos": *[
        _type == "photo"
        && hidden != true
        && (relatedEra->slug.current == $slug || $slug in tags)
      ] | order(_id asc) {
        _id,
        image,
        caption
      }
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
      featuredVideoUrl,
      samplePackUrl,
      samplePackTitle,
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

/** Photo docs tagged for the spacepit studio — used by the "from the room"
 *  mosaic on the homepage + the /studios page gallery. Defaults to a wide
 *  pool (kind: studio OR tagged 'spacepit'+'studio') so the importer's
 *  classification doesn't have to be perfect. */
export async function getStudioDocPhotos(limit = 60): Promise<{ _id: string; image: SanityImage; caption?: string }[]> {
  return sanityFetch<{ _id: string; image: SanityImage; caption?: string }[]>(groq`
    *[
      _type == "photo"
      && hidden != true
      && (kind == "studio" || ("spacepit" in tags && "studio" in tags))
    ] | order(_createdAt desc) [0...$limit] {
      _id, image, caption
    }
  `, { limit });
}

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

/** Who can grab the pack. FREE = public download. VAULT = patreon/supporter
 *  unlock only. PURCHASE = one-time pay (gumroad/bandcamp). Defaults to FREE
 *  on legacy packs that pre-date this field. */
export type PackAccess = "free" | "vault" | "purchase";

export type PackListItem = {
  _id: string;
  name: string;
  slug: string;
  kind: PackKind;
  access?: PackAccess;
  tagline?: string;
  cover?: SanityImage;
  releaseDate?: string;
  year?: number;
  downloadUrl?: string;
  vaultUrl?: string;
  previewUrl?: string;
  price?: string;
  youtubeUrl?: string;
  featured?: boolean;
};

const packListProjection = `
  _id,
  name,
  "slug": slug.current,
  kind,
  access,
  tagline,
  cover,
  releaseDate,
  year,
  downloadUrl,
  vaultUrl,
  previewUrl,
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

export type PackDetail = PackListItem & {
  description?: unknown[]; // PortableText blocks
  gearItems?: { name: string; slug: string }[];
  relatedReleases?: { title: string; slug: string }[];
};

const packDetailProjection = `
  ${packListProjection},
  description,
  "gearItems": gear[]->{ name, "slug": slug.current },
  "relatedReleases": releases[]->{ title, "slug": slug.current }
`;

export async function getPackBySlug(slug: string): Promise<PackDetail | null> {
  return sanityFetch<PackDetail | null>(
    groq`
      *[_type == "pack" && slug.current == $slug][0] {
        ${packDetailProjection}
      }
    `,
    { slug },
  );
}

export async function getPackSlugs(): Promise<string[]> {
  const rows = await sanityFetch<{ slug: string }[]>(groq`
    *[_type == "pack" && defined(slug.current)] {
      "slug": slug.current
    }
  `);
  return rows.map((r) => r.slug).filter(Boolean);
}

// ============================================================================
// VAULT DROPS — synced from Patreon by scripts/sync-patreon.ts
// ============================================================================

export type VaultDropKind =
  | "post" | "video" | "audio" | "pdf"
  | "sample-pack" | "session" | "office-hours";

export type VaultDropListItem = {
  _id: string;
  title: string;
  slug?: string;
  kind: VaultDropKind;
  excerpt?: string;
  patreonUrl?: string;
  publishedAt?: string;
  isPaid?: boolean;
  /** Patreon's min_cents_pledged_to_view — 500 = $5 tier, 2500 = $25 tier. */
  minCentsPledged?: number | null;
  cover?: SanityImage;
  coverUrl?: string;
  tags?: string[];
  featured?: boolean;
};

const vaultDropProjection = `
  _id,
  title,
  "slug": slug.current,
  kind,
  excerpt,
  patreonUrl,
  publishedAt,
  isPaid,
  minCentsPledged,
  cover,
  coverUrl,
  tags,
  featured
`;

export async function getVaultDrops(): Promise<VaultDropListItem[]> {
  return sanityFetch<VaultDropListItem[]>(groq`
    *[_type == "vaultDrop" && hidden != true]
      | order(featured desc, publishedAt desc) {
      ${vaultDropProjection}
    }
  `);
}

export async function getVaultDropsForRelease(slug: string): Promise<VaultDropListItem[]> {
  return sanityFetch<VaultDropListItem[]>(groq`
    *[_type == "vaultDrop" && hidden != true && relatedRelease->slug.current == $slug]
      | order(featured desc, publishedAt desc) {
      ${vaultDropProjection}
    }
  `, { slug });
}

export async function getVaultDropsForGear(gearId: string): Promise<VaultDropListItem[]> {
  return sanityFetch<VaultDropListItem[]>(groq`
    *[_type == "vaultDrop" && hidden != true && relatedGear._ref == $gearId]
      | order(featured desc, publishedAt desc) {
      ${vaultDropProjection}
    }
  `, { gearId });
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

  // Filter: hide dropping/upcoming records from the public catalog. They
  // stay reachable via direct URL + the gated /calm-collect/upcoming page
  // but don't surface on /catalog browsing.
  const statusGuard = `&& !(coalesce(status, "out") in ["dropping", "upcoming"])`;

  const primary = await sanityFetch<ReleaseListItem[]>(groq`
    *[
      _type == "release"
      && (withdrawn != true)
      ${titleGuard}
      ${statusGuard}
      && $slug in artists[]->slug.current
    ] | order(year desc, releaseDate desc, catalogNumber desc) {
      ${releaseListProjection}
    }
  `, { slug });

  const credited = await sanityFetch<(ReleaseListItem & { creditRoles: string[] })[]>(groq`
    *[
      _type == "release"
      && (withdrawn != true)
      ${statusGuard}
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
