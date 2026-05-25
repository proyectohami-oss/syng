import { ImageResponse } from '@vercel/og'
export const config = { runtime: 'edge' }
export default async function handler(req) {
  const url = new URL(req.url)
  const token = url.pathname.split('/').pop()
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  let groupName = 'Grupo Syng'
  let inviterName = 'Alguien'
  let memberCount = 0
  try {
    const now = Math.floor(Date.now() / 1000)
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({ iss: clientEmail, sub: clientEmail, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600, scope: 'https://www.googleapis.com/auth/datastore' }))
    const keyData = privateKey.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '')
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
    const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
    const sigInput = new TextEncoder().encode(`${header}.${payload}`)
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, sigInput)
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    const jwt = `${header}.${payload}.${sigB64}`
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` })
    const { access_token } = await tokenRes.json()
    const fsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`
    const query = { structuredQuery: { from: [{ collectionId: 'invitations' }], where: { fieldFilter: { field: { fieldPath: 'token' }, op: 'EQUAL', value: { stringValue: token } } }, limit: 1 } }
    const fsRes = await fetch(fsUrl, { method: 'POST', headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(query) })
    const docs = await fsRes.json()
    const fields = docs?.[0]?.document?.fields
    if (fields) { groupName = fields.groupName?.stringValue ?? groupName; inviterName = fields.inviterName?.stringValue ?? inviterName; memberCount = parseInt(fields.memberCount?.integerValue ?? '0') }
  } catch (e) { console.error('[OG] Error:', e) }
  return new ImageResponse((<div style={{ width:'1200px', height:'630px', display:'flex', fontFamily:'sans-serif', background:'linear-gradient(135deg,#FFF8EE 0%,#FEF3E2 60%,#E8EEFF 100%)' }}><div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 50px' }}><div style={{ fontSize:'80px', marginBottom:'24px' }}>👨‍👩‍👧‍👦</div><div style={{ fontSize:'52px', fontWeight:'800', color:'#0D1240', letterSpacing:'-2px', textAlign:'center', marginBottom:'12px' }}>{groupName}</div><div style={{ fontSize:'26px', color:'#2D3A8C', fontWeight:'600', marginBottom:'24px', textAlign:'center' }}>{inviterName} te invitó a colaborar</div><div style={{ display:'flex', gap:'12px', marginBottom:'32px' }}>{memberCount > 0 && <div style={{ background:'rgba(45,58,140,0.1)', borderRadius:'20px', padding:'8px 20px', fontSize:'18px', color:'#2D3A8C', fontWeight:'600' }}>👥 {memberCount} miembros</div>}<div style={{ background:'rgba(45,58,140,0.1)', borderRadius:'20px', padding:'8px 20px', fontSize:'18px', color:'#2D3A8C', fontWeight:'600' }}>Organiza juntos sus tareas</div></div><div style={{ fontSize:'28px', fontWeight:'700', color:'#2D3A8C' }}>≋ Únete a Syng ≋</div></div><div style={{ width:'340px', background:'#0D1240', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 30px' }}><div style={{ width:'80px', height:'80px', background:'#2D3A8C', borderRadius:'18px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px', fontWeight:'900', color:'#fff', marginBottom:'20px' }}>S</div><div style={{ fontSize:'36px', fontWeight:'800', color:'#fff', marginBottom:'12px', letterSpacing:'-1px' }}>Syng</div><div style={{ fontSize:'20px', color:'rgba(255,255,255,0.7)', textAlign:'center', lineHeight:'1.4', marginBottom:'8px' }}>Organiza tu vida,</div><div style={{ fontSize:'20px', color:'#F5A623', fontWeight:'700', textAlign:'center', marginBottom:'32px' }}>juntos es mejor.</div><div style={{ background:'rgba(255,255,255,0.12)', borderRadius:'24px', padding:'10px 20px', fontSize:'16px', color:'rgba(255,255,255,0.8)', fontWeight:'500' }}>🌐 syng-psi.vercel.app</div></div></div>), { width:1200, height:630 })
}
