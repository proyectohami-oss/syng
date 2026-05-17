import { useState, useEffect } from 'react'
import { listenActivity, eventLabel, timeAgo } from '../core/services/activity.service'

export function ActivityFeed({ groupId }) {
  const [events, setEvents] = useState([])

  useEffect(() => {
    if (!groupId) return
    const unsub = listenActivity(groupId, setEvents)
    return () => unsub()
  }, [groupId])

  if (events.length === 0) return null

  return (
    <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:8, marginTop:4 }}>
      <p style={{ margin:'10px 20px 4px', fontSize:11, fontWeight:600, color:'#9ca3af', letterSpacing:'0.06em' }}>
        ACTIVIDAD RECIENTE
      </p>
      {events.map(ev => (
        <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 20px' }}>
          <div style={dot} />
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:0, fontSize:13, color:'#374151', lineHeight:1.4 }}>
              {eventLabel(ev)}
            </p>
          </div>
          <span style={{ fontSize:11, color:'#9ca3af', flexShrink:0 }}>
            {timeAgo(ev.createdAt)}
          </span>
        </div>
      ))}
    </div>
  )
}

const dot = { width:6, height:6, borderRadius:'50%', background:'#5B3DF6', flexShrink:0 }
