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
      padding: '16px 18px',
      marginBottom: 10,
      borderRadius: 20,
      background: 'rgba(255,255,255,0.40)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.30)',
      opacity: localDone ? 0.55 : 1,
      transition: 'all 0.2s ease',
    }}>

      <button onClick={e => { e.stopPropagation(); onCircleTap(task.id) }} style={{
        flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
        border: selected ? 'none' : localDone ? '1.5px solid rgba(200,200,210,0.5)' : '1.5px solid #D0D0D8',
        background: selected ? '#3B82F6' : localDone ? 'rgba(255,255,255,0.4)' : '#FFFFFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', padding: 0,
        boxShadow: selected ? '0 0 0 6px rgba(59,130,246,0.15), 0 0 0 3px rgba(59,130,246,0.25)' : localDone ? 'none' : 'none',
        transition: 'all 0.2s ease',
        WebkitTapHighlightColor: 'transparent',
      }}>
        {selected && (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <polyline points="2,6.5 5,9.5 11,3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <div onClick={handleTextTap} style={{ flex: 1, cursor: hasSelection ? 'default' : 'pointer', userSelect: 'none', WebkitTapHighlightColor: 'transparent' }}>
        <p style={{
          margin: 0, fontSize: 16, fontWeight: 500, lineHeight: 1.4,
          color: localDone ? 'rgba(15,23,42,0.4)' : '#0F172A',
          textDecoration: localDone ? 'line-through' : 'none',
        }}>
          {task.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, fontWeight: 500, padding: '2px 9px', borderRadius: 9999,
            background: isGroup ? 'rgba(52,199,89,0.12)' : 'rgba(59,130,246,0.10)',
            color: isGroup ? '#166534' : '#1d4ed8',
          }}>{tag}</span>
          {dueLabel && <span style={{ fontSize: 11, color: 'rgba(15,23,42,0.35)', fontWeight: 400 }}>{dueLabel}</span>}
          {task.reminder && <span style={{ fontSize: 11, opacity: 0.5 }}>🔔</span>}
        </div>
      </div>
    </div>
  )
}
