import { useState, useEffect } from 'react'

export function DayTaskItem({
  task, groupName,
  onToggle, onEdit, onDelete,
  selected, onCircleTap, hasSelection,
}) {
  const [localDone, setLocalDone] = useState(task.status === 'completed')
  useEffect(() => { setLocalDone(task.status === 'completed') }, [task.status])

  const isGroup = !!groupName
  const tag     = groupName || 'Personal'

  async function handleTextTap() {
    if (hasSelection) return
    const prev = localDone
    setLocalDone(!prev)
    try { await onToggle(task) }
    catch { setLocalDone(prev) }
  }

  function handleCircleTap(e) {
    e.stopPropagation()
    onCircleTap(task.id)
  }

  const dueLabel = task.dueDate ? (() => {
    const d = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)
    const mes = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()]
    return `${d.getDate()} ${mes}`
  })() : null

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:14,
      padding:'18px',
      background: localDone ? 'rgba(232,232,230,0.7)' : 'rgba(253,253,252,0.85)',
      borderRadius:20,
      marginBottom:14,
      backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
      border:'1px solid rgba(255,255,255,0.3)',
      boxShadow:'0 8px 32px rgba(31,38,135,0.1)',
      opacity: localDone ? 0.35 : 1,
      transition:'opacity 0.2s ease',
    }}>

      <button onClick={handleCircleTap} style={{
        flexShrink:0, width:24, height:24, borderRadius:'50%',
        border: selected ? '2px solid #E0E0E0' : localDone ? 'none' : '2px solid #D1CFC9',
        background: selected ? '#4A90E2' : localDone ? '#C7C7C7' : 'transparent',
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', padding:0,
        boxShadow: selected ? '0 0 0 1px rgba(74,144,226,0.15), 0 0 14px 4px rgba(74,144,226,0.3)' : 'none',
        transition:'all 0.15s ease',
        WebkitTapHighlightColor:'transparent',
      }}>
        {(selected || localDone) && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polyline points="1.5,6 4.5,9 10.5,3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <div onClick={handleTextTap} style={{ flex:1, cursor: hasSelection ? 'default' : 'pointer', userSelect:'none', WebkitTapHighlightColor:'transparent' }}>
        <p style={{
          margin:0, fontSize:16, fontWeight:500, lineHeight:1.4,
          color: localDone ? '#9B9B9B' : '#21201E',
          textDecoration: localDone ? 'line-through' : 'none',
          textDecorationColor: 'rgba(163,161,156,0.5)',
          wordBreak:'break-word',
        }}>
          {task.title}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6, flexWrap:'wrap' }}>
          <span style={{
            fontSize:12, fontWeight:600, padding:'3px 10px',
            borderRadius:9999,
            background: isGroup ? 'rgba(34,197,94,0.12)' : 'rgba(91,61,246,0.10)',
            color: isGroup ? '#16A34A' : '#5B3DF6',
          }}>
            {tag}
          </span>
          {dueLabel && <span style={{ fontSize:12, color:'#7E7C77' }}>{dueLabel}</span>}
          {task.reminder && <span style={{ fontSize:12 }}>🔔</span>}
        </div>
      </div>
    </div>
  )
}
