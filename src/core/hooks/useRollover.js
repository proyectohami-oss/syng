/**
 * useRollover.js
 * Hook que ejecuta el rollover de tareas vencidas:
 * 1. Al abrir la app
 * 2. Automáticamente a medianoche cada día
 */
import { useEffect, useRef } from 'react'
import { rolloverPersonalTasks } from '../services/rollover.service'
import { isFreePlanExhausted } from '../services/movements.service'

export function useRollover(uid, auth) {
  const ranTodayRef = useRef(null)

  useEffect(() => {
    if (!uid) return

    function getTodayStr() {
      const d = new Date()
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }

    async function run() {
      const planId = auth?.subscription?.planId ?? 'gratis'
      if (isFreePlanExhausted(auth?.subscription, planId, auth?.plan, auth?.systemConfig)) return

      const today = getTodayStr()
      if (ranTodayRef.current === today) return
      ranTodayRef.current = today
      await rolloverPersonalTasks(uid)
    }

    run()

    function msUntilMidnight() {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      return midnight.getTime() - now.getTime()
    }

    let intervalId = null
    const timeoutId = setTimeout(() => {
      run()
      intervalId = setInterval(run, 24 * 60 * 60 * 1000)
    }, msUntilMidnight())

    return () => {
      clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [uid, auth?.subscription, auth?.plan, auth?.systemConfig])
}
