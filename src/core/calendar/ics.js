function pad(n) {
  return String(n).padStart(2, '0')
}

/** Hora local del dispositivo — iPhone la muestra tal cual en Calendario */
export function toIcsLocal(date) {
  const d = date instanceof Date ? date : new Date(date)
  return (
    d.getFullYear()
    + pad(d.getMonth() + 1)
    + pad(d.getDate())
    + 'T'
    + pad(d.getHours())
    + pad(d.getMinutes())
    + pad(d.getSeconds())
  )
}

/** Fecha UTC en formato ICS: YYYYMMDDTHHMMSSZ */
export function toIcsUtc(date) {
  const d = date instanceof Date ? date : new Date(date)
  return (
    d.getUTCFullYear()
    + pad(d.getUTCMonth() + 1)
    + pad(d.getUTCDate())
    + 'T'
    + pad(d.getUTCHours())
    + pad(d.getUTCMinutes())
    + pad(d.getUTCSeconds())
    + 'Z'
  )
}

function icsSummary(title) {
  const safe = (title || 'Recordatorio').replace(/[,;\\]/g, ' ').trim()
  const label = safe.length > 48 ? `${safe.slice(0, 45)}…` : safe
  return `Syng · ${label}`
}

export function buildIcsEvent({
  uid,
  title,
  alarmAt,
  taskTime,
  url,
}) {
  const start = toIcsLocal(alarmAt)
  const endDate = taskTime || new Date(alarmAt.getTime() + 15 * 60_000)
  const end = toIcsLocal(endDate)
  const now = toIcsUtc(new Date())
  const sum = icsSummary(title)
  const desc = 'Tu momento Syng.\\nAbre la app cuando suene.'

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Syng//Recordatorios//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${sum}`,
    `DESCRIPTION:${desc}`,
    url ? `URL:${url}` : null,
    'BEGIN:VALARM',
    'TRIGGER:PT0S',
    'ACTION:DISPLAY',
    `DESCRIPTION:Syng te avisa`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}
