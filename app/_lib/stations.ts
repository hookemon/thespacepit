/**
 * STATIONS — curated subsets of the catalog. Each station is a NAMED FILTER
 * over Nick's release pool. Picking a station on /radio shrinks the queue
 * to just those tracks (which are then shuffled + matched to YouTube as usual).
 *
 * Why code, not Sanity: stations express logic ("everything 2015–2018",
 * "everything on Calm + Collect", "everything from the CZ era") that's
 * cheaper as a small typed config than as 8 hand-curated playlists in Sanity.
 * When a station needs FULLY HAND-PICKED tracks (a vibe-mix, not a filter),
 * use `releaseSlugs` to pin them explicitly.
 *
 * To add a station: append to `STATIONS`. The slug is the station's URL key
 * (?station=…) and also its stable id. Multiple criteria within one station
 * are OR'd — a release is included if it matches ANY of: era, artist, label,
 * year range, or explicit slug pin.
 */
import type { ReleaseListItem } from "./sanity-queries";

export type Station = {
  /** URL slug + stable id */
  slug: string;
  /** Display label (lowercase, short) */
  label: string;
  /** One-line description for the chip tooltip / sub-headline */
  blurb?: string;
  /** Era project slugs — release is included if linked from any of these projects */
  eraSlugs?: string[];
  /** Artist slugs — release is included if any artist matches */
  artistSlugs?: string[];
  /** Label string match — release.label must equal one of these */
  labels?: string[];
  /** Inclusive year range (uses release.year) */
  yearMin?: number;
  yearMax?: number;
  /** Pin specific release slugs in (used for "hand-curated mix" stations) */
  releaseSlugs?: string[];
  /** Title regex match — useful for series like "chakra*" or "drone*" */
  titleMatch?: RegExp;
};

/**
 * The shipping stations. Order matters — this is also the order the chips
 * render in. "the catalog" sits first as the default unfiltered view.
 */
export const STATIONS: Station[] = [
  {
    slug: "the-catalog",
    label: "the catalog",
    blurb: "every song · every release · 2009 → today",
    // No filter rules == match everything
  },
  {
    slug: "calm-collect",
    label: "calm + collect",
    blurb: "the home label · 29 releases",
    labels: ["Calm + Collect", "Calm + Collect Instrumental"],
  },
  {
    slug: "the-bands",
    label: "the bands",
    blurb: "men women & children · cubic zirconia · spiritual friendship",
    eraSlugs: ["men-women-children", "cubic-zirconia", "spiritual-friendship"],
  },
  {
    slug: "cubic-zirconia",
    label: "cubic zirconia",
    blurb: "tiombe · daud · nick · 2009 → 2013",
    eraSlugs: ["cubic-zirconia"],
    labels: ["Lockhart Dynasty × Calm + Collect"],
  },
  {
    slug: "the-drones",
    label: "the drones · calllm",
    blurb: "the calllm sub-label · ambient + chakra series",
    labels: ["Calllm"],
    titleMatch: /chakra|drone|drums(?!\s*and)/i,
  },
  {
    slug: "the-rappers",
    label: "the rappers",
    blurb: "production work · rtj · bronson · boo · big boi",
    artistSlugs: [
      "run-the-jewels",
      "action-bronson",
      "gangsta-boo",
      "big-boi",
      "young-thug",
      "flatbush-zombies",
      "junglepussy",
      "kilo-kish",
    ],
  },
  {
    slug: "early-years",
    label: "early years",
    blurb: "the first records · 2009 → 2014",
    yearMin: 2009,
    yearMax: 2014,
  },
  {
    slug: "prolific-era",
    label: "prolific era",
    blurb: "release after release · 2015 → 2018",
    yearMin: 2015,
    yearMax: 2018,
  },
  {
    slug: "recent",
    label: "recent",
    blurb: "the new stuff · 2020 → today",
    yearMin: 2020,
  },
];

/**
 * Build a lookup of station-slug → Set<release-slug> by walking the era
 * project map (era → release[]) and combining it with the per-release
 * predicates (label / year / artist / explicit pin). Done once at request
 * time on the server, then handed to the client. Cheap; ~120 releases × 9
 * stations.
 */
export function buildStationMap(
  releases: ReleaseListItem[],
  eraReleaseMap: Record<string, string[]>, // era slug → release slugs (from project.releases[])
): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  for (const s of STATIONS) {
    const hits = new Set<string>();
    // Resolve era → release slug list once
    const erasReleaseSlugs = new Set<string>();
    if (s.eraSlugs) {
      for (const eraSlug of s.eraSlugs) {
        for (const rel of eraReleaseMap[eraSlug] ?? []) erasReleaseSlugs.add(rel);
      }
    }
    for (const r of releases) {
      // No filter rules at all = match everything
      const noFilters =
        !s.eraSlugs &&
        !s.artistSlugs &&
        !s.labels &&
        s.yearMin === undefined &&
        s.yearMax === undefined &&
        !s.releaseSlugs &&
        !s.titleMatch;
      if (noFilters) {
        hits.add(r.slug);
        continue;
      }
      let match = false;
      if (s.releaseSlugs?.includes(r.slug)) match = true;
      if (!match && s.labels && r.label && s.labels.includes(r.label)) match = true;
      if (!match && erasReleaseSlugs.has(r.slug)) match = true;
      if (!match && s.artistSlugs && r.artists.some((a) => s.artistSlugs!.includes(a.slug))) match = true;
      if (!match && (s.yearMin !== undefined || s.yearMax !== undefined)) {
        const y = r.year ?? 0;
        const minOk = s.yearMin === undefined || y >= s.yearMin;
        const maxOk = s.yearMax === undefined || y <= s.yearMax;
        if (minOk && maxOk && y > 0) match = true;
      }
      if (!match && s.titleMatch && s.titleMatch.test(r.title)) match = true;
      if (match) hits.add(r.slug);
    }
    out[s.slug] = hits;
  }
  return out;
}

/**
 * Counts per station — cheap derived value used to render "(N tracks)" on
 * each chip. Takes the per-station release-slug set and a release→trackCount
 * map (built from the catalog-songs query).
 */
export function countTracksPerStation(
  stationMap: Record<string, Set<string>>,
  releaseToTrackCount: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [stationSlug, releaseSet] of Object.entries(stationMap)) {
    let n = 0;
    for (const rel of releaseSet) n += releaseToTrackCount[rel] ?? 0;
    out[stationSlug] = n;
  }
  return out;
}
