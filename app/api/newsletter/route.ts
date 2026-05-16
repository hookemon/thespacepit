// Newsletter signup → Sanity (system of record) + Mailchimp (opportunistic).
//
// Architecture:
//   1. Every valid email is written to Sanity FIRST (a `subscriber` doc,
//      ID = sha1(lowercased email) for automatic dedupe). The signup is
//      considered successful the moment that write lands. Sanity is our
//      source of truth — ESPs come and go, the list stays.
//   2. THEN we opportunistically push to Mailchimp. If env vars are unset
//      or the call fails, we record the error on the Sanity doc but still
//      return success to the visitor. The visitor's email is captured
//      regardless of ESP state.
//   3. Export to CSV anytime from /studio and import to whichever ESP you
//      pick.
//
// Env vars:
//   SANITY_API_WRITE_TOKEN     (required — already in .env for content writes)
//   NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET
//   MAILCHIMP_API_KEY  (optional — when set, pushes to Mailchimp)
//   MAILCHIMP_LIST_ID  (optional — same)
//
// GET /api/newsletter returns wiring health for both backends.

import type { NextRequest } from "next/server";
import { createClient } from "@sanity/client";
import { createHash } from "crypto";

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// Mailchimp keys end in their datacenter, e.g. "abc...-us10".
function getDatacenter(apiKey: string): string | null {
  const i = apiKey.lastIndexOf("-");
  return i > -1 ? apiKey.slice(i + 1) : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Stable Sanity doc ID per email. SHA-1 of lowercased email; keeps the
 *  email out of the URL (PII hygiene) and gives us createOrReplace-style
 *  idempotency. */
function emailDocId(email: string): string {
  const hash = createHash("sha1").update(email).digest("hex");
  return `subscriber-${hash.slice(0, 24)}`;
}

// Health check — surfaces both backend statuses without leaking secrets.
export async function GET() {
  const hasMcKey = !!MAILCHIMP_API_KEY;
  const hasMcList = !!MAILCHIMP_LIST_ID;
  const dc = MAILCHIMP_API_KEY ? getDatacenter(MAILCHIMP_API_KEY) : null;
  const hasSanityToken = !!process.env.SANITY_API_WRITE_TOKEN;
  return Response.json({
    ok: hasSanityToken,  // Sanity is the must-have; Mailchimp is bonus
    config: {
      sanity: hasSanityToken ? "set" : "missing",
      mailchimp: {
        apiKey: hasMcKey ? "set" : "missing",
        listId: hasMcList ? "set" : "missing",
        datacenter: dc ?? "unknown",
      },
    },
  });
}

interface MailchimpPushResult {
  ok: boolean;
  error?: string;
}

/** Push to Mailchimp. Returns ok-or-error; never throws to the caller so
 *  the Sanity write stays the source of truth. */
async function pushToMailchimp(email: string, source?: string): Promise<MailchimpPushResult> {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID) {
    return { ok: false, error: "esp-not-configured" };
  }
  const dc = getDatacenter(MAILCHIMP_API_KEY);
  if (!dc) return { ok: false, error: "esp-bad-key-format" };

  const auth = Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString("base64");
  const payload: Record<string, unknown> = {
    email_address: email,
    status: "subscribed",  // swap to "pending" for double opt-in
  };
  if (source) {
    payload.merge_fields = { SOURCE: source };
    payload.tags = [source];
  }
  try {
    const mc = await fetch(
      `https://${dc}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    if (mc.ok) return { ok: true };
    const body = (await mc.json().catch(() => ({}))) as { title?: string; detail?: string };
    // Already-subscribed is a soft success — they're on the list, we're good.
    if (body.title === "Member Exists") return { ok: true };
    return { ok: false, error: body.detail || `${mc.status} ${mc.statusText}` };
  } catch (err) {
    return { ok: false, error: (err as Error).message || "esp-push-failed" };
  }
}

export async function POST(request: NextRequest) {
  let body: { email?: unknown; audienceId?: unknown; source?: unknown; website?: unknown; pathname?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid request body" }, { status: 400 });
  }

  // Honeypot — non-empty `website` field means bot. Fake 200 so it moves on.
  if (typeof body.website === "string" && body.website.trim()) {
    return Response.json({ ok: true, honeypot: true });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ error: "valid email required" }, { status: 400 });
  }

  // Source: explicit prop > pathname fallback > "unknown"
  const explicitSource = typeof body.source === "string" ? body.source : undefined;
  const pathname = typeof body.pathname === "string" ? body.pathname : undefined;
  const source =
    explicitSource ??
    (pathname ? pathname.replace(/^\//, "").replace(/\/$/, "") || "home" : "unknown");

  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return Response.json(
      { error: "newsletter wiring up — DM us for now and we'll add you" },
      { status: 503 },
    );
  }

  const docId = emailDocId(email);
  const now = new Date().toISOString();

  // 1. Sanity write — system of record. createIfNotExists makes initial,
  //    then patch updates lastSeenAt on every re-submit. Idempotent.
  try {
    await sanity.createIfNotExists({
      _id: docId,
      _type: "subscriber",
      email,
      source,
      pathname: pathname ?? null,
      subscribedAt: now,
      lastSeenAt: now,
      sentToMailchimp: false,
      unsubscribed: false,
    });
    // Always bump lastSeenAt + (if they re-submit from a new page) update source
    await sanity
      .patch(docId)
      .set({ lastSeenAt: now, ...(source && source !== "unknown" ? { source } : {}) })
      .commit();
  } catch (err) {
    console.error("newsletter sanity write failed:", err);
    return Response.json(
      { error: "couldn't save your email right now — try again in a sec" },
      { status: 500 },
    );
  }

  // 2. Mailchimp push — best effort, doesn't block success
  const mc = await pushToMailchimp(email, source);
  if (mc.ok) {
    await sanity.patch(docId).set({ sentToMailchimp: true, mailchimpError: undefined }).commit().catch(() => {});
  } else if (mc.error && mc.error !== "esp-not-configured") {
    // Only record actual failures, not the "no ESP wired" state
    await sanity.patch(docId).set({ mailchimpError: mc.error }).commit().catch(() => {});
  }

  return Response.json({
    ok: true,
    sanity: true,
    mailchimp: mc.ok,
  });
}
