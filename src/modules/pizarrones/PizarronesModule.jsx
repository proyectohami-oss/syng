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
      <div style={header}>
        <span style={{ fontSize:17, fontWeight:600, color:'#111', flex:1 }}>Pizarrones</span>
        <button onClick={() => setShowForm(true)} style={btnNew}>+ Nuevo grupo</button>
      </div>

      <div style={body}>
        {groups.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, padding:32 }}>
            <span style={{ fontSize:52 }}>📌</span>
            <p style={{ fontSize:16, fontWeight:600, color:'#111', margin:0 }}>Sin pizarrones aún</p>
            <p style={{ fontSize:14, color:'#9ca3af', margin:0, textAlign:'center' }}>
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
                <div style={{ width:44, height:44, borderRadius:12, background:'#EDE9FE', color:'#5B3DF6', fontSize:18, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {g.name[0].toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:15, fontWeight:600, color:'#111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {g.name}
                  </p>
                  <p style={{ margin:'2px 0 0', fontSize:12, color:'#9ca3af' }}>
                    {(g.memberIds?.length ?? 1)} miembro{(g.memberIds?.length ?? 1) !== 1 ? 's' : ''}
                  </p>
                </div>
                <span style={{ fontSize:18, color:'#d1d5db' }}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && <GroupForm onClose={() => setShowForm(false)} />}
    </div>
  )
}

const screen   = { display:'flex', flexDirection:'column', flex:1, minHeight:0, background:'#f9fafb' }
const header   = { flexShrink:0, display:'flex', alignItems:'center', padding:'14px 20px', borderBottom:'1px solid #f3f4f6', background:'#fff' }
const body     = { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch' }
const btnNew   = { background:'#5B3DF6', color:'#fff', border:'none', borderRadius:10, padding:'8px 14px', fontSize:14, fontWeight:600, cursor:'pointer' }
const btnCreate = { background:'#5B3DF6', color:'#fff', border:'none', borderRadius:12, padding:'12px 24px', fontSize:15, fontWeight:600, cursor:'pointer', marginTop:8 }
const groupCard = { display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#fff', borderRadius:14, border:'1px solid #f3f4f6', cursor:'pointer', WebkitTapHighlightColor:'transparent' }
