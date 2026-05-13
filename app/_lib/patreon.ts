/**
 * Patreon API v2 client — thin wrapper over fetch() with token refresh.
 *
 * Auth: we use the "Creator's Access Token" pattern — when you register an
 * API client at patreon.com/portal/registration/register-clients, Patreon
 * hands you a long-lived access_token + refresh_token. No OAuth dance needed
 * because you're accessing YOUR OWN creator data.
 *
 * Token TTL: ~1 month. On 401 we auto-refresh using refresh_token. The new
 * tokens are LOGGED so you can paste them back into .env.local — we don't
 * write back to .env (would race with the dev server).
 *
 * Env vars expected:
 *   PATREON_ACCESS_TOKEN   — the access token from the API client portal
 *   PATREON_REFRESH_TOKEN  — the refresh token from the API client portal
 *   PATREON_CLIENT_ID      — the OAuth client ID (for token refresh)
 *   PATREON_CLIENT_SECRET  — the OAuth client secret (for token refresh)
 *   PATREON_CAMPAIGN_ID    — your campaign ID (we auto-discover on first run
 *                            if not set, log it for you to paste in)
 *
 * Docs: https://docs.patreon.com/#api-resources
 */

const API_BASE = "https://www.patreon.com/api/oauth2/v2";
const TOKEN_URL = "https://www.patreon.com/api/oauth2/token";

export type PatreonPost = {
  id: string;
  attributes: {
    title: string | null;
    /** HTML body. NULL for patron-only posts you don't have access to (but
     *  you should always have access to your own posts). */
    content: string | null;
    /** Public-facing URL of the post on patreon.com */
    url: string;
    /** Publish timestamp in ISO 8601 */
    published_at: string;
    /** TRUE = locked behind any tier. FALSE = free / public-on-Patreon. */
    is_paid: boolean | null;
    /** Minimum cents-pledged required to view. 500 = $5/mo tier, etc. */
    min_cents_pledged_to_view: number | null;
    /** Embed object — patreon attaches youtube/soundcloud/etc here. */
    embed_data: { provider?: string; provider_url?: string; subject?: string } | null;
    /** Featured / hero image URL. */
    image: { large_url?: string; thumb_url?: string; url?: string } | null;
  };
};

export type PatreonCampaign = {
  id: string;
  attributes: {
    creation_name: string | null;
    summary: string | null;
    patron_count: number;
    pledge_url: string;
  };
};

export type PatreonAuthBundle = {
  accessToken: string;
  refreshToken: string;
};

interface PatreonError {
  errors?: Array<{ status: string; detail: string }>;
}

/**
 * Throw-on-non-ok wrapper. Surfaces 401 specifically so the caller can
 * attempt a refresh.
 */
class PatreonAuthError extends Error {
  constructor() { super("PATREON_AUTH_EXPIRED"); }
}

async function call<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 401) throw new PatreonAuthError();
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as PatreonError;
    const detail = body.errors?.[0]?.detail ?? `${res.status} ${res.statusText}`;
    throw new Error(`Patreon API error on ${path}: ${detail}`);
  }
  return (await res.json()) as T;
}

/**
 * Refresh an expired access token. Returns the new pair. Caller is expected
 * to log them so the user can paste back into .env.local.
 */
export async function refreshTokens(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<PatreonAuthBundle> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Patreon token refresh failed: ${res.status} ${body}`);
  }
  const json = (await res.json()) as { access_token: string; refresh_token: string };
  return { accessToken: json.access_token, refreshToken: json.refresh_token };
}

/**
 * Run a call, refresh on 401, retry once.
 */
async function callWithRefresh<T>(
  path: string,
  auth: PatreonAuthBundle,
  clientId: string,
  clientSecret: string,
): Promise<{ data: T; auth: PatreonAuthBundle }> {
  try {
    const data = await call<T>(path, auth.accessToken);
    return { data, auth };
  } catch (e) {
    if (!(e instanceof PatreonAuthError)) throw e;
    console.log("→ access_token expired, refreshing...");
    const refreshed = await refreshTokens(auth.refreshToken, clientId, clientSecret);
    console.log("→ refreshed. PASTE THESE INTO .env.local SO THE NEXT RUN STARTS FRESH:");
    console.log(`   PATREON_ACCESS_TOKEN=${refreshed.accessToken}`);
    console.log(`   PATREON_REFRESH_TOKEN=${refreshed.refreshToken}`);
    const data = await call<T>(path, refreshed.accessToken);
    return { data, auth: refreshed };
  }
}

/**
 * Fetch the authenticated creator's campaigns. There's usually one.
 * Returned IDs go into PATREON_CAMPAIGN_ID.
 */
export async function listCampaigns(
  auth: PatreonAuthBundle,
  clientId: string,
  clientSecret: string,
): Promise<PatreonCampaign[]> {
  const fields = "creation_name,summary,patron_count,pledge_url";
  const { data } = await callWithRefresh<{ data: PatreonCampaign[] }>(
    `/campaigns?fields[campaign]=${fields}`,
    auth, clientId, clientSecret,
  );
  return data.data;
}

/**
 * Pull every post from a campaign. Patreon paginates at 20/page, so we walk
 * the cursor until exhausted. Posts arrive newest-first.
 */
export async function listCampaignPosts(
  campaignId: string,
  auth: PatreonAuthBundle,
  clientId: string,
  clientSecret: string,
): Promise<{ posts: PatreonPost[]; auth: PatreonAuthBundle }> {
  // Request every field we care about. embed_data + image require explicit ask.
  const fields = [
    "title",
    "content",
    "url",
    "published_at",
    "is_paid",
    "min_cents_pledged_to_view",
    "embed_data",
    "image",
  ].join(",");

  let cursor: string | null = null;
  const out: PatreonPost[] = [];
  let workingAuth = auth;

  do {
    // Explicit `: string` — Next 16's strict TS checker on Vercel infers
    // `any` here without it (probably tripped by the [post] / [count] tokens
    // inside the template literal), which then trips the "implicit any"
    // error. Local `tsc --noEmit` is more forgiving. Annotation fixes both.
    const path: string = `/campaigns/${encodeURIComponent(campaignId)}/posts?fields[post]=${fields}&page[count]=20${cursor ? `&page[cursor]=${encodeURIComponent(cursor)}` : ""}`;
    type PageRes = {
      data: PatreonPost[];
      meta?: { pagination?: { cursors?: { next?: string | null } } };
    };
    const { data, auth: nextAuth } = await callWithRefresh<PageRes>(
      path, workingAuth, clientId, clientSecret,
    );
    out.push(...data.data);
    workingAuth = nextAuth;
    cursor = data.meta?.pagination?.cursors?.next ?? null;
    if (cursor) await new Promise((r) => setTimeout(r, 250)); // be gentle
  } while (cursor);

  return { posts: out, auth: workingAuth };
}
