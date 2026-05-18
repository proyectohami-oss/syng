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
      padding:'16px 18px',
      background: localDone ? 'rgba(240,240,238,0.5)' : 'rgba(255,255,255,0.62)',
      backdropFilter:'blur(18px)',
      WebkitBackdropFilter:'blur(18px)',
      border:'1px solid rgba(255,255,255,0.45)',
      borderRadius:28,
      marginBottom:12,
      boxShadow:'0 10px 40px rgba(15,23,42,0.06), 0 2px 12px rgba(255,255,255,0.35) inset',
      opacity: localDone ? 0.6 : 1,
      transition:'all 0.2s ease',
    }}>

      <button onClick={handleCircleTap} style={{
        flexShrink:0, width:24, height:24, borderRadius:'50%',
        border: selected ? 'none' : localDone ? 'none' : '1.5px solid #C8C8C8',
        background: selected ? '#4A90E2' : localDone ? '#B8B8B8' : 'rgba(255,255,255,0.8)',
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', padding:0,
        boxShadow:'none',
        transition:'all 0.15s ease',
        WebkitTapHighlightColor:'transparent',
      }}>
        {(selected || localDone) && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <polyline points="1.5,6 4.5,9 10.5,3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <div onClick={handleTextTap} style={{ flex:1, cursor: hasSelection ? 'default' : 'pointer', userSelect:'none', WebkitTapHighlightColor:'transparent' }}>
        <p style={{
          margin:0, fontSize:16, fontWeight:500, lineHeight:1.45,
          color: localDone ? '#A0A0A0' : '#1A1A1A',
          textDecoration: localDone ? 'line-through' : 'none',
          textDecorationColor:'rgba(160,160,160,0.5)',
          wordBreak:'break-word',
        }}>
          {task.title}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6, flexWrap:'wrap' }}>
          <span style={{
            fontSize:11, fontWeight:500, padding:'3px 10px',
            borderRadius:9999,
            background: isGroup ? 'rgba(52,199,89,0.12)' : 'rgba(74,144,226,0.12)',
            color: isGroup ? '#1A7A3A' : '#2B6CB0',
          }}>
            {tag}
          </span>
          {dueLabel && <span style={{ fontSize:11, color:'#A0A0A0', fontWeight:400 }}>{dueLabel}</span>}
          {task.reminder && <span style={{ fontSize:11, opacity:0.7 }}>🔔</span>}
        </div>
      </div>
    </div>
  )
}
