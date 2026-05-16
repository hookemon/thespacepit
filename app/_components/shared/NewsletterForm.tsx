"use client";

import { useState, type FormEvent } from "react";

type Props = {
  // Optional override for the Mailchimp audience this form subscribes to.
  // When omitted, the server route falls back to MAILCHIMP_LIST_ID env var.
  audienceId?: string;
  // Optional source tag, written to Mailchimp merge fields so we can see
  // where each signup came from (e.g. "packs", "sessions", "footer").
  source?: string;
  submitLabel?: string;
  placeholder?: string;
};

export function NewsletterForm({
  audienceId,
  source,
  submitLabel = "join the list",
  placeholder = "email@yourdomain.com",
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const email = (data.get("email") ?? "").toString();
    // Honeypot — a hidden field bots tend to fill. If non-empty, we still
    // surface a fake "success" UI without hitting the API.
    const website = (data.get("website") ?? "").toString();
    // Capture the page the user signed up from. Used as source fallback
    // when no explicit source prop was passed.
    const pathname = typeof window !== "undefined" ? window.location.pathname : undefined;

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, audienceId, source, website, pathname }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || `signup failed (${res.status})`);
      }
      form.reset();
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="border border-paper p-4 font-mono text-[12px] tracking-[.05em] text-paper-2 inline-flex items-center gap-3">
        <span aria-hidden>✓</span>
        <span>youre on the list. see u in the pit 🪐</span>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="underline underline-offset-4 hover:opacity-70 text-lamp"
        >
          add another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 max-w-[560px]">
      {/* Honeypot — visually hidden + flagged off-screen + aria-hidden. Bots
          tend to fill every <input> on a form, so a non-empty value here
          tells us this isn't a real human. Don't use display:none — many
          bots skip those. */}
      <div aria-hidden className="absolute opacity-0 pointer-events-none" style={{ left: "-9999px", height: 0, width: 0 }}>
        <label>
          your website (leave blank)
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>
      <label className="flex-1 block">
        <span className="sr-only">email</span>
        <input
          name="email"
          type="email"
          required
          placeholder={placeholder}
          className="w-full bg-transparent border border-paper text-paper px-3 py-3 font-mono text-[13px] tracking-[.02em] placeholder:text-paper-2/60 focus:outline-none focus:border-lamp focus:bg-ink-2"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="font-display font-semibold text-[14px] tracking-[.08em] uppercase px-6 py-3 border border-lamp bg-lamp text-ink rounded-none cursor-pointer hover:bg-paper hover:border-paper transition-colors disabled:opacity-50 disabled:cursor-wait whitespace-nowrap"
      >
        {submitting ? "sending…" : `${submitLabel} →`}
      </button>
      {error && (
        <div className="font-mono text-[11px] uppercase tracking-[.1em] text-redline sm:basis-full">
          {error}
        </div>
      )}
    </form>
  );
}
