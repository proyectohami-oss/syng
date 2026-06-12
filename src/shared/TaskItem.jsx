import { useState } from 'react'
import { ReminderBell } from './ReminderBell'
import { taskHasReminder } from '../core/tasks/taskReminder'

export function TaskItem({ task, onToggle, onEdit, onDelete, showGroup, groupName, disabled }) {
  const [toggling, setToggling] = useState(false)
  const isDone    = task.status === 'completed'
  const isPending = task._optimistic === true

  async function handleToggle(e) {
    e.stopPropagation()
    if (toggling || disabled) return
    setToggling(true)
    try { await onToggle(task) } finally { setToggling(false) }
  }

  const hasDueDate  = !!task.dueDate
  const dueLabel    = hasDueDate
    ? (() => { const d = task.dueDate.toDate(); return `${d.getDate()} ${['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()]}` })()
    : null
  const isOverdue   = hasDueDate && !isDone && task.dueDate.toDate() < new Date()
  const hasReminder = taskHasReminder(task)

  return (
    <div style={{ ...row, opacity: isPending ? 0.65 : 1 }} className="task-item">

      {/* Círculo toggle — sistema Syng */}
      <button
        onClick={handleToggle}
        disabled={toggling || disabled}
        aria-label={isDone ? 'Marcar pendiente' : 'Completar tarea'}
        style={{
          ...toggle,
          background:  isDone ? 'rgba(13,18,64,0.12)' : 'transparent',
          borderColor: isDone ? 'rgba(13,18,64,0.18)' : 'rgba(13,18,64,0.28)',
        }}
      >
        {isDone && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="rgba(13,18,64,0.40)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5 5 4 7.5 8.5 2.5" />
          </svg>
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:4, overflow:'hidden' }}>
          {hasReminder && (
            <ReminderBell size={13} color="rgba(13,18,64,0.45)" opacity={isDone ? 0.35 : 0.75} />
          )}
          <p style={{
            margin: 0, fontSize: 14, lineHeight: '20px',
            color:          isDone ? 'rgba(13,18,64,0.32)' : '#0D1240',
            textDecoration: isDone ? 'line-through' : 'none',
            textDecorationColor: 'rgba(13,18,64,0.22)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: 1,
            fontWeight: isDone ? 400 : 400,
          }}>
            {task.title}
          </p>
        </div>

        {(task.description || hasDueDate || showGroup || isPending) && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3 }}>
            {task.description && (
              <span style={{ fontSize:12, color:'rgba(13,18,64,0.35)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>
                {task.description}
              </span>
            )}
            {hasDueDate && (
              <span style={{ fontSize:11, color: isOverdue ? '#E05252' : 'rgba(13,18,64,0.35)', flexShrink:0, fontWeight: isOverdue ? 500 : 400 }}>
                {isOverdue ? '⚠ ' : ''}{dueLabel}
              </span>
            )}
            {showGroup && groupName && (
              <span style={{
                fontSize:11, padding:'1px 7px', borderRadius:99,
                background:'rgba(45,58,140,0.09)',
                color:'#2D3A8C',
                flexShrink:0, fontWeight:500,
              }}>
                {groupName}
              </span>
            )}
            {isPending && (
              <span style={{ fontSize:11, color:'rgba(13,18,64,0.30)' }}>guardando...</span>
            )}
          </div>
        )}
      </div>

      {!disabled && (
        <div className="task-actions" style={{ display:'flex', gap:4, flexShrink:0 }}>
          <button onClick={(e) => { e.stopPropagation(); onEdit(task) }} aria-label="Editar tarea" style={actionBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(task) }} aria-label="Eliminar tarea" style={{ ...actionBtn, color:'#E05252' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

const row = {
  display: 'flex', alignItems: 'flex-start', gap: 12,
  padding: '11px 16px',
  borderBottom: '1px solid rgba(13,18,64,0.07)',
  transition: 'background 0.12s',
  background: 'transparent',
}
const toggle = {
  flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
  border: '2px solid',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', padding: 0,
  transition: 'background 0.15s, border-color 0.15s',
}
const actionBtn = {
  padding: 4, borderRadius: 6, border: 'none',
  background: 'transparent', cursor: 'pointer',
  color: 'rgba(13,18,64,0.28)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
