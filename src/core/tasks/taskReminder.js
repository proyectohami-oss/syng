/** Helpers para detectar y mostrar recordatorios en listas de tareas. */

export function taskHasReminder(task) {
  return !!(task?.reminder?.dueTime || task?.reminder?.scheduledAt || task?.reminderTime)
}

export function formatTaskReminderTime(task) {
  if (task?.reminder?.dueTime && typeof task.reminder.dueTime === 'string') {
    const [h, m] = task.reminder.dueTime.split(':').map(Number)
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      const ap = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 || 12
      return `${h12}:${String(m).padStart(2, '0')} ${ap}`
    }
  }
  if (task?.dueDate && taskHasReminder(task)) {
    const d = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)
    if (d.getHours() !== 23 || d.getMinutes() !== 59) {
      return d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
    }
  }
  return null
}
