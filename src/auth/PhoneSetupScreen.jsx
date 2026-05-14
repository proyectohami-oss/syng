/**
 * PhoneSetupScreen — onboarding obligatorio de número telefónico.
 * Aparece una sola vez después del login si el usuario no tiene teléfono.
 * No puede saltarse — es la puerta de entrada a Syng.
 */
import { useState } from 'react'
import { useCoreAuth } from '../core/hooks/useCoreData'
import { updatePhoneNumber } from '../core/services/users.service'
import { checkPendingInvitations } from '../core/services/invitations.service'

export function PhoneSetupScreen() {
  const auth = useCoreAuth()
  const uid  = auth.user?.uid

  const [phone,   setPhone]   = useState('')
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      setError('Ingresa un número válido de 10 dígitos.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const phoneNumber = await updatePhoneNumber(uid, phone)
      // Buscar invitaciones pendientes para este número
      const userData = auth.userData
      await checkPendingInvitations({
        uid,
        displayName: userData?.displayName ?? '',
        email:       userData?.email ?? '',
        phoneNumber,
      })
      // El listener de Firestore actualizará userData automáticamente
      // y AuthGuard dejará pasar al usuario
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={screen}>
      <div style={card}>

        <div style={{ fontSize:48, marginBottom:16 }}>📱</div>

        <h1 style={{ fontSize:22, fontWeight:700, color:'#111', margin:'0 0 8px' }}>
          Agrega tu número
        </h1>

        <p style={{ fontSize:14, color:'#6b7280', margin:'0 0 28px', lineHeight:1.5 }}>
          Syng usa tu número para que otros puedan encontrarte y agregarte a grupos.
          Tu número no se comparte públicamente.
        </p>

        <label style={lbl}>Número de teléfono</label>
        <div style={{ position:'relative', marginBottom:8 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:15, color:'#6b7280' }}>+52</span>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="9611234567"
            value={phone}
            onChange={e => { setPhone(e.target.value); setError(null) }}
            style={{ ...inputStyle, paddingLeft:44 }}
            maxLength={15}
          />
        </div>

        {error && (
          <p style={{ fontSize:13, color:'#dc2626', margin:'0 0 12px', padding:'8px 12px', background:'#fef2f2', borderRadius:8 }}>
            {error}
          </p>
        )}

        <p style={{ fontSize:12, color:'#9ca3af', margin:'0 0 24px' }}>
          Formato: 10 dígitos. Ej: 9611234567
        </p>

        <button
          onClick={handleSave}
          disabled={loading || phone.replace(/\D/g,'').length < 10}
          style={{
            width:'100%', padding:'14px', borderRadius:12, border:'none',
            fontSize:16, fontWeight:600, cursor:'pointer',
            background: phone.replace(/\D/g,'').length >= 10 ? '#5B3DF6' : '#e5e7eb',
            color:      phone.replace(/\D/g,'').length >= 10 ? '#fff'    : '#9ca3af',
          }}
        >
          {loading ? 'Guardando...' : 'Continuar'}
        </button>

      </div>
    </div>
  )
}

const screen    = { height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#f9fafb', padding:'20px' }
const card      = { background:'#fff', borderRadius:20, padding:'32px 24px', width:'100%', maxWidth:400, textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }
const lbl       = { display:'block', fontSize:12, color:'#6b7280', fontWeight:500, marginBottom:6, textAlign:'left' }
const inputStyle= { width:'100%', boxSizing:'border-box', padding:'12px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:16, color:'#111', fontFamily:'inherit', outline:'none' }
