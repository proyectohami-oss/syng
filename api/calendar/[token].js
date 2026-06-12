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
    const { id, t, a, u, k, r } = JSON.parse(b64urlDecode(token))
    if (!id || !a) return new Response('Datos incompletos', { status: 400 })

    const alarmAt = new Date(a)
    if (Number.isNaN(alarmAt.getTime())) return new Response('Fecha inválida', { status: 400 })

    const webApp = process.env.WEB_APP_URL || 'https://syng-psi.vercel.app'
    const targetUrl = k === 'daily'
      ? `${webApp}${r && r.startsWith('/') ? r : '/resumen-diario'}`
      : `${webApp}/recordatorio/${id}`
    const eventUid = k === 'daily' ? `syng-${id}@syng.app` : `syng-${id}@syng.app`

    const wrap = url.searchParams.get('wrap')
    const destParam = url.searchParams.get('dest') || '/agenda'
    const safeDest = destParam.startsWith('/') ? destParam : '/agenda'
    const icsPath = url.pathname

    if (wrap === '1') {
      const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Syng · Calendario</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0A0A;color:#FAF8F5;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;padding:24px}
  .box{max-width:360px;text-align:center}
  h1{font-family:Georgia,serif;font-size:22px;font-weight:400;margin:0 0 8px}
  p{font-size:14px;color:rgba(250,248,245,0.55);line-height:1.5;margin:0 0 20px}
  a{display:inline-block;padding:14px 24px;background:#FAF8F5;color:#0A0A0A;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;border-radius:2px}
</style>
</head>
<body>
<div class="box">
  <h1>Agregar a Calendario</h1>
  <p>Confirma en Calendario para que suene tu aviso Syng.</p>
  <a id="open" href="${icsPath}">Abrir invitación</a>
</div>
<script>
(function(){
  var app=${JSON.stringify(webApp)};
  var dest=${JSON.stringify(safeDest)};
  function goSyng(){
    try{ sessionStorage.removeItem('syng_ios_cal_return'); sessionStorage.removeItem('syng_ios_cal_dest'); }catch(e){}
    location.replace(app + dest);
  }
  document.getElementById('open').click();
  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState==='visible') setTimeout(goSyng,400);
  });
  window.addEventListener('pageshow',function(){ setTimeout(goSyng,400); });
})();
</script>
</body>
</html>`
      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }

    const ics = buildIcsEvent({
      uid: eventUid,
      title: t,
      alarmAt,
      taskTime: u ? new Date(u) : null,
      url: targetUrl,
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
