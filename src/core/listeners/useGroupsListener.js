/**
 * Listener L4 — groups the user belongs to + their members.
 *
 * Uses array-contains query on memberIds so Firestore automatically
 * delivers new groups when someone adds the user to a group.
 *
 * For each group added in docChanges, a member subcollection listener
 * is started and tracked in memberUnsubsRef. When a group is removed,
 * its member listener is cancelled immediately.
 */
import { useEffect, useRef } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { CORE_ACTIONS } from '../store/coreActions'

export function useGroupsListener(uid, dispatch) {
  const groupsUnsubRef  = useRef(null)
  const memberUnsubsRef = useRef(new Map()) // Map<groupId, unsubFn>

  useEffect(() => {
    // Full cleanup on uid change or unmount
    if (groupsUnsubRef.current) {
      groupsUnsubRef.current()
      groupsUnsubRef.current = null
    }
    memberUnsubsRef.current.forEach(u => u())
    memberUnsubsRef.current = new Map()

    if (!uid) {
      dispatch({ type: CORE_ACTIONS.SET_GROUPS_LOADING, loading: false })
      return
    }

    dispatch({ type: CORE_ACTIONS.SET_GROUPS_LOADING, loading: true })

    const q = query(
      collection(db, 'groups'),
      where('memberIds', 'array-contains', uid),
      where('isDeleted', '==', false)
    )

    groupsUnsubRef.current = onSnapshot(
      q,
      (snapshot) => {
        dispatch({
          type:    CORE_ACTIONS.APPLY_GROUP_CHANGES,
          changes: snapshot.docChanges(),
        })

        // Manage member listeners based on group additions/removals
        snapshot.docChanges().forEach((change) => {
          const groupId = change.doc.id

          if (change.type === 'added') {
            // Start member listener if not already running
            if (!memberUnsubsRef.current.has(groupId)) {
              const unsub = startMembersListener(groupId, dispatch)
              memberUnsubsRef.current.set(groupId, unsub)
            }
          }

          if (change.type === 'removed') {
            // Cancel member listener for this group
            const unsub = memberUnsubsRef.current.get(groupId)
            if (unsub) {
              unsub()
              memberUnsubsRef.current.delete(groupId)
            }
          }
        })
      },
      (error) => {
        console.error('[GroupsListener] error:', error)
        dispatch({ type: CORE_ACTIONS.SET_GROUPS_ERROR, error: error.message })
      }
    )

    return () => {
      if (groupsUnsubRef.current) {
        groupsUnsubRef.current()
        groupsUnsubRef.current = null
      }
      memberUnsubsRef.current.forEach(u => u())
      memberUnsubsRef.current = new Map()
    }
  }, [uid, dispatch])
}

/** Start listening to /groups/{groupId}/members. Returns the unsubscribe fn. */
function startMembersListener(groupId, dispatch) {
  return onSnapshot(
    collection(db, 'groups', groupId, 'members'),
    (snapshot) => {
      dispatch({
        type:    CORE_ACTIONS.APPLY_MEMBER_CHANGES,
        groupId,
        changes: snapshot.docChanges(),
      })
    },
    (error) => {
      console.error(`[MembersListener:${groupId}] error:`, error)
    }
  )
}
