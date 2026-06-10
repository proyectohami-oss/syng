/**
 * Bootstrap de auth — singleton para sobrevivir remounts de React StrictMode
 * y evitar perder el resultado del redirect de Google.
 */
import { getRedirectResult } from 'firebase/auth'
import { auth } from '../firebase'

let redirectPromise = null

function captureAuthUrlError() {
  try {
    const hash   = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const search = new URLSearchParams(window.location.search)
    const error  = hash.get('error') || search.get('error')
    if (error) {
      sessionStorage.setItem('authRedirectError', error)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  } catch (_) {}
}

export function consumeGoogleRedirect() {
  if (!redirectPromise) {
    redirectPromise = (async () => {
      captureAuthUrlError()
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) sessionStorage.setItem('justLoggedIn', '1')
        return result
      } catch (err) {
        console.error('[Auth] getRedirectResult:', err)
        sessionStorage.setItem('authRedirectError', err?.code || err?.message || 'error')
        return null
      }
    })()
  }
  return redirectPromise
}

export function notifyAuthBootstrapped() {
  if (typeof window === 'undefined') return
  window.__syngAuthReady = true
  window.dispatchEvent(new Event('syng:auth-ready'))
}
