import { useState, useEffect } from 'react'

export function DayTaskItem({
  task, groupName,
  onToggle, onEdit, onDelete,
  selected, onCircleTap, hasSelection,
  draggable, onDragStart, onDragEnd, onDragOver, onDrop, isDragOver,
}) {
  const [localDone, setLocalDone] = useState(task.status === 'completed')

  useEffect(() => {
    setLocalDone(task.status === 'completed')
  }, [task.status])

  const tag      = groupName || 'Personal'
  const tagStyle = groupName
    ? { background: '#DCFCE7', color: '#166534' }
    : { background: '#EDE9FE', color: '#5B3DF6' }

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
    <>
      {isDragOver && (
        <div style={{ height: 3, background: '#5B3DF6', borderRadius: 2, margin: '0 0 -3px', boxShadow: '0 0 8px rgba(91,61,246,0.4)' }} />
      )}
      <div
        draggable={draggable && !hasSelection}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={e => { e.preventDefault(); onDragOver?.() }}
        onDrop={e => { e.preventDefault(); onDrop?.() }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 0',
          borderBottom: isDragOver ? 'none' : '1px solid #f3f4f6',
          background: selected ? '#fff5f5' : 'transparent',
          borderRadius: selected ? 8 : 0,
        }}
      >
        {draggable && !hasSelection && (
          <span style={{ color: '#d1d5db', flexShrink: 0, cursor: 'grab', userSelect: 'none', fontSize: 16, padding: '0 2px' }}>⠿</span>
        )}

        {/* CÍRCULO — área táctil 44x44, visual 22x22 */}
        <button
          onClick={handleCircleTap}
          style={{
            flexShrink: 0,
            width: 44, height: 44,          // área táctil mínima Apple/Google
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
            margin: '-10px -11px',          // colapsa el espacio visual extra
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Seleccionar tarea"
        >
          <span style={{
            width: 22, height: 22,
            borderRadius: '50%',
            border: `2px solid ${selected ? '#ef4444' : localDone ? '#22C55E' : '#d1d5db'}`,
            background: selected ? '#ef4444' : localDone ? '#22C55E' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.12s, border-color 0.12s',
            flexShrink: 0,
          }}>
            {(selected || localDone) && (
              <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>
            )}
          </span>
        </button>

        {/* TEXTO — toca para completar */}
        <div
          onClick={handleTextTap}
          style={{ flex: 1, cursor: hasSelection ? 'default' : 'pointer', userSelect: 'none', padding: '4px 0', WebkitTapHighlightColor: 'transparent' }}
        >
          <p style={{
            margin: 0, fontSize: 15, lineHeight: 1.5,
            color: localDone ? '#9ca3af' : '#111827',
            textDecoration: localDone ? 'line-through' : 'none',
            wordBreak: 'break-word',
            transition: 'color 0.1s',
          }}>
            {task.title}{' '}
            <span style={{ fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap', ...tagStyle }}>
              {tag}
            </span>
          </p>
        </div>

        {/* Acciones — área táctil mínima 44px */}
        {!hasSelection && (
          <div style={{ display: 'flex', gap: 0, flexShrink: 0 }}>
            <button
              onClick={e => { e.stopPropagation(); onEdit(task) }}
              style={touchBtn}
              aria-label="Editar"
            >✏️</button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(task) }}
              style={touchBtn}
              aria-label="Eliminar"
            >🗑️</button>
          </div>
        )}
      </div>
    </>
  )
}

const touchBtn = {
  background: 'none', border: 'none',
  fontSize: 17, cursor: 'pointer',
  width: 44, height: 44,               // área táctil 44x44
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 10,
  WebkitTapHighlightColor: 'transparent',
}
