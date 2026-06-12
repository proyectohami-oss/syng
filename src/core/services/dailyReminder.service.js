/** Recordatorio del día — días con tareas pendientes + hora elegida por el usuario */

export function toDateKey(date) {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function taskDateKey(task) {
  if (!task?.dueDate) return null
  const d = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)
  return toDateKey(d)
}

export function collectDaysWithPendingTasks(allTasks, { fromDate = new Date(), daysAhead = 14 } = {}) {
  const counts = {}
  for (const t of allTasks) {
    if (t.isDeleted || t.status !== 'pending') continue
    const key = taskDateKey(t)
    if (!key) continue
    counts[key] = (counts[key] || 0) + 1
  }

  const todayKey = toDateKey(fromDate)
  const result = []
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + i)
    const key = toDateKey(d)
    if (key < todayKey) continue
    const count = counts[key] || 0
    if (count > 0) result.push({ dateKey: key, count, date: d })
  }
  return result
}

export function alarmAtForDay(dateKey, hour, minute) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d, hour, minute, 0, 0)
}

export function dailyEventId(uid, dateKey) {
  return `daily-${uid.slice(0, 8)}-${dateKey}`
}

export function dailyTitle(count) {
  return count === 1 ? 'Tu día — 1 tarea' : `Tu día — ${count} tareas`
}

export const DEFAULT_DAILY_REMINDER = { enabled: false, hour: 8, minute: 0 }

export function parseDailyReminder(userData) {
  const raw = userData?.dailyReminder
  if (!raw) return { ...DEFAULT_DAILY_REMINDER, calendarSynced: {} }
  return {
    enabled: !!raw.enabled,
    hour: Number.isFinite(raw.hour) ? raw.hour : 8,
    minute: Number.isFinite(raw.minute) ? raw.minute : 0,
    calendarSynced: raw.calendarSynced || {},
  }
}

export function formatDayLabel(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const todayKey = toDateKey(new Date())
  if (dateKey === todayKey) return 'Hoy'
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (dateKey === toDateKey(tomorrow)) return 'Mañana'
  return date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function timeToInput(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function parseTimeInput(value) {
  const [h, m] = (value || '08:00').split(':').map(Number)
  return { hour: h || 8, minute: m || 0 }
}
