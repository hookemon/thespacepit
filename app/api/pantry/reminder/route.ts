// la despensa reminder — Mon + Fri 9pm Medellín-time email nudge to lrel
// to do the stock check.
//
// Cron schedule (declared in vercel.json): "0 2 * * 2,6"
//   = Tuesday + Saturday at 02:00 UTC
//   = Monday + Friday at 21:00 in America/Bogota (UTC-5, no DST)
//
// Vercel invokes this route on schedule with an Authorization: Bearer
// ${CRON_SECRET} header. We verify that header so the endpoint isn't
// publicly triggerable. If CRON_SECRET is unset (e.g. local dev), we
// log a warning and accept — that way `curl localhost:3000/api/pantry/reminder`
// still works while testing.
//
// Setup steps (one-time, Vercel project settings → Environment Variables):
//   RESEND_API_KEY  = re_xxx                    (required to send)
//   CRON_SECRET     = <long random string>      (Vercel auto-fills for crons;
//                                                 set to match for manual tests)
//   PANTRY_TO       = lrel.code@gmail.com       (optional, this is default)
//   PANTRY_FROM     = la despensa <onboarding@resend.dev>   (optional)
//   PANTRY_URL      = https://thespacepit.com/pantry        (optional)
//
// Manual test (after deploy):
//   curl -H "Authorization: Bearer $CRON_SECRET" https://thespacepit.com/api/pantry/reminder

import type { NextRequest } from "next/server";

// Force dynamic — never cache; the cron pings this for the side effect.
export const dynamic = "force-dynamic";

function unauthorized() {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

async function sendReminder() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "RESEND_API_KEY not set" },
      { status: 500 },
    );
  }

  const to = process.env.PANTRY_TO ?? "lrel.code@gmail.com";
  const from = process.env.PANTRY_FROM ?? "la despensa <onboarding@resend.dev>";
  const link = process.env.PANTRY_URL ?? "https://thespacepit.com/pantry";

  const html = `<!doctype html><html><body style="margin:0;background:#F4EFE6;color:#0B0B0B;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:48px 24px;">
    <tr><td>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;margin:0 auto;">
        <tr><td style="font-family:Courier,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#3A362E;padding-bottom:8px;">la despensa · thespacepit</td></tr>
        <tr><td style="font-weight:700;text-transform:uppercase;font-size:48px;line-height:0.95;letter-spacing:-.015em;color:#0B0B0B;padding-bottom:16px;">time to do<br/>the stock check</td></tr>
        <tr><td style="font-family:Georgia,serif;font-style:italic;font-size:18px;line-height:1.5;color:#3A362E;padding-bottom:32px;">~2 min. tap through what&rsquo;s running low and the mercado list comes out ready to send.</td></tr>
        <tr><td><a href="${link}" style="display:inline-block;background:#0B0B0B;color:#F4EFE6;text-decoration:none;padding:14px 22px;font-family:Courier,monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;box-shadow:3px 3px 0 #F2B705;">open la despensa →</a></td></tr>
        <tr><td style="padding-top:48px;border-top:1px solid #D9D1BE;font-family:Courier,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8C8677;">mon + fri · 9pm reminder</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `la despensa — time to do the stock check.\n\n~2 min. tap through what's running low and the mercado list comes out ready to send.\n\n${link}\n\nmon + fri 9pm reminder`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "la despensa — stock check tonight 🌒",
      html,
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("resend send failed", res.status, err);
    return Response.json(
      { error: `resend ${res.status}`, detail: err },
      { status: 502 },
    );
  }

  const body = (await res.json().catch(() => ({}))) as { id?: string };
  return Response.json({ ok: true, id: body.id ?? null, to });
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  const expected = secret ? `Bearer ${secret}` : null;

  if (expected) {
    if (header !== expected) return unauthorized();
  } else {
    // No secret set — local dev / first deploy. Warn but allow.
    console.warn("[pantry-reminder] CRON_SECRET not set; allowing unauthenticated request");
  }

  return sendReminder();
}
