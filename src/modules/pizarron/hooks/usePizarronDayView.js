/**
 * usePizarronDayView — maneja el día seleccionado en el Pizarrón.
 * Filtra tareas del grupo por día seleccionado.
 */
import { useState, useMemo } from 'react'

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function parseKey(key) {
  const [y,m,d] = key.split('-').map(Number)
  return new Date(y, m-1, d)
}

export function usePizarronDayView(tasks) {
  const today = new Date()
  const todayKey = toDateKey(today)

  const [selectedKey, setSelectedKey] = useState(todayKey)

  // Genera 7 días: 3 antes de hoy, hoy, 3 después
  const days = useMemo(() => {
    const result = []
    for (let i = -3; i <= 10; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
      result.push({
        key:     toDateKey(d),
        date:    d,
        dayNum:  d.getDate(),
        dayName: ['Do','Lu','Ma','Mi','Ju','Vi','Sá'][d.getDay()],
        isToday: toDateKey(d) === todayKey,
      })
    }
    return result
  }, [])

  // Tareas del día seleccionado
  const dayTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!t.dueDate) return false
      const d = t.dueDate.toDate ? t.dueDate.toDate() : new Date(t.dueDate)
      return toDateKey(d) === selectedKey
    })
  }, [tasks, selectedKey])

  const pending   = useMemo(() => dayTasks.filter(t => t.status === 'pending'),   [dayTasks])
  const completed = useMemo(() => dayTasks.filter(t => t.status === 'completed'), [dayTasks])

  // Días con actividad
  const daysWithActivity = useMemo(() => {
    const map = {}
    tasks.forEach(t => {
      if (!t.dueDate) return
      const d = t.dueDate.toDate ? t.dueDate.toDate() : new Date(t.dueDate)
      map[toDateKey(d)] = true
    })
    return map
  }, [tasks])

  return {
    days,
    selectedKey,
    setSelectedKey,
    selectedDate: parseKey(selectedKey),
    dayTasks,
    pending,
    completed,
    daysWithActivity,
    todayKey,
  }
}
