import { useState } from 'react'

const OFFSETS = [
  { label:'15 min antes',          offsetMin: 15  },
  { label:'1 hora antes',          offsetMin: 60  },
  { label:'3 horas antes',         offsetMin: 180 },
  { label:'A la hora de la tarea', offsetMin: 0   },
]

function calcScheduledAt(dateStr, dueTime, offsetMin) {
  if (!dateStr || !dueTime) return null
  const [h, m] = dueTime.split(':').map(Number)
  const base   = new Date(dateStr + 'T00:00:00')
  base.setHours(h, m, 0, 0)
  base.setMinutes(base.getMinutes() - offsetMin)
  return base
}

function formatTime(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`
}

export function ReminderPicker({ dateStr, reminder, onChange, onClose }) {
  const [step,          setStep]          = useState('offset')
  const [dueTime,       setDueTime]       = useState(reminder?.dueTime || null)
  const [pendingOffset, setPendingOffset] = useState(null)

  function handleOffset(opt) {
    if (opt.offsetMin > 0 && !dueTime) {
      setPendingOffset(opt)
      setStep('hora')
      return
    }
    const scheduledAt = calcScheduledAt(dateStr, dueTime, opt.offsetMin)
    onChange({ label: opt.label, offsetMin: opt.offsetMin, dueTime: dueTime || null, scheduledAt })
    onClose()
  }

  function handleConfirmarHora() {
    if (!dueTime) return
    if (pendingOffset) {
      const scheduledAt = calcScheduledAt(dateStr, dueTime, pendingOffset.offsetMin)
      onChange({ label: pendingOffset.label, offsetMin: pendingOffset.offsetMin, dueTime, scheduledAt })
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
              <button onClick={() => setStep('hora')} style={{ ...optBtn, background:'#EDE9FE', color:'#5B3DF6', marginTop:4 }}>
                🕐 {formatTime(dueTime)} ›
              </button>
            )}

            <button onClick={() => { onChange(null); onClose() }}
              style={{ ...optBtn, background:'none', color:'#9ca3af', border:'none', marginTop:4, textAlign:'center' }}>
              Sin recordatorio
            </button>
          </>
        )}

        {step === 'hora' && (
          <>
            <p style={title}>¿A qué hora es la tarea?</p>

            <label style={{
              display:'flex', alignItems:'center', justifyContent:'center',
              position:'relative', width:'100%', minHeight:64, borderRadius:16,
              border:'1.5px solid ' + (dueTime ? '#5B3DF6' : '#e5e7eb'),
              background:'#fafafa', cursor:'pointer', marginBottom:20,
              boxSizing:'border-box',
            }}>
              <span style={{
                fontSize: dueTime ? 26 : 16,
                fontWeight: dueTime ? 700 : 400,
                color: dueTime ? '#5B3DF6' : '#9ca3af',
                pointerEvents:'none',
              }}>
                {dueTime ? formatTime(dueTime) : 'Toca para elegir la hora'}
              </span>
              <input
                type="time"
                value={dueTime || ''}
                onChange={e => setDueTime(e.target.value)}
                style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' }}
              />
            </label>

            <button onClick={handleConfirmarHora} disabled={!dueTime} style={{
              width:'100%', padding:'14px', borderRadius:12, border:'none',
              background: dueTime ? '#5B3DF6' : '#f3f4f6',
              color:      dueTime ? '#fff'    : '#c4c4c4',
              fontSize:15, fontWeight:600, cursor: dueTime ? 'pointer' : 'default',
              marginBottom:8,
            }}>
              Confirmar
            </button>

            {!pendingOffset && (
              <button onClick={() => setStep('offset')} style={{
                width:'100%', padding:'11px', borderRadius:12,
                border:'none', background:'none', color:'#9ca3af', fontSize:14, cursor:'pointer',
              }}>
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
const title   = { margin:'0 0 20px', fontSize:17, fontWeight:600, color:'#111', textAlign:'center' }
const optBtn  = { display:'block', width:'100%', padding:'14px', borderRadius:12, border:'none', fontSize:15, fontWeight:500, cursor:'pointer', marginBottom:8, textAlign:'left' }
