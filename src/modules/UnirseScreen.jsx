import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useCoreAuth } from '../core/hooks/useCoreData'
import { getInvitationByToken, acceptInvitationLink } from '../core/services/invitations.service'

function tiempoRestante(expiresAt) {
  if (!expiresAt) return null
  const ms  = (expiresAt.toMillis ? expiresAt.toMillis() : new Date(expiresAt).getTime()) - Date.now()
  if (ms <= 0) return 'expirada'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return h + 'h ' + m + 'min'
  return m + ' minutos'
}

export function UnirseScreen() {
  const [params]  = useSearchParams()
  const navigate  = useNavigate()
  const auth      = useCoreAuth()
  const token     = params.get('inv')

  const [info,   setInfo]   = useState(null)
  const [status, setStatus] = useState('loading')
  const [err,    setErr]    = useState(null)

  useEffect(() => {
    if (!token) { setStatus('notoken'); return }
    getInvitationByToken(token)
      .then(inv => {
        if (!inv) { setStatus('error'); setErr('not_found'); return }
        setInfo(inv)
        setStatus('preview')
      })
      .catch(e => { setStatus('error'); setErr(e.message || 'Error al cargar.') })
  }, [token])

  async function handleUnirse() {
    if (!auth || !auth.user) { navigate('/'); return }
    setStatus('joining')
    try {
      const user = {
        uid:         auth.user.uid,
        displayName: (auth.userData && auth.userData.displayName) || auth.user.displayName || '',
        email:       auth.user.email || '',
        phoneNumber: (auth.userData && auth.userData.phoneNumber) || '',
      }
      const result = await acceptInvitationLink({ token, user })
      if (result.status === 'already_member' || result.status === 'already_used') {
        setStatus('already')
        setInfo(prev => ({ ...prev, ...result }))
        return
      }
      if (result.status === 'expired') { setStatus('expired'); setInfo(prev => ({ ...prev, ...result })); return }
      if (result.status === 'full')    { setStatus('full');    setInfo(prev => ({ ...prev, ...result })); return }
      if (result.status === 'revoked') { setStatus('revoked'); setInfo(prev => ({ ...prev, ...result })); return }
      setStatus('joined')
      setInfo(prev => ({ ...prev, ...result }))
    } catch (e) {
      setStatus('error')
      setErr(e.message)
    }
  }

  const lugares     = info ? ((info.maxUses || 5) - (info.usedCount || 0)) : 0
  const tiempo      = info ? tiempoRestante(info.expiresAt) : null
  const inviterName = info && info.inviterName ? info.inviterName : 'Alguien'
  const groupName   = info && info.groupName   ? info.groupName   : 'el grupo'

  return (
    <div style={{ flex:1, minHeight:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f0f5', padding:20, overflowY:'auto' }}>
      <div style={{ background:'#fff', borderRadius:24, padding:'36px 28px', width:'100%', maxWidth:380, textAlign:'center', boxShadow:'0 8px 40px rgba(0,0,0,0.10)' }}>

        {status === 'loading' && <>
          <div style={{ fontSize:48, marginBottom:16 }}>⏳</div>
          <h2 style={h2}>Cargando invitacion...</h2>
        </>}

        {status === 'notoken' && <>
          <div style={{ fontSize:48, marginBottom:16 }}>❌</div>
          <h2 style={h2}>Link invalido</h2>
          <p style={desc}>Este link no tiene una invitacion valida.</p>
        </>}

        {status === 'error' && <>
          <div style={{ fontSize:48, marginBottom:16 }}>❌</div>
          <h2 style={h2}>{err === 'not_found' ? 'Invitacion no encontrada' : 'Algo salio mal'}</h2>
          <p style={desc}>{err === 'not_found' ? 'Este link no existe o ya fue usado.' : err}</p>
          <button onClick={() => navigate('/')} style={btn}>Ir a Syng</button>
        </>}

        {status === 'joining' && <>
          <div style={{ fontSize:48, marginBottom:16 }}>⏳</div>
          <h2 style={h2}>Uniendome al grupo...</h2>
        </>}

        {status === 'already' && <>
          <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
          <h2 style={h2}>Ya eres miembro</h2>
          <p style={desc}>Ya perteneces a {groupName}.</p>
          <button onClick={() => navigate('/pizarrones')} style={btn}>Ver mis grupos</button>
        </>}

        {status === 'joined' && <>
          <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
          <h2 style={h2}>Te uniste a {groupName}</h2>
          <p style={desc}>Ya puedes ver y colaborar en el grupo.</p>
          <button onClick={() => navigate('/pizarrones')} style={btn}>Ir al grupo</button>
        </>}

        {status === 'expired' && <>
          <div style={{ fontSize:48, marginBottom:16 }}>⏰</div>
          <h2 style={h2}>Invitacion expirada</h2>
          <p style={desc}>Esta invitacion ya expiro. Contacta a {inviterName} para solicitar una nueva invitacion.</p>
        </>}

        {status === 'full' && <>
          <div style={{ fontSize:48, marginBottom:16 }}>🚫</div>
          <h2 style={h2}>Invitacion llena</h2>
          <p style={desc}>Esta invitacion ya alcanzo el limite de participantes. Contacta a {inviterName} para solicitar una nueva invitacion.</p>
        </>}

        {status === 'revoked' && <>
          <div style={{ fontSize:48, marginBottom:16 }}>🚫</div>
          <h2 style={h2}>Invitacion cancelada</h2>
          <p style={desc}>Esta invitacion fue cancelada. Contacta a {inviterName} para solicitar una nueva invitacion.</p>
        </>}

        {status === 'preview' && <>
          <div style={{ width:72, height:72, borderRadius:20, background:'#EDE9FE', color:'#5B3DF6', fontSize:32, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            {groupName[0].toUpperCase()}
          </div>
          <h2 style={h2}>{groupName}</h2>
          <p style={{ ...desc, marginBottom:20 }}>{inviterName} te invito a unirte a este grupo en Syng.</p>

          <div style={{ background:'#f9fafb', borderRadius:12, padding:'12px 16px', marginBottom:24, textAlign:'left' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:13, color:'#6b7280' }}>Lugares disponibles</span>
              <span style={{ fontSize:13, fontWeight:600, color:'#111' }}>{lugares} de {info.maxUses || 5}</span>
            </div>
            {tiempo && (
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, color:'#6b7280' }}>Expira en</span>
                <span style={{ fontSize:13, fontWeight:600, color: tiempo === 'expirada' ? '#dc2626' : '#111' }}>{tiempo}</span>
              </div>
            )}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button onClick={handleUnirse} style={btn}>Unirme al grupo</button>
            <button onClick={() => navigate('/')} style={btnSecondary}>Ahora no</button>
          </div>
        </>}

      </div>
    </div>
  )
}

const h2          = { margin:'0 0 8px', fontSize:20, fontWeight:700, color:'#111' }
const desc        = { margin:'0 0 24px', fontSize:14, color:'#6b7280', lineHeight:1.5 }
const btn         = { width:'100%', padding:'14px', borderRadius:12, border:'none', background:'#5B3DF6', color:'#fff', fontSize:16, fontWeight:600, cursor:'pointer' }
const btnSecondary= { width:'100%', padding:'14px', borderRadius:12, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:16, cursor:'pointer' }
