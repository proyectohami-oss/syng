import { useState, useEffect } from 'react'
import { listenActivity, timeAgo } from '../core/services/activity.service'

const CONFIG = {
  task_created:   { icon:'＋', bg:'#f5f5f7', color:'#8b8b8b' },
  task_completed: { icon:'✓',  bg:'#f0fdf4', color:'#86efac' },
  member_joined:  { icon:'·',  bg:'#f5f3ff', color:'#a78bfa' },
  member_left:    { icon:'·',  bg:'#f5f5f7', color:'#d1d5db' },
}

function label(ev) {
  const name   = ev.actorName || 'Alguien'
  const target = ev.targetName || ''
  switch (ev.type) {
    case 'task_created':   return { name, verb: 'creo',               target }
    case 'task_completed': return { name, verb: 'completo',           target }
    case 'member_joined':  return { name, verb: 'se unio al grupo',   target: '' }
    case 'member_left':    return { name, verb: 'salio del grupo',    target: '' }
    default:               return { name, verb: 'hizo algo',          target: '' }
  }
}

function EventRow({ ev, index }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), index * 30)
    return () => clearTimeout(t)
  }, [])

  const cfg  = CONFIG[ev.type] || CONFIG.task_created
  const lbl  = label(ev)
  const time = timeAgo(ev.createdAt)

  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:0,
      opacity: show ? 1 : 0,
      transform: show ? 'none' : 'translateY(4px)',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
    }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:40, flexShrink:0 }}>
        <div style={{ width:1, height:8, background:'#f0f0f0' }} />
        <div style={{
          width:22, height:22, borderRadius:'50%',
          background: cfg.bg, color: cfg.color,
          fontSize:11, fontWeight:700,
          display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0,
        }}>
          {cfg.icon}
        </div>
        <div style={{ width:1, flex:1, background:'#f0f0f0', minHeight:8 }} />
      </div>
      <div style={{ flex:1, minWidth:0, padding:'6px 16px 6px 0' }}>
        <p style={{ margin:0, fontSize:13, color:'#374151', lineHeight:1.4 }}>
          <span style={{ fontWeight:600, color:'#111' }}>{lbl.name}</span>
          {' '}{lbl.verb}
          {lbl.target ? <span style={{ color:'#5B3DF6' }}> "{lbl.target}"</span> : ''}
        </p>
        <p style={{ margin:'2px 0 0', fontSize:11, color:'#c4c4c4', letterSpacing:'0.01em' }}>{time}</p>
      </div>
    </div>
  )
}

export function ActivityFeed({ groupId }) {
  const [events, setEvents] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!groupId) return
    let first = true
    const unsub = listenActivity(groupId, evs => {
      setEvents(evs)
      if (first) { first = false; setLoaded(true) }
    })
    return () => unsub()
  }, [groupId])

  return (
    <div style={{ borderTop:'1px solid #f9fafb', paddingTop:8, marginTop:4 }}>
      <p style={{ margin:'8px 20px 4px', fontSize:11, fontWeight:600, color:'#c4c4c4', letterSpacing:'0.08em' }}>
        ACTIVIDAD
      </p>

      {loaded && events.length === 0 && (
        <p style={{ margin:'8px 20px 16px', fontSize:13, color:'#e5e7eb', fontStyle:'italic' }}>
          Aun no hay actividad en este grupo.
        </p>
      )}

      <div style={{ paddingLeft:20 }}>
        {events.map((ev, i) => (
          <EventRow key={ev.id} ev={ev} index={i} />
        ))}
      </div>
    </div>
  )
}
