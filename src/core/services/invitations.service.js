/**
 * Invitations service — invitaciones pendientes para usuarios sin Syng.
 *
 * FLUJO:
 * 1. Admin busca miembro por número — no existe en Syng
 * 2. Se crea invitación pendiente en /invitations
 * 3. Cuando el invitado instala Syng y registra su teléfono
 *    → checkPendingInvitations() detecta las invitaciones
 *    → lo agrega automáticamente a los grupos
 *    → marca invitaciones como accepted
 *
 * SCHEMA /invitations/{id}:
 *   groupId:     string
 *   groupName:   string
 *   inviterUid:  string
 *   inviterName: string
 *   phoneNumber: string  ← E.164
 *   status:      'pending' | 'accepted'
 *   createdAt:   Timestamp
 *   acceptedAt:  Timestamp | null
 */
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { addMember } from './groups.service'

/**
 * Crea una invitación pendiente para un número que aún no usa Syng.
 */
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

/**
 * Busca invitaciones pendientes para un número y los conecta automáticamente.
 * Se llama al registrar el teléfono por primera vez.
 *
 * @param {{ uid, displayName, email, phoneNumber }} newUser
 * @returns {string[]} nombres de grupos a los que fue agregado
 */
export async function checkPendingInvitations(newUser) {
  const q = query(
    collection(db, 'invitations'),
    where('phoneNumber', '==', newUser.phoneNumber),
    where('status', '==', 'pending')
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
      console.error('[Invitations] error al aceptar invitación:', err)
    }
  }

  return groupNames
}

/**
 * Lista invitaciones pendientes de un grupo (para mostrar en UI).
 */
export async function getPendingInvitations(groupId) {
  const q = query(
    collection(db, 'invitations'),
    where('groupId', '==', groupId),
    where('status', '==', 'pending')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
