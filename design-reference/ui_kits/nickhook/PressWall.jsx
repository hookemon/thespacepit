const pressStyles = {
  section: { padding: '64px 32px', background: '#0B0B0B', color: '#F4EFE6' },
  head: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8 },
  h2: { fontFamily: "'Antonio', sans-serif", fontWeight: 700, fontSize: 'clamp(40px, 6vw, 72px)', margin: 0, marginBottom: 40, letterSpacing: '-0.015em', textTransform: 'uppercase', lineHeight: .92 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 },
  quote: { border: '1px solid #F4EFE6', padding: 22, display: 'flex', flexDirection: 'column', gap: 14 },
  mark: { fontFamily: "'Instrument Serif', serif", fontSize: 60, lineHeight: .6, color: '#E83A1C' },
  text: { fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 22, lineHeight: 1.3 },
  src: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: '#C8C2B4', marginTop: 'auto' },
};

const QUOTES = [
  { q: 'nick hook is a ginger king.', s: 'El-P · Pitchfork' },
  { q: "it's a mentality that's made him one of new york's most in-demand producers.", s: 'Fact Magazine' },
  { q: 'a renowned producer straddling the worlds of hip-hop and alternative music.', s: 'Sound on Sound' },
  { q: "hook's collaborative spirit tends to bring out the best in him.", s: 'Pitchfork' },
];

function NHPressWall() {
  return (
    <section style={pressStyles.section}>
      <div style={pressStyles.head}>THEY SAID</div>
      <h2 style={pressStyles.h2}>the press</h2>
      <div style={pressStyles.grid}>
        {QUOTES.map((q, i) => (
          <div key={i} style={pressStyles.quote}>
            <div style={pressStyles.mark}>"</div>
            <div style={pressStyles.text}>{q.q}</div>
            <div style={pressStyles.src}>— {q.s}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
window.NHPressWall = NHPressWall;
