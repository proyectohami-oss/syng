export default async function handler(req, res) {
  const token = req.query.token || 'unknown'
  const projectId   = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  let groupName   = 'Grupo Syng'
  let inviterName = 'Alguien'
  let memberCount = 0

  try {
    const admin = (await import('firebase-admin')).default
    if (!admin.apps?.length) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey })
      })
    }
    const db   = admin.firestore()
    const snap = await db.collection('invitations').where('token', '==', token).limit(1).get()
    if (!snap.empty) {
      const data = snap.docs[0].data()
      groupName   = data.groupName   || groupName
      inviterName = data.inviterName || inviterName
      memberCount = data.memberCount || memberCount
    }
  } catch(e) { console.error('[OG]', e.message) }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FFF8EE"/>
        <stop offset="60%" style="stop-color:#FEF3E2"/>
        <stop offset="100%" style="stop-color:#E8EEFF"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <rect x="860" width="340" height="630" fill="#0D1240"/>
    <rect x="100" y="140" width="80" height="80" rx="18" fill="#2D3A8C"/>
    <text x="140" y="195" font-family="sans-serif" font-size="44" font-weight="900" fill="white" text-anchor="middle">S</text>
    <text x="430" y="220" font-family="sans-serif" font-size="62" font-weight="800" fill="#0D1240" text-anchor="middle">${groupName}</text>
    <text x="430" y="278" font-family="sans-serif" font-size="28" font-weight="600" fill="#2D3A8C" text-anchor="middle">${inviterName} te invit\xF3 a colaborar</text>
    <rect x="240" y="310" width="380" height="44" rx="22" fill="rgba(45,58,140,0.1)"/>
    <text x="430" y="339" font-family="sans-serif" font-size="18" font-weight="600" fill="#2D3A8C" text-anchor="middle">${memberCount} miembros</text>
    <text x="430" y="420" font-family="sans-serif" font-size="30" font-weight="700" fill="#2D3A8C" text-anchor="middle">Unete a Syng</text>
    <rect x="880" y="240" width="60" height="60" rx="14" fill="#2D3A8C"/>
    <text x="910" y="283" font-family="sans-serif" font-size="32" font-weight="900" fill="white" text-anchor="middle">S</text>
    <text x="1030" y="290" font-family="sans-serif" font-size="36" font-weight="800" fill="white" text-anchor="middle">Syng</text>
    <text x="1030" y="340" font-family="sans-serif" font-size="20" fill="rgba(255,255,255,0.7)" text-anchor="middle">Organiza tu vida,</text>
    <text x="1030" y="370" font-family="sans-serif" font-size="20" font-weight="700" fill="#F5A623" text-anchor="middle">juntos es mejor.</text>
    <rect x="900" y="430" width="260" height="40" rx="20" fill="rgba(255,255,255,0.12)"/>
    <text x="1030" y="456" font-family="sans-serif" font-size="16" fill="rgba(255,255,255,0.8)" text-anchor="middle">syng-psi.vercel.app</text>
  </svg>`

  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.status(200).send(svg)
}
