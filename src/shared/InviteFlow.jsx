import { useState } from 'react'
import { useGroups } from '../core/hooks/useGroups'

export function InviteFlow({ groupId, groupName, inviterName, onClose }) {
  const { createInvitationLink } = useGroups()
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [compartido, setCompartido] = useState(false)
  const [maxUses,    setMaxUses]    = useState(5)
  const [horas,      setHoras]      = useState(18)
  const [sheetUsos,  setSheetUsos]  = useState(false)
  const [sheetHoras, setSheetHoras] = useState(false)

  async function handleInvitar() {
    setLoading(true)
    setError(null)
    try {
      const token = await createInvitationLink({ groupId, groupName, inviterName, maxUses, hoursValid: horas })
      const url   = `https://syng-psi.vercel.app/unirse?inv=${token}`
      const msg   = `${inviterName || 'Alguien'} te invito al grupo "${groupName}" en Syng.`
      if (navigator.share) {
        await navigator.share({ title: 'Invitacion a Syng', text: msg, url })
      } else {
        await navigator.clipboard.writeText(msg)
        setError('Enlace copiado. Pegalo en WhatsApp o Mensajes.')
      }
      setCompartido(true)
    } catch (err) {
      if (err.name !== 'AbortError') setError('No se pudo compartir: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={sheet}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:600 }}>Invitar al grupo</h2>
          <button onClick={onClose} style={closeBtn}>X</button>
        </div>
        {compartido ? (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📨</div>
            <p style={{ margin:'0 0 8px', fontWeight:600, fontSize:16, color:'#111' }}>Invitacion compartida</p>
            <p style={{ margin:'0 0 24px', fontSize:13, color:'#6b7280', lineHeight:1.5 }}>
              Cuando la persona abra el link y acepte, entrara automaticamente al grupo.
            </p>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              <button onClick={() => setCompartido(false)} style={btnSecondary}>Invitar a otro</button>
              <button onClick={onClose} style={btnPrimary}>Listo</button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'8px 0' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>👥</div>
            <p style={{ margin:'0 0 8px', fontWeight:600, fontSize:16, color:'#111' }}>{groupName}</p>
            <p style={{ margin:'0 0 16px', fontSize:14, color:'#6b7280', lineHeight:1.5 }}>
              Syng genera un link unico. Tu eliges como compartirlo.
            </p>
            <div style={{ background:'#f9fafb', borderRadius:12, padding:'4px 0', marginBottom:20, textAlign:'left' }}>
              <button onClick={() => setSheetUsos(true)} style={rowBtn}>
                <span style={{ fontSize:13, color:'#6b7280' }}>👤 Participantes maximos</span>
                <span style={{ fontSize:13, fontWeight:600, color:'#5B3DF6' }}>{maxUses} ›</span>
              </button>
              <div style={{ height:1, background:'#f0f0f0', margin:'0 16px' }} />
              <button onClick={() => setSheetHoras(true)} style={rowBtn}>
                <span style={{ fontSize:13, color:'#6b7280' }}>⏳ Expira en</span>
                <span style={{ fontSize:13, fontWeight:600, color:'#5B3DF6' }}>{horas} horas ›</span>
              </button>
            </div>
            {error && (
              <p style={{ fontSize:13, color:'#dc2626', padding:'8px 12px', background:'#fef2f2', borderRadius:8, margin:'0 0 16px' }}>{error}</p>
            )}
            <button onClick={handleInvitar} disabled={loading} style={{ ...btnPrimary, width:'100%', marginBottom:12 }}>
              {loading ? 'Generando link...' : 'Generar link e invitar'}
            </button>
            <button onClick={onClose} style={{ ...btnSecondary, width:'100%' }}>Cancelar</button>
          </div>
        )}
      </div>

      {sheetUsos && (
        <div style={sheetOverlay} onClick={() => setSheetUsos(false)}>
          <div style={sheetInner} onClick={e => e.stopPropagation()}>
            <p style={sheetTitle}>Participantes maximos</p>
            <div style={chipRow}>
              {[3,5,10,15,20].map(n => (
                <button key={n} onClick={() => { setMaxUses(n); setSheetUsos(false) }}
                  style={{ ...chip, background: maxUses===n ? '#5B3DF6' : '#f3f4f6', color: maxUses===n ? '#fff' : '#111' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {sheetHoras && (
        <div style={sheetOverlay} onClick={() => setSheetHoras(false)}>
          <div style={sheetInner} onClick={e => e.stopPropagation()}>
            <p style={sheetTitle}>Duracion de invitacion</p>
            <div style={chipRow}>
              {[6,12,18,24,48].map(h => (
                <button key={h} onClick={() => { setHoras(h); setSheetHoras(false) }}
                  style={{ ...chip, background: horas===h ? '#5B3DF6' : '#f3f4f6', color: horas===h ? '#fff' : '#111' }}>
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

const rowBtn       = { width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:'none', border:'none', cursor:'pointer' }
const overlay      = { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }
const sheet        = { background:'#fff', borderRadius:'16px 16px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:480 }
const closeBtn     = { background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18, padding:4 }
const btnPrimary   = { padding:'13px 18px', borderRadius:12, border:'none', background:'#5B3DF6', color:'#fff', cursor:'pointer', fontSize:15, fontWeight:600 }
const btnSecondary = { padding:'13px 16px', borderRadius:12, border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:15, color:'#374151' }
const sheetOverlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:2000 }
const sheetInner   = { background:'#fff', borderRadius:'16px 16px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:480 }
const sheetTitle   = { margin:'0 0 16px', fontSize:15, fontWeight:600, color:'#111', textAlign:'center' }
const chipRow      = { display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }
const chip         = { padding:'10px 20px', borderRadius:20, border:'none', fontSize:15, fontWeight:600, cursor:'pointer' }
