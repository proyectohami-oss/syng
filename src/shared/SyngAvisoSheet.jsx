/**
 * Paso final del recordatorio — experiencia editorial Syng.
 */
import {
  L,
  LuxuryKeyframes,
  LuxuryHandle,
  LuxuryBadge,
  LuxuryDivider,
  LuxuryTimeCard,
  luxuryOverlay,
  luxurySheet,
  luxuryBtnPrimary,
  luxuryBtnGhost,
} from './avisoLuxury'

export function SyngAvisoSheet({
  title,
  notifyLabel,
  taskTimeLabel,
  onActivate,
  onSkip,
  onClose,
}) {
  return (
    <>
      <LuxuryKeyframes />
      <div style={luxuryOverlay} onClick={onClose}>
        <div style={luxurySheet} onClick={(e) => e.stopPropagation()}>
          <LuxuryHandle />
          <LuxuryBadge>Aviso personal</LuxuryBadge>

          <h2 style={{
            margin: '0 0 6px',
            fontFamily: L.serif,
            fontSize: 28,
            fontWeight: 400,
            color: L.ivory,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            textAlign: 'center',
          }}>
            {title || 'Tu tarea'}
          </h2>

          <LuxuryDivider />

          <LuxuryTimeCard notifyLabel={notifyLabel} taskTimeLabel={taskTimeLabel} />

          <p style={{
            margin: '0 0 26px',
            fontSize: 13,
            lineHeight: 1.6,
            color: L.ivoryMuted,
            textAlign: 'center',
            letterSpacing: '0.02em',
          }}>
            iPhone pedirá confirmar en Calendario.
            <br />
            Un gesto, y Syng te acompaña.
          </p>

          <button type="button" onClick={onActivate} style={luxuryBtnPrimary}>
            Activar aviso
          </button>
          <button type="button" onClick={onSkip} style={luxuryBtnGhost}>
            Solo guardar
          </button>
        </div>
      </div>
    </>
  )
}
