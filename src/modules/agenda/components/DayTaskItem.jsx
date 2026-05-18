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
      background:'#EDEDE9',
      borderRadius:20,
      marginBottom:14,
      boxShadow:'0 12px 36px -4px rgba(35,30,20,0.04), 0 4px 14px -2px rgba(35,30,20,0.02)',
      opacity: localDone ? 0.35 : 1,
      transition:'opacity 0.2s ease',
    }}>

      <button onClick={handleCircleTap} style={{
        flexShrink:0, width:24, height:24, borderRadius:'50%',
        border: selected ? '2px solid #FFFFFF' : localDone ? 'none' : '2px solid #D1CFC9',
        background: selected ? '#2B76FA' : localDone ? '#34C759' : 'transparent',
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', padding:0,
        boxShadow: selected ? '0 0 0 1px rgba(43,118,250,0.15), 0 0 14px 4px rgba(43,118,250,0.35)' : 'none',
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
          color: localDone ? '#A3A19C' : '#21201E',
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
