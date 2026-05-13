/**
 * Spotify Web API client — thin wrapper for our backfill use cases.
 *
 * Auth: Client Credentials Flow. No user OAuth needed because we're only
 * reading PUBLIC catalog data. You make a free Spotify dev app at
 * https://developer.spotify.com/dashboard, grab the CLIENT_ID + SECRET,
 * stick them in .env.local — we trade them for an access_token at the
 * start of each script run (TTL ~1hr, fresh each run, no refresh needed).
 *
 * Env vars expected:
 *   SPOTIFY_CLIENT_ID
 *   SPOTIFY_CLIENT_SECRET
 *
 * Search syntax we use:
 *   isrc:CODE        — exact-match track lookup (the gold standard)
 *   artist:X track:Y — fuzzy match for releases missing ISRCs
 *
 * Docs: https://developer.spotify.com/documentation/web-api/reference
 */

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

export interface SpotifyTrack {
  id: string;
  name: string;
  external_urls: { spotify: string };
  artists: { name: string }[];
  album: {
    id: string;
    name: string;
    external_urls: { spotify: string };
    release_date?: string;
  };
}

export async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const params = new URLSearchParams({ grant_type: "client_credentials" });
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify token request failed: ${res.status} ${body}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  return json.access_token;
}

/** Search by ISRC. Returns the FIRST matching track (usually the only one
 *  unless the ISRC was reassigned, which is rare). Null if no match. */
export async function searchByIsrc(isrc: string, token: string): Promise<SpotifyTrack | null> {
  const q = encodeURIComponent(`isrc:${isrc}`);
  const res = await fetch(`${API_BASE}/search?q=${q}&type=track&limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 429) {
    // Rate limited — back off and retry once.
    const retryAfter = parseInt(res.headers.get("Retry-After") ?? "2", 10);
    await new Promise((r) => setTimeout(r, (retryAfter + 1) * 1000));
    return searchByIsrc(isrc, token);
  }
  if (!res.ok) return null;
  const json = (await res.json()) as { tracks?: { items?: SpotifyTrack[] } };
  return json.tracks?.items?.[0] ?? null;
}

/** Fuzzy search for fallback when no ISRC. Returns up to 5 candidates so
 *  the caller can pick the best match or surface them for human review. */
export async function searchByArtistTitle(
  artist: string,
  title: string,
  token: string,
): Promise<SpotifyTrack[]> {
  // Strip parenthetical info that confuses Spotify ("(Original Mix)", etc.)
  const cleanTitle = title.replace(/\s*\([^)]*\)\s*$/g, "").trim();
  const q = encodeURIComponent(`artist:${artist} track:${cleanTitle}`);
  const res = await fetch(`${API_BASE}/search?q=${q}&type=track&limit=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") ?? "2", 10);
    await new Promise((r) => setTimeout(r, (retryAfter + 1) * 1000));
    return searchByArtistTitle(artist, title, token);
  }
  if (!res.ok) return [];
  const json = (await res.json()) as { tracks?: { items?: SpotifyTrack[] } };
  return json.tracks?.items ?? [];
}

/** Score a candidate match. Higher = more confident.
 *  - Artist name exact (case-insensitive) → +3
 *  - Artist name contains → +1
 *  - Title exact → +3
 *  - Title fuzzy-contains → +1
 *  - Album name matches release title → +2  */
export function scoreMatch(
  candidate: SpotifyTrack,
  wantArtist: string,
  wantTitle: string,
  wantReleaseTitle?: string,
): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const wa = norm(wantArtist);
  const wt = norm(wantTitle);
  const wr = wantReleaseTitle ? norm(wantReleaseTitle) : null;

  let score = 0;
  for (const a of candidate.artists) {
    const na = norm(a.name);
    if (na === wa) { score += 3; break; }
    if (na.includes(wa) || wa.includes(na)) { score += 1; break; }
  }
  const nct = norm(candidate.name);
  if (nct === wt) score += 3;
  else if (nct.includes(wt) || wt.includes(nct)) score += 1;
  if (wr) {
    const na = norm(candidate.album.name);
    if (na === wr) score += 2;
    else if (na.includes(wr) || wr.includes(na)) score += 1;
  }
  return score;
}
