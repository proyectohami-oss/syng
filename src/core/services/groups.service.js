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
 * Uses a batch write to atomically create the group document,
 * the admin's member sub-document, and update the user's groupIds.
 *
 * @returns {{ id: string, group: Object }} pre-computed local data for optimistic update
 */
export async function createGroup({ name, adminId, adminDisplayName, adminEmail }) {
  const groupRef = doc(collection(db, 'groups'))
  const id       = groupRef.id
  const batch    = writeBatch(db)

  batch.set(groupRef, {
    id,
    name:      name.trim(),
    adminId,
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

  batch.update(doc(db, 'users', adminId), {
    groupIds: arrayUnion(id),
  })

  await batch.commit()

  return { id }
}

/** Rename a group. Only the admin should call this. */
export async function updateGroupName(groupId, name) {
  await updateDoc(doc(db, 'groups', groupId), {
    name:      name.trim(),
    updatedAt: serverTimestamp(),
  })
}

/**
 * Soft-delete the group and remove it from all members' groupIds arrays.
 * @param {string} groupId
 * @param {string[]} memberIds — all current member UIDs
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
