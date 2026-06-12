import { CORE_ACTIONS } from './coreActions'

function applyDocChangesToMap(map, changes) {
  const next = new Map(map)
  for (const change of changes) {
    const data = { id: change.doc.id, ...change.doc.data() }
    if (change.type === 'added' || change.type === 'modified') {
      next.set(change.doc.id, data)
    } else if (change.type === 'removed') {
      next.delete(change.doc.id)
    }
  }
  return next
}

/**
 * Elimina una tarea de TODOS los lugares donde pueda estar.
 * Necesario cuando se cambia el tipo (personal→grupo o viceversa).
 * Devuelve { nextPersonal, nextByGroup } ya modificados.
 */
function removeTaskFromAllMaps(state, taskId) {
  const nextPersonal = new Map(state.tasks.personal)
  nextPersonal.delete(taskId)

  const nextByGroup = new Map(state.tasks.byGroup)
  nextByGroup.forEach((groupMap, groupId) => {
    if (groupMap.has(taskId)) {
      const next = new Map(groupMap)
      next.delete(taskId)
      nextByGroup.set(groupId, next)
    }
  })

  return { nextPersonal, nextByGroup }
}

export function coreReducer(state, action) {
  switch (action.type) {

    // ── AUTH ─────────────────────────────────────────────────────────

    case CORE_ACTIONS.SET_AUTH_USER:
      return { ...state, auth: { ...state.auth, user: action.user, loading: false } }

    case CORE_ACTIONS.SET_USER_DATA:
      return { ...state, auth: { ...state.auth, userData: action.userData } }

    case CORE_ACTIONS.SET_SUBSCRIPTION:
      return { ...state, auth: { ...state.auth, subscription: action.subscription } }

    case CORE_ACTIONS.SET_PLAN:
      return { ...state, auth: { ...state.auth, plan: action.plan } }

    case CORE_ACTIONS.SET_SYSTEM_CONFIG:
      return { ...state, auth: { ...state.auth, systemConfig: action.systemConfig } }

    // ── TASKS — snapshots ─────────────────────────────────────────────

    case CORE_ACTIONS.APPLY_PERSONAL_TASK_CHANGES: {
      const nextPersonal = applyDocChangesToMap(state.tasks.personal, action.changes)
      return { ...state, tasks: { ...state.tasks, personal: nextPersonal, loading: false } }
    }

    case CORE_ACTIONS.APPLY_GROUP_TASK_CHANGES: {
      const existing    = state.tasks.byGroup.get(action.groupId) ?? new Map()
      const nextGroup   = applyDocChangesToMap(existing, action.changes)
      const nextByGroup = new Map(state.tasks.byGroup)
      nextByGroup.set(action.groupId, nextGroup)
      return { ...state, tasks: { ...state.tasks, byGroup: nextByGroup, loading: false } }
    }

    case CORE_ACTIONS.SET_TASKS_LOADING:
      return { ...state, tasks: { ...state.tasks, loading: action.loading } }

    case CORE_ACTIONS.SET_TASKS_ERROR:
      return { ...state, tasks: { ...state.tasks, error: action.error, loading: false } }

    // ── TASKS — optimistic ────────────────────────────────────────────

    case CORE_ACTIONS.TASK_ADDED_OPTIMISTIC: {
      const { task } = action
      const { nextPersonal, nextByGroup } = removeTaskFromAllMaps(state, task.id)

      if (task.type === 'personal') {
        nextPersonal.set(task.id, task)
      } else if (task.groupId) {
        const gMap = nextByGroup.get(task.groupId) ?? new Map()
        const next = new Map(gMap)
        next.set(task.id, task)
        nextByGroup.set(task.groupId, next)
      }

      return { ...state, tasks: { ...state.tasks, personal: nextPersonal, byGroup: nextByGroup } }
    }

    case CORE_ACTIONS.TASK_UPDATED_OPTIMISTIC: {
      /**
       * CLAVE: siempre quita la tarea de TODOS los mapas antes de añadirla
       * a la ubicación correcta. Esto evita que quede en dos sitios cuando
       * el usuario cambia el tipo (personal↔grupo) o el groupId.
       */
      const { task } = action
      const { nextPersonal, nextByGroup } = removeTaskFromAllMaps(state, task.id)

      if (task.type === 'personal') {
        nextPersonal.set(task.id, task)
      } else if (task.groupId) {
        const gMap = nextByGroup.get(task.groupId) ?? new Map()
        const next = new Map(gMap)
        next.set(task.id, task)
        nextByGroup.set(task.groupId, next)
      }

      return { ...state, tasks: { ...state.tasks, personal: nextPersonal, byGroup: nextByGroup } }
    }

    case CORE_ACTIONS.TASK_DELETED_OPTIMISTIC: {
      const { taskId } = action
      const { nextPersonal, nextByGroup } = removeTaskFromAllMaps(state, taskId)
      return { ...state, tasks: { ...state.tasks, personal: nextPersonal, byGroup: nextByGroup } }
    }

    // ── GROUPS — snapshots ────────────────────────────────────────────

    case CORE_ACTIONS.APPLY_GROUP_CHANGES: {
      const nextList = applyDocChangesToMap(state.groups.list, action.changes)
      return { ...state, groups: { ...state.groups, list: nextList, loading: false } }
    }

    case CORE_ACTIONS.APPLY_MEMBER_CHANGES: {
      const existing       = state.groups.members.get(action.groupId) ?? new Map()
      const nextMembers    = applyDocChangesToMap(existing, action.changes)
      const nextMembersMap = new Map(state.groups.members)
      nextMembersMap.set(action.groupId, nextMembers)
      return { ...state, groups: { ...state.groups, members: nextMembersMap, loading: false } }
    }

    case CORE_ACTIONS.SET_GROUPS_LOADING:
      return { ...state, groups: { ...state.groups, loading: action.loading } }

    case CORE_ACTIONS.SET_GROUPS_ERROR:
      return { ...state, groups: { ...state.groups, error: action.error, loading: false } }

    // ── GROUPS — optimistic ───────────────────────────────────────────

    case CORE_ACTIONS.GROUP_ADDED_OPTIMISTIC: {
      const nextList = new Map(state.groups.list)
      nextList.set(action.group.id, action.group)
      return { ...state, groups: { ...state.groups, list: nextList } }
    }

    case CORE_ACTIONS.GROUP_UPDATED_OPTIMISTIC: {
      const nextList  = new Map(state.groups.list)
      const existing  = nextList.get(action.group.id) ?? {}
      nextList.set(action.group.id, { ...existing, ...action.group })
      return { ...state, groups: { ...state.groups, list: nextList } }
    }

    case CORE_ACTIONS.REMOVE_GROUP_DATA: {
      const { groupId } = action
      const nextList    = new Map(state.groups.list)
      nextList.delete(groupId)
      const nextMembers = new Map(state.groups.members)
      nextMembers.delete(groupId)
      const nextByGroup = new Map(state.tasks.byGroup)
      nextByGroup.delete(groupId)
      return {
        ...state,
        groups: { ...state.groups, list: nextList, members: nextMembers },
        tasks:  { ...state.tasks,  byGroup: nextByGroup },
      }
    }

    // ── SYNC ──────────────────────────────────────────────────────────

    case CORE_ACTIONS.SET_ONLINE_STATUS:
      return { ...state, sync: { ...state.sync, online: action.online } }

    case CORE_ACTIONS.SET_FROM_CACHE:
      return { ...state, sync: { ...state.sync, fromCache: action.fromCache } }

    case CORE_ACTIONS.SET_PENDING_WRITES:
      return { ...state, sync: { ...state.sync, hasPendingWrites: action.hasPendingWrites } }

    default:
      return state
  }
}
