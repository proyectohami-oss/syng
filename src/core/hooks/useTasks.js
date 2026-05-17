/**
 * useTasks — CRUD de tareas con optimistic updates.
 *
 * updateTask ahora maneja correctamente el cambio de tipo/grupo:
 * el reducer TASK_UPDATED_OPTIMISTIC siempre limpia la tarea de todos
 * los mapas antes de ubicarla en el lugar correcto, evitando duplicados.
 */
import { useCallback }    from 'react'
import { Timestamp }      from 'firebase/firestore'
import { useCoreData }    from './useCoreData'
import { CORE_ACTIONS }   from '../store/coreActions'
import {
  generateTaskId,
  createTask  as svcCreate,
  updateTask  as svcUpdate,
  toggleTaskStatus as svcToggle,
  deleteTask  as svcDelete,
} from '../services/tasks.service'

export function useTasks() {
  const { state, dispatch } = useCoreData()

  // ── Crear ────────────────────────────────────────────────────────

  const createTask = useCallback(async (data) => {
    const uid = state.auth.user?.uid
    if (!uid) throw new Error('Not authenticated')

    const id  = generateTaskId()
    const now = Timestamp.now()

    const optimistic = {
      id,
      title:       data.title.trim(),
      description: data.description?.trim() ?? '',
      status:      'pending',
      type:        data.type,
      ownerId:     uid,
      groupId:     data.groupId ?? null,
      assignedTo:  null,
      dueDate:     data.dueDate ?? null,
      completedAt: null,
      completedBy: null,
      isDeleted:   false,
      createdAt:   now,
      updatedAt:   now,
      _optimistic: true,
    }

    dispatch({ type: CORE_ACTIONS.TASK_ADDED_OPTIMISTIC, task: optimistic })

    try {
      const actorName = state.auth.userData?.displayName || ''
      await svcCreate({ id, ...data, ownerId: uid, actorName })
    } catch (error) {
      console.error('[useTasks] createTask error:', error)
      dispatch({ type: CORE_ACTIONS.TASK_DELETED_OPTIMISTIC, taskId: id })
      throw error
    }
  }, [state.auth.user, dispatch])

  // ── Actualizar ───────────────────────────────────────────────────

  /**
   * Actualiza campos de una tarea existente.
   * Si cambia type o groupId, la tarea se reubica automáticamente
   * gracias a removeTaskFromAllMaps en el reducer.
   *
   * @param {Object} task    — tarea actual del estado
   * @param {Object} updates — campos a cambiar (title, dueDate, type, groupId, etc.)
   */
  const updateTask = useCallback(async (task, updates) => {
    const now = Timestamp.now()

    // Tarea con los cambios aplicados — usa los nuevos valores si existen
    const patched = {
      ...task,
      ...updates,
      updatedAt:   now,
      _optimistic: true,
    }

    dispatch({ type: CORE_ACTIONS.TASK_UPDATED_OPTIMISTIC, task: patched })

    try {
      await svcUpdate(task.id, { ...updates, updatedAt: now })
    } catch (error) {
      console.error('[useTasks] updateTask error:', error)
      // Rollback: restaura la tarea original
      dispatch({ type: CORE_ACTIONS.TASK_UPDATED_OPTIMISTIC, task })
      throw error
    }
  }, [dispatch])

  // ── Toggle completada/pendiente ──────────────────────────────────

  const toggleStatus = useCallback(async (task) => {
    const uid         = state.auth.user?.uid
    if (!uid) throw new Error('Not authenticated')

    const isCompleting = task.status === 'pending'
    const now          = Timestamp.now()
    const optimistic   = {
      ...task,
      status:      isCompleting ? 'completed' : 'pending',
      completedAt: isCompleting ? now : null,
      completedBy: isCompleting ? uid : null,
      updatedAt:   now,
      _optimistic: true,
    }

    dispatch({ type: CORE_ACTIONS.TASK_UPDATED_OPTIMISTIC, task: optimistic })

    try {
      const actorName = state.auth.userData?.displayName || ''
      await svcToggle(task.id, task.status, uid, task.groupId || null, actorName, task.title || '')
    } catch (error) {
      console.error('[useTasks] toggleStatus error:', error)
      dispatch({ type: CORE_ACTIONS.TASK_UPDATED_OPTIMISTIC, task })
      throw error
    }
  }, [state.auth.user, dispatch])

  // ── Eliminar (soft delete) ───────────────────────────────────────

  const deleteTask = useCallback(async (task) => {
    dispatch({ type: CORE_ACTIONS.TASK_DELETED_OPTIMISTIC, taskId: task.id })

    try {
      await svcDelete(task.id)
    } catch (error) {
      console.error('[useTasks] deleteTask error:', error)
      dispatch({ type: CORE_ACTIONS.TASK_ADDED_OPTIMISTIC, task })
      throw error
    }
  }, [dispatch])

  return { createTask, updateTask, toggleStatus, deleteTask }
}
