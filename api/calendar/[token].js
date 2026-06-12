export const config = { runtime: 'edge' }

function pad(n) {
  return String(n).padStart(2, '0')
}

function toIcsLocal(date) {
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

function toIcsUtc(date) {
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

function buildIcsEvent({ uid, title, alarmAt, taskTime, url }) {
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

function b64urlDecode(token) {
  const raw = token.replace(/\.ics$/i, '')
  const padLen = (4 - (raw.length % 4)) % 4
  const b64 = raw.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLen)
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export default async function handler(req) {
  const url = new URL(req.url)
  const token = url.pathname.split('/').pop() || ''

  try {
    const { id, t, a, u } = JSON.parse(b64urlDecode(token))
    if (!id || !a) return new Response('Datos incompletos', { status: 400 })

    const alarmAt = new Date(a)
    if (Number.isNaN(alarmAt.getTime())) return new Response('Fecha inválida', { status: 400 })

    const webApp = process.env.WEB_APP_URL || 'https://syng-psi.vercel.app'
    const recordatorio = `${webApp}/recordatorio/${id}`
    const ics = buildIcsEvent({
      uid: `syng-${id}@syng.app`,
      title: t,
      alarmAt,
      taskTime: u ? new Date(u) : null,
      url: recordatorio,
    })

    return new Response(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="syng-${String(id).slice(0, 8)}.ics"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return new Response('Enlace inválido', { status: 400 })
  }
}
