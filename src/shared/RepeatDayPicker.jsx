import { useState } from 'react'
import { L } from './agendaEditorial'

const DAYS_HDR = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const QUICK = [
  { label: 'Todos los días', fn: (base) => buildPat(base, [0, 1, 2, 3, 4, 5, 6]) },
  { label: 'Entre semana', fn: (base) => buildPat(base, [0, 1, 2, 3, 4]) },
  { label: 'Fines de semana', fn: (base) => buildPat(base, [5, 6]) },
]

function buildPat(baseDate, dowList, weeks = 4) {
  const set = new Set()
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i)
    const dow = (d.getDay() + 6) % 7
    if (dowList.includes(dow)) {
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
  }
  return set
}

function dKey(y, m, d) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` }

export function RepeatDayPicker({ selectedDays, onChange, onClose }) {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(new Set(selectedDays))

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function toggle(d) {
    const key = dKey(year, month, d)
    const next = new Set(selected)
    next.has(key) ? next.delete(key) : next.add(key)
    setSelected(next)
  }

  function isToday(d) {
    const t = new Date(); t.setHours(0, 0, 0, 0)
    const dt = new Date(year, month, d)
    return dt.getTime() === t.getTime()
  }

  const count = selected.size

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={sheet}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 400, color: L.ivory, fontFamily: L.serif, letterSpacing: '-0.02em' }}>
            Elegir días de repetición
          </span>
          <button type="button" onClick={onClose} style={closeBtn}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {QUICK.map(q => (
            <button key={q.label} type="button" onClick={() => setSelected(q.fn(viewMonth))} style={quickBtn}>{q.label}</button>
          ))}
          <button type="button" onClick={() => setSelected(new Set())} style={{ ...quickBtn, color: '#fca5a5', borderColor: 'rgba(252,165,165,0.35)' }}>Limpiar</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button type="button" onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} style={navBtn}>‹</button>
          <span style={{ fontSize: 14, fontWeight: 500, color: L.ivory, fontFamily: L.serif }}>{MONTHS_ES[month]} {year}</span>
          <button type="button" onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} style={navBtn}>›</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
          {DAYS_HDR.map((d, i) => (
            <span key={i} style={{ fontSize: 10, color: L.champagne, textAlign: 'center', fontWeight: 500, letterSpacing: '0.06em' }}>{d}</span>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const key = dKey(year, month, day)
            const chosen = selected.has(key)
            const todayD = isToday(day)
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(day)}
                style={{
                  height: 40, borderRadius: 2,
                  border: todayD && !chosen ? `1px solid ${L.champagne}` : `1px solid transparent`,
                  background: chosen ? L.champagne : 'transparent',
                  color: chosen ? L.ink : L.ivory,
                  fontSize: 13, fontWeight: chosen ? 600 : 400,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                {day}
              </button>
            )
          })}
        </div>

        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: L.ivoryMuted }}>
            {count === 0 ? 'Ningún día seleccionado' : `${count} día${count !== 1 ? 's' : ''} seleccionado${count !== 1 ? 's' : ''}`}
          </span>
          <button
            type="button"
            onClick={() => { onChange(selected); onClose() }}
            disabled={count === 0}
            style={{
              padding: '10px 20px', borderRadius: 2,
              border: count > 0 ? `1px solid ${L.ivory}` : `1px solid ${L.champagneBorder}`,
              background: count > 0 ? L.ivory : L.champagneLight,
              color: count > 0 ? L.ink : L.ivoryFaint,
              fontWeight: 600, fontSize: 13, letterSpacing: '0.08em',
              cursor: count > 0 ? 'pointer' : 'default',
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1100,
}
const sheet = {
  background: L.inkSoft, borderRadius: '2px 2px 0 0',
  padding: '20px 20px calc(24px + env(safe-area-inset-bottom))',
  width: '100%', maxWidth: 480,
  borderTop: `1px solid ${L.champagneBorder}`,
}
const quickBtn = {
  padding: '6px 12px', borderRadius: 2, border: `1px solid ${L.champagneBorder}`,
  background: L.champagneLight, fontSize: 12, color: L.ivoryMuted, cursor: 'pointer',
  whiteSpace: 'nowrap', WebkitTapHighlightColor: 'transparent',
}
const navBtn = {
  background: 'none', border: 'none', fontSize: 22, color: L.champagne, cursor: 'pointer',
  padding: '4px 10px', minWidth: 44, minHeight: 44,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const closeBtn = {
  background: 'transparent', border: `1px solid ${L.champagneBorder}`, borderRadius: 2,
  fontSize: 18, color: L.ivoryMuted, cursor: 'pointer', padding: 4,
  minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
}
