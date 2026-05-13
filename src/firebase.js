import { initializeApp }                              from 'firebase/app'
import { getAuth }                                    from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
}                                                     from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app  = initializeApp(firebaseConfig)
export const auth = getAuth(app)

/**
 * Firebase v10 offline persistence.
 *
 * persistentLocalCache replaces the deprecated enableIndexedDbPersistence().
 * persistentMultipleTabManager allows multiple browser tabs to share the
 * same IndexedDB cache — only one tab holds the primary write lock, but
 * all tabs read from the cache. This is the correct v10 multi-tab setup.
 *
 * CACHE_SIZE_UNLIMITED lets IndexedDB grow as needed.
 * For production you may want to cap it (e.g., 100 * 1024 * 1024 = 100MB).
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager:  persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  }),
})
