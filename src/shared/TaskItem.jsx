/**
 * TaskItem — renders a single task with toggle, edit, and delete actions.
 * Shared between Mi Agenda and Pizarrón. Shows the group badge only
 * when the task belongs to a group and the caller opts in (showGroup).
 *
 * Props:
 *   task        — Task object from state
 *   onToggle    — (task) => void
 *   onEdit      — (task) => void
 *   onDelete    — (task) => void
 *   showGroup   — bool, show group name badge (used in Agenda's "All" view)
 *   groupName   — string, label for the badge
 *   disabled    — bool, disables all actions (e.g., no permission)
 */
import { useState } from 'react'

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

  const hasDueDate = !!task.dueDate
  const dueLabel   = hasDueDate
    ? task.dueDate.toDate().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
    : null
  const isOverdue  = hasDueDate && !isDone && task.dueDate.toDate() < new Date()

  return (
    <div style={{ ...row, opacity: isPending ? 0.65 : 1 }} className="task-item">
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        disabled={toggling || disabled}
        aria-label={isDone ? 'Marcar pendiente' : 'Completar tarea'}
        style={{
          ...toggle,
          background:   isDone ? '#22c55e' : 'transparent',
          borderColor:  isDone ? '#22c55e' : '#d1d5db',
        }}
      >
        {isDone && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5 5 4 7.5 8.5 2.5" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 14, lineHeight: '20px',
          color:          isDone ? '#9ca3af' : '#111827',
          textDecoration: isDone ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
{task.reminder ? <span style={{fontSize:11,marginRight:4}}>🔔</span> : null}{task.title}
        </p>
        {(task.description || hasDueDate || showGroup) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            {task.description && (
              <span style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                {task.description}
              </span>
            )}
            {hasDueDate && (
              <span style={{ fontSize: 11, color: isOverdue ? '#ef4444' : '#9ca3af', flexShrink: 0 }}>
                {isOverdue ? '⚠ ' : ''}{dueLabel}
              </span>
            )}
            {showGroup && groupName && (
              <span style={{
                fontSize: 11, padding: '1px 6px', borderRadius: 4,
                background: '#eff6ff', color: '#3b82f6', flexShrink: 0,
              }}>
                {groupName}
              </span>
            )}
            {isPending && (
              <span style={{ fontSize: 11, color: '#9ca3af' }}>guardando...</span>
            )}
            <span style={{ fontSize: 11, color: '#a78bfa', flexShrink: 0 }}>🔔TEST</span>
          </div>
        )}
      </div>

      {/* Actions (visible on hover via CSS class) */}
      {!disabled && (
        <div className="task-actions" style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task) }}
            aria-label="Editar tarea"
            style={actionBtn}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task) }}
            aria-label="Eliminar tarea"
            style={{ ...actionBtn, color: '#ef4444' }}
          >
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
  padding: '10px 16px', borderBottom: '1px solid #f3f4f6',
  transition: 'background 0.1s',
}
const toggle = {
  flexShrink: 0, width: 20, height: 20,
  borderRadius: '50%', border: '2px solid',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', padding: 0,
  transition: 'background 0.15s, border-color 0.15s',
}
const actionBtn = {
  padding: 4, borderRadius: 4, border: 'none', background: 'transparent',
  cursor: 'pointer', color: '#9ca3af', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
}
