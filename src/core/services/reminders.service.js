/**
 * Reminders service — programación exacta vía colección /reminders.
 * El trigger sendReminderTask en Cloud Functions encola Cloud Tasks
 * al segundo indicado por scheduledAt.
 */
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase'

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
    taskTime:      Timestamp.fromDate(taskTime),
    scheduledAt:   Timestamp.fromDate(scheduledAt),
    offsetMinutes,
    status:        'pending',
    createdAt:     serverTimestamp(),
  })
}
