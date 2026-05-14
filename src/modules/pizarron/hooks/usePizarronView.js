import { useMemo } from 'react'
import { useCoreState, useCoreGroups } from '../../../core/hooks/useCoreData'
import { selectTasksByGroup }    from '../../../core/selectors/taskSelectors'
import { selectGroupById, selectMembersByGroup, selectUserRole } from '../../../core/selectors/groupSelectors'

export function usePizarronView(groupId) {
  const state = useCoreState()
  const groups = useCoreGroups()
  console.log('[usePizarronView] groupId buscado:', groupId)
  console.log('[usePizarronView] keys en Map:', Array.from(groups.list.keys()))

  const tasks   = useMemo(() => selectTasksByGroup(state, groupId), [state.tasks.byGroup, groupId])
  const group   = useMemo(() => groups.list.get(groupId) ?? null,    [groups.list, groupId])
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
