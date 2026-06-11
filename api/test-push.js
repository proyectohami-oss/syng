/** Proxy same-origin para prueba push — evita CORS en iPhone PWA */
const PUSH_URL = 'https://us-central1-syng-app.cloudfunctions.net/sendPushNotification'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, reason: 'method_not_allowed' })
  }

  const { userId, token, platform } = req.body || {}
  if (!userId) {
    return res.status(400).json({ ok: false, reason: 'no_uid' })
  }

  try {
    const upstream = await fetch(PUSH_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, test: true, token: token || undefined, platform: platform || undefined }),
    })
    const data = await upstream.json()
    return res.status(upstream.ok ? 200 : 502).json(data)
  } catch (err) {
    return res.status(500).json({ ok: false, reason: err.message || 'proxy_error' })
  }
}
