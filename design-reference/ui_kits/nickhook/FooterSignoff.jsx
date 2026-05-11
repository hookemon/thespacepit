const footerStyles = {
  section: { padding: '48px 32px', background: '#0B0B0B', color: '#F4EFE6', borderTop: '1px solid #F4EFE6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 },
  left: { display: 'flex', alignItems: 'center', gap: 16 },
  hep: { width: 44, height: 44, animation: 'nh-spin 8s linear infinite' },
  sign: { fontFamily: "'Antonio', sans-serif", fontWeight: 600, fontSize: 34, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1 },
  meta: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#C8C2B4', marginTop: 6 },
  links: { display: 'flex', gap: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase' },
};

function NHFooterSignoff() {
  return (
    <footer style={footerStyles.section}>
      <style>{`@keyframes nh-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={footerStyles.left}>
        <img src="../../assets/logos/calmcollect-mark.png" style={footerStyles.hep} alt="" />
        <div>
          <div style={footerStyles.sign}>see u in the pit 🌱</div>
          <div style={footerStyles.meta}>booking · coleman@smooth-loop.com</div>
        </div>
      </div>
      <div style={footerStyles.links}>
        <span>bandcamp</span><span>youtube</span><span>discord</span><span>ig</span>
      </div>
    </footer>
  );
}
window.NHFooterSignoff = NHFooterSignoff;
