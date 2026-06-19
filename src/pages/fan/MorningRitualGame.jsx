import { useState, useCallback, useEffect } from 'react'
import { L } from '../../shared/agendaEditorial'

const AGENDA_PREVIEW = [
  { time: '06:30', task: 'Gratitud y propósito del día', done: true },
  { time: '07:00', task: 'Revisar agenda y prioridades', done: false },
  { time: '08:30', task: 'Bloque de enfoque — lo importante primero', done: false },
]

export function MorningRitualGame({ legend, onComplete }) {
  const [step, setStep] = useState('intro')
  const [gratitude, setGratitude] = useState(0)
  const [sunPulse, setSunPulse] = useState(false)
  const [sparkles, setSparkles] = useState([])

  const addSparkle = useCallback(() => {
    setSparkles(prev => [
      ...prev.slice(-24),
      {
        id: Math.random(),
        left: 10 + Math.random() * 80,
        top: 15 + Math.random() * 55,
        delay: Math.random() * 0.4,
        size: 4 + Math.random() * 6,
      },
    ])
  }, [])

  useEffect(() => {
    if (step !== 'done') return
    onComplete?.()
  }, [step, onComplete])

  function next(s) {
    setStep(s)
    addSparkle()
  }

  function handleGratitude() {
    addSparkle()
    const n = gratitude + 1
    setGratitude(n)
    if (n >= 3) setTimeout(() => next('agenda'), 500)
  }

  function handleWake() {
    setSunPulse(true)
    setTimeout(() => next('agradecer'), 700)
  }

  return (
    <div style={gameWrap}>
      <div style={gameGlow} aria-hidden />
      {sparkles.map(s => (
        <span
          key={s.id}
          className="fan-sparkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {step === 'intro' && (
        <div className="fan-step-in" style={stepBox}>
          <p style={stepBadge}>Ritual matutino</p>
          <h2 style={stepTitle}>¿Cómo empiezan las personas exitosas?</h2>
          <p style={stepSub}>Tres pasos. Un minuto. Siéntelo.</p>
          <button type="button" style={goldBtn} onClick={() => next('despertar')}>
            Comenzar ritual
          </button>
        </div>
      )}

      {step === 'despertar' && (
        <div className="fan-step-in" style={stepBox}>
          <p style={stepBadge}>Paso 1 · Despertar</p>
          <button
            type="button"
            className={sunPulse ? 'fan-sun-burst' : 'fan-sun-idle'}
            style={sunBtn}
            onClick={handleWake}
            aria-label="Despertar"
          >
            <span style={sunCore}>☀</span>
          </button>
          <p style={stepSub}>Toca el sol — un nuevo día, nuevas oportunidades.</p>
        </div>
      )}

      {step === 'agradecer' && (
        <div className="fan-step-in" style={stepBox}>
          <p style={stepBadge}>Paso 2 · Agradecer</p>
          <div style={heartRow}>
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{
                  ...heartDot,
                  opacity: gratitude > i ? 1 : 0.25,
                  transform: gratitude > i ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                ✦
              </span>
            ))}
          </div>
          <button type="button" style={goldBtn} onClick={handleGratitude}>
            {gratitude < 3 ? `Agradecer (${gratitude}/3)` : 'Gracias…'}
          </button>
          <p style={stepSub}>Lo primero: agradecer a Dios.</p>
        </div>
      )}

      {step === 'agenda' && (
        <div className="fan-step-in" style={stepBox}>
          <p style={stepBadge}>Paso 3 · Tu agenda</p>
          <div style={agendaCard}>
            <p style={agendaLabel}>Hoy</p>
            {AGENDA_PREVIEW.map(row => (
              <div key={row.task} style={agendaRow}>
                <span style={agendaTime}>{row.time}</span>
                <span style={{
                  ...agendaTask,
                  color: row.done ? L.champagne : L.ivory,
                  textDecoration: row.done ? 'line-through' : 'none',
                  opacity: row.done ? 0.7 : 1,
                }}>
                  {row.task}
                </span>
              </div>
            ))}
          </div>
          <button type="button" style={goldBtn} onClick={() => next('done')}>
            Completar ritual
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="fan-step-in fan-done" style={stepBox}>
          <p style={stepBadge}>Ritual completo</p>
          <p style={legendQuote}>&ldquo;{legend}&rdquo;</p>
          <p style={doneLine}>Así empiezan quienes construyen su éxito — con claridad y gratitud.</p>
        </div>
      )}
    </div>
  )
}

