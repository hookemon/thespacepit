const dsStyles = {
  section: { padding: '80px 32px', background: '#F2B705', color: '#0B0B0B', borderTop: '1px solid #0B0B0B', borderBottom: '1px solid #0B0B0B' },
  row: { display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 48, alignItems: 'center' },
  eye: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 10 },
  h2: { fontFamily: "'Antonio', sans-serif", fontWeight: 700, fontSize: 'clamp(48px, 8vw, 120px)', lineHeight: .88, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' },
  lede: { fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 22, lineHeight: 1.35, maxWidth: 540, marginTop: 20 },
  cta: { fontFamily: "'Antonio', sans-serif", fontWeight: 600, fontSize: 18, letterSpacing: '.04em', textTransform: 'uppercase', padding: '16px 26px', border: '1px solid #0B0B0B', background: '#0B0B0B', color: '#F4EFE6', cursor: 'pointer', borderRadius: 0, marginTop: 28 },
  panel: { background: '#0B0B0B', color: '#F4EFE6', border: '1px solid #0B0B0B', padding: 18, boxShadow: '6px 6px 0 #0B0B0B', fontFamily: "'JetBrains Mono', monospace" },
  chanRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #3A362E', fontSize: 13, letterSpacing: '.02em' },
  chanLast: { borderBottom: 0 },
  chanName: { color: '#F2B705' },
  count: { color: '#C8C2B4', fontVariantNumeric: 'tabular-nums' },
  head: { fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#C8C2B4', marginBottom: 8, display: 'flex', justifyContent: 'space-between' },
  greenDot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#3E8E5A', marginRight: 6 },
};

const CHANS = [
  { n: '# general', c: 814 },
  { n: '# gear-chat', c: 522 },
  { n: '# samples-share', c: 301 },
  { n: '# now-playing', c: 178 },
  { n: '# medellín', c: 96 },
  { n: '# calm-and-collect', c: 44 },
];

function SPDiscordStrip() {
  return (
    <section style={dsStyles.section}>
      <div style={dsStyles.row}>
        <div>
          <div style={dsStyles.eye}>THE DISCORD</div>
          <h1 style={dsStyles.h2}>join the fam</h1>
          <p style={dsStyles.lede}>come thru. share what you're working on. drop your samples. hang in the #medellín channel if you're down there. we all here to help each other finish.</p>
          <button style={dsStyles.cta}>join the discord →</button>
        </div>
        <div style={dsStyles.panel}>
          <div style={dsStyles.head}>
            <span><span style={dsStyles.greenDot}></span>thespacepit · online</span>
            <span>2,127 in fam</span>
          </div>
          {CHANS.map((c, i) => (
            <div key={i} style={{...dsStyles.chanRow, ...(i === CHANS.length - 1 ? dsStyles.chanLast : {})}}>
              <span style={dsStyles.chanName}>{c.n}</span>
              <span style={dsStyles.count}>{c.c} active</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
window.SPDiscordStrip = SPDiscordStrip;
