// Discogs collection — pulls Nick's record collection from the public API.
//
// API docs: https://www.discogs.com/developers/#page:user-collection
// Auth: not required for public collections (Nick's is public).
// Rate limit: 60 req/min unauth. We use per_page=500 so 1,300+ records
// fit in ~3 calls.

const DISCOGS_USERNAME = process.env.DISCOGS_USERNAME ?? "nickhook";

// Revalidate every 12 hours. Collection doesn't change often.
const REVALIDATE_SECONDS = 60 * 60 * 12;

export type DiscogsArtist = {
  name: string;
  id: number;
};

export type DiscogsFormat = {
  name: string; // "Vinyl" | "CD" | "Cassette" | "File" | ...
  qty?: string;
  descriptions?: string[]; // ["LP", "Album", "Reissue", ...]
};

export type DiscogsLabel = {
  name: string;
  catno?: string;
};

export type DiscogsRelease = {
  id: number; // release id (link to https://www.discogs.com/release/{id})
  instance_id: number;
  date_added: string;
  year: number;
  title: string;
  artists: DiscogsArtist[];
  formats: DiscogsFormat[];
  labels: DiscogsLabel[];
  genres: string[];
  styles: string[];
  thumb: string;       // small (~150px)
  cover_image: string; // medium (~600px)
};

type CollectionPage = {
  pagination: { items: number; pages: number; page: number; per_page: number };
  releases: Array<{
    id: number;
    instance_id: number;
    date_added: string;
    basic_information: {
      id: number;
      title: string;
      year: number;
      thumb: string;
      cover_image: string;
      artists: { name: string; id: number }[];
      formats: { name: string; qty?: string; descriptions?: string[] }[];
      labels: { name: string; catno?: string }[];
      genres: string[];
      styles: string[];
    };
  }>;
};

async function fetchPage(page: number, perPage: number): Promise<CollectionPage | null> {
  const url = `https://api.discogs.com/users/${DISCOGS_USERNAME}/collection/folders/0/releases?per_page=${perPage}&page=${page}&sort=added&sort_order=desc`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "spacepit-web/1.0 +https://thespacepit.com" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      console.warn(`Discogs fetch failed: ${res.status} for ${url}`);
      return null;
    }
    return (await res.json()) as CollectionPage;
  } catch (err) {
    console.warn("Discogs fetch error:", (err as Error).message);
    return null;
  }
}

/** Total record count + the full collection. Pages internally. */
export async function getCollection(): Promise<{ total: number; records: DiscogsRelease[] }> {
  const perPage = 500;
  const first = await fetchPage(1, perPage);
  if (!first) return { total: 0, records: [] };

  const totalPages = first.pagination.pages;
  const all: CollectionPage["releases"] = [...first.releases];

  // Fetch remaining pages in parallel — Discogs handles concurrent reads fine.
  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2, perPage))
    );
    for (const p of rest) {
      if (p) all.push(...p.releases);
    }
  }

  const records: DiscogsRelease[] = all.map((r) => ({
    id: r.id,
    instance_id: r.instance_id,
    date_added: r.date_added,
    year: r.basic_information.year,
    title: r.basic_information.title,
    artists: r.basic_information.artists.map((a) => ({ name: a.name, id: a.id })),
    formats: r.basic_information.formats ?? [],
    labels: r.basic_information.labels ?? [],
    genres: r.basic_information.genres ?? [],
    styles: r.basic_information.styles ?? [],
    thumb: r.basic_information.thumb,
    cover_image: r.basic_information.cover_image,
  }));

  return { total: first.pagination.items, records };
}

/** Discogs strips "(2)" suffixes from disambiguated artist names — pretty-print. */
export function cleanArtistName(name: string): string {
  return name.replace(/\s*\(\d+\)\s*$/, "").trim();
}

/** Primary format string for a release (Vinyl/CD/Cassette/Digital). */
export function primaryFormat(formats: DiscogsFormat[]): string {
  if (!formats || formats.length === 0) return "—";
  return formats[0].name;
}

/** Discogs public URL for a release. */
export function discogsUrl(releaseId: number): string {
  return `https://www.discogs.com/release/${releaseId}`;
}
