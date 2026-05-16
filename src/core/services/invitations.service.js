import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { addMember } from './groups.service'

export async function createInvitation({ groupId, groupName, inviterUid, inviterName, phoneNumber }) {
  await addDoc(collection(db, 'invitations'), {
    groupId,
    groupName,
    inviterUid,
    inviterName,
    phoneNumber,
    status:     'pending',
    createdAt:  serverTimestamp(),
    acceptedAt: null,
  })
}

export async function hasPendingInvitation({ groupId, phoneNumber }) {
  const q = query(
    collection(db, 'invitations'),
    where('groupId',     '==', groupId),
    where('phoneNumber', '==', phoneNumber),
    where('status',      '==', 'pending'),
    limit(1)
  )
  const snap = await getDocs(q)
  return !snap.empty
}

export async function cancelInvitation(invitationId) {
  await deleteDoc(doc(db, 'invitations', invitationId))
}

export async function checkPendingInvitations(newUser) {
  const q = query(
    collection(db, 'invitations'),
    where('phoneNumber', '==', newUser.phoneNumber),
    where('status',      '==', 'pending')
  )
  const snap = await getDocs(q)
  if (snap.empty) return []
  const groupNames = []
  for (const invDoc of snap.docs) {
    const inv = invDoc.data()
    try {
      await addMember(inv.groupId, newUser, inv.inviterUid)
      await updateDoc(doc(db, 'invitations', invDoc.id), {
        status:     'accepted',
        acceptedAt: serverTimestamp(),
      })
      groupNames.push(inv.groupName)
    } catch (err) {
      console.error('[Invitations] error al aceptar:', err)
    }
  }
  return groupNames
}

export async function getPendingInvitations(groupId) {
  const q = query(
    collection(db, 'invitations'),
    where('groupId', '==', groupId),
    where('status',  '==', 'pending')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}