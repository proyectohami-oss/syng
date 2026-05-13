/**
 * Listener L3 — tasks for all groups the user belongs to.
 *
 * Firestore's 'in' operator accepts a maximum of 30 items.
 * We chunk groupIds into batches of 10 (safe margin) and create
 * one onSnapshot listener per batch.
 *
 * The listener receives a stable string key (sorted groupIds joined
 * with commas) so it only re-subscribes when the actual set of groups
 * changes — not on every render.
 *
 * When docChanges arrive, tasks are grouped by their groupId field
 * and dispatched per-group to update the correct Map entry in the reducer.
 */
import { useEffect, useRef } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { CORE_ACTIONS } from '../store/coreActions'

const BATCH_SIZE = 10

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

/**
 * @param {string} groupIdsKey — sorted comma-joined group IDs string
 *   produced by useMemo in CoreDataProvider. Stable across renders
 *   when the set of groups hasn't changed.
 */
export function useGroupTasksListener(groupIdsKey, dispatch) {
  const unsubsRef = useRef([])

  useEffect(() => {
    // Cancel all existing listeners before re-subscribing
    unsubsRef.current.forEach(u => u())
    unsubsRef.current = []

    if (!groupIdsKey) return

    const groupIds = groupIdsKey.split(',').filter(Boolean)
    if (groupIds.length === 0) return

    const batches = chunk(groupIds, BATCH_SIZE)

    batches.forEach((batch) => {
      const q = query(
        collection(db, 'tasks'),
        where('groupId',   'in', batch),
        where('isDeleted', '==', false)
      )

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          // Partition docChanges by groupId and dispatch once per group
          const byGroup = new Map()
          snapshot.docChanges().forEach((change) => {
            const gid = change.doc.data().groupId
            if (!byGroup.has(gid)) byGroup.set(gid, [])
            byGroup.get(gid).push(change)
          })

          byGroup.forEach((changes, groupId) => {
            dispatch({
              type: CORE_ACTIONS.APPLY_GROUP_TASK_CHANGES,
              groupId,
              changes,
            })
          })

          dispatch({
            type:      CORE_ACTIONS.SET_FROM_CACHE,
            fromCache: snapshot.metadata.fromCache,
          })
          dispatch({
            type:             CORE_ACTIONS.SET_PENDING_WRITES,
            hasPendingWrites: snapshot.metadata.hasPendingWrites,
          })
        },
        (error) => {
          console.error('[GroupTasksListener] batch error:', error)
          dispatch({ type: CORE_ACTIONS.SET_TASKS_ERROR, error: error.message })
        }
      )

      unsubsRef.current.push(unsub)
    })

    return () => {
      unsubsRef.current.forEach(u => u())
      unsubsRef.current = []
    }
  }, [groupIdsKey, dispatch])
}
