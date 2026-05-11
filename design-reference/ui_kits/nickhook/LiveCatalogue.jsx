const liveStyles = {
  section: { padding: '64px 32px', background: '#E83A1C', color: '#F4EFE6' },
  eyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 12 },
  h2: { fontFamily: "'Antonio', sans-serif", fontWeight: 700, fontSize: 'clamp(48px, 9vw, 120px)', margin: 0, letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: .9 },
  lede: { fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 22, lineHeight: 1.35, maxWidth: 680, marginTop: 20 },
  list: { marginTop: 40, display: 'grid', gap: 0 },
  row: { display: 'grid', gridTemplateColumns: '100px 1fr 1fr 120px', gap: 16, padding: '16px 0', borderTop: '1px solid #F4EFE6', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, alignItems: 'center', letterSpacing: '.02em' },
  rowLast: { borderBottom: '1px solid #F4EFE6' },
  date: { fontVariantNumeric: 'tabular-nums' },
  city: { fontFamily: "'Antonio', sans-serif", fontSize: 22, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '-0.01em' },
  venue: { textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 11 },
  btn: { fontFamily: "'Antonio', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', padding: '8px 14px', border: '1px solid #F4EFE6', background: '#0B0B0B', color: '#F4EFE6', cursor: 'pointer', borderRadius: 0 },
};

const DATES = [
  { d: '05.02.26', city: 'MEDELLÍN', v: 'MEDELLÍN MUSIC WEEK', status: 'tix' },
  { d: '05.24.26', city: 'DETROIT',  v: 'MOVEMENT FESTIVAL',   status: 'tix' },
  { d: '06.14.26', city: 'BARCELONA', v: 'SÓNAR',               status: 'tix' },
  { d: '07.08.26', city: 'BROOKLYN', v: 'THE SPACE PIT · LIVE', status: 'RSVP' },
  { d: '09.12.26', city: 'MEXICO CITY', v: 'CDMX · TBA',         status: 'soon' },
];

function NHLiveCatalogue() {
  return (
    <section style={liveStyles.section}>
      <div style={liveStyles.eyebrow}>🔊 A/V SHOW · 2026</div>
      <h2 style={liveStyles.h2}>live catalogue</h2>
      <p style={liveStyles.lede}>
        a dynamic audiovisual experience based on the extensive, genre-defying catalog. from
        underground classics to unreleased gems — gangsta boo, d double e, RTJ, lido pimienta,
        21 savage, akapellah and many more.
      </p>
      <div style={liveStyles.list}>
        {DATES.map((r, i) => (
          <div key={i} style={{...liveStyles.row, ...(i === DATES.length - 1 ? liveStyles.rowLast : {})}}>
            <span style={liveStyles.date}>{r.d}</span>
            <span style={liveStyles.city}>{r.city}</span>
            <span style={liveStyles.venue}>{r.v}</span>
            <button style={liveStyles.btn}>{r.status} →</button>
          </div>
        ))}
      </div>
    </section>
  );
}
window.NHLiveCatalogue = NHLiveCatalogue;
