const gsStyles = {
  section: { padding: '64px 32px', background: '#0B0B0B', color: '#F4EFE6' },
  eye: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#F2B705', marginBottom: 8 },
  h2: { fontFamily: "'Antonio', sans-serif", fontWeight: 700, fontSize: 'clamp(44px, 6vw, 72px)', lineHeight: .92, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.015em' },
  lede: { fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 20, maxWidth: 640, marginTop: 16 },
  table: { marginTop: 32, width: '100%', borderCollapse: 'collapse', borderTop: '1px solid #F4EFE6', borderBottom: '1px solid #F4EFE6', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontVariantNumeric: 'tabular-nums' },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#C8C2B4', fontWeight: 500, borderBottom: '1px solid #F4EFE6' },
  td: { padding: '14px 12px', borderTop: '1px solid #3A362E' },
  name: { fontFamily: "'Antonio', sans-serif", fontSize: 20, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '-0.005em' },
  statusDot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 8, background: '#F2B705' },
};

const GEAR = [
  { name: 'Roland TR-808', tag: 'drum machine', note: 'signed by bruce forat · near-death at sónar, she back', status: 'active' },
  { name: 'EMT 250', tag: 'reverb', note: 'allegedly jeff porcaro\'s', status: 'active' },
  { name: 'TE OP-1 field', tag: 'synth', note: 'the medellín travel kit', status: 'travel' },
  { name: 'Elektron Octatrack mk2', tag: 'sampler', note: 'the silver crate, full of samples', status: 'active' },
  { name: 'Prophet \'08', tag: 'synth', note: 'welcome to the fam my friend', status: 'active' },
  { name: 'Akai MPC 2500', tag: 'sampler', note: 'since 2015', status: 'shelf' },
  { name: 'Manley Cardioid Reference', tag: 'mic', note: 'standard vocal chain @ the pit', status: 'active' },
];

function SPGearShelf() {
  return (
    <section style={gsStyles.section}>
      <div style={gsStyles.eye}>THE SHELF · AS OF APRIL 2026</div>
      <h2 style={gsStyles.h2}>the gear log</h2>
      <p style={gsStyles.lede}>never turn anything off. if you pull up and something isn't patched in, patch it in.</p>
      <table style={gsStyles.table}>
        <thead><tr>
          <th style={gsStyles.th}>unit</th>
          <th style={gsStyles.th}>type</th>
          <th style={gsStyles.th}>note</th>
          <th style={gsStyles.th}>status</th>
        </tr></thead>
        <tbody>
          {GEAR.map((g, i) => (
            <tr key={i}>
              <td style={gsStyles.td}><div style={gsStyles.name}>{g.name}</div></td>
              <td style={gsStyles.td}>{g.tag}</td>
              <td style={{...gsStyles.td, color: '#C8C2B4'}}>{g.note}</td>
              <td style={gsStyles.td}><span style={gsStyles.statusDot}></span>{g.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
window.SPGearShelf = SPGearShelf;
