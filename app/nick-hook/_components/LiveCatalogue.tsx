import { getUpcomingLiveDates } from "../../_lib/sanity-queries";

function formatDate(iso: string): string {
  // YYYY-MM-DD → MM.DD.YY
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[2]}.${m[3]}.${m[1].slice(2)}`;
}

/**
 * Live Catalogue section. Renders ONLY real upcoming dates from Sanity
 * (`liveDate` doc type). When nothing is on the books, shows an honest
 * "no dates currently · DM for booking" empty state.
 *
 * Previously this component shipped with hardcoded FALLBACK dates
 * (Medellín Music Week, Movement Festival, Sónar, etc.) intended as
 * design-mode placeholders. They read as real to anyone visiting the
 * page — Nick's manager called it out — so the fallback was deleted.
 * Better to show "no upcoming dates" than to invent shows.
 */
export async function NHLiveCatalogue() {
  const list = await getUpcomingLiveDates(20);
  const isEmpty = list.length === 0;

  return (
    <section id="live" className="px-5 sm:px-8 py-16 bg-redline text-paper">
      <div className="font-mono text-[11px] tracking-[.14em] uppercase mb-3 flex items-baseline gap-3 flex-wrap">
        <span>🔊 A/V SHOW · 2026</span>
      </div>
      <h2
        className="font-display font-bold uppercase m-0"
        style={{ fontSize: "clamp(48px, 9vw, 120px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
      >
        live catalogue
      </h2>
      <p className="font-serif italic text-[22px] leading-snug max-w-[680px] mt-5">
        a dynamic audiovisual experience based on the extensive, genre-defying catalog. from underground classics to unreleased gems — gangsta boo, d double e, RTJ, lido pimienta, 21 savage, akapellah and many more.
      </p>

      {isEmpty ? (
        <div className="mt-10 border-t border-b border-paper py-10 text-center">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase mb-3">
            no dates on the books right now
          </div>
          <p className="font-serif italic text-[18px] text-paper-2 max-w-[520px] mx-auto leading-snug mb-6">
            booking by referral. drop coleman a line and we&apos;ll talk.
          </p>
          <a
            href="mailto:coleman@smooth-loop.com"
            className="inline-block font-display font-semibold text-[14px] tracking-[.04em] uppercase px-5 py-2.5 border border-paper bg-ink text-paper hover:bg-paper hover:text-ink transition-colors no-underline"
          >
            coleman@smooth-loop.com →
          </a>
        </div>
      ) : (
        <div className="mt-10 grid gap-0">
          {list.map((r, i) => {
            const ticketBtn = r.ticketUrl ? (
              <a
                href={r.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display font-semibold text-[12px] tracking-[.08em] uppercase px-3.5 py-2 border border-paper bg-ink text-paper rounded-none hover:bg-paper hover:text-ink transition-colors no-underline text-center"
              >
                {r.ticketLabel ?? "tix"} →
              </a>
            ) : (
              <span className="font-display font-semibold text-[12px] tracking-[.08em] uppercase px-3.5 py-2 border border-paper bg-ink text-paper rounded-none text-center opacity-70">
                {r.ticketLabel ?? "soon"}
              </span>
            );
            return (
              <div
                key={r._id}
                className={`grid gap-4 py-4 border-t border-paper font-mono text-[13px] tracking-[.02em] items-center ${i === list.length - 1 ? "border-b border-paper" : ""}`}
                style={{ gridTemplateColumns: "100px 1fr 1fr 120px" }}
              >
                <span className="tabular-nums">{formatDate(r.date)}</span>
                <span className="font-display text-[22px] uppercase font-semibold tracking-[-0.01em]">{r.city}</span>
                <span className="uppercase tracking-[.08em] text-[11px]">{r.venue ?? ""}</span>
                {ticketBtn}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
