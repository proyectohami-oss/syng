import { buildCalendarSummary } from './calendarSummary'

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

function buildIcsEventLines({
  uid,
  title,
  phrase,
  kind,
  alarmAt,
  taskTime,
  url,
  tzid,
  now,
  sequence,
}) {
  const stamp = now || toIcsUtc(new Date())
  const start = toIcsLocal(alarmAt)
  const endDate = taskTime || new Date(alarmAt.getTime() + 15 * 60_000)
  const end = toIcsLocal(endDate)
  const sum = buildCalendarSummary({ title, phrase, kind })
  const desc = 'Tu momento Syng.\\nAbre la app cuando suene.'
  const dtStart = tzid ? `DTSTART;TZID=${tzid}:${start}` : `DTSTART:${start}`
  const dtEnd = tzid ? `DTEND;TZID=${tzid}:${end}` : `DTEND:${end}`

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    sequence != null ? `SEQUENCE:${sequence}` : null,
    `LAST-MODIFIED:${stamp}`,
    dtStart,
    dtEnd,
    `SUMMARY:${sum}`,
    `DESCRIPTION:${desc}`,
    url ? `URL:${url}` : null,
    'BEGIN:VALARM',
    'TRIGGER:PT0S',
    'ACTION:DISPLAY',
    `DESCRIPTION:Syng te avisa`,
    'END:VALARM',
    'END:VEVENT',
  ].filter(Boolean)
}

export function buildIcsEvent(opts) {
  const now = toIcsUtc(new Date())
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Syng//Recordatorios//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...buildIcsEventLines({ ...opts, now }),
    'END:VCALENDAR',
  ].join('\r\n')
}
