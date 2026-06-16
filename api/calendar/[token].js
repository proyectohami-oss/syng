export const config = { runtime: 'edge' }

import { buildCalendarSummary, resolveFriendlyPhrase } from '../../src/core/calendar/calendarSummary.js'

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

const ICS_LOCAL_RE = /^\d{8}T\d{6}$/

function normalizeIcsLocal(value) {
  if (typeof value === 'string' && ICS_LOCAL_RE.test(value)) return value
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return toIcsLocal(d)
}

function addMinutesIcsLocal(icsLocal, minutes) {
  const y = +icsLocal.slice(0, 4)
  const mo = +icsLocal.slice(4, 6) - 1
  const d = +icsLocal.slice(6, 8)
  const h = +icsLocal.slice(9, 11)
  const mi = +icsLocal.slice(11, 13)
  const sec = +icsLocal.slice(13, 15)
  const dt = new Date(y, mo, d, h, mi, sec, 0)
  dt.setMinutes(dt.getMinutes() + minutes)
  return toIcsLocal(dt)
}

function safeTzid(z) {
  if (typeof z !== 'string' || !z || z.length > 64) return null
  if (!/^[A-Za-z0-9_+\/-]+$/.test(z)) return null
  return z
}

function dtLine(prop, local, tzid) {
  const tz = safeTzid(tzid)
  return tz ? `${prop};TZID=${tz}:${local}` : `${prop}:${local}`
}

function buildSingleIcsEvent({ uid, title, phrase, kind, startLocal, endLocal, url, tzid, sequence }) {
  const now = toIcsUtc(new Date())
  const sum = buildCalendarSummary({ title, phrase, kind })
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
    sequence != null ? `SEQUENCE:${sequence}` : null,
    `LAST-MODIFIED:${now}`,
    dtLine('DTSTART', startLocal, tzid),
    dtLine('DTEND', endLocal, tzid),
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
    const { id, t, p, a, u, k, r, z, s } = JSON.parse(b64urlDecode(token))
    if (!id || !a) return new Response('Datos incompletos', { status: 400 })

    const startLocal = normalizeIcsLocal(a)
    if (!startLocal) return new Response('Fecha inválida', { status: 400 })
    const endLocal = u ? normalizeIcsLocal(u) : addMinutesIcsLocal(startLocal, 15)
    if (!endLocal) return new Response('Fecha inválida', { status: 400 })

    const webApp = process.env.WEB_APP_URL || 'https://syng-psi.vercel.app'
    const targetUrl = k === 'daily'
      ? `${webApp}${r && r.startsWith('/') ? r : '/resumen-diario'}`
      : `${webApp}/recordatorio/${id}`

    const ics = buildSingleIcsEvent({
      uid: `syng-${id}@syng.app`,
      title: t,
      phrase: k === 'daily' ? undefined : resolveFriendlyPhrase(p),
      kind: k,
      startLocal,
      endLocal,
      url: targetUrl,
      tzid: z,
      sequence: typeof s === 'number' ? s : (s ? Number(s) : undefined),
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
