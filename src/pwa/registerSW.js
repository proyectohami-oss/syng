/**
 * Registra el SW después del login para no interrumpir redirect de Google.
 * Al detectar nueva versión: recarga (evita PWA en blanco con JS 404).
 */
export function registerSW() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  let installed = false

  function safeToReload() {
    const { search, hash } = window.location
    if (search.includes('code=') || hash.includes('access_token')) return false
    return true
  }

  function install() {
    if (installed) return
    installed = true
    window.removeEventListener('syng:auth-ready', install)

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw-v2.js', { scope: '/' })
        .then((reg) => {
          console.debug('[SW] Registered:', reg.scope)

          reg.addEventListener('updatefound', () => {
            const worker = reg.installing
            if (!worker) return
            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                worker.postMessage({ type: 'SKIP_WAITING' })
              }
            })
          })

          let refreshing = false
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing || !safeToReload()) return
            refreshing = true
            sessionStorage.removeItem('syng_chunk_reload')
            window.location.reload()
          })

          setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000)
        })
        .catch(e => console.error('[SW] Registration failed:', e))
    }, { once: true })
  }

  if (window.__syngAuthReady) install()
  else window.addEventListener('syng:auth-ready', install)

  setTimeout(install, 12000)
}
