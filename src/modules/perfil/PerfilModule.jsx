import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCoreAuth } from '../../core/hooks/useCoreData'
import { updateDisplayName, updatePhoneNumber } from '../../core/services/users.service'
import { useAuthActions } from '../../auth/useAuthActions'
import { NotifPrefsSection } from './NotifPrefsSection'

export function PerfilModule() {
  const auth = useCoreAuth()
  const navigate = useNavigate()
  const { signOut } = useAuthActions()
  const goDebug = () => navigate("/debug-sw")

  const user     = auth.user
  const userData = auth.userData

  const [editingName,  setEditingName]  = useState(false)
  const [editingPhone, setEditingPhone] = useState(false)
  const [name,         setName]         = useState(userData?.displayName ?? '')
  const [phone,        setPhone]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [success,      setSuccess]      = useState(null)
  const [signingOut,   setSigningOut]   = useState(false)

  async function handleSaveName() {
    if (!name.trim()) return
    setLoading(true); setError(null); setSuccess(null)
    try {
      await updateDisplayName(user.uid, name)
      setSuccess('Nombre actualizado')
      setEditingName(false)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleSavePhone() {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) { setError('Ingresa un número válido de 10 dígitos.'); return }
    setLoading(true); setError(null); setSuccess(null)
    try {
      await updatePhoneNumber(user.uid, phone)
      setSuccess('Número actualizado')
      setEditingPhone(false)
      setPhone('')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleSignOut() {
    setSigningOut(true)
    try { await signOut() } finally { setSigningOut(false) }
  }

  const phoneDisplay = userData?.phoneNumber
    ? userData.phoneNumber.replace('+52', '+52 ')
    : 'Sin número'

  return (
    <div style={screen}>

      {/* Header */}
      <div style={header}>
        <span style={{ fontSize:17, fontWeight:600, color:'#0D1240', letterSpacing:'-0.01em' }}>Perfil</span>
      </div>

      <div style={body}>

        {/* Avatar — usuario como protagonista */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 0 24px' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(145deg, rgba(61,79,168,0.15), rgba(45,58,140,0.10))',
            border: '2px solid rgba(45,58,140,0.15)',
            color: '#2D3A8C',
            fontSize: 30, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 10,
            boxShadow: '0 4px 16px rgba(45,58,140,0.12)',
          }}>
            {(userData?.displayName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
          </div>
          <p style={{ margin:'0 0 2px', fontSize:16, fontWeight:600, color:'#0D1240', letterSpacing:'-0.01em' }}>
            {userData?.displayName || 'Sin nombre'}
          </p>
          <p style={{ margin:0, fontSize:13, color:'rgba(13,18,64,0.40)' }}>{user?.email}</p>
        </div>

        {/* Nombre */}
        <div style={section}>
          <p style={sectionLabel}>NOMBRE</p>
          {editingName ? (
            <div style={{ padding:'12px 16px' }}>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle}
                placeholder="Tu nombre"
                autoFocus
              />
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button onClick={handleSaveName} disabled={loading} style={btnPrimary}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={() => { setEditingName(false); setError(null) }} style={btnSecondary}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div style={row} onClick={() => { setEditingName(true); setName(userData?.displayName ?? '') }}>
              <span style={{ fontSize:15, color:'#0D1240', flex:1 }}>{userData?.displayName || 'Sin nombre'}</span>
              <span style={{ fontSize:13, color:'#2D3A8C', fontWeight:500 }}>Editar</span>
            </div>
          )}
        </div>

        {/* Teléfono */}
        <div style={section}>
          <p style={sectionLabel}>TELÉFONO</p>
          {editingPhone ? (
            <div style={{ padding:'12px 16px' }}>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:15, color:'rgba(13,18,64,0.45)' }}>+52</span>
                <input
                  type="tel" inputMode="numeric"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(null) }}
                  style={{ ...inputStyle, paddingLeft:44 }}
                  placeholder="9611234567"
                  autoFocus maxLength={15}
                />
              </div>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button onClick={handleSavePhone} disabled={loading} style={btnPrimary}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={() => { setEditingPhone(false); setPhone(''); setError(null) }} style={btnSecondary}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div style={row} onClick={() => setEditingPhone(true)}>
              <span style={{ fontSize:15, color:'#0D1240', flex:1 }}>{phoneDisplay}</span>
              <span style={{ fontSize:13, color:'#2D3A8C', fontWeight:500 }}>Editar</span>
            </div>
          )}
        </div>

        {/* Mensajes */}
        {error   && (
          <p style={{ fontSize:13, color:'#C0392B', padding:'10px 16px', background:'rgba(224,82,82,0.08)', borderRadius:12, margin:'12px 16px 0', border:'1px solid rgba(224,82,82,0.15)' }}>
            {error}
          </p>
        )}
        {success && (
          <p style={{ fontSize:13, color:'#15803d', padding:'10px 16px', background:'rgba(34,197,94,0.08)', borderRadius:12, margin:'12px 16px 0', border:'1px solid rgba(34,197,94,0.15)' }}>
            {success}
          </p>
        )}

        {/* Cerrar sesión */}
        <NotifPrefsSection />
        <div style={{ padding:'32px 16px 48px' }}>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              width:'100%', padding:'14px',
              borderRadius:14,
              border:'1.5px solid rgba(224,82,82,0.25)',
              background:'rgba(224,82,82,0.05)',
              color:'#E05252',
              fontSize:15, fontWeight:600, cursor:'pointer',
              transition:'background 0.15s',
            }}
          >
            {signingOut ? 'Cerrando...' : 'Cerrar sesión'}
          </button>
          <button onClick={goDebug} style={{width:'100%',padding:'10px',borderRadius:12,border:'1px solid #ccc',background:'#f5f5f5',color:'#333',fontSize:13,cursor:'pointer',marginTop:8}}>🔧 Debug SW</button>
        </div>

      </div>
    </div>
  )
}

