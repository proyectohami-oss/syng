import { useEffect, useRef, useState } from 'react'
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
  luxuryBtnGhost,
  luxuryBtnOutline,
  luxuryNote,
} from './avisoLuxury'

/** iPhone: guía editorial para confirmar en Calendario */
export function SyngAvisoIosHelp({ onOpenCalendar, onDone }) {
  const [opened, setOpened] = useState(false)
  const openedRef = useRef(false)

  useEffect(() => {
    if (!opened) return
    openedRef.current = true
    function onReturn() {
      if (!openedRef.current || document.visibilityState !== 'visible') return
      setTimeout(() => onDone?.(), 350)
    }
    window.addEventListener('pageshow', onReturn)
    document.addEventListener('visibilitychange', onReturn)
    return () => {
      window.removeEventListener('pageshow', onReturn)
      document.removeEventListener('visibilitychange', onReturn)
    }
  }, [opened, onDone])

  async function handleOpen() {
    const result = await onOpenCalendar?.()
    if (result?.ok !== false) setOpened(true)
  }

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
            {opened ? 'Confirma en Calendario' : 'Un paso más'}
          </h2>

          <LuxuryDivider />

          {!opened ? (
            <>
              <div style={{ marginBottom: 8 }}>
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
                  desc="Confirma el evento Syng · Recordatorio."
                />
              </div>
              <p style={luxuryNote}>
                Sin ese gesto, el aviso no sonará fuera de Syng.
              </p>
              <button type="button" style={luxuryBtnPrimary} onClick={handleOpen}>
                Continuar
              </button>
            </>
          ) : (
            <>
              <p style={{
                margin: '0 0 22px',
                fontSize: 15,
                lineHeight: 1.6,
                color: L.ivoryMuted,
              }}>
                Busca <strong style={{ color: L.ivory, fontWeight: 500 }}>Syng · Recordatorio</strong>
                {' '}en Calendario. Al volver, Syng te lleva a la agenda.
              </p>
              <button type="button" style={luxuryBtnOutline} onClick={handleOpen}>
                Reintentar
              </button>
              <button type="button" style={luxuryBtnGhost} onClick={onDone}>
                Listo
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
