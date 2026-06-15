/** Proxy solicitar retiro Aliados Syng */
const URL = 'https://us-central1-syng-app.cloudfunctions.net/solicitarRetiroAliado'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(204).end()
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'Inicia sesión para continuar' })
  try {
    const upstream = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify(req.body || {}),
    })
    return res.status(upstream.status).json(await upstream.json())
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error de red' })
  }
}
