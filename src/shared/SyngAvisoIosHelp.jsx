import {
  L,
  LuxuryKeyframes,
  LuxuryHandle,
  LuxuryBadge,
  LuxuryDivider,
  LuxuryStep,
  LuxuryCalPreview,
  LuxuryPortal,
  luxuryBtnPrimary,
  luxuryNote,
} from './avisoLuxury'

/** iPhone: pantalla completa editorial — tarea ya guardada */
export function SyngAvisoIosHelp({ title, notifyLabel, onContinue }) {
  return (
    <LuxuryPortal>
      <LuxuryKeyframes />
      <div style={shell}>
        <div style={scroll}>
          <LuxuryHandle />
          <LuxuryBadge>En tu iPhone</LuxuryBadge>

          <h2 style={{
            margin: '0 0 4px',
            fontFamily: L.serif,
            fontSize: 24,
            fontWeight: 400,
            color: L.ivory,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}>
            Un paso más
          </h2>

          <p style={{
            margin: '0 0 12px',
            fontSize: 13,
            lineHeight: 1.45,
            color: L.ivoryMuted,
          }}>
            Tu tarea ya está guardada. Falta confirmar en Calendario para que suene.
          </p>

          <LuxuryCalPreview title={title} notifyLabel={notifyLabel} compact />

          <LuxuryDivider tight />

          <div style={{ marginBottom: 8 }}>
            <LuxuryStep n="1" title="Continuar" desc="Abre la invitación en iPhone." tight />
            <LuxuryStep n="2" title="Permitir" desc="Acepta cuando Safari te lo pida." tight />
            <LuxuryStep
              n="3"
              title="Agregar al calendario"
              desc="Toca el botón blanco abajo en la pantalla de Apple."
              tight
            />
          </div>

          <p style={{ ...luxuryNote, margin: 0, padding: '10px 12px', fontSize: 12 }}>
            Cuando suene, abre Syng desde el ícono o entra a{' '}
            <strong style={{ color: L.ivory }}>Avisos</strong>.
          </p>
        </div>

        <div style={footer}>
          <button type="button" style={luxuryBtnPrimary} onClick={onContinue}>
            Continuar
          </button>
        </div>
      </div>
    </LuxuryPortal>
  )
}

const shell = {
  position: 'fixed',
  inset: 0,
  zIndex: 100000,
  background: L.ink,
  color: L.ivory,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const scroll = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  padding: 'max(12px, env(safe-area-inset-top)) 20px 8px',
}

const footer = {
  flexShrink: 0,
  padding: '10px 20px max(12px, calc(env(safe-area-inset-bottom) + 8px))',
  borderTop: `1px solid rgba(196,169,98,0.18)`,
  background: L.ink,
}
