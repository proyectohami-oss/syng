import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
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

  // ── Invitaciones por link ─────────────────────────────────────────────────

export async function createInvitationLink({ groupId, groupName, inviterUid, inviterName }) {
  const ref = await addDoc(collection(db, 'invitations'), {
    type:       'link',
    groupId,
    groupName,
    inviterUid,
    inviterName,
    status:     'pending',
    createdAt:  serverTimestamp(),
    expiresAt:  null,
    acceptedAt: null,
  })
  await updateDoc(ref, { token: ref.id })
  return ref.id
}

export async function getInvitationByToken(token) {
  const q = query(
    collection(db, 'invitations'),
    where('token', '==', token),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function acceptInvitationLink({ token, user }) {
  const inv = await getInvitationByToken(token)
  if (!inv) return { status: 'not_found' }
  const memberSnap = await getDoc(doc(db, 'groups', inv.groupId, 'members', user.uid))
  if (memberSnap.exists()) {
    return { status: 'already_member', groupId: inv.groupId, groupName: inv.groupName }
  }
  await addMember(inv.groupId, user, inv.inviterUid)
  await updateDoc(doc(db, 'invitations', inv.id), {
    status:     'accepted',
    acceptedAt: serverTimestamp(),
    acceptedBy: user.uid,
  })
  return { status: 'joined', groupId: inv.groupId, groupName: inv.groupName }
}
}