import { useCallback } from 'react'
import { useCoreData } from './useCoreData'
import { CORE_ACTIONS } from '../store/coreActions'
import * as groupsService  from '../services/groups.service'
import * as membersService from '../services/members.service'
import { findUserByPhone } from '../services/users.service'
import {
  createInvitation,
  hasPendingInvitation,
  cancelInvitation as cancelInvitationService,
  createInvitationLink as createInvitationLinkService,
} from '../services/invitations.service'
import { addMember } from '../services/groups.service'

export function useGroups() {
  const { state, dispatch } = useCoreData()

  const createGroup = useCallback(async ({ name }) => {
    const uid      = state.auth.user?.uid
    const userData = state.auth.userData
    if (!uid || !userData) throw new Error('Not authenticated')
    const { id } = await groupsService.createGroup({
      name,
      adminId:          uid,
      adminDisplayName: userData.displayName ?? uid,
      adminEmail:       userData.email ?? '',
    })
    return id
  }, [state.auth.user, state.auth.userData])

  const updateGroupName = useCallback(async (groupId, name) => {
    const group = state.groups.list.get(groupId)
    if (!group) throw new Error('Group not found')
    dispatch({ type: CORE_ACTIONS.GROUP_UPDATED_OPTIMISTIC, group: { ...group, name } })
    try {
      await groupsService.updateGroupName(groupId, name)
    } catch (error) {
      dispatch({ type: CORE_ACTIONS.GROUP_UPDATED_OPTIMISTIC, group })
      throw error
    }
  }, [state.groups.list, dispatch])

  const deleteGroup = useCallback(async (groupId) => {
    const membersMap = state.groups.members.get(groupId) ?? new Map()
    const memberIds  = Array.from(membersMap.keys())
    await groupsService.deleteGroup(groupId, memberIds)
  }, [state.groups.members])

  const inviteUser = useCallback(async ({ groupId, email }) => {
    const uid      = state.auth.user?.uid
    const userData = state.auth.userData
    const group    = state.groups.list.get(groupId)
    if (!uid || !userData || !group) throw new Error('Invalid state')
    return membersService.inviteUserByEmail({
      groupId,
      groupName:     group.name,
      invitedEmail:  email,
      invitedByUid:  uid,
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
  }, [])

  const leaveGroup = useCallback(async (groupId) => {
    const uid        = state.auth.user?.uid
    const group      = state.groups.list.get(groupId)
    const membersMap = state.groups.members.get(groupId) ?? new Map()
    const memberIds  = Array.from(membersMap.keys())
    const isAdmin    = group?.adminId === uid
    if (!uid || !group) throw new Error('Invalid state')
    dispatch({ type: CORE_ACTIONS.REMOVE_GROUP_DATA, groupId })
    try {
      return await membersService.leaveGroup({ groupId, uid, isAdmin, memberIds })
    } catch (error) {
      console.error('[useGroups] leaveGroup error:', error)
      throw error
    }
  }, [state.auth.user, state.groups.list, state.groups.members, dispatch])

  const transferAdmin = useCallback(async ({ groupId, newAdminUid }) => {
    const uid = state.auth.user?.uid
    if (!uid) throw new Error('Not authenticated')
    await membersService.transferAdmin({ groupId, currentAdminUid: uid, newAdminUid })
  }, [state.auth.user])

  const addMemberByPhone = useCallback(async ({ groupId, phone }) => {
    const uid      = state.auth.user?.uid
    const userData = state.auth.userData
    const group    = state.groups.list.get(groupId)
    if (!uid || !userData || !group) throw new Error('Invalid state')

    const found = await findUserByPhone(phone)
    if (found) {
      await addMember(groupId, {
        uid:         found.uid,
        displayName: found.displayName,
        email:       found.email ?? '',
        phoneNumber: found.phoneNumber,
      }, uid)
      return { status: 'added', displayName: found.displayName || found.phoneNumber }
    }

    const { normalizePhone } = await import('../services/users.service')
    const phoneNumber = normalizePhone(phone)

    const duplicate = await hasPendingInvitation({ groupId, phoneNumber })
    if (duplicate) {
      return { status: 'already_invited', displayName: phoneNumber }
    }

    await createInvitation({
      groupId,
      groupName:   group.name,
      inviterUid:  uid,
      inviterName: userData.displayName ?? '',
      phoneNumber,
    })
    return { status: 'invited', displayName: phoneNumber }
  }, [state.auth.user, state.auth.userData, state.groups.list])

  const cancelInvitation = useCallback(async (invitationId) => {
    await cancelInvitationService(invitationId)
  }, [])


  const createInvitationLink = useCallback(async ({ groupId, groupName, inviterName }) => {
    const uid      = state.auth.user?.uid
    const userData = state.auth.userData
    const group    = state.groups.list.get(groupId)
    if (!uid || !userData || !group) throw new Error('Invalid state')
    return createInvitationLinkService({
      groupId,
      groupName:   groupName || group.name,
      inviterUid:  uid,
      inviterName: inviterName || userData.displayName || '',
    })
  }, [state.auth.user, state.auth.userData, state.groups.list])

  return {
    createGroup,
    updateGroupName,
    deleteGroup,
    inviteUser,
    acceptInvitation,
    removeMember,
    leaveGroup,
    transferAdmin,
    addMemberByPhone,
    cancelInvitation,
    createInvitationLink,
  }
}