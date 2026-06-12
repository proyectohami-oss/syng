const WEB_APP = import.meta.env.VITE_WEB_APP_URL || 'https://syng-psi.vercel.app'

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  bytes.forEach((b) => { bin += String.fromCharCode(b) })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function encodeCalendarToken({ taskId, title, alarmAt, taskTime, kind, redirect }) {
  const payload = {
    id: taskId,
    t: title || 'Recordatorio',
    a: new Date(alarmAt).toISOString(),
  }
  if (taskTime) payload.u = new Date(taskTime).toISOString()
  if (kind) payload.k = kind
  if (redirect) payload.r = redirect
  return `${b64urlEncode(JSON.stringify(payload))}.ics`
}

export function calendarIcsUrl(opts) {
  return `${WEB_APP}/api/calendar/${encodeCalendarToken(opts)}`
}