const screen = {
  display:'flex', flexDirection:'column', flex:1,
  minHeight:0, background:'transparent', overflow:'hidden',
}
const header = {
  flexShrink:0, display:'flex', alignItems:'center',
  padding:'14px 20px',
  borderBottom:'1px solid rgba(13,18,64,0.07)',
  background:'transparent',
}
const body = { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch' }
const section = {
  background:'rgba(255,255,255,0.82)',
  backdropFilter:'blur(20px)',
  WebkitBackdropFilter:'blur(20px)',
  borderRadius:16,
  margin:'12px 16px 0',
  overflow:'hidden',
  border:'1px solid rgba(255,255,255,0.65)',
  boxShadow:'0 4px 16px rgba(13,18,64,0.05), inset 0 1px 0 rgba(255,255,255,0.90)',
}
const sectionLabel = {
  margin:0, fontSize:11, fontWeight:600,
  color:'rgba(13,18,64,0.32)',
  letterSpacing:'0.08em',
  padding:'10px 16px 4px',
}
const row = {
  display:'flex', alignItems:'center',
  padding:'13px 16px', cursor:'pointer',
  borderTop:'1px solid rgba(13,18,64,0.06)',
}
const inputStyle = {
  width:'100%', boxSizing:'border-box',
  padding:'11px 14px', borderRadius:12,
  border:'1.5px solid rgba(13,18,64,0.12)',
  fontSize:16, color:'#0D1240',
  fontFamily:'inherit', outline:'none',
  background:'rgba(255,255,255,0.80)',
  boxShadow:'inset 0 1px 3px rgba(13,18,64,0.04)',
}
const btnPrimary = {
  flex:1, padding:'11px',
  borderRadius:12, border:'none',
  background:'linear-gradient(135deg, #3D4FA8, #2D3A8C)',
  color:'#fff', fontSize:14, fontWeight:600,
  cursor:'pointer',
  boxShadow:'0 2px 8px rgba(45,58,140,0.28)',
}
const btnSecondary = {
  flex:1, padding:'11px',
  borderRadius:12,
  border:'1px solid rgba(13,18,64,0.12)',
  background:'rgba(255,255,255,0.80)',
  color:'rgba(13,18,64,0.45)',
  fontSize:14, cursor:'pointer',
}
