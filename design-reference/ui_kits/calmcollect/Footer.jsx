const ccfStyles = {
  section: { padding: '48px 32px', background: '#F4EFE6', color: '#0B0B0B', borderTop: '1px solid #0B0B0B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 },
  left: { display: 'flex', alignItems: 'center', gap: 16 },
  hep: { width: 40, height: 40, animation: 'ccf-spin 8s linear infinite' },
  sign: { fontFamily: "'Antonio', sans-serif", fontWeight: 600, fontSize: 32, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1 },
  meta: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#3A362E', marginTop: 4 },
  links: { display: 'flex', gap: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase' },
};

function CCFooter() {
  return (
    <footer style={ccfStyles.section}>
      <style>{`@keyframes ccf-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={ccfStyles.left}>
        <img src="../../assets/logos/calmcollect-mark.png" style={ccfStyles.hep} alt="" />
        <div>
          <div style={ccfStyles.sign}>stay high 💚</div>
          <div style={ccfStyles.meta}>calm + collect · a record label · 2013 → today</div>
        </div>
      </div>
      <div style={ccfStyles.links}>
        <span>bandcamp</span><span>beatport</span><span>ig</span><span>contact</span>
      </div>
    </footer>
  );
}
window.CCFooter = CCFooter;
