/**
 * InviteFlow — agregar miembro a grupo por número de teléfono.
 * Soporta: contactos nativos (si disponible) + ingreso manual.
 */
import { useState } from 'react'
import { useGroups } from '../core/hooks/useGroups'
import { findUserByPhone, normalizePhone } from '../core/services/users.service'

export function InviteFlow({ groupId, onClose }) {
  const { addMemberByPhone } = useGroups()

  const [phone,          setPhone]          = useState('')
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)
  const [result,         setResult]         = useState(null)
  const [contactResult,  setContactResult]  = useState(null) // contacto seleccionado antes de agregar

  const digits  = phone.replace(/\D/g, '')
  const canSend = digits.length >= 10

  // Detecta si el dispositivo soporta la API de contactos
  const supportsContacts = typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    'select' in navigator.contacts

  async function handlePickContact() {
    try {
      const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false })
      if (!contacts || contacts.length === 0) return
      const contact = contacts[0]
      const tel = contact.tel?.[0] ?? ''
      const name = contact.name?.[0] ?? ''
      if (!tel) { setError('El contacto no tiene número de teléfono.'); return }

      // Buscar si ya usa Syng
      setLoading(true); setError(null)
      const normalized = normalizePhone(tel)
      const syngUser = await findUserByPhone(tel)
      setContactResult({ name, tel, normalized, syngUser })
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('No se pudo acceder a los contactos.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleAddContact() {
    if (!contactResult) return
    setLoading(true); setError(null)
    try {
      const res = await addMemberByPhone({ groupId, phone: contactResult.tel })
      setResult(res)
      setContactResult(null)
    } catch (err) {
      setError(err.message ?? 'No se pudo agregar al miembro')
    } finally {
      setLoading(false)
    }
  }

  function handleInviteWhatsApp() {
    const msg = encodeURIComponent('Te invito a unirte a Syng, una app para organizar tareas en grupo. Descárgala en: https://syng-psi.vercel.app')
    const num = contactResult.normalized.replace('+', '')
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
  }

  function handleInviteSMS() {
    const msg = encodeURIComponent('Te invito a Syng: https://syng-psi.vercel.app')
    window.open(`sms:${contactResult.normalized}?body=${msg}`, '_blank')
  }

  async function handleSubmit() {
    if (!canSend) return
    setLoading(true); setError(null)
    try {
      const res = await addMemberByPhone({ groupId, phone })
      setResult(res)
    } catch (err) {
      setError(err.message ?? 'No se pudo agregar al miembro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={sheet}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:600 }}>Agregar miembro</h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {/* Resultado final */}
        {result && (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>
              {result.status === 'added' ? '✅' : '📨'}
            </div>
            <p style={{ margin:'0 0 8px', fontWeight:600, color:'#111', fontSize:16 }}>
              {result.status === 'added' ? 'Miembro agregado' : 'Invitación enviada'}
            </p>
            <p style={{ margin:'0 0 20px', fontSize:13, color:'#6b7280', lineHeight:1.5 }}>
              {result.status === 'added'
                ? `${result.displayName} ya puede ver y colaborar en el grupo.`
                : `Cuando instale Syng con el número ${result.displayName}, entrará automáticamente.`
              }
            </p>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              <button onClick={() => { setPhone(''); setResult(null) }} style={btnSecondary}>Agregar otro</button>
              <button onClick={onClose} style={btnPrimary}>Listo</button>
            </div>
          </div>
        )}

        {/* Contacto seleccionado — mostrar opciones */}
        {!result && contactResult && (
          <div style={{ padding:'4px 0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid #f3f4f6', marginBottom:16 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'#EDE9FE', color:'#5B3DF6', fontSize:18, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {(contactResult.name?.[0] ?? '?').toUpperCase()}
              </div>
              <div>
                <p style={{ margin:0, fontSize:15, fontWeight:600, color:'#111' }}>{contactResult.name || 'Sin nombre'}</p>
                <p style={{ margin:0, fontSize:13, color:'#9ca3af' }}>{contactResult.normalized}</p>
              </div>
            </div>

            {contactResult.syngUser ? (
              <>
                <p style={{ margin:'0 0 12px', fontSize:13, color:'#22C55E', fontWeight:500 }}>✅ Ya usa Syng</p>
                <button onClick={handleAddContact} disabled={loading} style={{ ...btnPrimary, width:'100%', marginBottom:8 }}>
                  {loading ? 'Agregando...' : 'Agregar al grupo'}
                </button>
              </>
            ) : (
              <>
                <p style={{ margin:'0 0 12px', fontSize:13, color:'#6b7280' }}>Aún no usa Syng. Puedes invitarlo por:</p>
                <button onClick={handleInviteWhatsApp} style={{ ...btnPrimary, width:'100%', marginBottom:8, background:'#25D366' }}>
                  💬 Invitar por WhatsApp
                </button>
                <button onClick={handleInviteSMS} style={{ ...btnSecondary, width:'100%', marginBottom:8 }}>
                  📱 Invitar por SMS
                </button>
              </>
            )}

            {error && <p style={{ fontSize:13, color:'#dc2626', padding:'8px 12px', background:'#fef2f2', borderRadius:8, margin:'8px 0' }}>{error}</p>}

            <button onClick={() => { setContactResult(null); setError(null) }} style={{ ...btnSecondary, width:'100%' }}>
              Cancelar
            </button>
          </div>
        )}

        {/* Formulario principal */}
        {!result && !contactResult && (
          <>
            {supportsContacts && (
              <button onClick={handlePickContact} disabled={loading} style={btnContacts}>
                👥 Elegir desde contactos
              </button>
            )}

            <p style={{ margin: supportsContacts ? '16px 0 8px' : '0 0 8px', fontSize:12, color:'#9ca3af', fontWeight:500, textAlign:'center' }}>
              {supportsContacts ? 'o ingresa el número manualmente' : 'Ingresa el número de teléfono'}
            </p>

            <label style={lbl}>Número de teléfono</label>
            <div style={{ position:'relative', marginBottom:8 }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:15, color:'#6b7280' }}>+52</span>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={e => { setPhone(e.target.value); setError(null) }}
                placeholder="9611234567"
                style={{ ...inputStyle, paddingLeft:44 }}
                maxLength={15}
              />
            </div>

            {error && <p style={{ fontSize:13, color:'#dc2626', padding:'8px 12px', background:'#fef2f2', borderRadius:8, margin:'0 0 12px' }}>{error}</p>}

            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:8 }}>
              <button onClick={onClose} style={btnSecondary}>Cancelar</button>
              <button onClick={handleSubmit} disabled={!canSend || loading} style={{ ...btnPrimary, opacity: canSend ? 1 : 0.5 }}>
                {loading ? 'Buscando...' : 'Agregar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const overlay    = { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }
const sheet      = { background:'#fff', borderRadius:'16px 16px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:480, maxHeight:'85svh', overflowY:'auto' }
const lbl        = { display:'block', fontSize:12, color:'#6b7280', fontWeight:500, marginBottom:6 }
const inputStyle = { width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:16, color:'#111', fontFamily:'inherit', outline:'none' }
const closeBtn   = { background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18, padding:4 }
const btnContacts  = { width:'100%', padding:'13px', borderRadius:12, border:'none', background:'#EDE9FE', color:'#5B3DF6', fontSize:15, fontWeight:600, cursor:'pointer', marginBottom:4 }
const btnSecondary = { padding:'10px 18px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:14, color:'#374151' }
const btnPrimary   = { padding:'10px 18px', borderRadius:10, border:'none', background:'#5B3DF6', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:600 }
