/**
 * rollover.service.js
 * Mueve al día actual todas las tareas pendientes
 * cuya fecha de vencimiento sea anterior a hoy.
 * Compara solo YYYY-MM-DD — ignora la hora.
 */
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { updateTask } from './tasks.service'

function toDateKey(date) {
  const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date))
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export async function rolloverPersonalTasks(uid) {
  if (!uid) return

  const today = new Date()
  const todayKey = toDateKey(today)

  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)
  const newDueDate = Timestamp.fromDate(todayEnd)

  try {
    const qPersonal = query(
      collection(db, 'tasks'),
      where('ownerId',   '==', uid),
      where('type',      '==', 'personal'),
      where('status',    '==', 'pending'),
      where('isDeleted', '==', false),
    )

    const qGroup = query(
      collection(db, 'tasks'),
      where('ownerId',   '==', uid),
      where('type',      '==', 'group'),
      where('status',    '==', 'pending'),
      where('isDeleted', '==', false),
    )

    const [snapPersonal, snapGroup] = await Promise.all([
      getDocs(qPersonal),
      getDocs(qGroup),
    ])

    const allDocs = [...snapPersonal.docs, ...snapGroup.docs]
    const promises = []

    allDocs.forEach(docSnap => {
      const task = docSnap.data()
      if (!task.dueDate) return
      const taskKey = toDateKey(task.dueDate)
      if (taskKey < todayKey) {
        promises.push(updateTask(task.id, { dueDate: newDueDate }))
      }
    })

    await Promise.all(promises)
    console.log(`[Rollover] ${promises.length} tarea(s) movida(s) al día actual.`)
  } catch (error) {
    console.error('[Rollover] Error:', error)
  }
}
