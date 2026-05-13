/**
 * Group selectors — pure functions (state, params?) => derivedData.
 */

/** All groups the user is a member of, sorted by creation date ascending. */
export function selectAllGroups(state) {
  return Array.from(state.groups.list.values()).sort((a, b) => {
    const aMs = a.createdAt?.toMillis?.() ?? 0
    const bMs = b.createdAt?.toMillis?.() ?? 0
    return aMs - bMs
  })
}

/** Single group by ID, or null if not found. */
export function selectGroupById(state, groupId) {
  return state.groups.list.get(groupId) ?? null
}

/** All members of a group as an array. */
export function selectMembersByGroup(state, groupId) {
  const map = state.groups.members.get(groupId)
  if (!map) return []
  return Array.from(map.values())
}

/**
 * Role of the current user in a specific group.
 * Returns 'admin' | 'member' | null.
 */
export function selectUserRole(state, groupId) {
  const uid = state.auth.user?.uid
  if (!uid) return null
  const map = state.groups.members.get(groupId)
  if (!map) return null
  return map.get(uid)?.role ?? null
}

export function selectIsAdmin(state, groupId) {
  return selectUserRole(state, groupId) === 'admin'
}

export function selectIsMember(state, groupId) {
  const role = selectUserRole(state, groupId)
  return role === 'admin' || role === 'member'
}

/** Convenience: all groupIds the user belongs to, sorted by join order. */
export function selectUserGroupIds(state) {
  return Array.from(state.groups.list.keys())
}
