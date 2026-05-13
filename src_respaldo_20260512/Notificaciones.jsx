import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { db } from './firebase'
import { collection, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore'

const ICONOS = { 'Pizarrón': '📅', 'Lista del Súper': '🛒', 'Mi Agenda': '🗓' }

export default function Notificaciones({ userId, tema }) {
  const [toast, setToast] = useState(null)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)
  const esOscuro = tema === 'oscuro'

  const mostrar = (data) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast(data)
    setVisible(true)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => setToast(null), 400)
    }, 4500)
  }

  useEffect(() => {
    if (!userId) return
    const unsubs = []
    const prevData = {}

    const suscribir = (colRef, grupoId, grupoNombre, modulo, miembros) => {
      let primera = true
      const unsub = onSnapshot(colRef, snap => {
        if (primera) {
          // Primera vez: solo guardamos el estado actual, sin notificar
          snap.docs.forEach(d => {
            const key = `${grupoId}-${modulo}-${d.id}`
            prevData[key] = (d.data()?.items || []).map(i => i.id)
          })
          primera = false
          return
        }
        // De aquí en adelante, sí notificamos cambios
        snap.docs.forEach(d => {
          const key = `${grupoId}-${modulo}-${d.id}`
          const items = d.data()?.items || []
          const prevIds = new Set(prevData[key] || [])
          const nuevos = items.filter(i =>
            i.id && !prevIds.has(i.id) && i.creadoPor && i.creadoPor !== userId
          )
          if (nuevos.length > 0) {
            const item = nuevos[0]
            const miembro = miembros.find(m => m.uid === item.creadoPor)
            const autor = miembro?.nombre || miembro?.email?.split('@')[0] || 'Un miembro'
            mostrar({ texto: item.texto || '', grupoNombre, modulo, autor })
          }
          prevData[key] = items.map(i => i.id)
        })
      })
      unsubs.push(unsub)
    }

    const cargar = async () => {
      try {
        const gsSnap = await getDocs(collection(db, 'users', userId, 'misGrupos'))
        for (const gDoc of gsSnap.docs) {
          const grupoId = gDoc.id
          const grupoNombre = gDoc.data().nombre || 'Grupo'
          const gSnap = await getDoc(doc(db, 'grupos', grupoId))
          if (!gSnap.exists()) continue
          const miembros = gSnap.data()?.miembros || []
          suscribir(collection(db, 'grupos', grupoId, 'pizarron'), grupoId, grupoNombre, 'Pizarrón', miembros)
          suscribir(collection(db, 'grupos', grupoId, 'lista'), grupoId, grupoNombre, 'Lista del Súper', miembros)
        }
      } catch (e) {
        console.error('Notificaciones error:', e)
      }
    }

    cargar()
    return () => {
      unsubs.forEach(u => u())
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [userId])

  if (!toast) return null

  const el = (
    <>
      <style>{`
        @keyframes syng-notif-bar {
          from { width: 100%; }
          to   { width: 0%;   }
        }
        @keyframes syng-notif-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1);    }
        }
      `}</style>

      <div
        onClick={() => { setVisible(false); setTimeout(() => setToast(null), 400) }}
        style={{
          position: 'fixed',
          top: visible ? 'calc(env(safe-area-inset-top, 0px) + 14px)' : '-140px',
          left: '50%',
          transform: 'translateX(-50%)',
          transition: 'top 0.45s cubic-bezier(0.34,1.56,0.64,1)',
          zIndex: 99999,
          maxWidth: '360px',
          width: 'calc(100% - 24px)',
          background: esOscuro
            ? 'rgba(20,20,48,0.97)'
            : 'rgba(255,255,255,0.97)',
          borderRadius: '22px',
          padding: '14px 16px 18px',
          boxShadow: esOscuro
            ? '0 8px 40px rgba(0,0,0,0.75), 0 0 0 1px rgba(123,110,246,0.3)'
            : '0 8px 40px rgba(0,0,0,0.13), 0 0 0 1px rgba(83,74,183,0.12)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          display: 'flex',
          alignItems: 'center',
          gap: '13px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Icono módulo */}
        <div style={{
          width: 46, height: 46, borderRadius: '14px',
          background: 'linear-gradient(135deg,#534AB7,#185FA5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', flexShrink: 0,
          boxShadow: '0 4px 14px rgba(83,74,183,0.45)',
        }}>
          {ICONOS[toast.modulo] || '🔔'}
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Grupo · Módulo */}
          <div style={{
            fontSize: '10px', fontWeight: '700', letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: esOscuro ? 'rgba(168,158,255,0.85)' : '#534AB7',
            marginBottom: '3px',
          }}>
            {toast.grupoNombre} · {toast.modulo}
          </div>
          {/* Quién */}
          <div style={{
            fontSize: '13px', fontWeight: '700',
            color: esOscuro ? '#F0F0FF' : '#1C1C2E',
            marginBottom: '2px',
          }}>
            {toast.autor} agregó una tarea
          </div>
          {/* Texto de la tarea */}
          <div style={{
            fontSize: '12px',
            color: esOscuro ? 'rgba(255,255,255,0.45)' : '#888',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            "{toast.texto}"
          </div>
        </div>

        {/* X cerrar */}
        <div style={{
          fontSize: '16px', color: esOscuro ? 'rgba(255,255,255,0.35)' : '#ccc',
          flexShrink: 0, lineHeight: 1, padding: '4px',
        }}>✕</div>

        {/* Barra de progreso */}
        <div style={{
          position: 'absolute', bottom: 0, left: '16px', right: '16px',
          height: '3px', borderRadius: '0 0 6px 6px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg,#534AB7,#185FA5)',
            borderRadius: '2px',
            animation: 'syng-notif-bar 4.5s linear forwards',
          }} />
        </div>
      </div>
    </>
  )

  return createPortal(el, document.body)
}
