import { useState } from 'react'

const DAYS_HDR  = ['L','M','M','J','V','S','D']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const QUICK = [
  { label:'Todos los días',  fn: (base) => buildPat(base,[0,1,2,3,4,5,6]) },
  { label:'Entre semana',    fn: (base) => buildPat(base,[0,1,2,3,4]) },
  { label:'Fines de semana', fn: (base) => buildPat(base,[5,6]) },
]

function buildPat(baseDate, dowList, weeks=4) {
  const set = new Set()
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
  for (let i=0; i<weeks*7; i++) {
    const d = new Date(start); d.setDate(start.getDate()+i)
    const dow = (d.getDay()+6)%7
    if (dowList.includes(dow)) {
      set.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)
    }
  }
  return set
}

function dKey(y,m,d) { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` }

export function RepeatDayPicker({ selectedDays, onChange, onClose }) {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected,  setSelected]  = useState(new Set(selectedDays))

  const year  = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstDay    = new Date(year, month, 1)
  let startOffset   = firstDay.getDay()-1
  if (startOffset<0) startOffset=6
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const cells = []
  for (let i=0; i<startOffset; i++) cells.push(null)
  for (let d=1; d<=daysInMonth; d++) cells.push(d)

  function toggle(d) {
    const key = dKey(year, month, d)
    const next = new Set(selected)
    next.has(key) ? next.delete(key) : next.add(key)
    setSelected(next)
  }

  function isToday(d) {
    const t = new Date(); t.setHours(0,0,0,0)
    const dt = new Date(year, month, d)
    return dt.getTime()===t.getTime()
  }

  const count = selected.size

  return (
    <div style={overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={sheet}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <span style={{ fontSize:16, fontWeight:600, color:'#111' }}>Elegir días de repetición</span>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:'#9ca3af', cursor:'pointer', padding:4, minWidth:44, minHeight:44, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {QUICK.map(q => (
            <button key={q.label} onClick={() => setSelected(q.fn(viewMonth))} style={quickBtn}>{q.label}</button>
          ))}
          <button onClick={() => setSelected(new Set())} style={{ ...quickBtn, color:'#ef4444', borderColor:'#fecaca' }}>Limpiar</button>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <button onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1))} style={navBtn}>‹</button>
          <span style={{ fontSize:14, fontWeight:500, color:'#111' }}>{MONTHS_ES[month]} {year}</span>
          <button onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1))} style={navBtn}>›</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:6 }}>
          {DAYS_HDR.map((d,i) => <span key={i} style={{ fontSize:11, color:'#9ca3af', textAlign:'center', fontWeight:500 }}>{d}</span>)}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const key     = dKey(year, month, day)
            const chosen  = selected.has(key)
            const todayD  = isToday(day)
            return (
              <button
                key={i}
                onClick={() => toggle(day)}
                style={{
                  height:40, borderRadius:10,
                  border: todayD && !chosen ? '2px solid #5B3DF6' : '2px solid transparent',
                  background: chosen ? '#5B3DF6' : 'transparent',
                  color:  chosen ? '#fff' : '#111',
                  fontSize:13, fontWeight: chosen ? 600 : 400,
                  cursor:'pointer',
                  WebkitTapHighlightColor:'transparent',
                }}
              >
                {day}
              </button>
            )
          })}
        </div>

        <div style={{ marginTop:20, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:13, color:'#6b7280' }}>
            {count===0 ? 'Ningún día seleccionado' : `${count} día${count!==1?'s':''} seleccionado${count!==1?'s':''}`}
          </span>
          {/* Fix 7: clean button styles, no gradients */}
          <button
            onClick={() => { onChange(selected); onClose() }}
            disabled={count===0}
            style={{
              padding:'10px 20px',
              borderRadius:10,
              border:'none',
              background: count>0 ? '#5B3DF6' : '#e5e7eb',
              color:      count>0 ? '#fff'    : '#9ca3af',
              fontWeight:600, fontSize:14,
              cursor: count>0 ? 'pointer' : 'default',
              WebkitAppearance:'none',
              boxShadow:'none',
              outline:'none',
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

const overlay  = { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1100 }
const sheet    = { background:'#fff', borderRadius:'20px 20px 0 0', padding:'20px 20px', paddingBottom:'calc(24px + env(safe-area-inset-bottom))', width:'100%', maxWidth:480 }
const quickBtn = { padding:'6px 12px', borderRadius:20, border:'1px solid #e5e7eb', background:'#fff', fontSize:12, color:'#374151', cursor:'pointer', whiteSpace:'nowrap', WebkitTapHighlightColor:'transparent' }
const navBtn   = { background:'none', border:'none', fontSize:22, color:'#6b7280', cursor:'pointer', padding:'4px 10px', minWidth:44, minHeight:44, display:'flex', alignItems:'center', justifyContent:'center', WebkitTapHighlightColor:'transparent' }
