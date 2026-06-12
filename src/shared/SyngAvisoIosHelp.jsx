import {
  L,
  LuxuryKeyframes,
  LuxuryHandle,
  LuxuryBadge,
  LuxuryDivider,
  LuxuryStep,
  LuxuryPortal,
  luxuryFullscreen,
  luxuryBtnPrimary,
  luxuryNote,
} from './avisoLuxury'

/** iPhone: pantalla completa editorial — tarea ya guardada */
export function SyngAvisoIosHelp({ onContinue }) {
  return (
    <LuxuryPortal>
      <LuxuryKeyframes />
      <div style={luxuryFullscreen}>
        <LuxuryHandle />
        <LuxuryBadge>En tu iPhone</LuxuryBadge>

        <h2 style={{
          margin: '0 0 6px',
          fontFamily: L.serif,
          fontSize: 28,
          fontWeight: 400,
          color: L.ivory,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}>
          Un paso más
        </h2>

        <p style={{
          margin: '0 0 20px',
          fontSize: 14,
          lineHeight: 1.55,
          color: L.ivoryMuted,
        }}>
          Tu tarea ya está guardada. Falta confirmar en Calendario para que suene.
        </p>

        <LuxuryDivider />

        <div style={{ marginBottom: 12 }}>
          <LuxuryStep
            n="1"
            title="Continuar"
            desc="Toca el botón de abajo. iPhone abrirá la invitación."
          />
          <LuxuryStep
            n="2"
            title="Permitir"
            desc="Acepta cuando Safari te lo pida."
          />
          <LuxuryStep
            n="3"
            title="Agregar al calendario"
            desc="Toca Agregar al calendario — sin eso no queda guardado."
          />
        </div>

        <p style={luxuryNote}>
          Cuando suene, abre Syng desde el ícono o entra a{' '}
          <strong style={{ color: L.ivory }}>Avisos</strong>.
        </p>

        <button type="button" style={{ ...luxuryBtnPrimary, marginTop: 8 }} onClick={onContinue}>
          Continuar
        </button>
      </div>
    </LuxuryPortal>
  )
}
