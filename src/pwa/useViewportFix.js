/**
 * iOS Safari Viewport Fix
 *
 * Problem: iOS Safari shows/hides the address bar when scrolling,
 * changing the viewport height. This causes the layout to jump,
 * making fixed/absolute elements appear to move.
 *
 * Solution: Set --app-height CSS variable to window.innerHeight
 * ONCE on load and on orientation change only (not on scroll).
 * The app container uses this variable instead of 100vh/100dvh.
 *
 * This effectively "freezes" the app height to the initial viewport,
 * making it behave like a native app regardless of address bar state.
 */
import { useEffect } from 'react'

export function useViewportFix() {
  useEffect(() => {
    function setHeight() {
      // Use the actual window height (not CSS viewport)
      const h = window.innerHeight
      document.documentElement.style.setProperty('--app-height', `${h}px`)
    }

    // Set on mount
    setHeight()

    // Update ONLY on orientation change, not on scroll
    // (scroll triggers address bar show/hide which we want to ignore)
    window.addEventListener('orientationchange', () => {
      // Small delay to let the browser settle after rotation
      setTimeout(setHeight, 100)
    })

    // Also listen to resize but debounced — catches desktop window resize
    // without reacting to iOS address bar changes
    let resizeTimer
    function handleResize() {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(setHeight, 150)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('orientationchange', setHeight)
      window.removeEventListener('resize', handleResize)
    }
  }, [])
}
