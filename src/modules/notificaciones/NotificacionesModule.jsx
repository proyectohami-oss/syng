import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCoreAuth } from '../../core/hooks/useCoreData'
import { useNavigate } from 'react-router-dom'

function timeAgo(ts) {
  if (!ts) return ''
  const ms   = Date.now() - (ts.toMillis ? ts.toMillis() : new Date(ts).getTime())
  const min  = Math.floor(ms / 60000)
  const h    = Math.floor(ms / 3600000)
  const days = Math.floor(ms / 86400000)
  if (min < 1)    return 'ahora'
  if (min < 60)   return `hace ${min} min`
  if (h < 24)     return `hace ${h}h`
  if (days === 1) return 'ayer'
  return `hace ${days} días`
}

function iconFor(type) {
  if (type?.startsWith('task.completed')) return '✅'
  if (type?.startsWith('task.created'))   return '📝'
  if (type?.startsWith('task.deleted'))   return '🗑️'
  if (type?.startsWith('member'))         return '👤'
  if (type?.startsWith('payment'))        return '💳'
  return '🔔'
}

export function NotificacionesModule() {
  const auth     = useCoreAuth()
  const uid      = auth.user?.uid
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(db, `users/${uid}/notifications`),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    const unsub = onSnapshot(q, snap => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [uid])

  // Marcar todas como leídas al entrar
  useEffect(() => {
    if (!uid || !notifs.length) return
    const unread = notifs.filter(n => !n.read)
    if (!unread.length) return
    const batch = writeBatch(db)
    unread.forEach(n => batch.update(doc(db, `users/${uid}/notifications`, n.id), { read: true }))
    batch.commit()
  }, [uid, notifs])

  const unread = notifs.filter(n => !n.read).length

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'transparent' }}>

      {/* Header */}
      <div style={{ padding:'20px 20px 12px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:'#0D1240' }}>Notificaciones</h1>
          {unread > 0 && (
            <span style={{
              background:'#2D3A8C', color:'#fff',
              fontSize:12, fontWeight:700,
              borderRadius:20, padding:'3px 10px',
            }}>{unread} nuevas</span>
          )}
        </div>
      </div>

      {/* Lista */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 24px' }}>

        {loading && (
          <div style={{ textAlign:'center', padding:40, color:'rgba(13,18,64,0.4)', fontSize:14 }}>
            Cargando…
          </div>
        )}

        {!loading && notifs.length === 0 && (
          <div style={{ textAlign:'center', padding:60, color:'rgba(13,18,64,0.4)' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔔</div>
            <p style={{ margin:0, fontSize:16, fontWeight:500 }}>Sin notificaciones</p>
            <p style={{ margin:'6px 0 0', fontSize:13 }}>Aquí aparecerá la actividad de tus grupos</p>
          </div>
        )}

        {notifs.map(n => (
          <div
            key={n.id}
            onClick={() => n.actionUrl && navigate(n.actionUrl)}
            style={{
              display:'flex', gap:12, alignItems:'flex-start',
              padding:'14px 16px', marginBottom:8,
              borderRadius:16,
              background: n.read ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.95)',
              boxShadow: n.read ? '0 1px 4px rgba(13,18,64,0.05)' : '0 2px 12px rgba(13,18,64,0.10)',
              border: n.read ? '1px solid rgba(13,18,64,0.06)' : '1px solid rgba(45,58,140,0.15)',
              cursor: n.actionUrl ? 'pointer' : 'default',
              transition: 'opacity 0.15s',
            }}
          >
            <span style={{ fontSize:24, lineHeight:1, flexShrink:0, marginTop:2 }}>{iconFor(n.type)}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:0, fontSize:14, fontWeight: n.read ? 400 : 600, color:'#0D1240', lineHeight:1.4 }}>
                {n.body}
              </p>
              <p style={{ margin:'4px 0 0', fontSize:12, color:'rgba(13,18,64,0.4)' }}>
                {timeAgo(n.createdAt)}
              </p>
            </div>
            {!n.read && (
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#2D3A8C', flexShrink:0, marginTop:6 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
