const catStyles = {
  section: { padding: '64px 32px', background: '#F4EFE6', color: '#0B0B0B' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, borderBottom: '2px solid #0B0B0B', paddingBottom: 10 },
  eye: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#0E4B3A' },
  h2: { fontFamily: "'Antonio', sans-serif", fontWeight: 700, fontSize: 'clamp(44px, 6vw, 72px)', lineHeight: .92, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.015em' },
  row: { display: 'grid', gridTemplateColumns: '100px 1.5fr 1.5fr 90px 60px 100px', gap: 12, padding: '18px 0', borderBottom: '1px solid #0B0B0B', alignItems: 'center' },
  rowHead: { display: 'grid', gridTemplateColumns: '100px 1.5fr 1.5fr 90px 60px 100px', gap: 12, padding: '10px 0', borderBottom: '1px solid #0B0B0B', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#3A362E' },
  cat: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '.08em', color: '#3A362E' },
  title: { fontFamily: "'Antonio', sans-serif", fontWeight: 600, fontSize: 22, letterSpacing: '-0.005em', textTransform: 'uppercase', lineHeight: 1 },
  artist: { fontFamily: "'Inter', sans-serif", fontSize: 14 },
  format: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase' },
  year: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontVariantNumeric: 'tabular-nums' },
  play: { fontFamily: "'Antonio', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', padding: '6px 12px', border: '1px solid #0B0B0B', background: '#F4EFE6', cursor: 'pointer', borderRadius: 0 },
};

const CAT = [
  { cat: 'C+C–052', t: 'LA BURBUJA', a: 'Nick Hook · Quazzy', fmt: '7"', y: 2022 },
  { cat: 'C+C–048', t: 'GERALDINA', a: 'Geraldina', fmt: 'LP', y: 2021 },
  { cat: 'C+C–044', t: 'CAMO UFOS', a: 'Camo UFOs', fmt: 'EP', y: 2021 },
  { cat: 'C+C–040', t: 'JUNGLE JUICE V.1', a: 'Taso · Nick Hook', fmt: 'EP', y: 2020 },
  { cat: 'C+C–031', t: '50 BACKWOODS', a: 'DJ Earl · Nick Hook', fmt: 'LP', y: 2018 },
  { cat: 'C+C–024', t: 'RELATIONSHIPS', a: 'Nick Hook', fmt: 'LP', y: 2015 },
  { cat: 'C+C–019', t: 'DRUMS', a: 'Spiritual Friendship', fmt: 'LP', y: 2018 },
  { cat: 'C+C–001', t: 'SPIRITUAL FRIENDSHIP', a: 'Spiritual Friendship', fmt: 'LP', y: 2016 },
];

function CCCatalogGrid() {
  return (
    <section style={catStyles.section}>
      <div style={catStyles.head}>
        <div>
          <div style={catStyles.eye}>THE CATALOGUE</div>
          <h2 style={catStyles.h2}>releases</h2>
        </div>
      </div>
      <div style={catStyles.rowHead}>
        <span>CAT #</span><span>TITLE</span><span>ARTIST</span><span>FORMAT</span><span>YEAR</span><span></span>
      </div>
      {CAT.map((r, i) => (
        <div key={i} style={catStyles.row}>
          <span style={catStyles.cat}>{r.cat}</span>
          <span style={catStyles.title}>{r.t}</span>
          <span style={catStyles.artist}>{r.a}</span>
          <span style={catStyles.format}>{r.fmt}</span>
          <span style={catStyles.year}>{r.y}</span>
          <button style={catStyles.play}>▶ listen</button>
        </div>
      ))}
    </section>
  );
}
window.CCCatalogGrid = CCCatalogGrid;
