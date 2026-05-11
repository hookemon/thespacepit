import { getPressQuotes } from "../../_lib/sanity-queries";

const FALLBACK = [
  { _id: "f1", quote: "nick hook is a ginger king.", source: "El-P · Pitchfork", url: undefined },
  { _id: "f2", quote: "it's a mentality that's made him one of new york's most in-demand producers.", source: "Fact Magazine", url: undefined },
  { _id: "f3", quote: "a renowned producer straddling the worlds of hip-hop and alternative music.", source: "Sound on Sound", url: undefined },
  { _id: "f4", quote: "hook's collaborative spirit tends to bring out the best in him.", source: "Pitchfork", url: undefined },
];

export async function NHPressWall() {
  const fromSanity = await getPressQuotes(8);
  const list = fromSanity.length > 0 ? fromSanity : FALLBACK;
  const isEmpty = fromSanity.length === 0;

  return (
    <section id="press" className="px-5 sm:px-8 py-16 bg-ink text-paper">
      <div className="font-mono text-[11px] tracking-[.14em] uppercase mb-2 flex items-baseline gap-3 flex-wrap">
        <span>THEY SAID</span>
        {isEmpty && <span className="text-mute text-[10px]">· placeholder · edit in /studio</span>}
      </div>
      <h2
        className="font-display font-bold uppercase m-0 mb-10"
        style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
      >
        the press
      </h2>
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {list.map((q) => {
          const inner = (
            <div className="border border-paper p-5 flex flex-col gap-3.5 h-full">
              <div className="font-serif text-[60px] text-redline" style={{ lineHeight: 0.6 }}>&ldquo;</div>
              <div className="font-serif italic text-[22px] leading-snug">{q.quote}</div>
              <div className="font-mono text-[10px] tracking-[.12em] uppercase text-on-dark mt-auto">— {q.source}</div>
            </div>
          );
          return q.url ? (
            <a
              key={q._id}
              href={q.url}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline text-paper transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_#E83A1C] block"
            >
              {inner}
            </a>
          ) : (
            <div key={q._id}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}
