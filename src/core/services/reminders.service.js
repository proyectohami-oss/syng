/**
 * Reminders — hora local del dispositivo → UTC en Firestore → Cloud Task → FCM.
 */
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase'

/** Instante UTC desde fecha YYYY-MM-DD + hora local del dispositivo. */
export function localDateTimeToUtc(dateStr, hours24, minutes) {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(y, mo - 1, d, hours24, minutes, 0, 0)
}

export function getDeviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
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
    createdAt: serverTimestamp(),
  })
}
