import { useState, useMemo, useContext } from 'react'
import { CoreTasksContext, CoreGroupsContext, CoreAuthContext } from '../../../core/CoreDataProvider'

export function useAgendaView() {
  const tasks  = useContext(CoreTasksContext)
  const groups = useContext(CoreGroupsContext)
  const auth   = useContext(CoreAuthContext)

  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate())
  )
  const [viewMonth, setViewMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  )

  const allTasks = useMemo(() => {
    const personal = Array.from(tasks.personal.values())
    const grouped  = Array.from(tasks.byGroup.values()).flatMap(m => Array.from(m.values()))
    return [...personal, ...grouped].filter(t => !t.isDeleted)
  }, [tasks.personal, tasks.byGroup])

  const daysWithActivity = useMemo(() => {
    const map = {}
    allTasks.forEach(task => {
      if (!task.dueDate) return
      const d   = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      map[key] = true
    })
    return map
  }, [allTasks])

  const selectedKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`

  const dayTasks = useMemo(() => {
    return allTasks.filter(task => {
      if (!task.dueDate) return false
      const d   = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      return key === selectedKey
    })
  }, [allTasks, selectedKey])

  const pendingCount   = useMemo(() => dayTasks.filter(t => t.status === 'pending').length,   [dayTasks])
  const completedCount = useMemo(() => dayTasks.filter(t => t.status === 'completed').length, [dayTasks])

  function prevMonth() { setViewMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1)) }
  function nextMonth() { setViewMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1)) }

  const allGroups = useMemo(() => Array.from(groups.list.values()), [groups.list])

  return {
    selectedDate, setSelectedDate,
    viewMonth, prevMonth, nextMonth,
    daysWithActivity,
    dayTasks, pendingCount, completedCount,
    allGroups,
    uid:     auth.user?.uid ?? null,
    loading: tasks.loading,
  }
}
