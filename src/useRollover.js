import { useEffect } from 'react'
import { db } from './firebase'
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore'

export function useRollover(userId) {
  useEffect(() => {
    if (!userId) return

    const correr = async () => {
      const hoy = new Date()
      const hoyKey = `${hoy.getFullYear()}-${hoy.getMonth()}-${hoy.getDate()}`
      const lsKey = `syng_rollover_v2_${userId}_${hoyKey}`
      if (localStorage.getItem(lsKey)) return

      const ref = collection(db, 'users', userId, 'pizarron')
      const hoyDate = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
      const snap = await getDocs(ref)

      const hoyDoc = snap.docs.find(d => d.id === hoyKey)
      const hoyActual = hoyDoc ? (hoyDoc.data().items || []) : []

      const itemsParaHoy = []
      const promises = []
      let hayCambios = false

      snap.docs.forEach(d => {
        if (d.id === hoyKey) return
        const partes = d.id.split('-').map(Number)
        if (partes.length !== 3) return
        const fechaDoc = new Date(partes[0], partes[1], partes[2])
        if (fechaDoc >= hoyDate) return

        const items = d.data().items || []
        const pendientes = items.filter(a => !a.realizada)
        if (pendientes.length === 0) return

        pendientes.forEach(a => itemsParaHoy.push({
          ...a,
          dia: hoy.getDate(),
          mes: hoy.getMonth(),
          anio: hoy.getFullYear()
        }))

        const atendidas = items.filter(a => a.realizada)
        if (atendidas.length === 0) promises.push(deleteDoc(doc(ref, d.id)))
        else promises.push(setDoc(doc(ref, d.id), { items: atendidas }))
        hayCambios = true
      })

      if (hayCambios) {
        promises.push(setDoc(doc(ref, hoyKey), { items: [...hoyActual, ...itemsParaHoy] }))
        await Promise.all(promises)
      }

      localStorage.setItem(lsKey, '1')
    }

    correr()

    const alRegresar = () => { if (document.visibilityState === 'visible') correr() }
    document.addEventListener('visibilitychange', alRegresar)
    return () => document.removeEventListener('visibilitychange', alRegresar)
  }, [userId])
}
