import { useState, useEffect } from 'react'
import { A, L } from '../../../shared/agendaEditorial'

export function DayTaskItem({ task, groupName, onToggle, onEdit, onDelete, selected, onCircleTap, hasSelection, variant }) {
  const [localDone, setLocalDone] = useState(task.status === 'completed')
  useEffect(() => { setLocalDone(task.status === 'completed') }, [task.status])

  const isGroup = !!groupName
  const tag = groupName || 'Personal'
  const isCompleted = variant === 'completed' || localDone

  async function handleTextTap() {
    if (hasSelection) return
    const prev = localDone
    setLocalDone(!prev)
    try { await onToggle(task) } catch { setLocalDone(prev) }
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
        onClick={e => { e.stopPropagation(); onCircleTap(task.id) }}
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: 2,
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.18s ease',
          WebkitTapHighlightColor: 'transparent',
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
        style={{ flex:1, cursor:hasSelection?'default':'pointer', userSelect:'none', WebkitTapHighlightColor:'transparent' }}
      >
        <p style={{
          margin: 0,
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
        <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:6, flexWrap:'wrap' }}>
          <span style={isGroup ? A.tagGroup : A.tagPersonal}>{tag}</span>
          {dueLabel && (
            <span style={{ fontSize:11, color:L.ivoryMuted }}>{dueLabel}</span>
          )}
          {task.reminder?.dueTime && (() => {
            const [h, m] = task.reminder.dueTime.split(':').map(Number)
            const ap  = h >= 12 ? 'PM' : 'AM'
            const h12 = h % 12 || 12
            return (
              <span style={{ fontSize:11, color:L.champagne, opacity: isCompleted ? 0.4 : 1 }}>
                {h12}:{String(m).padStart(2,'0')} {ap}
              </span>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
