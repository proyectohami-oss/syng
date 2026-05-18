import { useState, useEffect } from 'react'
import { listenActivity, timeAgo } from '../core/services/activity.service'

const CONFIG = {
  task_created:   { icon:'＋', bg:'#EDE9FE', color:'#7C3AED' },
  task_completed: { icon:'✓',  bg:'#DCFCE7', color:'#16A34A' },
  member_joined:  { icon:'👋', bg:'#FEF3C7', color:'#D97706' },
  member_left:    { icon:'·',  bg:'#F3F4F6', color:'#9CA3AF' },
}

function label(ev) {
  const name   = ev.actorName || 'Alguien'
  const target = ev.targetName || ''
  switch (ev.type) {
    case 'task_created':   return { name, verb: 'creo',             target }
    case 'task_completed': return { name, verb: 'completo',         target }
    case 'member_joined':  return { name, verb: 'se unio al grupo', target: '' }
    case 'member_left':    return { name, verb: 'salio del grupo',  target: '' }
    default:               return { name, verb: 'hizo algo',        target: '' }
  }
}

function EventRow({ ev, index }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), index * 25)
    return () => clearTimeout(t)
  }, [])

  const cfg = CONFIG[ev.type] || CONFIG.task_created
  const lbl = label(ev)
  const time = timeAgo(ev.createdAt)

  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:12,
      padding:'10px 20px',
      opacity: show ? 1 : 0,
      transform: show ? 'none' : 'translateY(6px)',
      transition: 'opacity 0.25s ease, transform 0.25s ease',
    }}>
      <div style={{
        width:30, height:30, borderRadius:'50%', flexShrink:0,
        background: cfg.bg, color: cfg.color,
        fontSize: ev.type === 'member_joined' ? 13 : 12,
        fontWeight: 700,
        display:'flex', alignItems:'center', justifyContent:'center',
        marginTop:1,
      }}>
        {cfg.icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ margin:0, fontSize:13.5, color:'#1F2937', lineHeight:1.45 }}>
          <span style={{ fontWeight:700, color:'#111' }}>{lbl.name}</span>
          <span style={{ color:'#6B7280' }}> {lbl.verb}</span>
          {lbl.target
            ? <span style={{ fontWeight:500, color:'#5B3DF6' }}> &ldquo;{lbl.target}&rdquo;</span>
            : null}
        </p>
        <p style={{ margin:'3px 0 0', fontSize:11, color:'#C4C4C4', letterSpacing:'0.01em' }}>{time}</p>
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
    <div style={{ borderTop:'1px solid #F3F4F6', paddingTop:4, marginTop:8 }}>
      <p style={{ margin:'12px 20px 4px', fontSize:11, fontWeight:700, color:'#C4C4C4', letterSpacing:'0.08em' }}>
        ACTIVIDAD
      </p>

      {loaded && events.length === 0 && (
        <div style={{ padding:'20px 20px 16px', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'#F9FAFB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>
            ✨
          </div>
          <p style={{ margin:0, fontSize:13, color:'#C4C4C4', fontStyle:'italic' }}>
            Aun no hay actividad. Crea la primera tarea.
          </p>
        </div>
      )}

      <div>
        {events.map((ev, i) => (
          <EventRow key={ev.id} ev={ev} index={i} />
        ))}
      </div>
    </div>
  )
}
