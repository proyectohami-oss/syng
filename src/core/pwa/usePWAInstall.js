import { useState, useEffect, useCallback } from 'react'

function detectIOS() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function detectStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled,   setIsInstalled]   = useState(false)
  const [installing,    setInstalling]    = useState(false)
  const [isIOS,         setIsIOS]         = useState(false)

  useEffect(() => {
    setIsIOS(detectIOS())

    if (detectStandalone()) {
      setIsInstalled(true)
      return
    }

    if (window.__installPrompt) {
      setInstallPrompt(window.__installPrompt)
    }

    function onPrompt(e) {
      e.preventDefault()
      window.__installPrompt = e
      setInstallPrompt(e)
    }

    function onInstalled() {
      setIsInstalled(true)
      setInstallPrompt(null)
      window.__installPrompt = null
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const triggerInstall = useCallback(async () => {
    if (!installPrompt) return false
    setInstalling(true)
    try {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
        window.__installPrompt = null
        setInstallPrompt(null)
        return true
      }
      return false
    } finally {
      setInstalling(false)
    }
  }, [installPrompt])

  return {
    canInstall: !isInstalled && (!!installPrompt || isIOS),
    isIOS,
    isInstalled,
    installing,
    triggerInstall,
  }
}
