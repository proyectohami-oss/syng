import { useState, useEffect } from 'react'

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
      borderRadius: 20,
      transition: 'opacity 0.25s ease',
      ...(isCompleted ? {
        /* Completadas — etéreas, hundidas, resueltas */
        background: 'rgba(255,255,255,0.40)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.45)',
        boxShadow: 'none',
        opacity: 0.65,
      } : {
        /* Pendientes — blanco glass puro, premium */
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(24px) saturate(140%)',
        WebkitBackdropFilter: 'blur(24px) saturate(140%)',
        border: '1px solid rgba(255,255,255,0.75)',
        boxShadow: '0 4px 16px rgba(13,18,64,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
        opacity: 1,
      }),
    }}>

      {/* Círculo selector */}
      <button
        onClick={e => { e.stopPropagation(); onCircleTap(task.id) }}
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: '50%',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.18s ease',
          WebkitTapHighlightColor: 'transparent',
          ...(selected ? {
            background: '#2D3A8C',
            border: 'none',
            boxShadow: '0 0 0 2.5px #ffffff, 0 0 0 5px rgba(45,58,140,0.28), 0 0 14px rgba(45,58,140,0.22)',
          } : isCompleted ? {
            background: 'transparent',
            border: '2px solid rgba(13,18,64,0.18)',
            boxShadow: 'none',
          } : {
            background: 'rgba(255,255,255,0.90)',
            border: '2px solid rgba(13,18,64,0.28)',
            boxShadow: '0 1px 4px rgba(13,18,64,0.06)',
          }),
        }}
      >
        {selected && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <polyline points="2.5,7 5.5,10 11.5,4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {!selected && isCompleted && (
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <polyline points="2.5,7 5.5,10 11.5,4" stroke="rgba(13,18,64,0.22)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Contenido */}
      <div
        onClick={handleTextTap}
        style={{ flex:1, cursor:hasSelection?'default':'pointer', userSelect:'none', WebkitTapHighlightColor:'transparent' }}
      >
        <p style={{
          margin: 0,
          fontSize: 15.5,
          fontWeight: isCompleted ? 400 : 500,
          lineHeight: 1.4,
          letterSpacing: '-0.01em',
          color: isCompleted ? 'rgba(13,18,64,0.30)' : '#0D1240',
          textDecoration: isCompleted ? 'line-through' : 'none',
          textDecorationColor: 'rgba(13,18,64,0.22)',
        }}>
          {task.title}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:6, flexWrap:'wrap' }}>
          <span style={{
            fontSize: 11,
            fontWeight: 500,
            padding: '2px 9px',
            borderRadius: 9999,
            background: isCompleted
              ? 'rgba(13,18,64,0.05)'
              : isGroup
                ? 'rgba(52,199,89,0.10)'
                : 'rgba(45,58,140,0.09)',
            color: isCompleted
              ? 'rgba(13,18,64,0.28)'
              : isGroup ? '#15803d' : '#2D3A8C',
          }}>{tag}</span>
          {dueLabel && (
            <span style={{ fontSize:11, color:'rgba(13,18,64,0.30)', fontWeight:400 }}>{dueLabel}</span>
          )}
          {task.reminder && (
            <span style={{ fontSize:11, opacity: isCompleted ? 0.25 : 0.45 }}>🔔</span>
          )}
        </div>
      </div>
    </div>
  )
}
