/**
 * useTasks — CRUD de tareas con optimistic updates.
 *
 * updateTask ahora maneja correctamente el cambio de tipo/grupo:
 * el reducer TASK_UPDATED_OPTIMISTIC siempre limpia la tarea de todos
 * los mapas antes de ubicarla en el lugar correcto, evitando duplicados.
 */
import { useCallback }    from 'react'
import { showToast }      from '../../shared/Toast'
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
import { reserveMovement, PlanLimitError, assertFreeTierCanWrite } from '../services/movements.service'

export function useTasks() {
  const { state, dispatch } = useCoreData()

  const guardMovement = useCallback(async () => {
    const uid = state.auth.user?.uid
    if (!uid || !state.auth.subscription) return
    assertFreeTierCanWrite(
      state.auth.subscription,
      state.auth.plan,
      state.auth.subscription.planId,
      state.auth.systemConfig,
    )
    await reserveMovement(
      uid,
      state.auth.subscription,
      state.auth.plan,
      state.auth.subscription.planId,
      state.auth.systemConfig,
      state.auth.userData?.phoneNumber,
    )
  }, [
    state.auth.user,
    state.auth.userData,
    state.auth.subscription,
    state.auth.plan,
    state.auth.systemConfig,
  ])

  const handleMovementError = useCallback((error) => {
    if (error instanceof PlanLimitError) {
      showToast(error.message, '⚠️')
    }
    throw error
  }, [])

  const createTask = useCallback(async (data) => {
    const uid = state.auth.user?.uid
    if (!uid) throw new Error('Not authenticated')

    const id  = data.id ?? generateTaskId()
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
      reminder:    data.reminder ?? null,
      reminderTime: data.reminderTime ?? null,
      isDeleted:   false,
      createdAt:   now,
      updatedAt:   now,
      _optimistic: true,
    }

    dispatch({ type: CORE_ACTIONS.TASK_ADDED_OPTIMISTIC, task: optimistic })

    try {
      await guardMovement()
      const actorName = state.auth.userData?.displayName || ''
      await svcCreate({ id, ...data, ownerId: uid, actorName })
      if (data.groupId) showToast('Tarea creada', '＋')
    } catch (error) {
      console.error('[useTasks] createTask error:', error)
      dispatch({ type: CORE_ACTIONS.TASK_DELETED_OPTIMISTIC, taskId: id })
      handleMovementError(error)
    }
  }, [state.auth.user, state.auth.userData, state.auth.subscription, dispatch, guardMovement, handleMovementError])

  const updateTask = useCallback(async (task, updates) => {
    const now = Timestamp.now()

    const patched = {
      ...task,
      ...updates,
      updatedAt:   now,
      _optimistic: true,
    }

    dispatch({ type: CORE_ACTIONS.TASK_UPDATED_OPTIMISTIC, task: patched })

    try {
      await guardMovement()
      const fsUpdates = {
        ...updates,
        ownerId: task.ownerId,
        title: updates.title ?? task.title,
        dueDate: updates.dueDate ?? task.dueDate,
      }
      if (!('reminder' in updates)) {
        delete fsUpdates.reminder
        delete fsUpdates.reminderTime
      }
      await svcUpdate(task.id, fsUpdates)
      dispatch({ type: CORE_ACTIONS.SET_PENDING_WRITES, hasPendingWrites: false })
    } catch (error) {
      console.error('[useTasks] updateTask error:', error)
      dispatch({ type: CORE_ACTIONS.TASK_UPDATED_OPTIMISTIC, task })
      handleMovementError(error)
    }
  }, [dispatch, guardMovement, handleMovementError])

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
      await guardMovement()
      const actorName = state.auth.userData?.displayName || ''
      const completing = task.status === 'pending'
      await svcToggle(task.id, task.status, uid, task.groupId || null, actorName, task.title || '')
      if (task.groupId && completing) showToast('Tarea completada', '✓')
    } catch (error) {
      console.error('[useTasks] toggleStatus error:', error)
      dispatch({ type: CORE_ACTIONS.TASK_UPDATED_OPTIMISTIC, task })
      handleMovementError(error)
    }
  }, [state.auth.user, state.auth.userData, dispatch, guardMovement, handleMovementError])

  const deleteTask = useCallback(async (task) => {
    try {
      assertFreeTierCanWrite(
        state.auth.subscription,
        state.auth.plan,
        state.auth.subscription?.planId ?? 'gratis',
        state.auth.systemConfig,
      )
    } catch (error) {
      if (error instanceof PlanLimitError) showToast(error.message, '⚠️')
      throw error
    }

    dispatch({ type: CORE_ACTIONS.TASK_DELETED_OPTIMISTIC, taskId: task.id })

    try {
      await svcDelete(task.id)
    } catch (error) {
      console.error('[useTasks] deleteTask error:', error)
      dispatch({ type: CORE_ACTIONS.TASK_ADDED_OPTIMISTIC, task })
      throw error
    }
  }, [dispatch, state.auth.subscription, state.auth.plan, state.auth.systemConfig])

  return { createTask, updateTask, toggleStatus, deleteTask }
}
