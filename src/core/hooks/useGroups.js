/**
 * useGroups — group and membership operations.
 *
 * Note on optimistic updates for destructive operations:
 *   - createGroup: optimistic (group appears instantly)
 *   - updateGroupName: optimistic with rollback
 *   - deleteGroup: NOT optimistic — waits for Firestore confirmation.
 *     The soft-delete triggers the listener which removes the group
 *     from state via APPLY_GROUP_CHANGES (type: 'removed').
 *   - leaveGroup: optimistic — user sees they've left immediately.
 *   - removeMember: NOT optimistic — listener handles the update.
 */
import { useCallback } from 'react'
import { useCoreData } from './useCoreData'
import { CORE_ACTIONS } from '../store/coreActions'
import * as groupsService  from '../services/groups.service'
import * as membersService from '../services/members.service'

export function useGroups() {
  const { state, dispatch } = useCoreData()

  const createGroup = useCallback(async ({ name }) => {
    const uid      = state.auth.user?.uid
    const userData = state.auth.userData
    if (!uid || !userData) throw new Error('Not authenticated')

    const { id } = await groupsService.createGroup({
      name,
      adminId:         uid,
      adminDisplayName: userData.displayName ?? uid,
      adminEmail:       userData.email ?? '',
    })
    return id
  }, [state.auth.user, state.auth.userData])

  const updateGroupName = useCallback(async (groupId, name) => {
    const group = state.groups.list.get(groupId)
    if (!group) throw new Error('Group not found')

    dispatch({
      type:  CORE_ACTIONS.GROUP_UPDATED_OPTIMISTIC,
      group: { ...group, name },
    })

    try {
      await groupsService.updateGroupName(groupId, name)
    } catch (error) {
      // Rollback to original name
      dispatch({ type: CORE_ACTIONS.GROUP_UPDATED_OPTIMISTIC, group })
      throw error
    }
  }, [state.groups.list, dispatch])

  const deleteGroup = useCallback(async (groupId) => {
    const membersMap = state.groups.members.get(groupId) ?? new Map()
    const memberIds  = Array.from(membersMap.keys())
    // No optimistic update — let the listener handle state removal
    await groupsService.deleteGroup(groupId, memberIds)
  }, [state.groups.members])

  const inviteUser = useCallback(async ({ groupId, email }) => {
    const uid      = state.auth.user?.uid
    const userData = state.auth.userData
    const group    = state.groups.list.get(groupId)
    if (!uid || !userData || !group) throw new Error('Invalid state')

    return membersService.inviteUserByEmail({
      groupId,
      groupName:    group.name,
      invitedEmail: email,
      invitedByUid: uid,
      invitedByName: userData.displayName ?? uid,
    })
  }, [state.auth.user, state.auth.userData, state.groups.list])

  const acceptInvitation = useCallback(async ({ invitationId, groupId, invitedBy }) => {
    const uid      = state.auth.user?.uid
    const userData = state.auth.userData
    if (!uid || !userData) throw new Error('Not authenticated')

    await membersService.acceptInvitation({
      invitationId,
      groupId,
      uid,
      displayName: userData.displayName ?? uid,
      email:       userData.email ?? '',
      invitedBy,
    })
  }, [state.auth.user, state.auth.userData])

  const removeMember = useCallback(async ({ groupId, targetUid }) => {
    await membersService.removeMember({ groupId, targetUid })
    // Listener will dispatch APPLY_MEMBER_CHANGES (type: 'removed')
  }, [])

  const leaveGroup = useCallback(async (groupId) => {
    const uid      = state.auth.user?.uid
    const group    = state.groups.list.get(groupId)
    const membersMap = state.groups.members.get(groupId) ?? new Map()
    const memberIds  = Array.from(membersMap.keys())
    const isAdmin    = group?.adminId === uid
    if (!uid || !group) throw new Error('Invalid state')

    // Optimistic: remove group from state immediately so UI responds
    dispatch({ type: CORE_ACTIONS.REMOVE_GROUP_DATA, groupId })

    try {
      return await membersService.leaveGroup({ groupId, uid, isAdmin, memberIds })
    } catch (error) {
      console.error('[useGroups] leaveGroup error:', error)
      // On error the group listener will re-add it on next snapshot if user is still a member
      throw error
    }
  }, [state.auth.user, state.groups.list, state.groups.members, dispatch])

  const transferAdmin = useCallback(async ({ groupId, newAdminUid }) => {
    const uid = state.auth.user?.uid
    if (!uid) throw new Error('Not authenticated')
    await membersService.transferAdmin({ groupId, currentAdminUid: uid, newAdminUid })
  }, [state.auth.user])

  return {
    createGroup,
    updateGroupName,
    deleteGroup,
    inviteUser,
    acceptInvitation,
    removeMember,
    leaveGroup,
    transferAdmin,
  }
}
