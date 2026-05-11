const nhStyles = {
  hero: {
    position: 'relative', padding: '96px 32px 80px', background: '#0B0B0B', color: '#F4EFE6',
    borderBottom: '1px solid #F4EFE6', overflow: 'hidden', isolation: 'isolate',
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.14em',
    textTransform: 'uppercase', color: '#E83A1C', marginBottom: 16,
    display: 'flex', gap: 12, flexWrap: 'wrap',
  },
  name: {
    fontFamily: "'Antonio', 'Anton', sans-serif", fontWeight: 700,
    fontSize: 'clamp(88px, 16vw, 220px)', lineHeight: .88, letterSpacing: '-0.02em',
    textTransform: 'uppercase', margin: 0, color: '#F4EFE6',
  },
  nameRed: { color: '#E83A1C' },
  tagline: {
    fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
    fontSize: 'clamp(20px, 2.2vw, 28px)', lineHeight: 1.3, maxWidth: 560,
    marginTop: 24, color: '#E8E2D4',
  },
  ctaRow: { display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' },
  cta: {
    fontFamily: "'Antonio', sans-serif", fontWeight: 600, fontSize: 15,
    letterSpacing: '.04em', textTransform: 'uppercase',
    padding: '12px 20px', border: '1px solid #F4EFE6', background: '#E83A1C',
    color: '#F4EFE6', cursor: 'pointer', borderRadius: 0,
  },
  ctaGhost: {
    fontFamily: "'Antonio', sans-serif", fontWeight: 600, fontSize: 15,
    letterSpacing: '.04em', textTransform: 'uppercase',
    padding: '12px 20px', border: '1px solid #F4EFE6', background: 'transparent',
    color: '#F4EFE6', cursor: 'pointer', borderRadius: 0,
  },
  corner: {
    position: 'absolute', top: 24, right: 24, display: 'flex', alignItems: 'center',
    gap: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
    letterSpacing: '.1em', textTransform: 'uppercase', color: '#E8E2D4',
  },
  hep: { width: 28, height: 28, animation: 'nh-spin 8s linear infinite' },
};

function NHHero() {
  return (
    <section style={nhStyles.hero}>
      <style>{`@keyframes nh-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={nhStyles.corner}>
        <img src="../../assets/logos/calmcollect-mark.png" style={nhStyles.hep} alt="" />
        <span>BROOKLYN · MEDELLÍN · EST. 2011</span>
      </div>
      <div style={nhStyles.eyebrow}>
        <span>PRODUCER</span><span>·</span><span>DJ</span><span>·</span><span>ENGINEER</span><span>·</span><span>COLLABORATOR</span>
      </div>
      <h1 style={nhStyles.name}>
        NICK<br/><span style={nhStyles.nameRed}>HOOK</span>
      </h1>
      <p style={nhStyles.tagline}>
        gold-record producer. teenage engineering artist-mentor. co-exec of RTJ CU4TRO.
        "nyc's waviest resident" — fool's gold. raw analog energy, genre-defying live sets.
      </p>
      <div style={nhStyles.ctaRow}>
        <button style={nhStyles.cta}>hear the catalogue →</button>
        <button style={nhStyles.ctaGhost}>pull up to the pit</button>
      </div>
    </section>
  );
}
window.NHHero = NHHero;
