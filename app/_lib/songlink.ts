/**
 * Songlink / Odesli API client. No auth required.
 *
 * Use case: you have ONE platform URL for a release (Bandcamp, Apple Music,
 * etc.) and want the URLs for every other platform. Songlink is the music
 * industry's universal cross-streaming resolver (powers "open in" buttons
 * for press kits, radio shows, etc.).
 *
 * Endpoint:  GET /v1-alpha.1/links?url=<encoded-url>
 * Rate limit: ~10/min unauthenticated. Throttle to 6.5s between calls.
 *
 * Docs: https://www.notion.so/Public-API-Documentation-bf6f379e09f74e3aa5b1142d99cb59c8
 */

const API = "https://api.song.link/v1-alpha.1/links";

export interface SonglinkResponse {
  entityUniqueId: string;
  userCountry: string;
  pageUrl: string;
  linksByPlatform: Partial<Record<SonglinkPlatform, { url: string }>>;
}

export type SonglinkPlatform =
  | "spotify"
  | "appleMusic"
  | "youtube"
  | "youtubeMusic"
  | "amazonMusic"
  | "amazonStore"
  | "deezer"
  | "tidal"
  | "soundcloud"
  | "pandora"
  | "napster"
  | "yandex"
  | "audiomack"
  | "bandcamp";

export class SonglinkRateLimit extends Error {
  constructor() { super("SONGLINK_RATE_LIMITED"); }
}
export class SonglinkNotFound extends Error {
  constructor() { super("SONGLINK_NOT_FOUND"); }
}

/**
 * Lookup all platform URLs for the given input URL. Returns null when the
 * service can't find a match (404). Throws SonglinkRateLimit on 429 — caller
 * decides to back off + retry.
 */
export async function lookup(inputUrl: string): Promise<SonglinkResponse | null> {
  const u = `${API}?url=${encodeURIComponent(inputUrl)}`;
  const res = await fetch(u, {
    headers: {
      "User-Agent": "spacepit-backfill/1.0 (thespacepit.com)",
      Accept: "application/json",
    },
  });
  if (res.status === 429) throw new SonglinkRateLimit();
  if (res.status === 404) return null;
  if (!res.ok) {
    // Some 400s come back for malformed inputs — log and skip
    console.warn(`  songlink ${res.status} for ${inputUrl.slice(0, 80)}`);
    return null;
  }
  return (await res.json()) as SonglinkResponse;
}

/**
 * Convenience: lookup with built-in exponential backoff on 429 (up to 3
 * tries, 30s / 60s / 120s). Returns null on persistent rate limit.
 */
export async function lookupWithBackoff(
  inputUrl: string,
  initialDelayMs = 30000,
): Promise<SonglinkResponse | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await lookup(inputUrl);
    } catch (e) {
      if (!(e instanceof SonglinkRateLimit)) throw e;
      const wait = initialDelayMs * Math.pow(2, attempt);
      console.log(`    · rate-limited, waiting ${Math.round(wait / 1000)}s…`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  return null;
}
