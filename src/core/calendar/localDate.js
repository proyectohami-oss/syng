/** Fechas/horas siempre en zona horaria del dispositivo del usuario. */

export function parseDateKey(dateStr) {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return { y, mo: mo - 1, d }
}

/** Date en hora local: YYYY-MM-DD + HH:mm del reloj del equipo. */
export function localDateAt(dateStr, hours24 = 0, minutes = 0, seconds = 0) {
  const { y, mo, d } = parseDateKey(dateStr)
  return new Date(y, mo, d, hours24, minutes, seconds, 0)
}

/** Fin del día local (23:59:59). */
export function localEndOfDay(dateStr) {
  return localDateAt(dateStr, 23, 59, 59)
}

/** Hora de tarea + aviso con offset — todo en reloj del equipo. */
export function buildReminderSchedule(dayKey, actH24, actM, totalOffsetMin) {
  const activityDate = localDateAt(dayKey, actH24, actM, 0)
  const scheduled = new Date(activityDate.getTime() - totalOffsetMin * 60_000)
  return { activityDate, scheduled }
}

export function getDeviceTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null
  } catch {
    return null
  }
}

export function formatLocalDateTime(date, options = {}) {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleString('es-MX', {
    weekday: options.weekday ? 'short' : undefined,
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  })
}
