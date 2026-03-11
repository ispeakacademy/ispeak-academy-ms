export enum NotificationType {
  ASSIGNMENT_POSTED = 'assignment_posted',
  ASSIGNMENT_DUE_SOON = 'assignment_due_soon',
  ASSIGNMENT_OVERDUE = 'assignment_overdue',
  ASSIGNMENT_SUBMITTED = 'assignment_submitted',
  ASSIGNMENT_REVIEWED = 'assignment_reviewed',
  ASSIGNMENT_REVISION_REQUESTED = 'assignment_revision_requested',
  SESSION_REMINDER_24H = 'session_reminder_24h',
  SESSION_REMINDER_1H = 'session_reminder_1h',
  SESSION_CANCELLED = 'session_cancelled',
  SESSION_RESCHEDULED = 'session_rescheduled',
  ENROLLMENT_APPROVED = 'enrollment_approved',
  ENROLLMENT_CONFIRMED = 'enrollment_confirmed',
  MODULE_PROGRESS_UPDATED = 'module_progress_updated',
  PAYMENT_RECEIVED = 'payment_received',
  GENERAL = 'general',
}

export interface Notification {
  notificationId: string;
  recipientUserId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string | null;
  link?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}
