// la despensa reminder — Mon + Fri 9pm Medellín-time email nudge to do the
// stock check.
//
// Cron schedule: "0 2 * * 2,6" = Tuesday + Saturday at 02:00 UTC =
// Monday + Friday at 21:00 in America/Bogota (UTC-5, no DST).
//
// Setup steps (one-time):
//   1. Sign up at resend.com and create an API key.
//   2. In Netlify → Site settings → Environment variables, add:
//        RESEND_API_KEY  = re_xxx
//        PANTRY_TO       = lrel.code@gmail.com   (optional, this is the default)
//        PANTRY_FROM     = la despensa <onboarding@resend.dev>   (optional)
//        PANTRY_URL      = https://thespacepit.com/pantry        (optional)
//   3. To send from a custom address you'll need to verify a domain in Resend
//      (e.g. thespacepit.com → DNS records), then set PANTRY_FROM accordingly.
//      Without verification, only onboarding@resend.dev → your Resend-account
//      email works.
//   4. Deploy: `npx netlify deploy --prod --build`
//
// Manual test (after deploy): hit /.netlify/functions/pantry-reminder

export default async () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return new Response("RESEND_API_KEY not set", { status: 500 });
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
    return new Response(`resend error: ${res.status} ${err}`, { status: 502 });
  }

  return new Response("ok");
};

export const config = {
  schedule: "0 2 * * 2,6",
};
