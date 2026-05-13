/**
 * AgendaTaskList — renders the task list for Mi Agenda.
 * When filter is 'all', shows a group badge on group tasks.
 * Groups completed tasks into a collapsible section.
 */
import { useState }      from 'react'
import { TaskItem }      from '../../../shared/TaskItem'
import { EmptyState }    from '../../../shared/EmptyState'
import { useTasks }      from '../../../core/hooks/useTasks'
import { useCoreState }  from '../../../core/hooks/useCoreData'

export function AgendaTaskList({ tasks, filter, loading, onEdit, onDelete }) {
  const { toggleStatus } = useTasks()
  const state = useCoreState()
  const [showCompleted, setShowCompleted] = useState(false)

  if (loading && tasks.length === 0) {
    return <div style={loadingWrap}><span style={{ color: '#9ca3af', fontSize: 14 }}>Cargando tareas...</span></div>
  }

  const pending   = tasks.filter(t => t.status === 'pending')
  const completed = tasks.filter(t => t.status === 'completed')
  const showGroup = filter === 'all'

  function getGroupName(task) {
    if (!task.groupId) return null
    return state.groups.list.get(task.groupId)?.name ?? null
  }

  if (pending.length === 0 && completed.length === 0) {
    return (
      <EmptyState
        title="Sin tareas"
        description={filter === 'all'
          ? 'Crea tu primera tarea personal o en un grupo.'
          : 'No hay tareas aquí todavía.'}
      />
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* Pending tasks */}
      {pending.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={toggleStatus}
          onEdit={onEdit}
          onDelete={onDelete}
          showGroup={showGroup}
          groupName={getGroupName(task)}
        />
      ))}

      {/* Completed section — collapsible */}
      {completed.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setShowCompleted(v => !v)} style={completedToggle}>
            <svg
              width="12" height="12" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            {completed.length} completada{completed.length !== 1 ? 's' : ''}
          </button>
          {showCompleted && completed.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
              showGroup={showGroup}
              groupName={getGroupName(task)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const loadingWrap     = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }
const completedToggle = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#9ca3af', width: '100%' }
