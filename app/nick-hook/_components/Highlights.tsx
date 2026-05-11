// Source: Nick Hook EPK — "HIGHLIGHTS" page.
// Pure data right now (matches the EPK exactly). When we want this editable
// without a code change, we'll move it into a Sanity singleton.

const PERFORMANCES = [
  "Movement Festival",
  "Sónar",
  "Moogfest",
  "Medellín Music Week",
  "MoMA PS1",
  "Boiler Room",
  "Fool's Gold Day Off",
  "Hopscotch Festival",
  "Pitchfork Festival",
];

const TOURS = [
  "Run The Jewels US 2017",
  "India / Asia 2020",
  "Machinedrum · Vapor City",
];

const EXPERIENCES = [
  "Mentor · Teenage Engineering",
  "Red Bull Music Academy 2011",
  "Bauer · Searching for Sound",
  "Converse + Moog Week",
  "Vice + Hennessy Rap Monument",
];

export function NHHighlights() {
  return (
    <section id="highlights" className="px-8 py-16 bg-ink text-paper border-y border-paper/20">
      <div className="font-mono text-[11px] tracking-[.12em] uppercase text-redline mb-2">CAREER · HIGHLIGHTS</div>
      <h2
        className="font-display font-bold uppercase m-0 mb-10"
        style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
      >
        highlights
      </h2>
      <div className="grid gap-10 md:grid-cols-3">
        <Column label="performances" items={PERFORMANCES} />
        <Column label="tours" items={TOURS} />
        <Column label="experiences" items={EXPERIENCES} />
      </div>
    </section>
  );
}

function Column({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[.16em] uppercase text-redline border-b border-paper pb-2 mb-3">
        {label}
      </div>
      <ul className="grid gap-1.5 font-display font-semibold text-[20px] leading-tight uppercase tracking-[-0.005em]">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
