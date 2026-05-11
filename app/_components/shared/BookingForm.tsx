"use client";

import { useState, type FormEvent } from "react";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "date" | "textarea";
  required?: boolean;
  placeholder?: string;
};

type Props = {
  toEmail: string;
  subjectPrefix: string;
  submitLabel: string;
  fields: Field[];
  // Formspree endpoint (e.g. https://formspree.io/f/xxxxxxxx). When set,
  // submissions POST there. Otherwise we fall back to a smart mailto.
  formspreeEndpoint?: string | null;
};

export function BookingForm({ toEmail, subjectPrefix, submitLabel, fields, formspreeEndpoint }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    if (formspreeEndpoint) {
      setSubmitting(true);
      try {
        const res = await fetch(formspreeEndpoint, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`submission failed (${res.status})`);
        form.reset();
        setDone(true);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Smart mailto fallback — assemble a body from the fields and open the user's email client.
    const lines: string[] = [];
    for (const f of fields) {
      const v = data.get(f.name);
      if (v) lines.push(`${f.label}: ${v}`);
    }
    const subject = encodeURIComponent(`${subjectPrefix} — ${data.get("name") ?? "anonymous"}`);
    const body = encodeURIComponent(lines.join("\n"));
    window.location.href = `mailto:${toEmail}?subject=${subject}&body=${body}`;
    setDone(true);
  }

  if (done) {
    return (
      <div className="border border-paper p-6 font-mono text-[13px] tracking-[.05em] text-paper-2">
        ✓ {formspreeEndpoint ? "got it. coleman will reply soon." : "your email client should be open. send and we'll be in touch."}
        <button
          type="button"
          onClick={() => setDone(false)}
          className="ml-3 underline underline-offset-4 hover:opacity-70"
        >
          send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 max-w-[560px]">
      {fields.map((f) => {
        const common =
          "w-full bg-transparent border border-paper text-paper px-3 py-2.5 font-mono text-[13px] tracking-[.02em] placeholder:text-on-dark/60 focus:outline-none focus:border-redline focus:bg-ink-2";
        return (
          <label key={f.name} className="block">
            <span className="font-mono text-[10px] tracking-[.14em] uppercase text-redline mb-1.5 block">
              {f.label}{f.required && " *"}
            </span>
            {f.type === "textarea" ? (
              <textarea
                name={f.name}
                required={f.required}
                placeholder={f.placeholder}
                rows={4}
                className={common}
              />
            ) : (
              <input
                name={f.name}
                type={f.type ?? "text"}
                required={f.required}
                placeholder={f.placeholder}
                className={common}
              />
            )}
          </label>
        );
      })}
      {error && (
        <div className="font-mono text-[11px] uppercase tracking-[.1em] text-redline">{error}</div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="font-display font-semibold text-[18px] tracking-[.04em] uppercase px-6 py-3.5 border border-paper bg-redline text-paper rounded-none cursor-pointer hover:bg-paper hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-wait"
      >
        {submitting ? "sending…" : `${submitLabel} →`}
      </button>
    </form>
  );
}
