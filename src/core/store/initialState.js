/**
 * Single source of truth for the entire application state.
 * Both Mi Agenda and Pizarrón read from this shape.
 *
 * Maps are used instead of arrays for O(1) lookup and efficient
 * docChanges() patching — only modified documents are re-set.
 */
export const initialState = {
  auth: {
    user:         null, // FirebaseUser | null
    userData:     null, // Firestore /users/{uid} document | null
    subscription:  null, // Firestore /subscriptions/{uid} document | null
    plan:          null, // Firestore /subscription_plans/{planId} document | null
    systemConfig:  null, // Firestore /system_config/main document | null
    loading:       true,
  },

  tasks: {
    personal: new Map(), // Map<taskId, Task>
    byGroup:  new Map(), // Map<groupId, Map<taskId, Task>>
    loading:  true,
    error:    null,
  },

  groups: {
    list:    new Map(), // Map<groupId, Group>
    members: new Map(), // Map<groupId, Map<uid, Member>>
    loading: true,
    error:   null,
  },

  sync: {
    online:           true,
    fromCache:        false,
    hasPendingWrites: false,
  },
}
