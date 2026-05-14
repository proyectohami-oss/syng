/**
 * PizarronModule — vista de un grupo específico.
 *
 * Recibe el groupId de React Router params.
 * No accede a Firestore — lee datos del CoreDataProvider.
 *
 * Layout:
 *   ┌──────────────────────────────────────┬────────────┐
 *   │  PizarronHeader (group name, actions)             │
 *   ├──────────────────────────────────────┬────────────┤
 *   │  PizarronTaskList                    │  Members   │
 *   │  (scrollable, tasks of this group)   │  Panel     │
 *   └──────────────────────────────────────┴────────────┘
 */
import { useState }               from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePizarronView }        from './hooks/usePizarronView'
import { PizarronHeader }         from './components/PizarronHeader'
import { PizarronTaskList }       from './components/PizarronTaskList'
import { PizarronMemberPanel }    from './components/PizarronMemberPanel'
import { TaskForm }               from '../../shared/TaskForm'
import { GroupForm }              from '../../shared/GroupForm'
import { ConfirmDialog }          from '../../shared/ConfirmDialog'
import { InviteFlow }             from '../../shared/InviteFlow'
import { SyncBadge }              from '../../shared/SyncBadge'
import { EmptyState }             from '../../shared/EmptyState'
import { useTasks }               from '../../core/hooks/useTasks'
import { useGroups }              from '../../core/hooks/useGroups'
import { usePermissions }         from '../../core/hooks/usePermissions'

export function PizarronModule() {
  const { groupId }  = useParams()
  const navigate     = useNavigate()
  const { tasks, group, members, role, pendingCount, completedCount, loading, uid } = usePizarronView(groupId)
  const { deleteTask }                = useTasks()
  const { deleteGroup, leaveGroup }   = useGroups()
  const perms = usePermissions(groupId)

  const [modal, setModal] = useState(null)
  // modal: null
  //   | 'createTask' | { type: 'editTask', task } | { type: 'deleteTask', task }
  //   | 'editGroup'  | 'deleteGroup' | 'leaveGroup' | 'invite'

  if ((loading || !group) && !group) {
    return (
      <div style={centered}>
        <span style={{ fontSize: 14, color: '#9ca3af' }}>Cargando pizarrón...</span>
      </div>
    )
  }

  if (!group && !loading) {
    return (
      <EmptyState
        title="Grupo no encontrado"
        description="Este grupo no existe o ya no tienes acceso."
        action={<button onClick={() => navigate('/agenda')} style={backBtn}>Ir a Mi Agenda</button>}
      />
    )
  }

  const taskType = 'group'

  return (
    <div style={layout}>
      {/* Header */}
      <PizarronHeader
        group={group}
        role={role}
        memberCount={members.length}
        onInvite={() => setModal('invite')}
        onEditGroup={() => setModal('editGroup')}
        onDeleteGroup={() => setModal('deleteGroup')}
        onLeaveGroup={() => setModal('leaveGroup')}
      />

      {/* Sync badge */}
      <div style={{ padding: '4px 20px', borderBottom: '1px solid #f9fafb', flexShrink: 0 }}>
        <SyncBadge />
      </div>

      {/* Task count bar */}
      <div style={countBar}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
          {completedCount > 0 && ` · ${completedCount} completada${completedCount !== 1 ? 's' : ''}`}
        </span>
        {perms.canCreateGroupTask && (
          <button onClick={() => setModal('createTask')} style={newBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva tarea
          </button>
        )}
      </div>

      {/* Content */}
      <div style={content}>
        <PizarronTaskList
          tasks={tasks}
          groupId={groupId}
          canCreate={perms.canCreateGroupTask}
          onEdit={(task) => setModal({ type: 'editTask', task })}
          onDelete={(task) => setModal({ type: 'deleteTask', task })}
          onCreateTask={() => setModal('createTask')}
        />
        <PizarronMemberPanel
          groupId={groupId}
          group={group}
          members={members}
          role={role}
          currentUid={uid}
        />
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}

      {modal === 'createTask' && (
        <TaskForm
          type={taskType}
          groupId={groupId}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'editTask' && (
        <TaskForm
          task={modal.task}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'deleteTask' && (
        <ConfirmDialog
          title="Eliminar tarea"
          message={`¿Eliminar "${modal.task.title}"?`}
          confirmLabel="Eliminar"
          danger
          onConfirm={async () => {
            await deleteTask(modal.task)
            setModal(null)
          }}
          onCancel={() => setModal(null)}
        />
      )}

      {modal === 'editGroup' && (
        <GroupForm group={group} onClose={() => setModal(null)} />
      )}

      {modal === 'invite' && (
        <InviteFlow groupId={groupId} onClose={() => setModal(null)} />
      )}

      {modal === 'leaveGroup' && (
        <ConfirmDialog
          title="Salir del grupo"
          message={
            role === 'admin' && members.length > 1
              ? 'Eres el administrador. Transfiere el rol de admin a otro miembro antes de salir.'
              : `¿Salir de "${group.name}"? Perderás acceso a las tareas del grupo.`
          }
          confirmLabel="Salir"
          danger
          onConfirm={async () => {
            try {
              await leaveGroup(groupId)
              navigate('/agenda')
            } catch (err) {
              if (err.message === 'group/admin-must-transfer-before-leaving') {
                alert('Transfiere el rol de admin antes de salir.')
              }
              throw err
            }
          }}
          onCancel={() => setModal(null)}
        />
      )}

      {modal === 'deleteGroup' && (
        <ConfirmDialog
          title="Eliminar grupo"
          message={`¿Eliminar "${group.name}" y todas sus tareas? Esta acción afecta a todos los miembros.`}
          confirmLabel="Eliminar grupo"
          danger
          onConfirm={async () => {
            await deleteGroup(groupId)
            navigate('/agenda')
          }}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}

const layout   = { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }
const content  = { display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }
const centered = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }
const countBar = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }
const newBtn   = { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }
const backBtn  = { padding: '8px 16px', borderRadius: 8, border: 'none', background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: 13 }
