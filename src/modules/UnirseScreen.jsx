import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useCoreAuth } from '../core/hooks/useCoreData'
import { getInvitationByToken, acceptInvitationLink } from '../core/services/invitations.service'

export function UnirseScreen() {
  const [params]  = useSearchParams()
  const navigate  = useNavigate()
  const auth      = useCoreAuth()
  const token     = params.get('inv')

  const [info,   setInfo]   = useState(null)
  const [status, setStatus] = useState('loading')
  const [err,    setErr]    = useState(null)
  const [log,    setLog]    = useState(['init'])
  const addLog = (msg) => setLog(prev => [...prev, msg])

  useEffect(() => {
    addLog('token:' + token)
    if (!token) { setStatus('notoken'); addLog('notoken'); return }
    addLog('fetching...')
    getInvitationByToken(token)
      .then(inv => {
        addLog('inv:' + JSON.stringify(inv ? {id:inv.id, groupName:inv.groupName} : null))
        if (!inv) { setStatus('error'); setErr('Invitacion no encontrada.'); return }
        setInfo(inv)
        setStatus('preview')
      })
      .catch(e => { addLog('err:' + e.message); setStatus('error'); setErr(e.message || 'Error al cargar.') })
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
      if (result.status === 'already_member') { setStatus('already'); return }
      setStatus('joined')
      setInfo(prev => ({ ...prev, ...result }))
    } catch (e) {
      setStatus('error')
      setErr(e.message)
    }
  }

  return (
    <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f9fafb', padding:20, overflowY:'auto' }}>
      <div style={{ position:'fixed', top:0, left:0, right:0, background:'rgba(0,0,0,0.8)', color:'#0f0', fontSize:11, padding:'4px 8px', zIndex:9999, fontFamily:'monospace' }}>
        status:{status} | {log.slice(-3).join(' | ')}
      </div>
      <div style={{ background:'#fff', borderRadius:20, padding:'32px 24px', width:'100%', maxWidth:380, textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }}>
        {status === 'loading' && <>
          <div style={{ fontSize:48, marginBottom:16 }}>⏳</div>
          <h2 style={{ margin:'0 0 8px', fontSize:20, fontWeight:700, color:'#111' }}>Cargando...</h2>
        </>}
        {status === 'notoken' && <>
          <div style={{ fontSize:48, marginBottom:16 }}>❌</div>
          <h2 style={{ margin:'0 0 8px', fontSize:20, fontWeight:700, color:'#111' }}>Link invalido</h2>
          <p style={{ margin:'0 0 24px', fontSize:14, color:'#6b7280' }}>Este link no tiene una invitacion valida.</p>
        </>}
        {status === 'error' && <>
          <div style={{ fontSize:48, marginBottom:16 }}>❌</div>
          <h2 style={{ margin:'0 0 8px', fontSize:20, fontWeight:700, color:'#111' }}>Error</h2>
          <p style={{ margin:'0 0 24px', fontSize:14, color:'#6b7280' }}>{err}</p>
          <button onClick={() => navigate('/')} style={btn}>Ir a Syng</button>
        </>}
        {status === 'joining' && <>
          <div style={{ fontSize:48, marginBottom:16 }}>⏳</div>
          <h2 style={{ margin:'0 0 8px', fontSize:20, fontWeight:700, color:'#111' }}>Uniendome...</h2>
        </>}
        {status === 'already' && <>
          <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
          <h2 style={{ margin:'0 0 8px', fontSize:20, fontWeight:700, color:'#111' }}>Ya eres miembro</h2>
          <p style={{ margin:'0 0 24px', fontSize:14, color:'#6b7280' }}>Ya perteneces a este grupo.</p>
          <button onClick={() => navigate('/pizarrones')} style={btn}>Ver mis grupos</button>
        </>}
        {status === 'joined' && <>
          <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
          <h2 style={{ margin:'0 0 8px', fontSize:20, fontWeight:700, color:'#111' }}>{'Te uniste a ' + ((info && info.groupName) || 'el grupo')}</h2>
          <p style={{ margin:'0 0 24px', fontSize:14, color:'#6b7280' }}>Ya puedes ver y colaborar en el grupo.</p>
          <button onClick={() => navigate('/pizarrones')} style={btn}>Ir al grupo</button>
        </>}
        {status === 'preview' && <>
          <div style={{ fontSize:48, marginBottom:16 }}>👥</div>
          <h2 style={{ margin:'0 0 8px', fontSize:20, fontWeight:700, color:'#111' }}>{(info && info.groupName) || 'Grupo'}</h2>
          <p style={{ margin:'0 0 24px', fontSize:14, color:'#6b7280', lineHeight:1.5 }}>
            {((info && info.inviterName) || 'Alguien') + ' te invito a unirte a este grupo en Syng.'}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button onClick={handleUnirse} style={btn}>Unirme al grupo</button>
            <button onClick={() => navigate('/')} style={btnSecondary}>Ahora no</button>
          </div>
        </>}
      </div>
    </div>
  )
}

const btn          = { width:'100%', padding:'14px', borderRadius:12, border:'none', background:'#5B3DF6', color:'#fff', fontSize:16, fontWeight:600, cursor:'pointer' }
const btnSecondary = { width:'100%', padding:'14px', borderRadius:12, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:16, cursor:'pointer' }
