export function registerSW() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  import('virtual:pwa-register')
    .then(({ registerSW: vitePwaRegister }) => {
      vitePwaRegister({
        onRegisteredSW(swUrl, registration) {
          if (!registration) return
          setInterval(() => {
            registration.update().catch(() => {})
          }, 60 * 60 * 1000)
        },
        onNeedRefresh() {
          window.location.reload()
        },
        onOfflineReady() {},
        onRegisterError(error) {
          console.error('[SW] Registration failed:', error)
        },
      })
    })
    .catch(() => {})

  // Fuerza reload cuando el SW nuevo toma control — clave para iOS
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}
