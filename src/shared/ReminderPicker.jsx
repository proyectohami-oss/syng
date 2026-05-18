import { useState } from 'react'

const HORAS = [
  { label:'6:00 AM',  value:'06:00' },
  { label:'8:00 AM',  value:'08:00' },
  { label:'12:00 PM', value:'12:00' },
  { label:'3:00 PM',  value:'15:00' },
  { label:'6:00 PM',  value:'18:00' },
  { label:'9:00 PM',  value:'21:00' },
]

const OFFSETS = [
  { label:'15 min antes',         offsetMin: 15 },
  { label:'1 hora antes',         offsetMin: 60 },
  { label:'3 horas antes',        offsetMin: 180 },
  { label:'A la hora de la tarea', offsetMin: 0 },
]

function calcScheduledAt(dateStr, dueTime, offsetMin) {
  if (!dateStr || !dueTime) return null
  const [h, m] = dueTime.split(':').map(Number)
  const base   = new Date(dateStr + 'T00:00:00')
  base.setHours(h, m, 0, 0)
  base.setMinutes(base.getMinutes() - offsetMin)
  return base
}

export function ReminderPicker({ dateStr, reminder, onChange, onClose }) {
  const [step,     setStep]     = useState('offset')   // 'offset' | 'hora'
  const [dueTime,  setDueTime]  = useState(reminder?.dueTime || null)
  const [needHora, setNeedHora] = useState(false)

  function handleOffset(opt) {
    if (opt.offsetMin > 0 && !dueTime) {
      setNeedHora(true)
      setStep('hora')
      // guardamos el offset pendiente para aplicarlo despues
      setPendingOffset(opt)
      return
    }
    const scheduledAt = calcScheduledAt(dateStr, dueTime, opt.offsetMin)
    onChange({ label: opt.label, offsetMin: opt.offsetMin, dueTime: dueTime || null, scheduledAt })
    onClose()
  }

  const [pendingOffset, setPendingOffset] = useState(null)

  function handleHora(h) {
    setDueTime(h)
    setNeedHora(false)
    if (pendingOffset) {
      const scheduledAt = calcScheduledAt(dateStr, h, pendingOffset.offsetMin)
      onChange({ label: pendingOffset.label, offsetMin: pendingOffset.offsetMin, dueTime: h, scheduledAt })
      onClose()
    } else {
      setStep('offset')
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>

        {step === 'offset' && (
          <>
            <p style={title}>Recordatorio</p>
            {needHora && (
              <p style={{ fontSize:13, color:'#f59e0b', margin:'0 0 12px', textAlign:'center' }}>
                Selecciona una hora para usar este recordatorio.
              </p>
            )}
            {OFFSETS.map(opt => (
              <button key={opt.label} onClick={() => handleOffset(opt)} style={{
                ...optBtn,
                background: reminder?.label === opt.label ? '#5B3DF6' : '#f3f4f6',
                color:      reminder?.label === opt.label ? '#fff'    : '#111',
              }}>
                {opt.label}
              </button>
            ))}
            {dueTime && (
              <button onClick={() => setStep('hora')} style={{ ...optBtn, background:'#f3f4f6', color:'#5B3DF6', marginTop:4 }}>
                Hora: {HORAS.find(h => h.value === dueTime)?.label || dueTime} ›
              </button>
            )}
            <button onClick={() => { onChange(null); onClose() }}
              style={{ ...optBtn, background:'#fff', color:'#9ca3af', border:'1.5px solid #e5e7eb', marginTop:4 }}>
              Sin recordatorio
            </button>
          </>
        )}

        {step === 'hora' && (
          <>
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🕐</div>
              <p style={{ margin:0, fontSize:17, fontWeight:600, color:'#111' }}>Hora de la tarea</p>
              <p style={{ margin:'6px 0 0', fontSize:13, color:'#9ca3af' }}>
                {dueTime ? 'Hora seleccionada' : 'Elige a que hora realizaras esta tarea'}
              </p>
            </div>

            <div style={{ position:'relative', marginBottom:28 }}>
              <label style={{
                display:'flex', alignItems:'center', justifyContent:'center',
                width:'100%', padding:'18px 16px', borderRadius:14, boxSizing:'border-box',
                border:'1.5px solid ' + (dueTime ? '#5B3DF6' : '#e5e7eb'),
                background:'#fafafa', cursor:'pointer', minHeight:60,
              }}>
                <span style={{ fontSize: dueTime ? 24 : 15, fontWeight: dueTime ? 600 : 400, color: dueTime ? '#5B3DF6' : '#9ca3af', pointerEvents:'none' }}>
                  {dueTime || 'Selecciona el horario de tu tarea'}
                </span>
                <input
                  type="time"
                  value={dueTime || ''}
                  onChange={e => setDueTime(e.target.value)}
                  style={{ position:'absolute', opacity:0, top:0, left:0, width:'100%', height:'100%', cursor:'pointer' }}
                />
              </label>
            </div>

            <button
              onClick={() => dueTime && handleHora(dueTime)}
              disabled={!dueTime}
              style={{
                width:'100%', padding:'13px', borderRadius:12, border:'none',
                background: dueTime ? '#5B3DF6' : '#f3f4f6',
                color:      dueTime ? '#fff'    : '#c4c4c4',
                fontSize:15, fontWeight:600, cursor: dueTime ? 'pointer' : 'default',
                marginBottom: needHora ? 0 : 8,
              }}>
              Confirmar hora
            </button>

            {!needHora && (
              <button onClick={() => setStep('offset')}
                style={{ width:'100%', padding:'11px', borderRadius:12, border:'none', background:'none', color:'#9ca3af', fontSize:14, cursor:'pointer', marginTop:4 }}>
                ‹ Atras
              </button>
            )}
          </>
        )}

      </div>
    </div>
  )
}

const overlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:2000 }
const sheet   = { background:'#fff', borderRadius:'16px 16px 0 0', padding:'24px 20px 44px', width:'100%', maxWidth:480, maxHeight:'80svh', overflowY:'auto' }
const title   = { margin:'0 0 16px', fontSize:16, fontWeight:600, color:'#111', textAlign:'center' }
const optBtn  = { display:'block', width:'100%', padding:'14px', borderRadius:12, border:'none', fontSize:15, fontWeight:500, cursor:'pointer', marginBottom:8, textAlign:'left' }
