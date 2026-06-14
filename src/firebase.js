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

/** iOS web: firebaseapp.com + sin IndexedDB — evita pantalla negra por auth/Firestore colgado. */
function authDomainForApp() {
  if (Capacitor.isNativePlatform()) return 'syng-app.firebaseapp.com'
  if (isIOSWeb()) return 'syng-app.firebaseapp.com'
  if (typeof window !== 'undefined') {
    const { hostname, host } = window.location
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') return host
  }
  return import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'syng-app.firebaseapp.com'
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
  if (isIOSWeb() && !Capacitor.isNativePlatform()) {
    return getAuth(app)
  }
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
  if (isIOSWeb() && !Capacitor.isNativePlatform()) {
    return getFirestore(app)
  }
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
