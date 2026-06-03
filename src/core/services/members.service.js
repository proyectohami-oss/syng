/**
 * Members service — invitations, membership operations, role transfers.
 *
 * Invitation model (no Cloud Functions required):
 *   1. Admin creates /invitations/{id} with invitedEmail field.
 *   2. When a user logs in, they query /invitations where
 *      invitedEmail == user.email to find pending invitations.
 *   3. User accepts → member sub-doc is created, groupIds updated.
 *
 * This avoids exposing user email lookup to arbitrary clients.
 */
import {
  doc,
  collection,
  setDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from '../../firebase'

/**
 * Create an invitation document.
 * The invited user will discover it by querying their email.
 */
export async function inviteUserByEmail({
  groupId,
  groupName,
  invitedEmail,
  invitedByUid,
  invitedByName,
}) {
  const ref        = doc(collection(db, 'invitations'))
  const expiresAt  = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7-day expiry

  await setDoc(ref, {
    id:            ref.id,
    groupId,
    groupName,
    invitedEmail:  invitedEmail.trim().toLowerCase(),
    invitedBy:     invitedByUid,
    invitedByName,
    status:        'pending',
    createdAt:     serverTimestamp(),
    expiresAt,
  })

  return ref.id
}

/**
 * Accept an invitation.
 * Atomically creates the member sub-doc, updates group.memberIds,
 * updates user.groupIds, and marks the invitation as accepted.
 *
 * @param {Object} params
 * @param {string} params.invitationId
 * @param {string} params.groupId
 * @param {string} params.uid        — accepting user's UID
 * @param {string} params.displayName
 * @param {string} params.email
 * @param {string} params.invitedBy  — UID of who sent the invite
 */
export async function acceptInvitation({
  invitationId,
  groupId,
  uid,
  displayName,
  email,
  invitedBy,
}) {
  const batch = writeBatch(db)

  batch.set(doc(db, 'groups', groupId, 'members', uid), {
    uid,
    displayName,
    email:     email.toLowerCase(),
    role:      'member',
    joinedAt:  serverTimestamp(),
    invitedBy,
  })

  batch.update(doc(db, 'groups', groupId), {
    memberIds: arrayUnion(uid),
    updatedAt: serverTimestamp(),
  })

  batch.update(doc(db, 'users', uid), {
    groupIds: arrayUnion(groupId),
  })

  batch.update(doc(db, 'invitations', invitationId), {
    status: 'accepted',
  })

  await batch.commit()
}

/**
 * Remove a member from a group.
 * Should only be called by the admin (checked in usePermissions, enforced in Security Rules).
 */
export async function removeMember({ groupId, targetUid }) {
  const batch = writeBatch(db)

  batch.delete(doc(db, 'groups', groupId, 'members', targetUid))

  batch.update(doc(db, 'groups', groupId), {
    memberIds: arrayRemove(targetUid),
    updatedAt: serverTimestamp(),
  })

  batch.update(doc(db, 'users', targetUid), {
    groupIds: arrayRemove(groupId),
  })

  await batch.commit()
}

/**
 * Leave a group.
 *
 * Rules:
 *   - If the user is admin and is the LAST member → soft-delete the group.
 *   - If the user is admin and there are other members → throw: must transfer first.
 *   - If the user is a regular member → remove them.
 *
 * @returns {{ deleted: boolean }} whether the group was deleted
 */
export async function leaveGroup({ groupId, uid, isAdmin, memberIds, actorName = 'Alguien' }) {
  if (isAdmin && memberIds.length > 1) {
    throw new Error('group/admin-must-transfer-before-leaving')
  }

  if (isAdmin && memberIds.length === 1) {
    // Last person — delete the group
    const batch = writeBatch(db)
    batch.update(doc(db, 'groups', groupId), {
      isDeleted: true,
      updatedAt: serverTimestamp(),
    })
    batch.update(doc(db, 'users', uid), {
      groupIds: arrayRemove(groupId),
    })
    await batch.commit()
    return { deleted: true }
  }

  await removeMember({ groupId, targetUid: uid })
  try {
    const { logActivityEvent } = await import('./activityLog.service.js')
    await logActivityEvent({ eventAction: 'member.left', actorId: uid, groupId, metadata: { actor_name: actorName } })
  } catch (_) {}
  return { deleted: false }
}

/**
 * Transfer the admin role to another member.
 * Atomically updates the group document and both member sub-docs.
 */
export async function transferAdmin({ groupId, currentAdminUid, newAdminUid }) {
  const batch = writeBatch(db)

  batch.update(doc(db, 'groups', groupId), {
    adminId:   newAdminUid,
    updatedAt: serverTimestamp(),
  })

  batch.update(doc(db, 'groups', groupId, 'members', currentAdminUid), {
    role: 'member',
  })

  batch.update(doc(db, 'groups', groupId, 'members', newAdminUid), {
    role: 'admin',
  })

  await batch.commit()
}
