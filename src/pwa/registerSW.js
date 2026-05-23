let updateAvailable = false
const listeners = new Set()

export function onUpdateAvailable(cb) {
  listeners.add(cb)
  if (updateAvailable) cb()
  return () => listeners.delete(cb)
}

export function applyUpdate() {
  window.location.reload()
}

export function registerSW() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  import('virtual:pwa-register')
    .then(({ registerSW: vitePwaRegister }) => {
      vitePwaRegister({
        onRegisteredSW(swUrl, registration) {
          if (!registration) return
          setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000)
        },
        onNeedRefresh() {
          updateAvailable = true
          listeners.forEach(cb => cb())
        },
        onOfflineReady() {},
        onRegisterError(error) {
          console.error('[SW] Registration failed:', error)
        },
      })
    })
    .catch(() => {})

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}
