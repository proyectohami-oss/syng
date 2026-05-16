import { useState } from 'react'
import { useGroups } from '../core/hooks/useGroups'

export function InviteFlow({ groupId, groupName, inviterName, onClose }) {
  const { createInvitationLink } = useGroups()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [compartido, setCompartido] = useState(false)

  async function handleInvitar() {
    setLoading(true)
    setError(null)
    try {
      const token = await createInvitationLink({ groupId, groupName, inviterName })
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
            <p style={{ margin:'0 0 24px', fontSize:14, color:'#6b7280', lineHeight:1.5 }}>
              Syng genera un link unico. Tu eliges como compartirlo.
            </p>
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
    </div>
  )
}

const overlay      = { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }
const sheet        = { background:'#fff', borderRadius:'16px 16px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:480 }
const closeBtn     = { background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18, padding:4 }
const btnPrimary   = { padding:'13px 18px', borderRadius:12, border:'none', background:'#5B3DF6', color:'#fff', cursor:'pointer', fontSize:15, fontWeight:600 }
const btnSecondary = { padding:'13px 16px', borderRadius:12, border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:15, color:'#374151' }
