const arStyles = {
  section: { padding: '64px 32px', background: '#0E4B3A', color: '#F4EFE6' },
  eye: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#C9B9E8', marginBottom: 8 },
  h2: { fontFamily: "'Antonio', sans-serif", fontWeight: 700, fontSize: 'clamp(44px, 6vw, 72px)', lineHeight: .92, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.015em', marginBottom: 36 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 },
  card: { border: '1px solid #F4EFE6', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 },
  name: { fontFamily: "'Antonio', sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1 },
  city: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: '#C9B9E8' },
  note: { fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 16, lineHeight: 1.35, marginTop: 8, color: '#E8E2D4' },
};

const ROSTER = [
  { n: 'Nick Hook', c: 'new york · ny', note: 'the waviest resident. producer/dj/founder.' },
  { n: 'Spiritual Friendship', c: 'new york · new york', note: 'nick + gareth jones. drones, beats, nothing judged.' },
  { n: 'Electrogenetic', c: 'london · uk', note: "gareth's solo noise-maker project." },
  { n: 'Quazzy', c: 'brooklyn · ny', note: 'guided meditation + la burbuja.' },
  { n: 'Super Hero Killer', c: 'st louis · mo', note: 'old friends, forever on the label.' },
  { n: 'Sinister Dane', c: 'st louis · mo', note: 'hometown heat.' },
];

function CCArtistRoster() {
  return (
    <section style={arStyles.section}>
      <div style={arStyles.eye}>THE FAM</div>
      <h2 style={arStyles.h2}>artists</h2>
      <div style={arStyles.grid}>
        {ROSTER.map((a, i) => (
          <div key={i} style={arStyles.card}>
            <div style={arStyles.name}>{a.n}</div>
            <div style={arStyles.city}>{a.c}</div>
            <div style={arStyles.note}>{a.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
window.CCArtistRoster = CCArtistRoster;
