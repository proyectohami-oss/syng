import { toIcsLocal } from './ics'
import { getDeviceTimeZone } from './localDate'

const WEB_APP = import.meta.env.VITE_WEB_APP_URL || 'https://syng-psi.vercel.app'

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  bytes.forEach((b) => { bin += String.fromCharCode(b) })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function encodeCalendarToken({ taskId, title, phrase, alarmAt, taskTime, kind, redirect, sequence }) {
  const payload = {
    id: taskId,
    t: title || 'Recordatorio',
    // Hora local del iPhone — evita que Vercel (UTC) desplace el evento
    a: toIcsLocal(new Date(alarmAt)),
    s: sequence ?? Math.floor(Date.now() / 1000),
  }
  if (taskTime) payload.u = toIcsLocal(new Date(taskTime))
  const tz = getDeviceTimeZone()
  if (tz) payload.z = tz
  if (phrase) payload.p = phrase
  if (kind) payload.k = kind
  if (redirect) payload.r = redirect
  return `${b64urlEncode(JSON.stringify(payload))}.ics`
}

export function calendarIcsUrl(opts) {
  return `${WEB_APP}/api/calendar/${encodeCalendarToken(opts)}`
}
