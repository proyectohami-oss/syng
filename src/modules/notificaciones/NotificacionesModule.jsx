import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot, doc, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCoreAuth } from '../../core/hooks/useCoreData'
import { useNavigate } from 'react-router-dom'
import { A, L } from '../../shared/agendaEditorial'

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

function labelFor(type) {
  if (type?.startsWith('task.completed')) return 'Tarea'
  if (type?.startsWith('task.created'))   return 'Nueva'
  if (type?.startsWith('task.deleted'))   return 'Eliminada'
  if (type?.startsWith('member'))         return 'Miembro'
  if (type?.startsWith('payment'))        return 'Pago'
  return 'Aviso'
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
    <div style={A.screen}>

      <div style={A.header}>
        <span style={A.headerTitle}>Avisos</span>
        {unread > 0 && (
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: L.ink,
            background: L.champagne,
            borderRadius: 2,
            padding: '4px 10px',
          }}>{unread} nuevas</span>
        )}
      </div>

      <div style={{ ...A.body, padding: '0 16px 24px' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: L.ivoryMuted, fontSize: 14 }}>
            Cargando…
          </div>
        )}

        {!loading && notifs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: L.ivoryMuted }}>
            <p style={{ margin: 0, fontFamily: L.serif, fontSize: 22, color: L.ivory }}>Sin avisos</p>
            <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.5 }}>
              Aquí aparecerá la actividad de tus grupos
            </p>
          </div>
        )}

        {notifs.map(n => (
          <div
            key={n.id}
            onClick={() => (n.actionUrl || n.url) && navigate(n.actionUrl || n.url)}
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              padding: '14px 16px',
              marginBottom: 8,
              borderRadius: 2,
              ...(n.read ? A.notifRead : A.notifUnread),
              cursor: n.actionUrl ? 'pointer' : 'default',
            }}
          >
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: L.champagne,
              flexShrink: 0,
              marginTop: 3,
              minWidth: 52,
            }}>{labelFor(n.type)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: 0,
                fontSize: 14,
                fontWeight: n.read ? 400 : 500,
                color: L.ivory,
                lineHeight: 1.45,
              }}>
                {n.body || n.title}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: L.ivoryFaint }}>
                {timeAgo(n.createdAt)}
              </p>
            </div>
            {!n.read && (
              <div style={{ width: 6, height: 6, borderRadius: 2, background: L.champagne, flexShrink: 0, marginTop: 6 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
