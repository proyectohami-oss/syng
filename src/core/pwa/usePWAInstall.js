/**
 * usePWAInstall — maneja la lógica de instalación PWA.
 * Separado de usePushNotifications para mantener responsabilidades claras.
 */
import { useState, useEffect, useCallback } from 'react'

function detectIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function detectStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled,   setIsInstalled]   = useState(false)
  const [installing,    setInstalling]    = useState(false)

  const isIOS        = detectIOS()
  const isStandalone = detectStandalone()

  useEffect(() => {
    // Si ya está instalada, no hay nada que hacer
    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // Recoge el prompt que se capturó en index.html antes de que React montara
    if (window.__installPrompt) {
      setInstallPrompt(window.__installPrompt)
    }

    // Por si llega después (raro pero posible)
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
  }, [isStandalone])

  // Dispara la instalación nativa en Android
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
    // ¿Puede instalarse? Android con prompt o iOS en Safari
    canInstall:  !isInstalled && (!!installPrompt || isIOS),
    isIOS,
    isInstalled,
    installing,
    triggerInstall,
  }
}
