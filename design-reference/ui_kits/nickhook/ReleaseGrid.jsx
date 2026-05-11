const releaseGridStyles = {
  section: { padding: '64px 32px', background: '#0B0B0B', color: '#F4EFE6' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, borderBottom: '2px solid #F4EFE6', paddingBottom: 12 },
  h2: { fontFamily: "'Antonio', sans-serif", fontWeight: 700, fontSize: 'clamp(40px, 6vw, 72px)', margin: 0, letterSpacing: '-0.015em', textTransform: 'uppercase', lineHeight: .92 },
  eyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: '#E83A1C' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  card: { background: '#0B0B0B', border: '1px solid #F4EFE6', padding: 14, cursor: 'pointer', transition: 'transform 160ms cubic-bezier(0.2,0,0,1), box-shadow 160ms' },
  cover: { aspectRatio: '1', border: '1px solid #F4EFE6', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  title: { fontFamily: "'Antonio', sans-serif", fontWeight: 700, fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1 },
  artist: { fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#C8C2B4', marginTop: 4 },
  meta: { display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  chip: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', border: '1px solid #F4EFE6', borderRadius: 999, padding: '2px 8px', color: '#F4EFE6' },
};

const NH_RELEASES = [
  { t: 'RELATIONSHIPS', a: 'nick hook', cat: 'C+C–024', yr: '2015', tag: 'LP', bg: '#E83A1C' },
  { t: '50 BACKWOODS', a: 'DJ Earl & Nick Hook', cat: 'C+C–031', yr: '2018', tag: 'LP', bg: '#0E4B3A' },
  { t: 'RTJ CU4TRO', a: 'Run The Jewels', cat: 'BMG', yr: '2023', tag: 'co-exec', bg: '#F4EFE6', fg: '#0B0B0B' },
  { t: 'OLD ENGLISH', a: 'Young Thug / Gibbs / Ferg', cat: 'GOLD', yr: '2014', tag: '💿 gold', bg: '#F2B705', fg: '#0B0B0B' },
  { t: 'JUNGLE JUICE v.1', a: 'Taso + Nick Hook', cat: 'C+C–040', yr: '2020', tag: 'EP', bg: '#9B1B1B' },
  { t: 'LA BURBUJA', a: 'Nick Hook + Quazzy', cat: 'C+C–052', yr: '2022', tag: 'single', bg: '#2F6FB3' },
  { t: 'DRUMS', a: 'Spiritual Friendship', cat: 'C+C–019', yr: '2018', tag: 'drone', bg: '#4B2E83' },
  { t: 'HEAD', a: 'Nick Hook ft. 21 Savage', cat: 'C+C–014', yr: '2015', tag: 'single', bg: '#1C1A17' },
];

function NHReleaseGrid() {
  const [hover, setHover] = React.useState(-1);
  return (
    <section style={releaseGridStyles.section}>
      <div style={releaseGridStyles.head}>
        <div>
          <div style={releaseGridStyles.eyebrow}>THE CATALOGUE</div>
          <h2 style={releaseGridStyles.h2}>releases</h2>
        </div>
        <div style={{...releaseGridStyles.eyebrow, color: '#C8C2B4'}}>08 OF ~40 · SEE ALL →</div>
      </div>
      <div style={releaseGridStyles.grid}>
        {NH_RELEASES.map((r, i) => (
          <div key={i} style={{...releaseGridStyles.card,
            transform: hover === i ? 'translate(-3px,-3px)' : 'translate(0,0)',
            boxShadow: hover === i ? '4px 4px 0 #E83A1C' : 'none'}}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(-1)}>
            <div style={{...releaseGridStyles.cover, background: r.bg, color: r.fg || '#F4EFE6'}}>
              <span style={{fontFamily: "'Antonio', sans-serif", fontWeight: 700, fontSize: 24, textTransform: 'uppercase', transform: 'rotate(-4deg)', letterSpacing: '-0.02em', textAlign: 'center', padding: 12}}>{r.t}</span>
            </div>
            <div style={releaseGridStyles.title}>{r.t}</div>
            <div style={releaseGridStyles.artist}>{r.a}</div>
            <div style={releaseGridStyles.meta}>
              <span style={releaseGridStyles.chip}>{r.cat}</span>
              <span style={releaseGridStyles.chip}>{r.yr}</span>
              <span style={releaseGridStyles.chip}>{r.tag}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
window.NHReleaseGrid = NHReleaseGrid;
