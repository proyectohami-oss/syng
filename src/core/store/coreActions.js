export const CORE_ACTIONS = {
  // ── Auth ────────────────────────────────────────────────────────────
  SET_AUTH_USER:    'SET_AUTH_USER',
  SET_USER_DATA:    'SET_USER_DATA',
  SET_SUBSCRIPTION:  'SET_SUBSCRIPTION',
  SET_PLAN:          'SET_PLAN',
  SET_SYSTEM_CONFIG: 'SET_SYSTEM_CONFIG',

  // ── Tasks — Firestore snapshots (docChanges) ─────────────────────────
  APPLY_PERSONAL_TASK_CHANGES: 'APPLY_PERSONAL_TASK_CHANGES',
  APPLY_GROUP_TASK_CHANGES:    'APPLY_GROUP_TASK_CHANGES',
  SET_TASKS_LOADING:           'SET_TASKS_LOADING',
  SET_TASKS_ERROR:             'SET_TASKS_ERROR',

  // ── Tasks — optimistic writes ────────────────────────────────────────
  // NOTE: use 'taskType' (not 'type') in DELETE action to avoid conflict
  // with action.type identifier used by the reducer switch.
  TASK_ADDED_OPTIMISTIC:   'TASK_ADDED_OPTIMISTIC',   // payload: { task }
  TASK_UPDATED_OPTIMISTIC: 'TASK_UPDATED_OPTIMISTIC', // payload: { task }
  TASK_DELETED_OPTIMISTIC: 'TASK_DELETED_OPTIMISTIC', // payload: { taskId, taskType, groupId }

  // ── Groups — Firestore snapshots ─────────────────────────────────────
  APPLY_GROUP_CHANGES:  'APPLY_GROUP_CHANGES',  // payload: { changes }
  APPLY_MEMBER_CHANGES: 'APPLY_MEMBER_CHANGES', // payload: { groupId, changes }
  SET_GROUPS_LOADING:   'SET_GROUPS_LOADING',
  SET_GROUPS_ERROR:     'SET_GROUPS_ERROR',

  // ── Groups — optimistic writes ───────────────────────────────────────
  GROUP_ADDED_OPTIMISTIC:   'GROUP_ADDED_OPTIMISTIC',   // payload: { group }
  GROUP_UPDATED_OPTIMISTIC: 'GROUP_UPDATED_OPTIMISTIC', // payload: { group }

  // ── Immediately remove a group from state (leave / kicked out) ───────
  REMOVE_GROUP_DATA: 'REMOVE_GROUP_DATA', // payload: { groupId }

  // ── Sync metadata ────────────────────────────────────────────────────
  SET_ONLINE_STATUS:   'SET_ONLINE_STATUS',   // payload: { online }
  SET_FROM_CACHE:      'SET_FROM_CACHE',      // payload: { fromCache }
  SET_PENDING_WRITES:  'SET_PENDING_WRITES',  // payload: { hasPendingWrites }
}
