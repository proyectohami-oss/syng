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
      padding:'14px 16px',
      background:'#FFFFFF',
      borderRadius:16,
      marginBottom:10,
      boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
      opacity: localDone ? 0.45 : 1,
      transition:'opacity 0.2s ease',
    }}>

      {/* Circulo selector — azul iOS */}
      <button onClick={handleCircleTap} style={{
        flexShrink:0, width:26, height:26, borderRadius:'50%',
        border: selected ? 'none' : localDone ? '2px solid #34C759' : '2px solid #D1D5DB',
        background: selected
          ? 'rgba(59,130,246,0.85)'
          : localDone ? '#34C759' : 'transparent',
        backdropFilter: selected ? 'blur(4px)' : 'none',
        WebkitBackdropFilter: selected ? 'blur(4px)' : 'none',
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', padding:0,
        boxShadow: selected ? '0 2px 8px rgba(59,130,246,0.4)' : 'none',
        transition:'all 0.15s ease',
        WebkitTapHighlightColor:'transparent',
      }}>
        {(selected || localDone) && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polyline points="1.5,6 4.5,9 10.5,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Contenido */}
      <div onClick={handleTextTap} style={{ flex:1, cursor: hasSelection ? 'default' : 'pointer', userSelect:'none', WebkitTapHighlightColor:'transparent' }}>
        <p style={{
          margin:0, fontSize:16, fontWeight:500, lineHeight:1.4,
          color: localDone ? '#9CA3AF' : '#0F0F0F',
          wordBreak:'break-word',
        }}>
          {task.title}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5, flexWrap:'wrap' }}>
          <span style={{
            fontSize:12, fontWeight:600, padding:'3px 10px',
            borderRadius:9999,
            background: isGroup ? 'rgba(34,197,94,0.12)' : 'rgba(91,61,246,0.10)',
            color: isGroup ? '#16A34A' : '#5B3DF6',
          }}>
            {tag}
          </span>
          {dueLabel && <span style={{ fontSize:12, color:'#9CA3AF' }}>{dueLabel}</span>}
          {task.reminder && <span style={{ fontSize:12 }}>🔔</span>}
        </div>
      </div>
    </div>
  )
}