const gameWrap = {
  position: 'relative',
  width: '100%',
  maxWidth: 440,
  minHeight: 320,
  margin: '0 auto',
  padding: '28px 22px',
  borderRadius: 4,
  border: `1px solid ${L.champagneBorder}`,
  background: `linear-gradient(165deg, ${L.inkSoft} 0%, ${L.ink} 55%, rgba(196,169,98,0.08) 100%)`,
  overflow: 'hidden',
}

const gameGlow = {
  position: 'absolute',
  inset: '-40%',
  background: 'radial-gradient(circle at 50% 20%, rgba(196,169,98,0.18), transparent 55%)',
  pointerEvents: 'none',
  animation: 'fanGlowPulse 4s ease-in-out infinite',
}

const stepBox = {
  position: 'relative',
  zIndex: 1,
  textAlign: 'center',
}

const stepBadge = {
  margin: '0 0 12px',
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: L.champagne,
}

const stepTitle = {
  margin: '0 0 10px',
  fontFamily: L.serif,
  fontSize: 26,
  fontWeight: 400,
  color: L.ivory,
  lineHeight: 1.25,
}

const stepSub = {
  margin: '16px 0 0',
  fontSize: 14,
  color: L.ivoryMuted,
  lineHeight: 1.55,
}

const goldBtn = {
  marginTop: 8,
  padding: '14px 28px',
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: L.ink,
  background: `linear-gradient(135deg, ${L.champagne}, #E8D5A3)`,
  border: 'none',
  borderRadius: 2,
  cursor: 'pointer',
  boxShadow: '0 8px 32px rgba(196,169,98,0.35)',
  transition: 'transform 0.2s, box-shadow 0.2s',
}

const sunBtn = {
  width: 88,
  height: 88,
  margin: '8px auto 4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  border: `2px solid ${L.champagneBorder}`,
  background: 'rgba(196,169,98,0.12)',
  cursor: 'pointer',
}

const sunCore = {
  fontSize: 40,
  lineHeight: 1,
  filter: 'drop-shadow(0 0 12px rgba(196,169,98,0.6))',
}

const heartRow = {
  display: 'flex',
  justifyContent: 'center',
  gap: 16,
  margin: '12px 0 20px',
  fontSize: 22,
  color: L.champagne,
}

const heartDot = {
  transition: 'transform 0.3s, opacity 0.3s',
}

const agendaCard = {
  textAlign: 'left',
  margin: '12px 0 20px',
  padding: '16px 18px',
  borderRadius: 2,
  border: `1px solid ${L.champagneBorder}`,
  background: L.champagneLight,
}

const agendaLabel = {
  margin: '0 0 12px',
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: L.champagne,
}

const agendaRow = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  padding: '8px 0',
  borderBottom: `1px solid rgba(196,169,98,0.15)`,
}

const agendaTime = {
  fontSize: 11,
  fontFamily: 'ui-monospace, monospace',
  color: L.champagne,
  minWidth: 44,
}

const agendaTask = {
  fontSize: 13,
  lineHeight: 1.45,
}

const legendQuote = {
  margin: '8px 0 16px',
  fontFamily: L.serif,
  fontSize: 18,
  fontStyle: 'italic',
  lineHeight: 1.55,
  color: L.ivory,
}

const doneLine = {
  margin: 0,
  fontSize: 13,
  color: L.ivoryMuted,
  lineHeight: 1.5,
}
