import { useState, useRef, useEffect } from 'react'
import { Timestamp } from 'firebase/firestore'

/* ── Datos ── */
const WHEEL_DAYS    = Array.from({length:31},(_,i)=>i)
const WHEEL_AHEAD_H = Array.from({length:24},(_,i)=>i)
const WHEEL_AHEAD_M = Array.from({length:60},(_,i)=>i)
const WHEEL_HOURS   = Array.from({length:12},(_,i)=>i+1)
const WHEEL_MINS    = Array.from({length:60},(_,i)=>i)
const WHEEL_AMPM    = ['AM','PM']

const ITEM_H = 42

/* ── Helpers para pre-cargar ── */
function parseOffsetMin(offsetMin) {
  if (!offsetMin) return { d:0, h:1, m:0 }
  const d     = Math.floor(offsetMin / 1440)
  const rem   = offsetMin % 1440
  const h     = Math.floor(rem / 60)
  const m     = rem % 60
  const snapM = m
  return { d, h, m: snapM }
}

function parseDueTime(dueTime) {
  if (!dueTime) return { h:8, m:0, ampm:'AM' }
  const [hh, mm] = dueTime.split(':').map(Number)
  const ampm  = hh >= 12 ? 'PM' : 'AM'
  const h12   = hh % 12 || 12
  const snapM = mm
  const snapH = WHEEL_HOURS.includes(h12) ? h12 : 8
  return { h: snapH, m: snapM, ampm }
}

