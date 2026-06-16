/**
 * Sincroniza recordatorios Syng → Calendario del dispositivo.
 */
import { buildIcsEvent } from './ics'
import { calendarIcsUrl } from './icsToken'
import { resolveFriendlyPhrase } from './calendarSummary'
import { getDeviceTimeZone } from './localDate'
import { showToast } from '../../shared/Toast'

const WEB_APP = import.meta.env.VITE_WEB_APP_URL || 'https://syng-psi.vercel.app'

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

/** Abre .ics en iOS — navegación directa; DeepLinkHandler regresa a Syng tras confirmar. */
export function openIosCalendarIcs(icsUrl) {
  if (isIOS()) {
    window.location.assign(icsUrl)
    return true
  }
  try {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;border:none'
    iframe.src = icsUrl
    document.body.appendChild(iframe)
    setTimeout(() => iframe.remove(), 60_000)
    return true
  } catch {
    window.location.assign(icsUrl)
    return true
  }
}

export function recordatorioUrl(taskId) {
  return `${WEB_APP}/recordatorio/${taskId}`
}

export function calendarEventUid(taskId) {
  return `syng-${taskId}@syng.app`
}

function buildIcs({ taskId, title, phrase, alarmAt, taskTime, sequence }) {
  return buildIcsEvent({
    uid: calendarEventUid(taskId),
    title,
    phrase,
    alarmAt,
    taskTime,
    url: recordatorioUrl(taskId),
    tzid: getDeviceTimeZone(),
    sequence: sequence ?? Math.floor(Date.now() / 1000),
  })
}

export async function syncReminderToCalendar({ taskId, title, phrase, description, alarmAt, taskTime }) {
  if (!taskId || !alarmAt) return { ok: false, reason: 'missing_fields' }
  const alarm = alarmAt instanceof Date ? alarmAt : new Date(alarmAt)
  if (Number.isNaN(alarm.getTime())) return { ok: false, reason: 'bad_date' }

  const msUntil = alarm.getTime() - Date.now()
  if (msUntil < 60_000) {
    showToast('Pon el aviso al menos 2 min en el futuro', '⚠️')
    return { ok: false, reason: 'too_soon' }
  }

  const friendlyPhrase = resolveFriendlyPhrase(phrase ?? description)
  const ics = buildIcs({
    taskId,
    title: title || 'Recordatorio',
    phrase: friendlyPhrase,
    alarmAt: alarm,
    taskTime: taskTime instanceof Date ? taskTime : (taskTime ? new Date(taskTime) : null),
  })

  const filename = `syng-${taskId.slice(0, 8)}.ics`
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })

  if (isIOS()) {
    const icsUrl = calendarIcsUrl({
      taskId,
      title,
      phrase: friendlyPhrase,
      alarmAt: alarm,
      taskTime,
    })
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
