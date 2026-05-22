import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCoreGroups } from '../../core/hooks/useCoreData'
import { GroupForm } from '../../shared/GroupForm'

export function PizarronesModule() {
  const navigate   = useNavigate()
  const groupsCtx  = useCoreGroups()
  const groups     = Array.from(groupsCtx.list.values())
  const [showForm, setShowForm] = useState(false)

  return (
    <div style={screen}>

      {/* Todo el contenido scrollable incluyendo header sticky */}
      <div style={scrollArea}>

        {/* Header sticky — se queda pegado al top mientras scrolleas */}
        <div style={header}>
          <span style={{ fontSize:17, fontWeight:600, color:'#0D1240', letterSpacing:'-0.01em', flex:1 }}>Pizarrones</span>
          <button onClick={() => setShowForm(true)} style={btnNew}>+ Nuevo grupo</button>
        </div>

        {/* Lista de grupos */}
        {groups.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 32px', gap:12 }}>
            <span style={{ fontSize:52 }}>📌</span>
            <p style={{ fontSize:16, fontWeight:600, color:'#0D1240', margin:0, letterSpacing:'-0.01em' }}>Sin pizarrones aún</p>
            <p style={{ fontSize:14, color:'rgba(13,18,64,0.40)', margin:0, textAlign:'center' }}>
              Crea un grupo para colaborar con otras personas.
            </p>
            <button onClick={() => setShowForm(true)} style={btnCreate}>
              Crear primer pizarrón
            </button>
          </div>
        ) : (
          <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            {groups.map(g => (
              <div
                key={g.id}
                onClick={() => navigate(`/pizarron/${g.id}`)}
                style={groupCard}
              >
                <div style={{
                  width:44, height:44, borderRadius:12,
                  background:'rgba(45,58,140,0.10)',
                  color:'#2D3A8C',
                  fontSize:18, fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0,
                }}>
                  {g.name[0].toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:15, fontWeight:600, color:'#0D1240', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>
                    {g.name}
                  </p>
                  <p style={{ margin:'2px 0 0', fontSize:12, color:'rgba(13,18,64,0.38)' }}>
                    {(g.memberIds?.length ?? 1)} miembro{(g.memberIds?.length ?? 1) !== 1 ? 's' : ''}
                  </p>
                </div>
                <span style={{ fontSize:20, color:'rgba(13,18,64,0.22)', fontWeight:400 }}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && <GroupForm onClose={() => setShowForm(false)} />}
    </div>
  )
}

const screen = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  background: 'transparent',
  overflow: 'hidden',
}
const scrollArea = {
  flex: 1,
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  minHeight: 0,
}
const header = {
  /* sticky — se queda fijo en el top del área de scroll */
  position: 'sticky',
  top: 0,
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  padding: '14px 20px',
  borderBottom: '1px solid rgba(13,18,64,0.07)',
  background: 'rgba(247,248,252,0.95)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
}
const btnNew = {
  background: 'linear-gradient(135deg, #3D4FA8, #2D3A8C)',
  color: '#fff', border: 'none', borderRadius: 10,
  padding: '8px 14px', fontSize: 14, fontWeight: 600,
  cursor: 'pointer', flexShrink: 0,
  boxShadow: '0 2px 8px rgba(45,58,140,0.28)',
  WebkitTapHighlightColor: 'transparent',
}
const btnCreate = {
  background: 'linear-gradient(135deg, #3D4FA8, #2D3A8C)',
  color: '#fff', border: 'none', borderRadius: 12,
  padding: '12px 24px', fontSize: 15, fontWeight: 600,
  cursor: 'pointer', marginTop: 8,
  boxShadow: '0 4px 16px rgba(45,58,140,0.30)',
}
const groupCard = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '14px 16px',
  background: 'rgba(255,255,255,0.82)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.65)',
  boxShadow: '0 4px 16px rgba(13,18,64,0.05), inset 0 1px 0 rgba(255,255,255,0.90)',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
}
