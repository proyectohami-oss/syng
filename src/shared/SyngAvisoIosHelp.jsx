import {
  L,
  LuxuryKeyframes,
  LuxuryHandle,
  LuxuryBadge,
  LuxuryDivider,
  LuxuryStep,
  luxuryOverlay,
  luxurySheet,
  luxuryBtnPrimary,
  luxuryNote,
} from './avisoLuxury'

/** iPhone: un solo paso — la tarea ya está guardada */
export function SyngAvisoIosHelp({ onContinue }) {
  return (
    <>
      <LuxuryKeyframes />
      <div style={{ ...luxuryOverlay, zIndex: 4000 }}>
        <div style={luxurySheet}>
          <LuxuryHandle />
          <LuxuryBadge>En tu iPhone</LuxuryBadge>

          <h2 style={{
            margin: '0 0 6px',
            fontFamily: L.serif,
            fontSize: 26,
            fontWeight: 400,
            color: L.ivory,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}>
            Un paso más
          </h2>

          <LuxuryDivider />

          <div style={{ marginBottom: 8 }}>
            <LuxuryStep
              n="1"
              title="Continuar"
              desc="Tu tarea ya está guardada. iPhone abrirá la invitación."
            />
            <LuxuryStep
              n="2"
              title="Permitir"
              desc="Acepta cuando Safari te lo pida."
            />
            <LuxuryStep
              n="3"
              title="Agregar al calendario"
              desc="Confirma el evento Syng · Recordatorio."
            />
          </div>

          <p style={luxuryNote}>
            Sin confirmar en Calendario, no sonará fuera de Syng.
            Cuando suene, abre Syng desde el ícono o entra a <strong style={{ color: L.ivory }}>Avisos</strong>.
          </p>

          <button type="button" style={luxuryBtnPrimary} onClick={onContinue}>
            Continuar
          </button>
        </div>
      </div>
    </>
  )
}
