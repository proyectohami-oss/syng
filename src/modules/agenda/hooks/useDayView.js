/**
 * useDayView — datos para la vista de un día específico.
 * Usa CoreTasksContext y CoreGroupsContext por separado
 * para evitar re-renders cuando cambia auth o sync.
 */
import { useContext, useMemo }  from 'react'
import { CoreTasksContext, CoreGroupsContext, CoreAuthContext } from '../../../core/CoreDataProvider'

export function useDayView(dateKey) {
  const tasks  = useContext(CoreTasksContext)
  const groups = useContext(CoreGroupsContext)
  const auth   = useContext(CoreAuthContext)

  const allTasks = useMemo(() => {
    const personal = Array.from(tasks.personal.values())
    const grouped  = Array.from(tasks.byGroup.values()).flatMap(m => Array.from(m.values()))
    return [...personal, ...grouped]
  }, [tasks.personal, tasks.byGroup])

  const dayTasks = useMemo(() => {
    return allTasks.filter(task => {
      if (!task.dueDate || task.isDeleted) return false
      const d   = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      return key === dateKey
    })
  }, [allTasks, dateKey])

  function toMs(ts) {
    if (!ts) return 0
    return ts.toMillis ? ts.toMillis() : new Date(ts).getTime()
  }

  const pending = useMemo(
    () => dayTasks.filter(t => t.status === 'pending').sort((a,b) => toMs(a.createdAt) - toMs(b.createdAt)),
    [dayTasks]
  )

  const completed = useMemo(
    () => dayTasks.filter(t => t.status === 'completed').sort((a,b) => toMs(a.completedAt) - toMs(b.completedAt)),
    [dayTasks]
  )

  function getGroupName(groupId) {
    if (!groupId) return null
    return groups.list.get(groupId)?.name ?? null
  }

  return {
    pending,
    completed,
    dayTasks,
    getGroupName,
    uid:     auth.user?.uid ?? null,
    loading: tasks.loading,
  }
}
