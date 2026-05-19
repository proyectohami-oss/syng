import { useState, useEffect } from 'react'

export function DayTaskItem({ task, groupName, onToggle, onEdit, onDelete, selected, onCircleTap, hasSelection }) {
  const [localDone, setLocalDone] = useState(task.status === 'completed')
  useEffect(() => { setLocalDone(task.status === 'completed') }, [task.status])

  const isGroup = !!groupName
  const tag = groupName || 'Personal'

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
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '20px 22px',
      marginBottom: 16,
      borderRadius: 28,
      background: localDone ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.42)',
      backdropFilter: 'blur(28px) saturate(180%)',
      WebkitBackdropFilter: 'blur(28px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.55)',
      boxShadow: localDone
        ? '0 8px 32px rgba(15,23,42,0.04)'
        : '0 20px 60px rgba(15,23,42,0.08), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(255,255,255,0.2)',
      opacity: localDone ? 0.55 : 1,
      transition: 'all 0.25s ease',
    }}>

      <button onClick={e => { e.stopPropagation(); onCircleTap(task.id) }} style={{
        flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
        border: selected ? 'none' : localDone ? 'none' : '1.5px solid rgba(0,0,0,0.15)',
        background: selected ? '#4A90E2' : localDone ? 'rgba(180,180,180,0.6)' : 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', padding: 0, transition: 'all 0.2s ease',
        boxShadow: selected ? '0 0 0 3px rgba(74,144,226,0.25)' : 'none',
        WebkitTapHighlightColor: 'transparent',
      }}>
        {(selected || localDone) && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polyline points="1.5,6 4.5,9 10.5,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <div onClick={handleTextTap} style={{ flex: 1, cursor: hasSelection ? 'default' : 'pointer', userSelect: 'none', WebkitTapHighlightColor: 'transparent' }}>
        <p style={{
          margin: 0, fontSize: 16, fontWeight: 500, lineHeight: 1.45,
          color: localDone ? 'rgba(0,0,0,0.35)' : '#111827',
          textDecoration: localDone ? 'line-through' : 'none',
          textDecorationColor: 'rgba(0,0,0,0.2)',
        }}>
          {task.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 9999,
            background: isGroup ? 'rgba(52,199,89,0.15)' : 'rgba(139,92,246,0.12)',
            color: isGroup ? '#1a7a3a' : '#6d28d9',
            border: isGroup ? '1px solid rgba(52,199,89,0.2)' : '1px solid rgba(139,92,246,0.15)',
          }}>{tag}</span>
          {dueLabel && <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontWeight: 400 }}>{dueLabel}</span>}
          {task.reminder && <span style={{ fontSize: 11, opacity: 0.6 }}>🔔</span>}
        </div>
      </div>
    </div>
  )
}
