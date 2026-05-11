const spfStyles = {
  section: { padding: '48px 32px', background: '#F4EFE6', color: '#0B0B0B', borderTop: '1px solid #0B0B0B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 },
  left: { display: 'flex', alignItems: 'center', gap: 16 },
  hep: { width: 40, height: 40, animation: 'sp-spin 8s linear infinite' },
  sign: { fontFamily: "'Antonio', sans-serif", fontWeight: 600, fontSize: 32, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1 },
  meta: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#3A362E', marginTop: 4 },
  links: { display: 'flex', gap: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase' },
};

function SPFooter() {
  return (
    <footer style={spfStyles.section}>
      <style>{`@keyframes sp-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={spfStyles.left}>
        <img src="../../assets/logos/calmcollect-mark.png" style={spfStyles.hep} alt="" />
        <div>
          <div style={spfStyles.sign}>see u in the pit 🪐</div>
          <div style={spfStyles.meta}>brooklyn · medellín · since 2014</div>
        </div>
      </div>
      <div style={spfStyles.links}>
        <span>yt</span><span>discord</span><span>ig</span><span>bandcamp</span>
      </div>
    </footer>
  );
}
window.SPFooter = SPFooter;
