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
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
} from 'firebase/firestore'

/** En app nativa el authDomain debe ser firebaseapp.com, no la URL de Vercel. */
function authDomainForApp() {
  if (Capacitor.isNativePlatform()) return 'syng-app.firebaseapp.com'
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

/**
 * indexedDBLocalPersistence + popupRedirectResolver son obligatorios en iOS
 * (Safari y PWA). getAuth() usa localStorage que iOS borra con frecuencia.
 */
function createAuth() {
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

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager:       persistentMultipleTabManager(),
    cacheSizeBytes:   CACHE_SIZE_UNLIMITED,
  }),
})