/* ── Columna rueda ── */
function WheelCol({ items, value, onChange, format, label }) {
  const ref = useRef(null)
  const idx = items.indexOf(value)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = idx * ITEM_H
  }, [])

  function handleScroll() {
    if (!ref.current) return
    const newIdx  = Math.round(ref.current.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(items.length - 1, newIdx))
    if (items[clamped] !== value) onChange(items[clamped])
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
      {label && <p style={{ margin:'0 0 4px', fontSize:10, fontWeight:600, color:'rgba(13,18,64,0.32)', letterSpacing:'0.08em', textAlign:'center' }}>{label}</p>}
      <div style={{ position:'relative', height: ITEM_H * 5, width:'100%', overflow:'hidden' }}>
        <div style={{ position:'absolute', left:4, right:4, top: ITEM_H * 2, height: ITEM_H, background:'rgba(45,58,140,0.08)', borderRadius:12, pointerEvents:'none', zIndex:1 }} />
        <div style={{ position:'absolute', top:0, left:0, right:0, height: ITEM_H * 2, background:'linear-gradient(to bottom, rgba(250,251,255,1), rgba(250,251,255,0))', pointerEvents:'none', zIndex:2 }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height: ITEM_H * 2, background:'linear-gradient(to top, rgba(250,251,255,1), rgba(250,251,255,0))', pointerEvents:'none', zIndex:2 }} />
        <div ref={ref} onScroll={handleScroll} style={{ height:'100%', overflowY:'scroll', scrollSnapType:'y mandatory', WebkitOverflowScrolling:'touch', scrollbarWidth:'none', msOverflowStyle:'none', paddingTop: ITEM_H * 2, paddingBottom: ITEM_H * 2, boxSizing:'border-box' }}>
          {items.map((item, i) => (
            <div key={i} onClick={() => { onChange(item); if(ref.current) ref.current.scrollTop = i * ITEM_H }}
              style={{ height: ITEM_H, display:'flex', alignItems:'center', justifyContent:'center', scrollSnapAlign:'center', fontSize: item === value ? 24 : 17, fontWeight: item === value ? 700 : 400, color: item === value ? '#0D1240' : 'rgba(13,18,64,0.22)', cursor:'pointer', transition:'all 0.15s ease', userSelect:'none', WebkitUserSelect:'none', textAlign:'center', width:'100%' }}
            >
              {format ? format(item) : item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Helpers ── */
function buildLabel(d, h, m) {
  const parts = []
  if (d > 0) parts.push(`${d} día${d !== 1 ? 's' : ''}`)
  if (h > 0) parts.push(`${h} hora${h !== 1 ? 's' : ''}`)
  if (m > 0) parts.push(`${m} min`)
  return parts.length === 0 ? 'a la hora exacta' : parts.join(', ') + ' antes'
}

function to24min(h12, min, ampm) {
  let h = h12 % 12
  if (ampm === 'PM') h += 12
  return h * 60 + min
}

function formatFromMin(totalMin) {
  const norm = ((totalMin % 1440) + 1440) % 1440
  const h    = Math.floor(norm / 60)
  const m    = norm % 60
  const ap   = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return `${h12}:${String(m).padStart(2,'0')} ${ap}`
}

function calcNotify(dateStr, taskMin, offsetMin) {
  if (!dateStr) return null
  return formatFromMin(taskMin - offsetMin)
}

/* ── Componente principal ── */
export function ReminderPicker({ dateStr, reminder, onChange, onClose }) {
  const initOffset = parseOffsetMin(reminder?.offsetMin)
  const initTime   = parseDueTime(reminder?.dueTime)
  const initStep   = reminder ? 'hora' : 'offset'

  const [step,   setStep]   = useState(initStep)
  const [aDays,  setADays]  = useState(initOffset.d)
  const [aHours, setAHours] = useState(initOffset.h)
  const [aMins,  setAMins]  = useState(initOffset.m)
  const [wHour,  setWHour]  = useState(initTime.h)
  const [wMin,   setWMin]   = useState(initTime.m)
  const [wAmpm,  setWAmpm]  = useState(initTime.ampm)

  const totalOffsetMin = aDays * 1440 + aHours * 60 + aMins
  const taskMin        = to24min(wHour, wMin, wAmpm)
  const notifyTime     = calcNotify(dateStr, taskMin, totalOffsetMin)
  const taskTimeStr    = `${wHour}:${String(wMin).padStart(2,'0')} ${wAmpm}`

  function handleConfirm() {
    const hh      = Math.floor(taskMin / 60)
    const mm      = taskMin % 60
    const dueTime = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`
    const label   = buildLabel(aDays, aHours, aMins)
    const scheduledAt = dateStr ? (() => {
      const base = new Date(dateStr + 'T00:00:00')
      base.setMinutes(taskMin - totalOffsetMin)
      return Timestamp.fromDate(base)
    })() : null
    onChange({ label, offsetMin: totalOffsetMin, dueTime, scheduledAt })
    onClose()
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>

        {/* ── PASO 1 ── */}
        {step === 'offset' && (
          <>
            <p style={title}>¿Cuánto antes avisar?</p>
            <div style={{ display:'flex', gap:4, marginBottom:10 }}>
              <WheelCol items={WHEEL_DAYS}    value={aDays}  onChange={setADays}  label="DÍAS"  format={v=>v} />
              <WheelCol items={WHEEL_AHEAD_H} value={aHours} onChange={setAHours} label="HORAS" format={v=>v} />
              <WheelCol items={WHEEL_AHEAD_M} value={aMins}  onChange={setAMins}  label="MIN"   format={v=>String(v).padStart(2,'0')} />
            </div>
            <p style={{ textAlign:'center', fontSize:14, fontWeight:600, color:'#2D3A8C', marginBottom:20 }}>
              {buildLabel(aDays, aHours, aMins)}
            </p>
            <button onClick={() => setStep('hora')} style={btnPrimary}>Siguiente →</button>
            <button onClick={() => { onChange(null); onClose() }} style={btnGhost}>Sin recordatorio</button>
          </>
        )}

        {/* ── PASO 2 ── */}
        {step === 'hora' && (
          <>
            <p style={title}>¿A qué hora es la tarea?</p>

            {/* Ruedas */}
            <div style={{ display:'flex', gap:4, marginBottom:16 }}>
              <WheelCol items={WHEEL_HOURS} value={wHour} onChange={setWHour} label="HORA"  format={v=>v} />
              <WheelCol items={WHEEL_MINS}  value={wMin}  onChange={setWMin}  label="MIN"   format={v=>String(v).padStart(2,'0')} />
              <WheelCol items={WHEEL_AMPM}  value={wAmpm} onChange={setWAmpm} label="AM/PM" />
            </div>

            {/* Jerarquía iOS — sin cajas, tipografía flotante */}
            <div style={{ textAlign:'center', marginBottom:20 }}>
              {/* Hora de la tarea — protagonista */}
              <p style={{ margin:'0 0 2px', fontSize:11, fontWeight:600, color:'rgba(13,18,64,0.32)', letterSpacing:'0.08em' }}>HORA DE LA TAREA</p>
              <p style={{ margin:'0 0 14px', fontSize:38, fontWeight:700, color:'#0D1240', letterSpacing:'-0.03em', lineHeight:1 }}>
                {taskTimeStr}
              </p>
              {/* Separador sutil */}
              <div style={{ width:40, height:1, background:'rgba(13,18,64,0.10)', margin:'0 auto 14px' }} />
              {/* Hora del aviso — secundaria */}
              <p style={{ margin:'0 0 2px', fontSize:11, fontWeight:600, color:'rgba(13,18,64,0.32)', letterSpacing:'0.08em' }}>AVISO</p>
              <p style={{ margin:0, fontSize:22, fontWeight:600, color:'#2D3A8C', letterSpacing:'-0.02em' }}>
                {notifyTime || '—'}
              </p>
              <p style={{ margin:'2px 0 0', fontSize:12, color:'rgba(13,18,64,0.38)' }}>
                {buildLabel(aDays, aHours, aMins)}
              </p>
            </div>

            <button onClick={handleConfirm} style={btnPrimary}>Confirmar recordatorio</button>
            <button onClick={() => setStep('offset')} style={btnGhost}>‹ Cambiar tiempo de aviso</button>
            <button onClick={() => { onChange(null); onClose() }} style={{ ...btnGhost, color:'rgba(13,18,64,0.25)', fontSize:12 }}>Quitar recordatorio</button>
          </>
        )}

      </div>
    </div>
  )
}

const overlay    = { position:'fixed', inset:0, background:'rgba(13,18,64,0.30)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:2000 }
const sheet      = { background:'rgba(250,251,255,0.97)', backdropFilter:'blur(48px)', WebkitBackdropFilter:'blur(48px)', borderRadius:'24px 24px 0 0', padding:'20px 20px calc(32px + env(safe-area-inset-bottom))', width:'100%', maxWidth:480, boxShadow:'0 -8px 48px rgba(13,18,64,0.12)' }
const title      = { margin:'0 0 12px', fontSize:16, fontWeight:600, color:'#0D1240', textAlign:'center', letterSpacing:'-0.01em' }
const btnPrimary = { display:'block', width:'100%', padding:'13px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#3D4FA8,#2D3A8C)', color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer', marginBottom:6, boxShadow:'0 4px 16px rgba(45,58,140,0.28)', WebkitTapHighlightColor:'transparent' }
const btnGhost   = { display:'block', width:'100%', padding:'10px', borderRadius:14, border:'none', background:'none', color:'rgba(13,18,64,0.38)', fontSize:13, cursor:'pointer', WebkitTapHighlightColor:'transparent' }
