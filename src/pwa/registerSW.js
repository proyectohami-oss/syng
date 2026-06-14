/**
 * Registra el SW de caché DESPUÉS del login para no interrumpir
 * el redirect de Google (controllerchange recargaba la página a mitad de auth).
 */
export function registerSW() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  let installed = false

  function install() {
    if (installed) return
    installed = true
    window.removeEventListener('syng:auth-ready', install)
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw-v2.js', { scope: '/' })
        .then(reg => {
          console.debug('[SW] Registered:', reg.scope)
          setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000)
        })
        .catch(e => console.error('[SW] Registration failed:', e))
    }, { once: true })
  }

  if (window.__syngAuthReady) install()
  else window.addEventListener('syng:auth-ready', install)

  setTimeout(install, 12000)
}
