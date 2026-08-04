// Shared source of truth for both NotificationBell.tsx and the toast/sound
// hook (useNotificationToastsAndSound) — hoisted out of NotificationBell so
// neither copy can drift.
export const notificationIcons: Record<string, string> = {
  booking: '📅',
  checkin: '🔑',
  checkout: '👋',
  cleaning_task: '🧹',
  cleaning_completed: '✨',
  payment: '💳',
  order: '🍽️',
  order_ready: '✅',
  request: '🔧',
  request_completed: '🎉',
  shift: '⏰',
  general: '📢',
  // Added for the production notification upgrade
  booking_cancelled: '❌',
  room_status_changed: '🚪',
  order_cancelled: '🚫',
  staff_activity: '👥',
  escalation: '⚠️',
  user_management: '🧑‍💼',
  branch_event: '🏢',
  // Maintenance & Complaints notifications
  maintenance_request_created: '🔧',
  complaint_submitted: '📣',
  maintenance_status_changed: '🔄',
  maintenance_request_reopened: '🔁',
  maintenance_request_resolved: '✅',
  maintenance_priority_changed: '⚠️',
  maintenance_request_updated: '✏️',
};

export const priorityColors: Record<string, string> = {
  low: 'text-blue-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};
