export const config = { runtime: 'edge' }

export default async function handler(req) {
  const url   = new URL(req.url)
  const token = url.pathname.split('/').pop()

  const projectId   = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  let groupName   = 'Grupo Syng'
  let inviterName = 'Alguien'

  try {
    const now     = Math.floor(Date.now() / 1000)
    const header  = btoa(JSON.stringify({ alg:'RS256', typ:'JWT' }))
    const payload = btoa(JSON.stringify({ iss:clientEmail, sub:clientEmail, aud:'https://oauth2.googleapis.com/token', iat:now, exp:now+3600, scope:'https://www.googleapis.com/auth/datastore' }))
    const keyData = privateKey.replace('-----BEGIN PRIVATE KEY-----','').replace('-----END PRIVATE KEY-----','').replace(/\s/g,'')
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
    const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey, { name:'RSASSA-PKCS1-v1_5', hash:'SHA-256' }, false, ['sign'])
    const sigInput  = new TextEncoder().encode(`${header}.${payload}`)
    const sig       = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, sigInput)
    const sigB64    = btoa(String.fromCharCode(...new Uint8Array(sig)))
    const jwt       = `${header}.${payload}.${sigB64}`
    const tokenRes  = await fetch('https://oauth2.googleapis.com/token', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` })
    const { access_token } = await tokenRes.json()
    const fsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`
    const query = { structuredQuery:{ from:[{ collectionId:'invitations' }], where:{ fieldFilter:{ field:{ fieldPath:'token' }, op:'EQUAL', value:{ stringValue:token } } }, limit:1 } }
    const fsRes = await fetch(fsUrl, { method:'POST', headers:{ Authorization:`Bearer ${access_token}`, 'Content-Type':'application/json' }, body:JSON.stringify(query) })
    const docs  = await fsRes.json()
    const fields = docs?.[0]?.document?.fields
    if (fields) {
      groupName   = fields.groupName?.stringValue   ?? groupName
      inviterName = fields.inviterName?.stringValue  ?? inviterName
    }
  } catch(e) { console.error('[invite] Error:', e) }

  const inviteUrl = `https://syng-psi.vercel.app/invite/${token}`
  const ogImage   = `https://syng-psi.vercel.app/api/og-group?groupName=${encodeURIComponent(groupName)}&inviterName=${encodeURIComponent(inviterName)}`
  const joinUrl   = `https://syng-psi.vercel.app/unirse?inv=${token}`
  const title     = `${inviterName} te invitó a ${groupName}`
  const desc      = `Únete a ${groupName} en Syng y organiza tareas juntos.`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <meta property="og:title"        content="${title}"/>
  <meta property="og:description"  content="${desc}"/>
  <meta property="og:image"        content="${ogImage}"/>
  <meta property="og:image:width"  content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:url"          content="${inviteUrl}"/>
  <meta property="og:type"         content="website"/>
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="${title}"/>
  <meta name="twitter:description" content="${desc}"/>
  <meta name="twitter:image"       content="${ogImage}"/>
  <meta http-equiv="refresh" content="0;url=${joinUrl}"/>
</head>
<body>
  <p>Redirigiendo a Syng...</p>
  <script>window.location.replace('${joinUrl}')</script>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type':'text/html;charset=UTF-8', 'Cache-Control':'no-store' }
  })
}
