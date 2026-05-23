export function registerSW() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      console.debug('[SW] Registered:', reg.scope)

      // Revisa actualizaciones cada hora
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000)

      // Cuando hay SW nuevo esperando — recarga
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing
        if (!newSW) return
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            window.location.reload()
          }
        })
      })

    } catch (e) {
      console.error('[SW] Registration failed:', e)
    }
  })

  // Recarga cuando el SW nuevo toma control
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}
