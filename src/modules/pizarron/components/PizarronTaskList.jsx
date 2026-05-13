/**
 * PizarronTaskList — task list for a group's Pizarrón.
 * Similar to AgendaTaskList but without the group badge.
 * Adds "New task" inline button.
 */
import { useState }   from 'react'
import { TaskItem }   from '../../../shared/TaskItem'
import { EmptyState } from '../../../shared/EmptyState'
import { useTasks }   from '../../../core/hooks/useTasks'

export function PizarronTaskList({ tasks, groupId, canCreate, onEdit, onDelete, onCreateTask }) {
  const { toggleStatus } = useTasks()
  const [showCompleted, setShowCompleted] = useState(false)

  const pending   = tasks.filter(t => t.status === 'pending')
  const completed = tasks.filter(t => t.status === 'completed')

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="Sin tareas en este grupo"
        description="Crea la primera tarea para empezar a colaborar."
        action={canCreate && (
          <button onClick={onCreateTask} style={newTaskBtn}>
            + Crear primera tarea
          </button>
        )}
      />
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* Inline "new task" row */}
      {canCreate && (
        <button onClick={onCreateTask} style={addRow}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Añadir tarea
        </button>
      )}

      {/* Pending */}
      {pending.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={toggleStatus}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}

      {/* Completed — collapsible */}
      {completed.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setShowCompleted(v => !v)} style={completedToggle}>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
            ><polyline points="9 18 15 12 9 6"/></svg>
            {completed.length} completada{completed.length !== 1 ? 's' : ''}
          </button>
          {showCompleted && completed.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={toggleStatus} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

const addRow        = { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none', borderBottom: '1px solid #f3f4f6', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#9ca3af', textAlign: 'left' }
const completedToggle = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#9ca3af', width: '100%' }
const newTaskBtn    = { padding: '8px 16px', borderRadius: 8, border: 'none', background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: 13 }
