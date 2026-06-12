import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCoreAuth, useCoreTasks } from '../../core/hooks/useCoreData'
import { A, L } from '../../shared/agendaEditorial'

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function hoy() {
  const d = new Date()
  return `${d.getDate()} de ${MESES[d.getMonth()]}`
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

export function ResumenDiarioScreen() {
  const navigate = useNavigate()
  const auth     = useCoreAuth()
  const tasksCtx = useCoreTasks()
  const todayKey = toDateKey(new Date())

  const tasks = useMemo(() => {
    const personal = Array.from(tasksCtx.personal.values())
    const grouped  = Array.from(tasksCtx.byGroup.values()).flatMap(m => Array.from(m.values()))
    return [...personal, ...grouped].filter(t => {
      if (t.isDeleted || t.status !== 'pending' || !t.dueDate) return false
      const d = t.dueDate.toDate ? t.dueDate.toDate() : new Date(t.dueDate)
      return toDateKey(d) === todayKey
    })
  }, [tasksCtx.personal, tasksCtx.byGroup, todayKey])

  const loading = tasksCtx.loading && !auth.user
  const n = tasks.length

  return (
    <div style={screen}>
      <div style={card}>
        <p style={labelStyle}>Tu día en Syng</p>
        <p style={fechaStyle}>{hoy()}</p>

        {!loading && (
          <div style={conteoWrap}>
            <span style={conteoNum}>{n}</span>
            <span style={conteoLabel}>{n === 1 ? 'tarea pendiente' : 'tareas pendientes'}</span>
          </div>
        )}

        <div style={divider} />

        {loading ? (
          <p style={muted}>Cargando tu día…</p>
        ) : tasks.length === 0 ? (
          <p style={muted}>No tienes tareas pendientes hoy.</p>
        ) : (
          <div style={{ marginBottom: 20 }}>
            {tasks.map(t => (
              <div key={t.id} style={taskRow}>
                <div style={taskDot} />
                <p style={taskTitle}>{t.title}</p>
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={() => navigate(`/agenda/${todayKey}`)} style={btnPrimary}>
          Organizar mi día
        </button>

        <button type="button" onClick={() => navigate('/agenda')} style={btnSecondary}>
          Cerrar
        </button>

        {n > 0 && (
          <p style={fraseText}>
            Lo que se agenda, se logra. Hoy tienes {n} oportunidad{n !== 1 ? 'es' : ''} de avanzar.
          </p>
        )}
      </div>
    </div>
  )
}

const screen = {
  minHeight: '100svh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 20px',
  background: L.ink,
}

const card = {
  width: '100%',
  maxWidth: 400,
  background: L.champagneLight,
  border: `1px solid ${L.champagneBorder}`,
  borderRadius: 2,
  padding: '36px 28px 32px',
}

const labelStyle = {
  margin: 0,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: L.champagne,
  textAlign: 'center',
}

const fechaStyle = {
  margin: '8px 0 0',
  fontFamily: L.serif,
  fontSize: 24,
  color: L.ivory,
  textAlign: 'center',
}

const conteoWrap = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  justifyContent: 'center',
  margin: '20px 0',
}

const conteoNum = {
  fontFamily: L.serif,
  fontSize: 48,
  fontWeight: 400,
  color: L.champagne,
  lineHeight: 1,
}

const conteoLabel = {
  fontSize: 15,
  color: L.ivoryMuted,
}

const divider = {
  height: 1,
  background: L.champagneBorder,
  margin: '0 0 20px',
}

const taskRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 0',
  borderBottom: `1px solid rgba(196,169,98,0.15)`,
}

const taskDot = {
  width: 6,
  height: 6,
  borderRadius: 2,
  background: L.champagne,
  flexShrink: 0,
}

const taskTitle = {
  margin: 0,
  fontSize: 14,
  color: L.ivory,
  lineHeight: 1.4,
}

const muted = {
  margin: '0 0 20px',
  fontSize: 14,
  color: L.ivoryMuted,
  textAlign: 'center',
  lineHeight: 1.5,
}

const btnPrimary = {
  display: 'block',
  width: '100%',
  padding: '14px',
  borderRadius: 2,
  border: `1px solid ${L.ivory}`,
  background: L.ivory,
  color: L.ink,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  marginBottom: 10,
  WebkitTapHighlightColor: 'transparent',
}

const btnSecondary = {
  display: 'block',
  width: '100%',
  padding: '13px',
  borderRadius: 2,
  border: `1px solid ${L.champagneBorder}`,
  background: 'transparent',
  color: L.ivoryMuted,
  fontSize: 14,
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
}

const fraseText = {
  margin: '24px 0 0',
  fontSize: 13,
  color: L.ivoryFaint,
  lineHeight: 1.6,
  fontStyle: 'italic',
  textAlign: 'center',
}
