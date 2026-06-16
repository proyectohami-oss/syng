import { initializeApp } from 'firebase/app'
import { Capacitor } from '@capacitor/core'
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
} from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  CACHE_SIZE_UNLIMITED,
} from 'firebase/firestore'

function isIOSWeb() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isAndroidWeb() {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

function isMobileWeb() {
  return !Capacitor.isNativePlatform() && (isIOSWeb() || isAndroidWeb())
}

const FIREBASE_AUTH_DOMAIN = 'syng-app.firebaseapp.com'

/**
 * authDomain fijo en firebaseapp.com: Google OAuth ya autoriza
 * https://syng-app.firebaseapp.com/__/auth/handler (sin tocar Google Cloud Console).
 * iOS web usa popup (no redirect cross-site). vercel.json mantiene /__/auth por si
 * algún flujo legacy lo necesita; nativo Capacitor igual usa firebaseapp.com.
 */
function authDomainForApp() {
  return import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || FIREBASE_AUTH_DOMAIN
}

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        authDomainForApp(),
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)

function createAuth() {
  if (Capacitor.isNativePlatform()) return getAuth(app)
  try {
    return initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      popupRedirectResolver: browserPopupRedirectResolver(),
    })
  } catch {
    return getAuth(app)
  }
}

export const auth = createAuth()

function createDb() {
  if (isMobileWeb()) return getFirestore(app)
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      }),
    })
  } catch (err) {
    console.warn('[Firebase] Firestore persistence fallback:', err)
    try {
      return initializeFirestore(app, { localCache: memoryLocalCache() })
    } catch {
      return getFirestore(app)
    }
  }
}

export const db = createDb()
