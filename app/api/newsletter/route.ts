// Newsletter signup → Mailchimp.
//
// Env vars (set in .env.local / Netlify):
//   MAILCHIMP_API_KEY  — your Mailchimp API key (e.g. "abc...-us10")
//   MAILCHIMP_LIST_ID  — the default audience ID (10-char hex from Audience > Settings > Audience name and defaults)
//
// If env vars are missing, the route returns a friendly 503 so the form
// renders without exploding during development.
//
// GET /api/newsletter returns health/config (no secrets exposed) — hit it
// to verify Netlify env vars actually propagated without going through
// the form. e.g. `curl https://thespacepit.com/api/newsletter`

import type { NextRequest } from "next/server";

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;

// Mailchimp keys end in their datacenter, e.g. "abc...-us10".
function getDatacenter(apiKey: string): string | null {
  const i = apiKey.lastIndexOf("-");
  return i > -1 ? apiKey.slice(i + 1) : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Health check — returns wiring state without leaking secrets. Useful so
// Nick can verify deploys without writing to his real list.
export async function GET() {
  const hasKey = !!MAILCHIMP_API_KEY;
  const hasList = !!MAILCHIMP_LIST_ID;
  const dc = MAILCHIMP_API_KEY ? getDatacenter(MAILCHIMP_API_KEY) : null;
  return Response.json({
    ok: hasKey && hasList && !!dc,
    config: {
      apiKey: hasKey ? "set" : "missing",
      listId: hasList ? "set" : "missing",
      datacenter: dc ?? "unknown",
    },
  });
}

export async function POST(request: NextRequest) {
  let body: { email?: unknown; audienceId?: unknown; source?: unknown; website?: unknown; pathname?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid request body" }, { status: 400 });
  }

  // Honeypot — a hidden `website` field that real users never see. Bots
  // tend to fill every input on a form, so any value here is a spam tell.
  // We return success (so the bot moves on) but never hit Mailchimp.
  if (typeof body.website === "string" && body.website.trim()) {
    return Response.json({ ok: true, honeypot: true });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const audienceId =
    typeof body.audienceId === "string" && body.audienceId
      ? body.audienceId
      : MAILCHIMP_LIST_ID;
  // Source: explicit `source` wins, else fall back to the pathname the user
  // submitted from (so a form on a new page auto-tags without code changes).
  const explicitSource = typeof body.source === "string" ? body.source : undefined;
  const pathname = typeof body.pathname === "string" ? body.pathname : undefined;
  const source = explicitSource ?? (pathname ? pathname.replace(/^\//, "").replace(/\/$/, "") || "home" : undefined);

  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ error: "valid email required" }, { status: 400 });
  }

  if (!MAILCHIMP_API_KEY || !audienceId) {
    return Response.json(
      { error: "newsletter wiring up — DM us for now and we'll add you" },
      { status: 503 },
    );
  }

  const dc = getDatacenter(MAILCHIMP_API_KEY);
  if (!dc) {
    return Response.json({ error: "newsletter config error" }, { status: 500 });
  }

  const auth = Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString("base64");
  const payload: Record<string, unknown> = {
    email_address: email,
    status: "subscribed", // swap to "pending" for double opt-in
  };
  if (source) {
    payload.merge_fields = { SOURCE: source };
    payload.tags = [source];
  }

  try {
    const mc = await fetch(
      `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (mc.ok) {
      return Response.json({ ok: true });
    }

    const errPayload: { title?: string; detail?: string } = await mc
      .json()
      .catch(() => ({}));

    // Already-subscribed reads as success from the user's POV.
    if (errPayload.title === "Member Exists") {
      return Response.json({ ok: true, alreadySubscribed: true });
    }

    return Response.json(
      { error: errPayload.detail || `signup failed (${mc.status})` },
      { status: mc.status },
    );
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || "signup failed" },
      { status: 500 },
    );
  }
}
