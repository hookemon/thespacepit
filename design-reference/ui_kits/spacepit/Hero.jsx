const spStyles = {
  hero: { padding: '80px 32px 64px', background: '#F4EFE6', color: '#0B0B0B', borderBottom: '1px solid #0B0B0B', position:'relative' },
  eyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#3A362E', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' },
  dot: { width: 10, height: 10, background: '#E83A1C', borderRadius: '50%', animation: 'sp-pulse 1.4s ease-in-out infinite' },
  h1: { fontFamily: "'Antonio', sans-serif", fontWeight: 700, fontSize: 'clamp(80px, 14vw, 200px)', lineHeight: .88, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: 0 },
  lamp: { color: '#F2B705', WebkitTextStroke: '2px #0B0B0B' },
  tag: { fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 'clamp(20px, 2vw, 26px)', maxWidth: 640, lineHeight: 1.35, marginTop: 20 },
  stats: { marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: '1px solid #0B0B0B' },
  stat: { borderRight: '1px solid #0B0B0B', padding: '16px 18px' },
  statLast: { borderRight: 0 },
  num: { fontFamily: "'Antonio', sans-serif", fontWeight: 700, fontSize: 40, letterSpacing: '-0.01em', lineHeight: 1 },
  lbl: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: '#3A362E', marginTop: 6 },
};

function SPHero() {
  return (
    <section style={spStyles.hero}>
      <style>{`@keyframes sp-pulse { 50% { opacity: .3; } }`}</style>
      <div style={spStyles.eyebrow}>
        <span style={spStyles.dot}></span>
        <span>LIVE · recording now · brooklyn</span>
      </div>
      <h1 style={spStyles.h1}>pull up to<br/><span style={spStyles.lamp}>thespacepit</span></h1>
      <p style={spStyles.tag}>the studio. the youtube channel. the discord. gear demos, live jams, after-midnight sessions — brooklyn to the garden in medellín. we out here 🌱</p>
      <div style={spStyles.stats}>
        <div style={spStyles.stat}><div style={spStyles.num}>214</div><div style={spStyles.lbl}>videos posted</div></div>
        <div style={spStyles.stat}><div style={spStyles.num}>38.4k</div><div style={spStyles.lbl}>fam on yt</div></div>
        <div style={spStyles.stat}><div style={spStyles.num}>2.1k</div><div style={spStyles.lbl}>in the discord</div></div>
        <div style={{...spStyles.stat, ...spStyles.statLast}}><div style={spStyles.num}>11yr</div><div style={spStyles.lbl}>since we started</div></div>
      </div>
    </section>
  );
}
window.SPHero = SPHero;
