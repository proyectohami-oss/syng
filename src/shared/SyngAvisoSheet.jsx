/**
 * Paso final del recordatorio — se siente Syng, no "Calendario ajeno".
 */
export function SyngAvisoSheet({
  title,
  notifyLabel,
  taskTimeLabel,
  onActivate,
  onSkip,
  onClose,
}) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={logoBox}>S</div>
        <p style={badge}>AVISO SYNG</p>
        <h2 style={heading}>{title || 'Tu tarea'}</h2>
        <p style={sub}>
          Syng te avisará <strong style={{ color: '#2D3A8C' }}>{notifyLabel}</strong>
          {taskTimeLabel ? <> — tarea a las {taskTimeLabel}</> : null}
        </p>
        <p style={hint}>
          Un toque confirma el aviso en tu iPhone. Suena aunque cierres Syng.
        </p>
        <button type="button" onClick={onActivate} style={btnPrimary}>
          Activar aviso Syng
        </button>
        <button type="button" onClick={onSkip} style={btnGhost}>
          Guardar sin aviso
        </button>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0, zIndex: 3000,
  background: 'rgba(13,18,64,0.35)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
}
const sheet = {
  width: '100%', maxWidth: 480,
  background: 'rgba(250,251,255,0.98)',
  backdropFilter: 'blur(48px)',
  WebkitBackdropFilter: 'blur(48px)',
  borderRadius: '24px 24px 0 0',
  padding: '28px 24px calc(32px + env(safe-area-inset-bottom))',
  textAlign: 'center',
  boxShadow: '0 -8px 48px rgba(13,18,64,0.12)',
}
const logoBox = {
  width: 56, height: 56, borderRadius: 16,
  background: 'linear-gradient(135deg,#3D4FA8,#2D3A8C)',
  color: '#fff', fontSize: 24, fontWeight: 800,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  margin: '0 auto 12px',
  boxShadow: '0 6px 24px rgba(45,58,140,0.28)',
}
const badge = {
  margin: '0 0 8px', fontSize: 10, fontWeight: 700,
  letterSpacing: '0.22em', color: 'rgba(45,58,140,0.55)',
}
const heading = {
  margin: '0 0 10px', fontSize: 22, fontWeight: 700,
  color: '#0D1240', letterSpacing: '-0.02em', lineHeight: 1.25,
}
const sub = {
  margin: '0 0 12px', fontSize: 15, color: 'rgba(13,18,64,0.62)', lineHeight: 1.5,
}
const hint = {
  margin: '0 0 20px', fontSize: 12, color: 'rgba(13,18,64,0.38)', lineHeight: 1.45,
}
const btnPrimary = {
  width: '100%', padding: 15, borderRadius: 14, border: 'none',
  background: 'linear-gradient(135deg,#3D4FA8,#2D3A8C)',
  color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
  marginBottom: 8,
  boxShadow: '0 4px 16px rgba(45,58,140,0.28)',
}
const btnGhost = {
  width: '100%', padding: 12, borderRadius: 14, border: 'none',
  background: 'none', color: 'rgba(13,18,64,0.38)', fontSize: 13, cursor: 'pointer',
}
