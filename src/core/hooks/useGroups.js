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
import { assertFreeTierCanWrite, PlanLimitError } from '../services/movements.service'
import { showToast } from '../../shared/Toast'

export function useGroups() {
  const { state, dispatch } = useCoreData()

  function guardFreeWrite() {
    assertFreeTierCanWrite(
      state.auth.subscription,
      state.auth.plan,
      state.auth.subscription?.planId ?? 'gratis',
      state.auth.systemConfig,
    )
  }

  function tryGuardFreeWrite() {
    try {
      guardFreeWrite()
    } catch (error) {
      if (error instanceof PlanLimitError) showToast(error.message, '⚠️')
      throw error
    }
  }

  const createGroup = useCallback(async ({ name }) => {
    const uid      = state.auth.user?.uid
    const userData = state.auth.userData
    if (!uid || !userData) throw new Error('Not authenticated')
    tryGuardFreeWrite()
    const { id } = await groupsService.createGroup({
      name,
      adminId:          uid,
      adminDisplayName: userData.displayName ?? uid,
      adminEmail:       userData.email ?? '',
    })
    return id
  }, [state.auth.user, state.auth.userData, state.auth.subscription, state.auth.plan, state.auth.systemConfig])

  const updateGroupName = useCallback(async (groupId, name) => {
    tryGuardFreeWrite()
    const group = state.groups.list.get(groupId)
    if (!group) throw new Error('Group not found')
    dispatch({ type: CORE_ACTIONS.GROUP_UPDATED_OPTIMISTIC, group: { ...group, name } })
    try {
      await groupsService.updateGroupName(groupId, name)
    } catch (error) {
      dispatch({ type: CORE_ACTIONS.GROUP_UPDATED_OPTIMISTIC, group })
      throw error
    }
  }, [state.groups.list, dispatch, state.auth.subscription, state.auth.plan, state.auth.systemConfig])

  const deleteGroup = useCallback(async (groupId) => {
    tryGuardFreeWrite()
    const membersMap = state.groups.members.get(groupId) ?? new Map()
    const memberIds  = Array.from(membersMap.keys())
    await groupsService.deleteGroup(groupId, memberIds)
  }, [state.groups.members, state.auth.subscription, state.auth.plan, state.auth.systemConfig])

  const inviteUser = useCallback(async ({ groupId, email }) => {
    tryGuardFreeWrite()
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
  }, [state.auth.user, state.auth.userData, state.auth.subscription, state.auth.plan, state.auth.systemConfig, state.groups.list])

  const acceptInvitation = useCallback(async ({ invitationId, groupId, invitedBy }) => {
    tryGuardFreeWrite()
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
  }, [state.auth.user, state.auth.userData, state.auth.subscription, state.auth.plan, state.auth.systemConfig])

  const removeMember = useCallback(async ({ groupId, targetUid }) => {
    tryGuardFreeWrite()
    await membersService.removeMember({ groupId, targetUid })
  }, [state.auth.subscription, state.auth.plan, state.auth.systemConfig])

  const leaveGroup = useCallback(async (groupId) => {
    const uid        = state.auth.user?.uid
    const group      = state.groups.list.get(groupId)
    const membersMap = state.groups.members.get(groupId) ?? new Map()
    const memberIds  = Array.from(membersMap.keys())
    const isAdmin    = group?.adminId === uid
    const actorName  = state.auth.userData?.displayName || 'Alguien'
    if (!uid || !group) throw new Error('Invalid state')
    dispatch({ type: CORE_ACTIONS.REMOVE_GROUP_DATA, groupId })
    try {
      return await membersService.leaveGroup({ groupId, uid, isAdmin, memberIds, actorName })
    } catch (error) {
      console.error('[useGroups] leaveGroup error:', error)
      throw error
    }
  }, [state.auth.user, state.groups.list, state.groups.members, dispatch])

  const transferAdmin = useCallback(async ({ groupId, newAdminUid }) => {
    tryGuardFreeWrite()
    const uid = state.auth.user?.uid
    if (!uid) throw new Error('Not authenticated')
    await membersService.transferAdmin({ groupId, currentAdminUid: uid, newAdminUid })
  }, [state.auth.user, state.auth.subscription, state.auth.plan, state.auth.systemConfig])

  const addMemberByPhone = useCallback(async ({ groupId, phone }) => {
    const uid      = state.auth.user?.uid
    const userData = state.auth.userData
    const group    = state.groups.list.get(groupId)
    if (!uid || !userData || !group) throw new Error('Invalid state')

    tryGuardFreeWrite()

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
  }, [state.auth.user, state.auth.userData, state.auth.subscription, state.auth.plan, state.auth.systemConfig, state.groups.list])

  const cancelInvitation = useCallback(async (invitationId) => {
    await cancelInvitationService(invitationId)
  }, [])


  const createInvitationLink = useCallback(async ({ groupId, groupName, inviterName }) => {
    tryGuardFreeWrite()
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
  }, [state.auth.user, state.auth.userData, state.auth.subscription, state.auth.plan, state.auth.systemConfig, state.groups.list])

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