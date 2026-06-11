/**
 * Entry point — mounts the React app.
 *
 * Deliberately minimal. No providers here that belong in App.jsx.
 * The service worker for PWA/offline is registered separately in
 * src/pwa/registerSW.js so it doesn't block the first render.
 *
 * Boot order:
 *   1. React renders <App> (CoreDataProvider + Router)
 *   2. Firebase SDK initializes (firebase.js is imported by CoreDataProvider)
 *   3. IndexedDB persistence enables (firebase.js, async, non-blocking)
 *   4. Service worker registers (after first paint, non-blocking)
 */
import { StrictMode }   from 'react'
import { createRoot }   from 'react-dom/client'
import { App }          from './App'
import { registerSW }   from './pwa/registerSW'
import { isNativeApp }  from './core/notifications/native-push.service'

const root = document.getElementById('root')
if (!root) throw new Error('[Syng] #root element not found in index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// PWA service worker — solo en web, no en app nativa Capacitor.
if (!isNativeApp()) registerSW()
