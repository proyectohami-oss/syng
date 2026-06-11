/** Instrucciones iOS tras tocar Activar aviso Syng */
export function SyngAvisoIosHelp({ onDone }) {
  return (
    <div style={overlay}>
      <div style={sheet}>
        <p style={badge}>PASO EN IPHONE</p>
        <h2 style={heading}>Agrega el aviso Syng</h2>
        <ol style={list}>
          <li>En la pantalla que se abrió, <strong>desliza los íconos hacia la izquierda</strong>.</li>
          <li>Busca <strong>Calendario</strong> (o More → Calendario).</li>
          <li>Toca y luego <strong>Agregar evento</strong>.</li>
        </ol>
        <p style={hint}>Si cierras esa pantalla sin Calendario, <strong>no sonará</strong> en iPhone.</p>
        <button type="button" style={btn} onClick={onDone}>Entendido</button>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0, zIndex: 4000,
  background: 'rgba(13,18,64,0.45)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
}
const sheet = {
  width: '100%', maxWidth: 480,
  background: '#fff', borderRadius: '24px 24px 0 0',
  padding: '24px 22px calc(28px + env(safe-area-inset-bottom))',
}
const badge = {
  margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
  color: 'rgba(45,58,140,0.55)',
}
const heading = {
  margin: '8px 0 14px', fontSize: 20, fontWeight: 700, color: '#0D1240',
}
const list = {
  margin: '0 0 14px', paddingLeft: 20, fontSize: 15, lineHeight: 1.55, color: '#0D1240',
}
const hint = {
  margin: '0 0 18px', fontSize: 13, color: '#7c2d12',
  background: 'rgba(254,226,226,0.5)', padding: '10px 12px', borderRadius: 12,
}
const btn = {
  width: '100%', padding: 14, borderRadius: 14, border: 'none',
  background: 'linear-gradient(135deg,#3D4FA8,#2D3A8C)',
  color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
}
