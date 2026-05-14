import { useState } from 'react'
import { useCoreAuth } from '../../core/hooks/useCoreData'
import { updateDisplayName, updatePhoneNumber } from '../../core/services/users.service'
import { useAuthActions } from '../../auth/useAuthActions'

export function PerfilModule() {
  const auth = useCoreAuth()
  const { signOut } = useAuthActions()

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
      <div style={header}>
        <span style={{ fontSize:17, fontWeight:600, color:'#111' }}>Perfil</span>
      </div>

      <div style={body}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 0 20px' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'#EDE9FE', color:'#5B3DF6', fontSize:28, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 }}>
            {(userData?.displayName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
          </div>
          <p style={{ margin:0, fontSize:13, color:'#9ca3af' }}>{user?.email}</p>
        </div>

        <div style={section}>
          <p style={sectionLabel}>NOMBRE</p>
          {editingName ? (
            <div style={{ padding:'12px 16px' }}>
              <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Tu nombre" autoFocus />
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button onClick={handleSaveName} disabled={loading} style={btnPrimary}>{loading ? 'Guardando...' : 'Guardar'}</button>
                <button onClick={() => { setEditingName(false); setError(null) }} style={btnSecondary}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div style={row} onClick={() => { setEditingName(true); setName(userData?.displayName ?? '') }}>
              <span style={{ fontSize:15, color:'#111', flex:1 }}>{userData?.displayName || 'Sin nombre'}</span>
              <span style={{ fontSize:13, color:'#5B3DF6' }}>Editar</span>
            </div>
          )}
        </div>

        <div style={section}>
          <p style={sectionLabel}>TELÉFONO</p>
          {editingPhone ? (
            <div style={{ padding:'12px 16px' }}>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:15, color:'#6b7280' }}>+52</span>
                <input type="tel" inputMode="numeric" value={phone} onChange={e => { setPhone(e.target.value); setError(null) }} style={{ ...inputStyle, paddingLeft:44 }} placeholder="9611234567" autoFocus maxLength={15} />
              </div>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button onClick={handleSavePhone} disabled={loading} style={btnPrimary}>{loading ? 'Guardando...' : 'Guardar'}</button>
                <button onClick={() => { setEditingPhone(false); setPhone(''); setError(null) }} style={btnSecondary}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div style={row} onClick={() => setEditingPhone(true)}>
              <span style={{ fontSize:15, color:'#111', flex:1 }}>{phoneDisplay}</span>
              <span style={{ fontSize:13, color:'#5B3DF6' }}>Editar</span>
            </div>
          )}
        </div>

        {error   && <p style={{ fontSize:13, color:'#dc2626', padding:'8px 16px', background:'#fef2f2', borderRadius:8, margin:'12px 16px 0' }}>{error}</p>}
        {success && <p style={{ fontSize:13, color:'#16a34a', padding:'8px 16px', background:'#f0fdf4', borderRadius:8, margin:'12px 16px 0' }}>{success}</p>}

        <div style={{ padding:'32px 16px 0' }}>
          <button onClick={handleSignOut} disabled={signingOut} style={{ width:'100%', padding:'13px', borderRadius:12, border:'1.5px solid #fee2e2', background:'#fff', color:'#dc2626', fontSize:15, fontWeight:600, cursor:'pointer' }}>
            {signingOut ? 'Cerrando...' : 'Cerrar sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}

const screen       = { display:'flex', flexDirection:'column', flex:1, minHeight:0, background:'#f9fafb' }
const header       = { flexShrink:0, display:'flex', alignItems:'center', padding:'14px 20px', borderBottom:'1px solid #f3f4f6', background:'#fff' }
const body         = { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch' }
const section      = { background:'#fff', borderRadius:12, margin:'12px 16px 0', overflow:'hidden', border:'1px solid #f3f4f6' }
const sectionLabel = { margin:0, fontSize:11, fontWeight:600, color:'#9ca3af', letterSpacing:'0.06em', padding:'10px 16px 4px' }
const row          = { display:'flex', alignItems:'center', padding:'12px 16px', cursor:'pointer' }
const inputStyle   = { width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:16, color:'#111', fontFamily:'inherit', outline:'none' }
const btnPrimary   = { flex:1, padding:'10px', borderRadius:10, border:'none', background:'#5B3DF6', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }
const btnSecondary = { flex:1, padding:'10px', borderRadius:10, border:'1px solid #e5e7eb', background:'#fff', color:'#6b7280', fontSize:14, cursor:'pointer' }
