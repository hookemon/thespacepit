import { getUpcomingLiveDates, type LiveDateItem } from "../../_lib/sanity-queries";

type FallbackDate = { _id: string; date: string; city: string; venue: string; ticketLabel: string; ticketUrl?: string };

const FALLBACK: FallbackDate[] = [
  { _id: "f1", date: "2026-05-02", city: "MEDELLÍN", venue: "MEDELLÍN MUSIC WEEK", ticketLabel: "tix" },
  { _id: "f2", date: "2026-05-24", city: "DETROIT", venue: "MOVEMENT FESTIVAL", ticketLabel: "tix" },
  { _id: "f3", date: "2026-06-14", city: "BARCELONA", venue: "SÓNAR", ticketLabel: "tix" },
  { _id: "f4", date: "2026-07-08", city: "BROOKLYN", venue: "THE SPACE PIT · LIVE", ticketLabel: "RSVP" },
  { _id: "f5", date: "2026-09-12", city: "MEXICO CITY", venue: "CDMX · TBA", ticketLabel: "soon" },
];

function formatDate(iso: string): string {
  // YYYY-MM-DD → MM.DD.YY
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[2]}.${m[3]}.${m[1].slice(2)}`;
}

export async function NHLiveCatalogue() {
  const fromSanity = await getUpcomingLiveDates(20);
  const list: (LiveDateItem | FallbackDate)[] = fromSanity.length > 0 ? fromSanity : FALLBACK;
  const isEmpty = fromSanity.length === 0;

  return (
    <section id="live" className="px-5 sm:px-8 py-16 bg-redline text-paper">
      <div className="font-mono text-[11px] tracking-[.14em] uppercase mb-3 flex items-baseline gap-3 flex-wrap">
        <span>🔊 A/V SHOW · 2026</span>
        {isEmpty && <span className="text-paper-2 text-[10px]">· placeholder · edit in /studio</span>}
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
    </section>
  );
}
