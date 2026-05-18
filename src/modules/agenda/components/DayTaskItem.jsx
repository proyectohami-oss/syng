import { useState, useEffect } from 'react'
import { T } from '../../../theme'

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

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:14,
      padding:'14px 16px',
      background: selected ? '#FFF5F5' : T.surface,
      borderRadius: T.radiusLG,
      marginBottom: 10,
      boxShadow: selected ? '0 0 0 2px #EF4444' : T.shadowSM,
      transition:'box-shadow 0.15s, background 0.15s',
      opacity: localDone ? 0.45 : 1,
    }}>

      {/* Circulo selector */}
      <button onClick={handleCircleTap} style={{
        flexShrink:0, width:26, height:26, borderRadius:'50%',
        border: `2px solid ${selected ? T.danger : localDone ? T.success : T.borderStrong}`,
        background: selected ? T.danger : localDone ? T.success : 'transparent',
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', padding:0, transition:'all 0.15s',
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
          margin:0, fontSize:T.fontMD, fontWeight:500, lineHeight:1.4,
          color: localDone ? T.textTertiary : T.textPrimary,
          textDecoration:'none',
          wordBreak:'break-word',
        }}>
          {task.title}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
          <span style={{
            fontSize:11, fontWeight:600, padding:'2px 10px',
            borderRadius: T.radiusFull,
            background: isGroup ? 'rgba(34,197,94,0.1)' : 'rgba(91,61,246,0.1)',
            color: isGroup ? '#166634' : T.primary,
          }}>
            {tag}
          </span>
          {task.dueDate && (() => {
            const d = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)
            const mes = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()]
            return <span style={{ fontSize:11, color: T.textTertiary }}>{d.getDate()} {mes}</span>
          })()}
          {task.reminder && <span style={{ fontSize:11, color: T.primary }}>🔔</span>}
        </div>
      </div>
    </div>
  )
}
