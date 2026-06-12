/**
 * Recordatorios — Firestore + Calendario del dispositivo.
 */
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { syncReminderToCalendar } from '../calendar/calendar.service'

import { localDateAt, getDeviceTimeZone } from '../calendar/localDate'

/** @deprecated use localDateAt */
export function localDateTimeToUtc(dateStr, hours24, minutes) {
  return localDateAt(dateStr, hours24, minutes, 0)
}

export { getDeviceTimeZone as getDeviceTimezone }

function toDate(v) {
  if (!v) return null
  if (v instanceof Date) return v
  if (v.toDate) return v.toDate()
  return new Date(v)
}

function dateStrFromDue(dueDate) {
  const d = toDate(dueDate)
  if (!d) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function taskTimeFromReminder(reminder, dueDate) {
  const scheduledAt = toDate(reminder?.scheduledAt)
  if (reminder?.dueTime) {
    const ds = dateStrFromDue(dueDate)
    if (ds) {
      const [hh, mm] = reminder.dueTime.split(':').map(Number)
      return localDateAt(ds, hh, mm, 0)
    }
  }
  if (scheduledAt && reminder?.offsetMin) {
    return new Date(scheduledAt.getTime() + reminder.offsetMin * 60_000)
  }
  return scheduledAt
}

export async function scheduleReminder({
  taskId,
  userId,
  title,
  taskTime,
  scheduledAt,
  offsetMinutes,
}) {
  await setDoc(doc(db, 'reminders', taskId), {
    taskId,
    userId,
    title: title.trim(),
    taskTime: Timestamp.fromDate(taskTime),
    scheduledAt: Timestamp.fromDate(scheduledAt),
    offsetMinutes,
    userTimezone: getDeviceTimezone(),
    tzOffsetMin: -new Date().getTimezoneOffset(),
    status: 'pending',
    delivery: 'calendar',
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true })
}

/** Desde objeto reminder de la UI + dueDate de la tarea. */
export async function applyReminderForTask({ taskId, userId, title, reminder, dueDate }) {
  if (!reminder?.scheduledAt || !userId) return null
  const scheduledAt = toDate(reminder.scheduledAt)
  const taskTime = taskTimeFromReminder(reminder, dueDate)
  if (!scheduledAt || !taskTime) return null

  return scheduleReminder({
    taskId,
    userId,
    title,
    taskTime,
    scheduledAt,
    offsetMinutes: reminder.offsetMin ?? 0,
  })
}
