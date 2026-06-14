import { useState, useEffect } from 'react'
import { A, L } from '../../../shared/agendaEditorial'
import { ReminderBell } from '../../../shared/ReminderBell'
import { taskHasReminder, formatTaskReminderTime } from '../../../core/tasks/taskReminder'

export function DayTaskItem({ task, groupName, onToggle, onDelete, selected, onCircleTap, hasSelection, variant, readOnly = false }) {
  const [localDone, setLocalDone] = useState(task.status === 'completed')
  useEffect(() => { setLocalDone(task.status === 'completed') }, [task.status])

  const isGroup = !!groupName
  const tag = groupName || 'Personal'
  const isCompleted = variant === 'completed' || localDone
  const hasReminder = taskHasReminder(task)
  const reminderLabel = formatTaskReminderTime(task)

  async function handleTextTap() {
    if (readOnly || hasSelection) return
    const prev = localDone
    setLocalDone(!prev)
    try { await onToggle(task) } catch { setLocalDone(prev) }
  }

  function handleCircleTap(e) {
    e.stopPropagation()
    if (readOnly) return
    onCircleTap?.(task.id)
  }

  const dueLabel = task.dueDate ? (() => {
    const d = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)
    return `${d.getDate()} ${['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()]}`
  })() : null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '15px 16px',
      marginBottom: 8,
      transition: 'opacity 0.25s ease',
      ...(isCompleted ? A.taskDone : A.taskPending),
    }}>
      <button
        type="button"
        onClick={handleCircleTap}
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: 2,
          cursor: readOnly ? 'default' : 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.18s ease',
          WebkitTapHighlightColor: 'transparent',
          opacity: readOnly ? 0.45 : 1,
          ...(selected ? {
            background: L.champagne,
            border: 'none',
          } : isCompleted ? {
            background: 'transparent',
            border: `1px solid ${L.champagneBorder}`,
          } : {
            background: 'transparent',
            border: `1px solid ${L.champagneBorder}`,
          }),
        }}
      >
        {selected && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <polyline points="2.5,7 5.5,10 11.5,4" stroke={L.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {!selected && isCompleted && (
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <polyline points="2.5,7 5.5,10 11.5,4" stroke={L.ivoryFaint} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <div
        onClick={handleTextTap}
        style={{
          flex: 1,
          cursor: readOnly || hasSelection ? 'default' : 'pointer',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          opacity: readOnly ? 0.7 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {hasReminder && (
            <ReminderBell size={14} opacity={isCompleted ? 0.45 : 1} />
          )}
          <p style={{
            margin: 0,
            flex: 1,
            minWidth: 0,
            fontSize: 15,
            fontWeight: isCompleted ? 400 : 500,
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
            color: isCompleted ? L.ivoryFaint : L.ivory,
            textDecoration: isCompleted ? 'line-through' : 'none',
            textDecorationColor: L.ivoryFaint,
          }}>
            {task.title}
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:6, flexWrap:'wrap' }}>
          <span style={isGroup ? A.tagGroup : A.tagPersonal}>{tag}</span>
          {dueLabel && (
            <span style={{ fontSize:11, color:L.ivoryMuted }}>{dueLabel}</span>
          )}
          {reminderLabel && (
            <span style={{ fontSize:11, color:L.champagne, opacity: isCompleted ? 0.4 : 1 }}>
              {reminderLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
