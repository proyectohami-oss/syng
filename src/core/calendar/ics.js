function pad(n) {
  return String(n).padStart(2, '0')
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

export function buildIcsEvent({
  uid,
  title,
  alarmAt,
  taskTime,
  url,
  description,
}) {
  const start = toIcsUtc(alarmAt)
  const endDate = taskTime || new Date(alarmAt.getTime() + 15 * 60_000)
  const end = toIcsUtc(endDate)
  const now = toIcsUtc(new Date())
  const safeTitle = (title || 'Recordatorio').replace(/[,;\\]/g, ' ')
  const sum = 'Syng · Recordatorio'
  const desc = `${safeTitle}\\n\\nTu momento. Abre Syng cuando suene.`.replace(/\n/g, '\\n')

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
    `DESCRIPTION:${desc}${url ? `\\n${url}` : ''}`,
    url ? `URL:${url}` : null,
    'BEGIN:VALARM',
    'TRIGGER:PT0S',
    'ACTION:DISPLAY',
    `DESCRIPTION:${sum}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}
