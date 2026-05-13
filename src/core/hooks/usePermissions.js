import { useMemo, useContext } from 'react'
import { CoreAuthContext, CoreGroupsContext } from '../CoreDataProvider'
import { selectUserRole } from '../selectors/groupSelectors'

export function usePermissions(groupId = null) {
  const auth   = useContext(CoreAuthContext)
  const groups = useContext(CoreGroupsContext)
  const uid    = auth?.user?.uid ?? null

  return useMemo(() => {
    const state = { auth, groups }
    const role     = groupId ? selectUserRole(state, groupId) : null
    const isMember = role === 'admin' || role === 'member'
    const isAdmin  = role === 'admin'

    return {
      canCreatePersonalTask: !!uid,
      canCreateGroupTask:    !!uid && isMember,
      canEditTask:   (task) => !!uid && task.ownerId === uid,
      canDeleteTask: (task) => !!uid && task.ownerId === uid,
      canToggleTask: (task) => {
        if (!uid) return false
        if (task.type === 'personal') return task.ownerId === uid
        const r = selectUserRole(state, task.groupId)
        return r === 'admin' || r === 'member'
      },
      canEditGroup:    isAdmin,
      canDeleteGroup:  isAdmin,
      canInviteMember: isAdmin,
      canRemoveMember: (targetUid) => isAdmin && targetUid !== uid,
      canLeaveGroup:   isMember,
      canTransferAdmin:isAdmin,
      canManageGroup:  isAdmin,
    }
  }, [uid, groups, groupId])
}
