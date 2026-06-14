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
import { createRoot }   from 'react-dom/client'
import { App }          from './App'
import { BootErrorBoundary } from './shared/BootErrorBoundary'

const root = document.getElementById('root')
if (!root) throw new Error('[Syng] #root element not found in index.html')

createRoot(root).render(
  <BootErrorBoundary>
    <App />
  </BootErrorBoundary>
)
