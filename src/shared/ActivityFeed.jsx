import { useState, useEffect } from 'react'
import { listenActivity, eventLabel, timeAgo } from '../core/services/activity.service'

const ICONS = {
  task_created:   '+',
  task_completed: '✓',
  member_joined:  '👋',
  member_left:    '·',
}

function EventRow({ ev, isNew }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [])

  const icon   = ICONS[ev.type] || '·'
  const name   = ev.actorName || 'Alguien'
  const target = ev.targetName || ''
  const time   = timeAgo(ev.createdAt)

  let nameEl   = <span style={{ fontWeight:600, color:'#111' }}>{name}</span>
  let action   = ''
  let targetEl = null

  switch (ev.type) {
    case 'task_created':
      action  = ' creo '
      targetEl = target ? <span style={{ color:'#5B3DF6', fontWeight:500 }}>"{target}"</span> : null
      break
    case 'task_completed':
      action  = ' completo '
      targetEl = target ? <span style={{ color:'#22c55e', fontWeight:500 }}>"{target}"</span> : null
      break
    case 'member_joined':
      action = ' se unio al grupo'
      break
    case 'member_left':
      action = ' salio del grupo'
      break
    default:
      action = ' hizo algo'
  }

  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:10, padding:'10px 20px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(6px)',
      transition: 'opacity 0.25s ease, transform 0.25s ease',
    }}>
      <div style={{
        width:28, height:28, borderRadius:'50%', flexShrink:0,
        background: ev.type === 'task_completed' ? '#f0fdf4' : ev.type === 'member_joined' ? '#EDE9FE' : '#f3f4f6',
        color: ev.type === 'task_completed' ? '#22c55e' : ev.type === 'member_joined' ? '#5B3DF6' : '#9ca3af',
        fontSize: ev.type === 'task_created' ? 16 : 13,
        fontWeight:700,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ margin:0, fontSize:13, color:'#374151', lineHeight:1.5 }}>
          {nameEl}{action}{targetEl}
        </p>
        <p style={{ margin:'2px 0 0', fontSize:11, color:'#9ca3af' }}>{time}</p>
      </div>
    </div>
  )
}

export function ActivityFeed({ groupId }) {
  const [events,  setEvents]  = useState([])
  const [newIds,  setNewIds]  = useState(new Set())
  const [loaded,  setLoaded]  = useState(false)

  useEffect(() => {
    if (!groupId) return
    let first = true
    const unsub = listenActivity(groupId, evs => {
      if (first) {
        first = false
        setEvents(evs)
        setLoaded(true)
        return
      }
      setEvents(prev => {
        const prevIds = new Set(prev.map(e => e.id))
        const fresh   = evs.filter(e => !prevIds.has(e.id))
        if (fresh.length > 0) setNewIds(ids => new Set([...ids, ...fresh.map(e => e.id)]))
        return evs
      })
    })
    return () => unsub()
  }, [groupId])

  return (
    <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:4, marginTop:4 }}>
      <p style={{ margin:'12px 20px 4px', fontSize:11, fontWeight:600, color:'#9ca3af', letterSpacing:'0.06em' }}>
        ACTIVIDAD RECIENTE
      </p>

      {loaded && events.length === 0 && (
        <div style={{ padding:'16px 20px', textAlign:'center' }}>
          <p style={{ margin:0, fontSize:13, color:'#d1d5db', fontStyle:'italic' }}>
            Aun no hay actividad en este grupo.
          </p>
        </div>
      )}

      {events.map(ev => (
        <EventRow key={ev.id} ev={ev} isNew={newIds.has(ev.id)} />
      ))}
    </div>
  )
}
