/**
 * rollover.service.js
 * Mueve al día actual todas las tareas personales pendientes
 * cuya fecha de vencimiento sea anterior a hoy.
 * Solo se ejecuta una vez por día, a medianoche.
 */
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { updateTask } from './tasks.service'

export async function rolloverPersonalTasks(uid) {
  if (!uid) return

  /* Inicio del día de hoy a las 00:00:00 */
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  /* Final del día de hoy a las 23:59:59 */
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  /* Nueva fecha: hoy a las 23:59:59 */
  const newDueDate = Timestamp.fromDate(todayEnd)

  try {
    const q = query(
      collection(db, 'tasks'),
      where('ownerId',   '==', uid),
      where('type',      '==', 'personal'),
      where('status',    '==', 'pending'),
      where('isDeleted', '==', false),
    )

    const snapshot = await getDocs(q)

    const promises = []
    snapshot.forEach(docSnap => {
      const task = docSnap.data()
      if (!task.dueDate) return

      const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)

      /* Solo mover si la fecha es anterior a hoy */
      if (dueDate < todayStart) {
        promises.push(updateTask(task.id, { dueDate: newDueDate }))
      }
    })

    await Promise.all(promises)
    console.log(`[Rollover] ${promises.length} tarea(s) movida(s) al día actual.`)
  } catch (error) {
    console.error('[Rollover] Error:', error)
  }
}
