/** Tareas para la pantalla de bienvenida (hoy / ayer). */

function toDateKey(date) {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function taskDateKey(task) {
  if (!task?.dueDate) return null
  const d = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)
  return toDateKey(d)
}

function flattenTasks(tasksState) {
  const personal = Array.from(tasksState.personal.values())
  const grouped = Array.from(tasksState.byGroup.values()).flatMap(m => Array.from(m.values()))
  return [...personal, ...grouped]
}

function pendingOnDay(tasksState, dateKey) {
  return flattenTasks(tasksState).filter(t => {
    if (t.isDeleted || t.status !== 'pending') return false
    return taskDateKey(t) === dateKey
  })
}

function completedOnDay(tasksState, dateKey) {
  return flattenTasks(tasksState).filter(t => {
    if (t.isDeleted || t.status !== 'completed') return false
    return taskDateKey(t) === dateKey
  })
}

export function getBienvenidaTaskSnapshot(tasksState) {
  const now = new Date()
  const todayKey = toDateKey(now)
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const yesterdayKey = toDateKey(yesterday)

  return {
    tareasHoy: pendingOnDay(tasksState, todayKey),
    tareasAyer: completedOnDay(tasksState, yesterdayKey),
  }
}

export function bienvenidaStorageKey() {
  return `syng_bienvenida_${toDateKey(new Date())}`
}

export function shouldSkipBienvenidaPath(path) {
  return path.startsWith('/recordatorio/')
    || path.startsWith('/unirse')
    || path.startsWith('/resumen-diario')
    || path.startsWith('/bienvenido-de-vuelta')
    || path.startsWith('/preview')
}
