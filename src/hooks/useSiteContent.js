import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { activePromociones, normalizeSiteContent } from '../core/services/siteContent.service'

export function useSiteContent({ publicOnly = true } = {}) {
  const [content, setContent] = useState(() => normalizeSiteContent(null))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, 'site_content', 'main')
    const unsub = onSnapshot(
      ref,
      snap => {
        const normalized = normalizeSiteContent(snap.exists() ? snap.data() : null)
        setContent(publicOnly
          ? { ...normalized, promociones: activePromociones(normalized.promociones) }
          : normalized)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [publicOnly])

  return { content, loading }
}
