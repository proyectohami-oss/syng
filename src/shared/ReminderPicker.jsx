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
            <p style={title}>Hora de la tarea</p>
            {HORAS.map(h => (
              <button key={h.value} onClick={() => handleHora(h.value)} style={{
                ...optBtn,
                background: dueTime === h.value ? '#5B3DF6' : '#f3f4f6',
                color:      dueTime === h.value ? '#fff'    : '#111',
              }}>
                {h.label}
              </button>
            ))}
            <input type="time" onChange={e => handleHora(e.target.value)}
              style={{ width:'100%', boxSizing:'border-box', padding:'12px', borderRadius:12, border:'1.5px solid #e5e7eb', fontSize:16, fontFamily:'inherit', marginTop:4 }} />
            {!needHora && (
              <button onClick={() => setStep('offset')}
                style={{ ...optBtn, background:'#fff', color:'#9ca3af', border:'1.5px solid #e5e7eb', marginTop:4 }}>
                Atras
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
