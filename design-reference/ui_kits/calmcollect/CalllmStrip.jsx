const clStyles = {
  section: { padding: '80px 32px', background: 'linear-gradient(120deg, #9B1B1B 0%, #E2651A 16%, #F2C84B 33%, #3E8E5A 50%, #2F6FB3 67%, #4B2E83 84%, #E3D4F2 100%)', color: '#F4EFE6', borderTop: '2px solid #0B0B0B', borderBottom: '2px solid #0B0B0B', position: 'relative', overflow: 'hidden' },
  scrim: { position: 'absolute', inset: 0, background: 'rgba(11,11,11,0.5)', backdropFilter: 'blur(2px)' },
  wrap: { position: 'relative', zIndex: 1 },
  eye: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#E3D4F2', marginBottom: 12 },
  h2: { fontFamily: "'Antonio', sans-serif", fontWeight: 700, fontSize: 'clamp(56px, 10vw, 160px)', lineHeight: .86, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' },
  lede: { fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 'clamp(20px, 2vw, 26px)', lineHeight: 1.35, maxWidth: 620, marginTop: 20 },
  chakras: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, marginTop: 40, border: '1px solid #F4EFE6' },
  chak: { padding: '16px 10px', borderRight: '1px solid #F4EFE6', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#F4EFE6', textAlign: 'center' },
  chakLast: { borderRight: 0 },
};

const CHAKRAS = [
  { n: 'root', k: 'C', bg: '#9B1B1B' },
  { n: 'sacral', k: 'D', bg: '#E2651A' },
  { n: 'solar', k: 'E', bg: '#F2C84B' },
  { n: 'heart', k: 'F#', bg: '#3E8E5A' },
  { n: 'throat', k: 'G', bg: '#2F6FB3' },
  { n: 'third eye', k: 'A', bg: '#4B2E83' },
  { n: 'crown', k: 'B', bg: '#E3D4F2' },
];

function CCCalllmStrip() {
  return (
    <section style={clStyles.section}>
      <div style={clStyles.scrim}></div>
      <div style={clStyles.wrap}>
        <div style={clStyles.eye}>◐ SUB-LABEL · AMBIENT / DRONE</div>
        <h2 style={clStyles.h2}>calllm</h2>
        <p style={clStyles.lede}>seven chakra-inspired drones. released weekly with live watercolor and guided meditation. the calm + collect ambient wing.</p>
        <div style={clStyles.chakras}>
          {CHAKRAS.map((c, i) => (
            <div key={i} style={{...clStyles.chak, ...(i === CHAKRAS.length - 1 ? clStyles.chakLast : {}), background: c.bg, color: (c.bg === '#E3D4F2' || c.bg === '#F2C84B') ? '#0B0B0B' : '#F4EFE6'}}>
              <div style={{fontFamily: "'Antonio', sans-serif", fontSize: 22, fontWeight: 700}}>{c.n}</div>
              <div style={{marginTop: 4}}>{c.k}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
window.CCCalllmStrip = CCCalllmStrip;
