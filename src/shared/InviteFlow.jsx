import { useState } from 'react'
import { useGroups } from '../core/hooks/useGroups'
import { normalizePhone } from '../core/services/users.service'

export function InviteFlow({ groupId, groupName, inviterName, onClose }) {
  const { addMemberByPhone } = useGroups()

  const [phone,    setPhone]    = useState('')
  const [lista,    setLista]    = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [enviados, setEnviados] = useState(null)

  const digits  = phone.replace(/\D/g, '')
  const canAdd  = digits.length >= 10
  const canSend = lista.length > 0 && !loading

  const supportsContacts = typeof navigator !== 'undefined' &&
    'contacts' in navigator && 'select' in navigator.contacts

  function agregarNumero() {
    if (!canAdd) return
    const norm = normalizePhone(phone)
    if (lista.find(x => x.norm === norm)) {
      setError('Ese número ya está en la lista.')
      return
    }
    setLista(prev => [...prev, { phone, norm, label: phone }])
    setPhone('')
    setError(null)
  }

  function quitarNumero(norm) {
    setLista(prev => prev.filter(x => x.norm !== norm))
  }

  async function handlePickContact() {
    try {
      const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: true })
      if (!contacts || contacts.length === 0) return
      const nuevos = []
      for (const c of contacts) {
        const tel = c.tel?.[0] ?? ''
        if (!tel) continue
        const norm = normalizePhone(tel)
        if (lista.find(x => x.norm === norm) || nuevos.find(x => x.norm === norm)) continue
        nuevos.push({ phone: tel, norm, label: c.name?.[0] ?? tel })
      }
      setLista(prev => [...prev, ...nuevos])
      setError(null)
    } catch (err) {
      if (err.name !== 'AbortError') setError('No se pudo acceder a los contactos.')
    }
  }

  async function abrirShareSheet() {
    const msg = `${inviterName || 'Alguien'} te invitó al grupo "${groupName || 'el grupo'}" en Syng.`
    const url = 'https://syng-psi.vercel.app'
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Invitación a Syng', text: msg, url })
      } catch (err) {
        if (err.name !== 'AbortError') {
          await navigator.clipboard?.writeText(`${msg} ${url}`).catch(() => {})
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${msg} ${url}`)
        setError('Enlace copiado. Pégalo en WhatsApp o Mensajes.')
      } catch {
        setError(`Comparte: ${url}`)
      }
    }
  }

  async function handleEnviar() {
    if (!canSend) return
    setLoading(true)
    setError(null)
    const resultados = []
    for (const item of lista) {
      try {
        const res = await addMemberByPhone({ groupId, phone: item.phone })
        resultados.push({ ...item, ok: true, status: res.status, name: res.displayName })
      } catch (err) {
        resultados.push({ ...item, ok: false, msg: err.message ?? 'Error' })
      }
    }
    setEnviados(resultados)
    setLoading(false)
    const hayInvitados = resultados.some(r => r.ok && r.status === 'invited')
    if (hayInvitados) {
      setTimeout(() => abrirShareSheet(), 300)
    }
  }

  function statusLabel(r) {
    if (!r.ok) return r.msg
    if (r.status === 'added') return 'Agregado al grupo'
    if (r.status === 'already_invited') return 'Ya tenía invitación pendiente'
    return 'Invitación enviada'
  }
  function statusIcon(r) {
    if (!r.ok) return '❌'
    if (r.status === 'added') return '✅'
    if (r.status === 'already_invited') return '⏳'
    return '📨'
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={sheet}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:600 }}>Invitar miembros</h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {enviados && (
          <div>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>
                {enviados.every(r => r.ok) ? '✅' : '⚠️'}
              </div>
              <p style={{ margin:0, fontWeight:600, fontSize:16, color:'#111' }}>
                {enviados.filter(r => r.ok && r.status === 'invited').length} invitación(es) enviada(s)
              </p>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'#9ca3af' }}>
                El share sheet se abrió para que elijas cómo compartir
              </p>
            </div>
            {enviados.map(r => (
              <div key={r.norm} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid #f3f4f6' }}>
                <span style={{ fontSize:18 }}>{statusIcon(r)}</span>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontSize:14, fontWeight:500, color:'#111' }}>{r.label}</p>
                  <p style={{ margin:0, fontSize:12, color:'#9ca3af' }}>{statusLabel(r)}</p>
                </div>
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:20 }}>
              <button onClick={() => abrirShareSheet()} style={btnSecondary}>📤 Compartir de nuevo</button>
              <button onClick={() => { setLista([]); setEnviados(null) }} style={btnSecondary}>+ Más</button>
              <button onClick={onClose} style={{ ...btnPrimary, flex:1 }}>Listo</button>
            </div>
          </div>
        )}

        {!enviados && (
          <>
            {supportsContacts && (
              <button onClick={handlePickContact} disabled={loading} style={btnContacts}>
                👥 Elegir desde contactos
              </button>
            )}
            <p style={{ margin:'12px 0 6px', fontSize:12, color:'#9ca3af', fontWeight:500, textAlign:'center' }}>
              {supportsContacts ? 'o ingresa el número manualmente' : 'Número de teléfono'}
            </p>
            <div style={{ display:'flex', gap:8, marginBottom:4 }}>
              <div style={{ position:'relative', flex:1 }}>
                <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:15, color:'#6b7280' }}>+52</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(null) }}
                  onKeyDown={e => e.key === 'Enter' && agregarNumero()}
                  placeholder="9611234567"
                  style={{ ...inputStyle, paddingLeft:44 }}
                  maxLength={15}
                />
              </div>
              <button onClick={agregarNumero} disabled={!canAdd}
                style={{ ...btnPrimary, opacity: canAdd ? 1 : 0.4, paddingLeft:16, paddingRight:16, flexShrink:0 }}>
                + Añadir
              </button>
            </div>
            {error && (
              <p style={{ fontSize:13, color:'#dc2626', padding:'8px 12px', background:'#fef2f2', borderRadius:8, margin:'8px 0 0' }}>
                {error}
              </p>
            )}
            {lista.length > 0 && (
              <div style={{ marginTop:16, borderTop:'1px solid #f3f4f6', paddingTop:12 }}>
                <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:600, color:'#9ca3af', letterSpacing:'0.05em' }}>
                  POR INVITAR ({lista.length})
                </p>
                {lista.map(item => (
                  <div key={item.norm} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid #f9fafb' }}>
                    <div style={avatarSmall}>{item.label[0].toUpperCase()}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:0, fontSize:14, color:'#111', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {item.label}
                      </p>
                    </div>
                    <button onClick={() => quitarNumero(item.norm)} style={btnRemove}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:'flex', gap:8, marginTop:20 }}>
              <button onClick={onClose} style={btnSecondary}>Cancelar</button>
              <button onClick={handleEnviar} disabled={!canSend}
                style={{ ...btnPrimary, flex:1, opacity: canSend ? 1 : 0.4 }}>
                {loading ? 'Enviando...' : lista.length === 1 ? 'Enviar invitación' : `Enviar ${lista.length} invitaciones`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const overlay      = { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }
const sheet        = { background:'#fff', borderRadius:'16px 16px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:480, maxHeight:'85svh', overflowY:'auto' }
const closeBtn     = { background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18, padding:4 }
const inputStyle   = { width:'100%', boxSizing:'border-box', padding:'11px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:16, color:'#111', fontFamily:'inherit', outline:'none' }
const btnContacts  = { width:'100%', padding:'13px', borderRadius:12, border:'none', background:'#EDE9FE', color:'#5B3DF6', fontSize:15, fontWeight:600, cursor:'pointer', marginBottom:4 }
const btnPrimary   = { padding:'11px 18px', borderRadius:10, border:'none', background:'#5B3DF6', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:600 }
const btnSecondary = { padding:'11px 16px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:14, color:'#374151' }
const btnRemove    = { background:'none', border:'none', color:'#d1d5db', fontSize:16, cursor:'pointer', padding:'4px 6px', flexShrink:0 }
const avatarSmall  = { width:32, height:32, borderRadius:'50%', background:'#EDE9FE', color:'#5B3DF6', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }