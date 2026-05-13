/**
 * RepeatDayPicker — selector visual de días de repetición.
 * Estilo selección de asientos de cine: toca para marcar/desmarcar.
 * Navega entre meses. Atajos rápidos como opción secundaria.
 *
 * Props:
 *   selectedDays: Set<"YYYY-MM-DD">
 *   onChange: (Set<"YYYY-MM-DD">) => void
 *   onClose: () => void
 */
import { useState } from 'react'

const DAYS_HDR  = ['L','M','M','J','V','S','D']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const QUICK = [
  { label:'Todos los días',  build: (base) => buildPattern(base, [0,1,2,3,4,5,6]) },
  { label:'Entre semana',    build: (base) => buildPattern(base, [0,1,2,3,4]) },
  { label:'Fines de semana', build: (base) => buildPattern(base, [5,6]) },
]

function buildPattern(baseDate, dowList, weeks = 4) {
  const set = new Set()
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dow = (d.getDay() + 6) % 7 // 0=Mon
    if (dowList.includes(dow)) {
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      set.add(key)
    }
  }
  return set
}

function dateKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

export function RepeatDayPicker({ selectedDays, onChange, onClose }) {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [selected, setSelected] = useState(new Set(selectedDays))

  const year  = viewMonth.getFullYear()
  const month = viewMonth.getMonth()

  const firstDay   = new Date(year, month, 1)
  let startOffset  = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function toggle(d) {
    const key  = dateKey(year, month, d)
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setSelected(next)
  }

  function applyQuick(build) {
    const next = build(viewMonth)
    setSelected(next)
  }

  function handleConfirm() {
    onChange(selected)
    onClose()
  }

  const count = selected.size

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={sheet}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <span style={{ fontSize:16, fontWeight:600, color:'#111' }}>
            Elegir días de repetición
          </span>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, color:'#9ca3af', cursor:'pointer' }}>×</button>
        </div>

        {/* Atajos rápidos */}
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {QUICK.map(q => (
            <button
              key={q.label}
              onClick={() => applyQuick(q.build)}
              style={quickBtn}
            >
              {q.label}
            </button>
          ))}
          <button onClick={() => setSelected(new Set())} style={{ ...quickBtn, color:'#ef4444', borderColor:'#fecaca' }}>
            Limpiar
          </button>
        </div>

        {/* Navegación de mes */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <button
            onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1))}
            style={navBtn}
          >‹</button>
          <span style={{ fontSize:14, fontWeight:500, color:'#111' }}>
            {MONTHS_ES[month]} {year}
          </span>
          <button
            onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1))}
            style={navBtn}
          >›</button>
        </div>

        {/* Encabezados días */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:6 }}>
          {DAYS_HDR.map((d,i) => (
            <span key={i} style={{ fontSize:11, color:'#9ca3af', textAlign:'center', fontWeight:500 }}>{d}</span>
          ))}
        </div>

        {/* Celdas del calendario */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const key      = dateKey(year, month, day)
            const isChosen = selected.has(key)
            const isToday  = (() => {
              const t = new Date(); t.setHours(0,0,0,0)
              const dt = new Date(year, month, day)
              return dt.getTime() === t.getTime()
            })()
            return (
              <button
                key={i}
                onClick={() => toggle(day)}
                style={{
                  height: 38,
                  borderRadius: 10,
                  border: isToday && !isChosen ? '2px solid #5B3DF6' : '2px solid transparent',
                  background: isChosen ? '#5B3DF6' : 'transparent',
                  color:  isChosen ? '#fff' : '#111',
                  fontSize: 13,
                  fontWeight: isChosen ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'background 0.12s, transform 0.08s',
                  transform: isChosen ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* Contador + confirmación */}
        <div style={{ marginTop:20, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:13, color:'#6b7280' }}>
            {count === 0
              ? 'Ningún día seleccionado'
              : `${count} día${count!==1?'s':''} seleccionado${count!==1?'s':''}`}
          </span>
          <button
            onClick={handleConfirm}
            disabled={count === 0}
            style={{
              padding:'9px 20px', borderRadius:10,
              background: count > 0 ? '#5B3DF6' : '#e5e7eb',
              color: count > 0 ? '#fff' : '#9ca3af',
              border:'none', fontWeight:600, fontSize:14, cursor: count > 0 ? 'pointer' : 'default',
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
  position:'fixed', inset:0,
  background:'rgba(0,0,0,0.45)',
  display:'flex', alignItems:'flex-end', justifyContent:'center',
  zIndex:1100,
}
const sheet = {
  background:'#fff', borderRadius:'20px 20px 0 0',
  padding:'20px 20px 36px',
  width:'100%', maxWidth:480,
}
const quickBtn = {
  padding:'6px 12px', borderRadius:20,
  border:'1px solid #e5e7eb',
  background:'transparent',
  fontSize:12, color:'#374151',
  cursor:'pointer', whiteSpace:'nowrap',
}
const navBtn = {
  background:'none', border:'none',
  fontSize:20, color:'#6b7280',
  cursor:'pointer', padding:'4px 10px',
}
