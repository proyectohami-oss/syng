/**
 * NOTIFICATION EVENTS CATALOG
 * ───────────────────────────
 * This file defines every event in the system that CAN trigger a push
 * notification. It serves as the contract between:
 *
 *   - The client (which fires these events through normal Firestore writes)
 *   - Cloud Functions (which listen to Firestore triggers and send FCM messages)
 *
 * IMPORTANT: The client does NOT send notifications directly.
 * Notifications are a side effect of normal Firestore writes.
 * Cloud Functions observe those writes and decide who to notify.
 *
 * HOW CLOUD FUNCTIONS WILL USE THIS:
 * ────────────────────────────────────
 *
 *   GROUP_TASK_CREATED  → onCreate('tasks/{taskId}')
 *                           when data.type === 'group'
 *                           Recipients: all group members except creator
 *
 *   TASK_ASSIGNED       → onUpdate('tasks/{taskId}')
 *                           when after.assignedTo !== before.assignedTo
 *                           Recipient: assignedTo user
 *
 *   TASK_COMPLETED      → onUpdate('tasks/{taskId}')
 *                           when after.status === 'completed' && type === 'group'
 *                           Recipient: group admin (optional feature)
 *
 *   INVITATION_RECEIVED → onCreate('invitations/{id}')
 *                           Recipient: look up /users by invitedEmail
 *                           (graceful skip if user hasn't signed up yet)
 *
 *   MEMBER_REMOVED      → onDelete('groups/{gid}/members/{uid}')
 *                           Recipient: the removed member
 *
 *   ADMIN_TRANSFERRED   → onUpdate('groups/{groupId}')
 *                           when after.adminId !== before.adminId
 *                           Recipient: new admin
 *
 * FCM MESSAGE SHAPE (for future frontend notification center):
 *   {
 *     notification: { title, body },
 *     data: {
 *       event:   <one of NOTIFICATION_EVENTS values>
 *       groupId: string | ''
 *       taskId:  string | ''
 *     },
 *     webpush: { fcmOptions: { link: '/pizarron/${groupId}' } }
 *   }
 *
 * FUTURE USER PREFERENCE SCHEMA (add to /users/{uid}):
 *   notificationPrefs: {
 *     groupTaskCreated:     boolean  (default: true)
 *     taskAssigned:         boolean  (default: true)
 *     taskCompletedInGroup: boolean  (default: false)
 *     invitationReceived:   boolean  (default: true)
 *     memberRemoved:        boolean  (default: true)
 *   }
 */

export const NOTIFICATION_EVENTS = {
  GROUP_TASK_CREATED:      'group_task_created',
  TASK_ASSIGNED:           'task_assigned',
  TASK_COMPLETED_IN_GROUP: 'task_completed_in_group',
  INVITATION_RECEIVED:     'invitation_received',
  MEMBER_REMOVED:          'member_removed',
  ADMIN_TRANSFERRED:       'admin_transferred',
}
