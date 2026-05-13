/**
 * TaskForm — create or edit a task (modal).
 *
 * Create mode: pass type and optionally groupId. No task prop.
 * Edit mode:   pass the existing task object.
 *
 * The form itself never knows about Firestore.
 * It calls useTasks() to dispatch optimistic updates.
 */
import { useState }   from 'react'
import { Timestamp }  from 'firebase/firestore'
import { useTasks }   from '../core/hooks/useTasks'

export function TaskForm({ task, type, groupId, onClose }) {
  const { createTask, updateTask } = useTasks()
  const isEdit = !!task

  const [title,       setTitle]       = useState(task?.title       ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [dueDate,     setDueDate]     = useState(
    task?.dueDate ? task.dueDate.toDate().toISOString().split('T')[0] : ''
  )
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)

    const dueDateTimestamp = dueDate
      ? Timestamp.fromDate(new Date(dueDate + 'T23:59:59'))
      : null

    try {
      if (isEdit) {
        await updateTask(task, {
          title:       title.trim(),
          description: description.trim(),
          dueDate:     dueDateTimestamp,
        })
      } else {
        await createTask({
          title:       title.trim(),
          description: description.trim(),
          type:        type,
          groupId:     groupId ?? null,
          dueDate:     dueDateTimestamp,
        })
      }
      onClose()
    } catch (err) {
      console.error('[TaskForm] submit error:', err)
      setError(err.message ?? 'No se pudo guardar la tarea')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={sheet} role="dialog" aria-modal="true" aria-labelledby="form-title">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 id="form-title" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            {isEdit ? 'Editar tarea' : 'Nueva tarea'}
          </h2>
          <button onClick={onClose} style={closeBtn} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle} htmlFor="task-title">Título *</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué hay que hacer?"
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="task-desc">Descripción</label>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles opcionales..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="task-due">Fecha límite</label>
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {!isEdit && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', background: '#f9fafb',
              borderRadius: 8, fontSize: 13, color: '#6b7280',
            }}>
              {type === 'personal' ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Tarea personal
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 1-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Tarea de grupo
                </>
              )}
            </div>
          )}

          {error && (
            <p style={{ margin: 0, fontSize: 13, color: '#ef4444', padding: '8px 12px', background: '#fef2f2', borderRadius: 8 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" onClick={onClose} disabled={loading} style={btnCancel}>
              Cancelar
            </button>
            <button type="submit" disabled={loading || !title.trim()} style={btnSubmit}>
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.35)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  zIndex: 1000,
}
const sheet = {
  background: '#fff', borderRadius: '16px 16px 0 0',
  padding: '24px 20px 32px', width: '100%', maxWidth: 480,
}
const labelStyle  = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }
const inputStyle  = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111827', outline: 'none', fontFamily: 'inherit' }
const closeBtn    = { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, display: 'flex' }
const btnCancel   = { padding: '9px 18px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151' }
const btnSubmit   = { padding: '9px 18px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }
