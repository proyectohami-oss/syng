import { useEffect, useState, CSSProperties } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'

interface Task {
  id: string
  title: string
  description?: string
  groupId?: string
  dueDate?: Timestamp
  reminderTime?: Timestamp
  status?: string
}

const DEMO: Task = {
  id: 'prueba',
  title: 'Comprar ingredientes para la cena',
  description: 'Diseño premium activo',
  status: 'pending',
}

function formatDue(dueDate?: Timestamp): string | null {
  if (!dueDate) return null
  const fecha = dueDate.toDate()
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1)
  if (fecha < hoy) return 'Vencida'
  if (fecha.toDateString() === hoy.toDateString()) return 'Vence hoy'
  if (fecha.toDateString() === manana.toDateString()) return 'Vence mañana'
  const dias = Math.ceil((fecha.getTime() - hoy.getTime()) / 86400000)
  return `Vence en ${dias} días`
}

export default function RecordatorioView() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate     = useNavigate()
  const isDemo       = taskId === 'prueba'
  const [task, setTask] = useState<Task | null>(isDemo ? DEMO : null)

  useEffect(() => {
    if (isDemo || !taskId) return
    getDoc(doc(db, 'tasks', taskId)).then(snap => {
      if (snap.exists()) setTask({ id: snap.id, ...snap.data() } as Task)
    })
  }, [taskId, isDemo])

  async function completar() {
    if (!isDemo && taskId) {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
    navigate('/agenda')
  }

  if (!task) return (
    <div style={s.stage}>
      <div style={s.orb1} /><div style={s.orb2} />
    </div>
  )

  const venceLabel = formatDue(task.dueDate)
  const esGrupo    = !!task.groupId

  return (
    <div style={s.stage}>
      <div style={s.orb1} /><div style={s.orb2} />

      <div style={s.top}>
        <div style={s.logoBox}>S</div>
        <p style={s.badge}>Recordatorio</p>
      </div>

      <div style={s.center}>
        <h1 style={s.title}>{task.title}</h1>
        <p style={s.sub}>{task.description || 'Es momento de retomarlo.'}</p>
        <div style={s.meta}>
          {venceLabel && (
            <span style={{ ...s.tag, ...(venceLabel.includes('Venc') ? s.tagRed : s.tagMuted) }}>
              {venceLabel}
            </span>
          )}
          <span style={{ ...s.tag, ...s.tagMuted }}>{esGrupo ? 'Grupo' : 'Personal'}</span>
        </div>
      </div>

      <div style={s.footer}>
        <button type="button" style={s.btnPrimary} onClick={completar}>Abrir tarea</button>
        <button type="button" style={s.btnSecondary} onClick={() => navigate('/agenda')}>Posponer</button>
      </div>
    </div>
  )
}

const s: Record<string, CSSProperties> = {
  stage: {
    position: 'fixed', inset: 0, zIndex: 999,
    background: '#0A0A0A', color: '#fff',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
    padding: '48px 28px 40px', overflow: 'hidden',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif',
  },
  orb1: {
    position: 'absolute', width: 400, height: 400, borderRadius: '50%', pointerEvents: 'none',
    background: 'radial-gradient(circle,rgba(45,58,140,0.16) 0%,transparent 68%)', top: -100, left: -80,
  },
  orb2: {
    position: 'absolute', width: 300, height: 300, borderRadius: '50%', pointerEvents: 'none',
    background: 'radial-gradient(circle,rgba(127,119,221,0.08) 0%,transparent 70%)', bottom: -40, right: -50,
  },
  top: { textAlign: 'center', position: 'relative', zIndex: 1 },
  logoBox: {
    width: 64, height: 64, borderRadius: 18, background: '#fff', color: '#0A0A0A',
    fontSize: 26, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 12px', boxShadow: '0 8px 32px rgba(127,119,221,0.2)',
  },
  badge: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase',
    color: 'rgba(175,169,236,0.65)', margin: 0,
  },
  center: { textAlign: 'center', padding: '0 8px', position: 'relative', zIndex: 1, maxWidth: 360 },
  title: {
    fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.025em',
    margin: '0 0 12px', color: '#FAFAFA',
  },
  sub: { fontSize: 17, color: 'rgba(255,255,255,0.42)', lineHeight: 1.5, margin: '0 0 20px' },
  meta: { display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  tag: { padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1px solid rgba(255,255,255,0.08)' },
  tagRed: { background: 'rgba(255,80,80,0.12)', color: '#FF9B9B' },
  tagMuted: { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)' },
  footer: { width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 },
  btnPrimary: {
    width: '100%', padding: 18, borderRadius: 18, border: 'none', cursor: 'pointer',
    background: '#fff', color: '#0A0A0A', fontSize: 17, fontWeight: 700,
  },
  btnSecondary: {
    width: '100%', padding: 16, borderRadius: 18, cursor: 'pointer',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: 15, fontWeight: 500,
  },
}
