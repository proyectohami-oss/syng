/**
 * Task selectors — pure functions (state, params?) => derivedData.
 * No side effects, no Firestore access, no React.
 * Wrap with useMemo in view hooks to avoid redundant computation.
 */

function sortByCreatedAt(tasks) {
  return tasks.sort((a, b) => {
    const aMs = a.createdAt?.toMillis?.() ?? 0
    const bMs = b.createdAt?.toMillis?.() ?? 0
    return bMs - aMs
  })
}

/** All tasks the user has access to: personal + every group they belong to. */
export function selectAllTasks(state) {
  const personal = Array.from(state.tasks.personal.values())
  const grouped  = Array.from(state.tasks.byGroup.values()).flatMap(m =>
    Array.from(m.values())
  )
  return sortByCreatedAt([...personal, ...grouped])
}

/** Only personal tasks (ownerId == uid, type == 'personal'). */
export function selectPersonalTasks(state) {
  return sortByCreatedAt(Array.from(state.tasks.personal.values()))
}

/** All tasks for a specific group. */
export function selectTasksByGroup(state, groupId) {
  const groupMap = state.tasks.byGroup.get(groupId)
  if (!groupMap) return []
  return sortByCreatedAt(Array.from(groupMap.values()))
}

/** Look up a single task by ID across all sources. */
export function selectTaskById(state, taskId) {
  const personal = state.tasks.personal.get(taskId)
  if (personal) return personal
  for (const groupMap of state.tasks.byGroup.values()) {
    const task = groupMap.get(taskId)
    if (task) return task
  }
  return null
}

export function selectPendingTasks(state) {
  return selectAllTasks(state).filter(t => t.status === 'pending')
}

export function selectCompletedTasks(state) {
  return selectAllTasks(state).filter(t => t.status === 'completed')
}

export function selectPendingTasksByGroup(state, groupId) {
  return selectTasksByGroup(state, groupId).filter(t => t.status === 'pending')
}

export function selectCompletedTasksByGroup(state, groupId) {
  return selectTasksByGroup(state, groupId).filter(t => t.status === 'completed')
}
