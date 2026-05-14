/**
 * Groups service — pure Firestore CRUD. No React, no state.
 */
import {
  doc,
  collection,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from '../../firebase'

/**
 * Create a new group and add the creator as admin.
 * adminIds es array desde el inicio — soporta múltiples admins.
 */
export async function createGroup({ name, adminId, adminDisplayName, adminEmail }) {
  const groupRef = doc(collection(db, 'groups'))
  const id       = groupRef.id
  const batch    = writeBatch(db)

  batch.set(groupRef, {
    id,
    name:      name.trim(),
    adminIds:  [adminId],
    memberIds: [adminId],
    isDeleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  batch.set(doc(db, 'groups', id, 'members', adminId), {
    uid:         adminId,
    displayName: adminDisplayName,
    email:       adminEmail,
    role:        'admin',
    joinedAt:    serverTimestamp(),
    invitedBy:   adminId,
  })

  await batch.commit()

  // Actualizar groupIds del usuario por separado (fuera del batch)
  await updateDoc(doc(db, 'users', adminId), {
    groupIds: arrayUnion(id),
  })

  return { id }
}

/** Rename a group. Only admins should call this. */
export async function updateGroupName(groupId, name) {
  await updateDoc(doc(db, 'groups', groupId), {
    name:      name.trim(),
    updatedAt: serverTimestamp(),
  })
}

/**
 * Add an existing Syng user to a group.
 * @param {string} groupId
 * @param {{ uid, displayName, email, phoneNumber }} member
 * @param {string} invitedBy — uid of who invited them
 */
export async function addMember(groupId, member, invitedBy) {
  const batch = writeBatch(db)

  batch.update(doc(db, 'groups', groupId), {
    memberIds: arrayUnion(member.uid),
    updatedAt: serverTimestamp(),
  })

  batch.set(doc(db, 'groups', groupId, 'members', member.uid), {
    uid:         member.uid,
    displayName: member.displayName ?? '',
    email:       member.email ?? '',
    phoneNumber: member.phoneNumber ?? null,
    role:        'member',
    joinedAt:    serverTimestamp(),
    invitedBy,
  })

  batch.update(doc(db, 'users', member.uid), {
    groupIds: arrayUnion(groupId),
  })

  await batch.commit()
}

/**
 * Remove a member from a group (admin action).
 */
export async function removeMember(groupId, uid) {
  const batch = writeBatch(db)

  batch.update(doc(db, 'groups', groupId), {
    memberIds: arrayRemove(uid),
    adminIds:  arrayRemove(uid),
    updatedAt: serverTimestamp(),
  })

  batch.delete(doc(db, 'groups', groupId, 'members', uid))

  batch.update(doc(db, 'users', uid), {
    groupIds: arrayRemove(groupId),
  })

  await batch.commit()
}

/**
 * Leave a group voluntarily (member action).
 * Same as removeMember but called by the member themselves.
 */
export async function leaveGroup(groupId, uid) {
  return removeMember(groupId, uid)
}

/**
 * Promote a member to admin.
 */
export async function promoteToAdmin(groupId, uid) {
  const batch = writeBatch(db)

  batch.update(doc(db, 'groups', groupId), {
    adminIds:  arrayUnion(uid),
    updatedAt: serverTimestamp(),
  })

  batch.update(doc(db, 'groups', groupId, 'members', uid), {
    role: 'admin',
  })

  await batch.commit()
}

/**
 * Soft-delete the group and remove it from all members' groupIds arrays.
 */
export async function deleteGroup(groupId, memberIds) {
  const batch = writeBatch(db)

  batch.update(doc(db, 'groups', groupId), {
    isDeleted: true,
    updatedAt: serverTimestamp(),
  })

  for (const uid of memberIds) {
    batch.update(doc(db, 'users', uid), {
      groupIds: arrayRemove(groupId),
    })
  }

  await batch.commit()
}
