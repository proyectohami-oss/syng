import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCoreGroups } from '../../core/hooks/useCoreData'
import { useFreeTierBlocked } from '../../core/hooks/useFreeTierGuard'
import { GroupForm } from '../../shared/GroupForm'
import { A, L } from '../../shared/agendaEditorial'

export function PizarronesModule() {
  const navigate   = useNavigate()
  const groupsCtx  = useCoreGroups()
  const groups     = Array.from(groupsCtx.list.values())
  const readOnly     = useFreeTierBlocked()
  const [showForm, setShowForm] = useState(false)

  return (
    <div style={A.screen}>

      <div style={A.scrollArea}>

        <div style={A.stickyHeader}>
          <span style={{ ...A.headerTitle, flex: 1 }}>Pizarrones</span>
          {!readOnly && (
            <button onClick={() => setShowForm(true)} style={A.btnNew}>+ Nuevo grupo</button>
          )}
        </div>

        {groups.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', gap: 12 }}>
            <p style={{ fontFamily: L.serif, fontSize: 22, color: L.ivory, margin: 0 }}>Sin pizarrones aún</p>
            <p style={{ fontSize: 14, color: L.ivoryMuted, margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
              Crea un grupo para colaborar con otras personas.
            </p>
            {!readOnly && (
              <button onClick={() => setShowForm(true)} style={{ ...A.btnPrimary, flex: 'none', marginTop: 8, padding: '12px 24px' }}>
                Crear primer pizarrón
              </button>
            )}
          </div>
        ) : (
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {groups.map(g => (
              <div
                key={g.id}
                onClick={() => navigate(`/pizarron/${g.id}`)}
                style={A.groupCard}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: L.champagneLight,
                  border: `1px solid ${L.champagneBorder}`,
                  color: L.champagne,
                  fontFamily: L.serif,
                  fontSize: 20,
                  fontWeight: 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {g.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: L.ivory, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {g.name}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: L.ivoryMuted }}>
                    {(g.memberIds?.length ?? 1)} miembro{(g.memberIds?.length ?? 1) !== 1 ? 's' : ''}
                  </p>
                </div>
                <span style={{ fontSize: 18, color: L.champagne }}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && <GroupForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
