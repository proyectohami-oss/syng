import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SyngLogo } from '../../shared/SyngLogo'
import { L } from '../../shared/agendaEditorial'
import { LuxuryBadge, LuxuryDivider, LuxuryKeyframes } from '../../shared/avisoLuxury'

const VARIANTS = [
  { label: 'Tu día de hoy',  text: (d) => `Tienes ${d.n} tarea${d.n !== 1 ? 's' : ''} pendiente${d.n !== 1 ? 's' : ''}`, sub: 'Todo está organizado' },
  { label: 'Tu prioridad',   text: (d) => d.tarea || 'Empieza por una sola cosa', sub: 'Empieza por esto' },
  { label: 'Buen trabajo',   text: (d) => `Ayer completaste ${d.c} tarea${d.c !== 1 ? 's' : ''}`, sub: 'Sigue así' },
  { label: 'Todo listo',     text: () => 'Tu agenda está preparada', sub: 'Syng ya hizo el trabajo' },
  { label: 'Enfoque',        text: () => 'Empieza por una sola cosa', sub: 'El resto llegará solo' },
  { label: 'Perspectiva',    text: () => 'Todo gran avance comienza con una tarea', sub: '' },
  { label: 'Espacio',        text: () => 'Hoy tienes espacio para avanzar', sub: '' },
  { label: 'Claridad',       text: () => 'Lo importante ya está definido', sub: '' },
  { label: 'Prioridad',      text: () => 'Una prioridad clara cambia todo', sub: '' },
  { label: 'Bienvenido',     text: () => 'Bienvenido de nuevo', sub: 'Tu día te está esperando' },
  { label: 'Ritual',         text: () => 'Tu día te está esperando', sub: '' },
  { label: 'Filosofía',      text: () => 'Organiza menos. Avanza más.', sub: '' },
  { label: 'Progreso',       text: () => 'Pequeños avances. Grandes resultados.', sub: '' },
  { label: 'Posibilidad',    text: () => 'Hoy puede ser un gran día.', sub: '' },
  { label: 'Syng',           text: () => 'Syng ya preparó tu agenda.', sub: '' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function BienvenidaScreen({ userData, tareasHoy = [], tareasAyer = [], onDone }) {
  const navigate = useNavigate()
  const barRef = useRef(null)
  const stageRef = useRef(null)

  const n = tareasHoy.length
  const c = tareasAyer.length
  const tarea = tareasHoy[0]?.title || ''
  const nombre = userData?.displayName?.split(' ')[0] || ''

  const dayIdx = new Date().getDate() % VARIANTS.length
  const variant = VARIANTS[dayIdx]
  const texto = variant.text({ n, c, tarea })

  const dismiss = useCallback(() => {
    if (onDone) onDone()
    else navigate('/agenda', { replace: true })
  }, [onDone, navigate])

  useEffect(() => {
    const t1 = setTimeout(() => {
      if (barRef.current) {
        barRef.current.style.transition = 'width 3.5s linear'
        barRef.current.style.width = '100%'
      }
    }, 400)
    const t2 = setTimeout(() => {
      if (stageRef.current) stageRef.current.style.opacity = '0'
    }, 4200)
    const t3 = setTimeout(dismiss, 4600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [dismiss])

  return (
    <div
      ref={stageRef}
      role="button"
      tabIndex={0}
      onClick={dismiss}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') dismiss() }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: L.ink,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(24px, env(safe-area-inset-top)) 20px max(24px, env(safe-area-inset-bottom))',
        transition: 'opacity 0.4s ease',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <LuxuryKeyframes />
      <style>{`
        @keyframes syngBienvenidaIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: 380,
        padding: '36px 28px 32px',
        background: L.champagneLight,
        border: `1px solid ${L.champagneBorder}`,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        animation: 'syngBienvenidaIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        <div style={{ marginBottom: 28 }}>
          <SyngLogo size="lg" animated />
        </div>

        <LuxuryBadge>{getGreeting()}</LuxuryBadge>

        <h1 style={{
          margin: '0 0 6px',
          fontFamily: L.serif,
          fontSize: 32,
          fontWeight: 400,
          color: L.ivory,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          {nombre || 'Syng'}
        </h1>

        <LuxuryDivider />

        <div style={{
          width: '100%',
          marginBottom: 28,
          padding: '18px 20px',
          borderRadius: 2,
          border: `1px solid ${L.champagneBorder}`,
          background: 'rgba(255,255,255,0.04)',
          textAlign: 'left',
        }}>
          <p style={{
            margin: '0 0 10px',
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: L.champagne,
          }}>
            {variant.label}
          </p>
          <p style={{
            margin: 0,
            fontFamily: L.serif,
            fontSize: 20,
            fontWeight: 400,
            color: L.ivory,
            lineHeight: 1.35,
            letterSpacing: '-0.01em',
          }}>
            {texto}
          </p>
          {variant.sub ? (
            <p style={{
              margin: '10px 0 0',
              fontSize: 13,
              lineHeight: 1.5,
              color: L.ivoryMuted,
            }}>
              {variant.sub}
            </p>
          ) : null}
        </div>

        <div style={{ width: '100%' }}>
          <div style={{
            width: '100%',
            height: 2,
            background: 'rgba(196,169,98,0.18)',
            borderRadius: 1,
            overflow: 'hidden',
          }}>
            <div
              ref={barRef}
              style={{
                height: '100%',
                width: '0%',
                background: L.champagne,
                borderRadius: 1,
              }}
            />
          </div>
          <p style={{
            margin: '12px 0 0',
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: L.ivoryFaint,
          }}>
            Toca para continuar
          </p>
        </div>
      </div>
    </div>
  )
}
