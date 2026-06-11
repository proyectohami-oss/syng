/**
 * Sincroniza recordatorios Syng → Calendario del dispositivo.
 */
import { buildIcsEvent } from './ics'
import { showToast } from '../../shared/Toast'

const WEB_APP = import.meta.env.VITE_WEB_APP_URL || 'https://syng-psi.vercel.app'

function isIOS() {
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
    const blobUrl = URL.createObjectURL(blob)
    window.location.assign(blobUrl)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
    showToast('Toca Agregar en la pantalla de iPhone', '📅')
    return { ok: true, method: 'ios-open' }
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
