const vgStyles = {
  section: { padding: '64px 32px', background: '#F4EFE6', color: '#0B0B0B' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, borderBottom: '2px solid #0B0B0B', paddingBottom: 10 },
  eye: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#C48F00' },
  h2: { fontFamily: "'Antonio', sans-serif", fontWeight: 700, fontSize: 'clamp(44px, 6vw, 72px)', lineHeight: .92, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.015em' },
  filter: { display: 'flex', gap: 8 },
  chip: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', padding: '4px 10px', border: '1px solid #0B0B0B', borderRadius: 999, background: '#F4EFE6', cursor: 'pointer' },
  chipActive: { background: '#0B0B0B', color: '#F4EFE6' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 },
  card: { border: '1px solid #0B0B0B', background: '#F4EFE6', display: 'flex', flexDirection: 'column', cursor: 'pointer' },
  thumb: { aspectRatio: '16/9', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #0B0B0B' },
  play: { width: 56, height: 56, border: '1px solid #F4EFE6', borderRadius: '50%', background: 'rgba(11,11,11,0.6)', color: '#F4EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 },
  dur: { position: 'absolute', bottom: 8, right: 8, background: '#0B0B0B', color: '#F4EFE6', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: '2px 6px', letterSpacing: '.05em' },
  body: { padding: 14 },
  title: { fontFamily: "'Antonio', sans-serif", fontWeight: 600, fontSize: 20, letterSpacing: '-0.005em', lineHeight: 1.1, textTransform: 'uppercase' },
  meta: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#3A362E', marginTop: 8 },
};

const VIDS = [
  { t: 'OP-1 field · first feel', bg: '#F2B705', dur: '14:22', v: '48k', ago: '3d' },
  { t: 'the 808 that bruce signed', bg: '#E83A1C', dur: '22:10', v: '124k', ago: '2w' },
  { t: 'live in thespacepit w/ quazzy', bg: '#0E4B3A', dur: '47:55', v: '88k', ago: '1mo' },
  { t: 'prophet-08 into the emt 250', bg: '#4B2E83', dur: '19:03', v: '22k', ago: '1mo' },
  { t: 'calm + collect radio · the lot', bg: '#C9B9E8', fg: '#0B0B0B', dur: '2:00:04', v: '12k', ago: '2mo' },
  { t: 'medellín sessions · octatrack', bg: '#2F6FB3', dur: '31:47', v: '54k', ago: '3mo' },
];

function SPVideoGrid() {
  const [filter, setFilter] = React.useState('all');
  const filters = ['all', 'gear', 'live', 'radio'];
  return (
    <section style={vgStyles.section}>
      <div style={vgStyles.head}>
        <div>
          <div style={vgStyles.eye}>YOUTUBE · @THESPACEPIT</div>
          <h2 style={vgStyles.h2}>in the pit</h2>
        </div>
        <div style={vgStyles.filter}>
          {filters.map(f => (
            <button key={f} style={{...vgStyles.chip, ...(filter === f ? vgStyles.chipActive : {})}} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>
      <div style={vgStyles.grid}>
        {VIDS.map((v, i) => (
          <div key={i} style={vgStyles.card}>
            <div style={{...vgStyles.thumb, background: v.bg, color: v.fg || '#F4EFE6'}}>
              <div style={vgStyles.play}>▶</div>
              <div style={vgStyles.dur}>{v.dur}</div>
            </div>
            <div style={vgStyles.body}>
              <div style={vgStyles.title}>{v.t}</div>
              <div style={vgStyles.meta}>{v.v} views · {v.ago} ago</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
window.SPVideoGrid = SPVideoGrid;
