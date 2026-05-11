const ccStyles = {
  hero: { padding: '80px 32px 64px', background: '#F4EFE6', color: '#0B0B0B', borderBottom: '2px solid #0B0B0B', position: 'relative', overflow: 'hidden' },
  row: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' },
  eye: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#0E4B3A', marginBottom: 14, display: 'flex', gap: 10 },
  h1: { fontFamily: "'Antonio', sans-serif", fontWeight: 700, fontSize: 'clamp(72px, 13vw, 200px)', lineHeight: .88, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: 0 },
  plus: { color: '#0E4B3A', fontWeight: 400 },
  lede: { fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 'clamp(22px, 2.2vw, 28px)', lineHeight: 1.35, maxWidth: 620, marginTop: 20 },
  meta: { marginTop: 32, display: 'flex', gap: 20, flexWrap: 'wrap', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#3A362E' },
  hep: { width: 240, height: 240, animation: 'cc-spin 8s linear infinite' },
};

function CCHero() {
  return (
    <section style={ccStyles.hero}>
      <style>{`@keyframes cc-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={ccStyles.row}>
        <div>
          <div style={ccStyles.eye}><span>◆ A RECORD LABEL</span><span>·</span><span>EST. 2013</span><span>·</span><span>NY → MDE</span></div>
          <h1 style={ccStyles.h1}>calm<br/><span style={ccStyles.plus}>+</span> collect</h1>
          <p style={ccStyles.lede}>cultivating records where the sound is shared. nick hook &amp; gareth jones. hip-hop, experimental, and ambient — released with care, one after the other.</p>
          <div style={ccStyles.meta}>
            <span>52 releases</span>
            <span>·</span>
            <span>5 artists</span>
            <span>·</span>
            <span>1 sub-label · calllm</span>
          </div>
        </div>
        <img src="../../assets/logos/calmcollect-mark.png" style={ccStyles.hep} alt="heptagon" />
      </div>
    </section>
  );
}
window.CCHero = CCHero;
