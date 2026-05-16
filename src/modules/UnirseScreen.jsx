import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useCoreAuth } from '../core/hooks/useCoreData'
import { getInvitationByToken, acceptInvitationLink } from '../core/services/invitations.service'

export function UnirseScreen() {
  const [params]  = useSearchParams()
  const navigate  = useNavigate()
  const auth      = useCoreAuth()
  const token     = params.get('inv')

  const [info,    setInfo]    = useState(null)
  const [status,  setStatus]  = useState('loading')
  const [err,     setErr]     = useState(null)

  useEffect(() => {
    if (!token) { setStatus('notoken'); return }
    getInvitationByToken(token)
      .then(inv => {
        if (!inv) { setStatus('error'); setErr('Invitacion no encontrada o ya usada.'); return }
        setInfo(inv)
        setStatus('preview')
      })
      .catch(() => { setStatus('error'); setErr('No se pudo cargar la invitacion.') })
  }, [token])

  async function handleUnirse() {
    if (!auth || !auth.user) { navigate('/'); return }
    setStatus('joining')
    try {
      const user = {
        uid:         auth.user.uid,
        displayName: auth.userData ? (auth.userData.displayName || '') : (auth.user.displayName || ''),
        email:       auth.user.email || '',
        phoneNumber: auth.userData ? (auth.userData.phoneNumber || '') : '',
      }
      const result = await acceptInvitationLink({ token, user })
      if (result.status === 'already_member') {
        setStatus('already')
        setInfo(prev => ({ ...prev, ...result }))
        return
      }
      setStatus('joined')
      setInfo(prev => ({ ...prev, ...result }))
    } catch (e) {
      setStatus('error')
      setErr(e.message)
    }
  }

  if (status === 'loading') return (
    <Pantalla emoji="⏳" titulo="Cargando..." />
  )

  if (status === 'notoken') return (
    <Pantalla emoji="❌" titulo="Link invalido" desc="Este link no tiene una invitacion valida." />
  )

  if (status === 'error') return (
    <Pantalla emoji="❌" titulo="Error" desc={err} />
  )

  if (status === 'joining') return (
    <Pantalla emoji="⏳" titulo="Uniendome al grupo..." />
  )

  if (status === 'already') return (
    <Pantalla emoji="✅" titulo={"Ya eres miembro de " + (info && info.groupName ? info.groupName : "el grupo")} desc="Ya perteneces a este grupo.">
      <button onClick={() => navigate('/pizarrones')} style={btn}>Ver mis grupos</button>
    </Pantalla>
  )

  if (status === 'joined') return (
    <Pantalla emoji="🎉" titulo={"Te uniste a " + (info && info.groupName ? info.groupName : "el grupo")} desc="Ya puedes ver y colaborar en el grupo.">
      <button onClick={() => navigate('/pizarrones')} style={btn}>Ir al grupo</button>
    </Pantalla>
  )

  return (
    <Pantalla
      emoji="👥"
      titulo={info && info.groupName ? info.groupName : "Grupo"}
      desc={(info && info.inviterName ? info.inviterName : "Alguien") + " te invito a unirte a este grupo en Syng."}
    >
      <button onClick={handleUnirse} style={btn}>Unirme al grupo</button>
      <button onClick={() => navigate('/')} style={btnSecondary}>Ahora no</button>
    </Pantalla>
  )
}

function Pantalla({ emoji, titulo, desc, children }) {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 24px', width: '100%', maxWidth: 380, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>{emoji}</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#111' }}>{titulo}</h2>
        {desc && <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>{desc}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

const btn          = { width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#5B3DF6', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer' }
const btnSecondary = { width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 16, cursor: 'pointer' }
