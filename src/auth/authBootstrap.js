/**
 * Bootstrap de auth — singleton para sobrevivir remounts de React StrictMode
 * y evitar perder el resultado del redirect de Google.
 */
import { getRedirectResult } from 'firebase/auth'
import { auth } from '../firebase'

let redirectPromise = null

export function consumeGoogleRedirect() {
  if (!redirectPromise) {
    redirectPromise = getRedirectResult(auth)
      .then((result) => {
        if (result?.user) sessionStorage.setItem('justLoggedIn', '1')
        return result
      })
      .catch((err) => {
        console.error('[Auth] getRedirectResult:', err)
        sessionStorage.setItem('authRedirectError', err?.code || err?.message || 'error')
        return null
      })
  }
  return redirectPromise
}

export function notifyAuthBootstrapped() {
  if (typeof window === 'undefined') return
  window.__syngAuthReady = true
  window.dispatchEvent(new Event('syng:auth-ready'))
}
