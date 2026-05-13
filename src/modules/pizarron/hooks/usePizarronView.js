import { useMemo } from 'react'
import { useCoreState }          from '../../../core/hooks/useCoreData'
import { selectTasksByGroup }    from '../../../core/selectors/taskSelectors'
import { selectGroupById, selectMembersByGroup, selectUserRole } from '../../../core/selectors/groupSelectors'

export function usePizarronView(groupId) {
  const state = useCoreState()

  const tasks   = useMemo(() => selectTasksByGroup(state, groupId), [state.tasks.byGroup, groupId])
  const group   = useMemo(() => selectGroupById(state, groupId),    [state.groups.list, groupId])
  const members = useMemo(() => selectMembersByGroup(state, groupId), [state.groups.members, groupId])
  const role    = useMemo(() => selectUserRole(state, groupId),     [state.groups.members, state.auth.user, groupId])

  const pendingCount   = useMemo(() => tasks.filter(t => t.status === 'pending').length,   [tasks])
  const completedCount = useMemo(() => tasks.filter(t => t.status === 'completed').length, [tasks])

  return {
    tasks,
    group,
    members,
    role,
    pendingCount,
    completedCount,
    isAdmin:  role === 'admin',
    isMember: role === 'admin' || role === 'member',
    loading:  state.tasks.loading || state.groups.loading,
    error:    state.tasks.error   || state.groups.error,
    uid:      state.auth.user?.uid ?? null,
  }
}
