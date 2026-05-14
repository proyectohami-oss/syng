/**
 * InviteFlow — agregar miembro a grupo por número de teléfono.
 * Si el número ya tiene Syng → entra directo al grupo.
 * Si no → queda como invitación pendiente.
 */
import { useState } from 'react'
import { useGroups } from '../core/hooks/useGroups'

export function InviteFlow({ groupId, onClose }) {
  const { addMemberByPhone } = useGroups()

  const [phone,   setPhone]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [result,  setResult]  = useState(null)

  const digits = phone.replace(/\D/g, '')
  const canSend = digits.length >= 10

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

        {result ? (
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
                : `Cuando instale Syng con el número ${result.displayName}, entrará automáticamente al grupo.`
              }
            </p>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              <button onClick={() => { setPhone(''); setResult(null) }} style={btnSecondary}>
                Agregar otro
              </button>
              <button onClick={onClose} style={btnPrimary}>Listo</button>
            </div>
          </div>
        ) : (
          <>
            <p style={{ margin:'0 0 16px', fontSize:13, color:'#6b7280', lineHeight:1.5 }}>
              Ingresa el número de la persona. Si ya usa Syng, entra al grupo de inmediato.
              Si no, recibirá una invitación cuando instale la app.
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
                autoFocus
              />
            </div>

            {error && (
              <p style={{ fontSize:13, color:'#dc2626', padding:'8px 12px', background:'#fef2f2', borderRadius:8, margin:'0 0 12px' }}>
                {error}
              </p>
            )}

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
const sheet      = { background:'#fff', borderRadius:'16px 16px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:480 }
const lbl        = { display:'block', fontSize:12, color:'#6b7280', fontWeight:500, marginBottom:6 }
const inputStyle = { width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:16, color:'#111', fontFamily:'inherit', outline:'none' }
const closeBtn   = { background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18, padding:4 }
const btnSecondary = { padding:'10px 18px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:14, color:'#374151' }
const btnPrimary   = { padding:'10px 18px', borderRadius:10, border:'none', background:'#5B3DF6', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:600 }
