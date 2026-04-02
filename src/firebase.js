import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyC8Ym6HJBerYK5ke6lCiRM32mx7ei2Dn78",
  authDomain: "syng-app.firebaseapp.com",
  projectId: "syng-app",
  storageBucket: "syng-app.firebasestorage.app",
  messagingSenderId: "751348580546",
  appId: "1:751348580546:web:9bfede4680f4589e367b5b"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)