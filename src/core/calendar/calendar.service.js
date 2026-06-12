/**
 * Sincroniza recordatorios Syng → Calendario del dispositivo.
 */
import { buildIcsEvent } from './ics'
import { calendarIcsUrl } from './icsToken'
import { showToast } from '../../shared/Toast'

const WEB_APP = import.meta.env.VITE_WEB_APP_URL || 'https://syng-psi.vercel.app'

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function recordatorioUrl(taskId) {
  return `${WEB_APP}/recordatorio/${taskId}`
}

export function calendarEventUid(taskId) {
  return `syng-${taskId}@syng.app`
}

function buildIcs({ taskId, title, alarmAt, taskTime }) {
  return buildIcsEvent({
    uid: calendarEventUid(taskId),
    title,
    alarmAt,
    taskTime,
    url: recordatorioUrl(taskId),
    description: `Tarea en Syng. Toca el enlace para abrirla.`,
  })
}

export async function syncReminderToCalendar({ taskId, title, alarmAt, taskTime }) {
  if (!taskId || !alarmAt) return { ok: false, reason: 'missing_fields' }
  const alarm = alarmAt instanceof Date ? alarmAt : new Date(alarmAt)
  if (Number.isNaN(alarm.getTime())) return { ok: false, reason: 'bad_date' }

  const msUntil = alarm.getTime() - Date.now()
  if (msUntil < 60_000) {
    showToast('Pon el aviso al menos 2 min en el futuro', '⚠️')
    return { ok: false, reason: 'too_soon' }
  }

  const ics = buildIcs({
    taskId,
    title: title || 'Recordatorio',
    alarmAt: alarm,
    taskTime: taskTime instanceof Date ? taskTime : (taskTime ? new Date(taskTime) : null),
  })

  const filename = `syng-${taskId.slice(0, 8)}.ics`
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })

  if (isIOS()) {
    const icsUrl = calendarIcsUrl({ taskId, title, alarmAt: alarm, taskTime })
    window.location.assign(icsUrl)
    return { ok: true, method: 'ios-url', needsHelp: true, icsUrl }
  }

  const file = new File([blob], filename, { type: 'text/calendar' })

  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Syng te avisa' })
      showToast('Toca Calendario → Agregar evento', '📅')
      return { ok: true, method: 'share' }
    }
  } catch (err) {
    if (err?.name === 'AbortError') {
      showToast('No se agregó al Calendario — sin aviso en iPhone', '⚠️')
      return { ok: false, reason: 'cancelled' }
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  showToast('Toca Agregar para activar tu aviso Syng', '📅')
  return { ok: true, method: 'download' }
}

export function activateSyngAviso(opts) {
  return syncReminderToCalendar(opts)
}

export function resumenDiarioUrl() {
  return `${WEB_APP}/resumen-diario`
}

/** Aviso del día — solo días con tareas; hora elegida en Perfil */
export async function syncDailyReminderToCalendar({ uid, dateKey, taskCount, hour, minute }) {
  if (!uid || !dateKey || !taskCount) return { ok: false, reason: 'missing_fields' }

  const alarmAt = (() => {
    const [y, m, d] = dateKey.split('-').map(Number)
    return new Date(y, m - 1, d, hour, minute, 0, 0)
  })()

  if (Number.isNaN(alarmAt.getTime())) return { ok: false, reason: 'bad_date' }

  const msUntil = alarmAt.getTime() - Date.now()
  if (msUntil < 60_000) {
    showToast('Elige una hora al menos 2 min en el futuro para hoy', '⚠️')
    return { ok: false, reason: 'too_soon' }
  }

  const eventId = `daily-${uid.slice(0, 8)}-${dateKey}`
  const title = taskCount === 1 ? 'Tu día — 1 tarea' : `Tu día — ${taskCount} tareas`
  const endTime = new Date(alarmAt.getTime() + 20 * 60_000)

  const ics = buildIcsEvent({
    uid: `syng-${eventId}@syng.app`,
    title,
    alarmAt,
    taskTime: endTime,
    url: resumenDiarioUrl(),
  })

  if (isIOS()) {
    const icsUrl = calendarIcsUrl({
      taskId: eventId,
      title,
      alarmAt,
      taskTime: endTime,
      kind: 'daily',
      redirect: '/resumen-diario',
    })
    window.location.assign(icsUrl)
    return { ok: true, method: 'ios-url', needsHelp: true, icsUrl }
  }

  const filename = `syng-dia-${dateKey}.ics`
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const file = new File([blob], filename, { type: 'text/calendar' })

  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Syng · Tu día' })
      showToast('Toca Calendario → Agregar evento', '📅')
      return { ok: true, method: 'share' }
    }
  } catch (err) {
    if (err?.name === 'AbortError') return { ok: false, reason: 'cancelled' }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  showToast('Toca Agregar para activar tu aviso del día', '📅')
  return { ok: true, method: 'download' }
}
