export enum AuditAction {
  // User
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_SUSPENDED = 'user_suspended',
  USER_REACTIVATED = 'user_reactivated',
  USER_ROLE_CHANGED = 'user_role_changed',
  // Client
  CLIENT_CREATED = 'client_created',
  CLIENT_UPDATED = 'client_updated',
  CLIENT_DELETED = 'client_deleted',
  CLIENT_STATUS_CHANGED = 'client_status_changed',
  CLIENT_MERGED = 'client_merged',
  CLIENT_PORTAL_INVITE_SENT = 'client_portal_invite_sent',
  // Organisation
  ORGANISATION_CREATED = 'organisation_created',
  ORGANISATION_UPDATED = 'organisation_updated',
  // Program
  PROGRAM_CREATED = 'program_created',
  PROGRAM_UPDATED = 'program_updated',
  PROGRAM_DELETED = 'program_deleted',
  // Cohort
  COHORT_CREATED = 'cohort_created',
  COHORT_UPDATED = 'cohort_updated',
  COHORT_STATUS_CHANGED = 'cohort_status_changed',
  // Enrollment
  ENROLLMENT_CREATED = 'enrollment_created',
  ENROLLMENT_APPROVED = 'enrollment_approved',
  ENROLLMENT_REJECTED = 'enrollment_rejected',
  ENROLLMENT_CONFIRMED = 'enrollment_confirmed',
  ENROLLMENT_DROPPED = 'enrollment_dropped',
  ENROLLMENT_DEFERRED = 'enrollment_deferred',
  ENROLLMENT_COMPLETED = 'enrollment_completed',
  // Invoice
  INVOICE_CREATED = 'invoice_created',
  INVOICE_SENT = 'invoice_sent',
  INVOICE_VOIDED = 'invoice_voided',
  INVOICE_UPDATED = 'invoice_updated',
  // Payment
  PAYMENT_RECORDED = 'payment_recorded',
  PAYMENT_REVERSED = 'payment_reversed',
  STK_PUSH_INITIATED = 'stk_push_initiated',
  STK_PUSH_CALLBACK_SUCCESS = 'stk_push_callback_success',
  STK_PUSH_CALLBACK_FAILED = 'stk_push_callback_failed',
  C2B_PAYMENT_RECEIVED = 'c2b_payment_received',
  C2B_PAYMENT_UNMATCHED = 'c2b_payment_unmatched',
  C2B_URLS_REGISTERED = 'c2b_urls_registered',
  // Communication
  COMMUNICATION_SENT = 'communication_sent',
  COMMUNICATION_RECEIVED = 'communication_received',
  BROADCAST_SENT = 'broadcast_sent',
  TEMPLATE_CREATED = 'template_created',
  TEMPLATE_UPDATED = 'template_updated',
  // Settings
  SETTINGS_UPDATED = 'settings_updated',
  // Roles
  ROLE_CREATED = 'role_created',
  ROLE_UPDATED = 'role_updated',
  ROLE_DELETED = 'role_deleted',
  // Employee
  EMPLOYEE_CREATED = 'employee_created',
  EMPLOYEE_UPDATED = 'employee_updated',
  EMPLOYEE_DELETED = 'employee_deleted',
  EMPLOYEE_DEACTIVATED = 'employee_deactivated',
  // Assignment
  ASSIGNMENT_CREATED = 'assignment_created',
  ASSIGNMENT_UPDATED = 'assignment_updated',
  ASSIGNMENT_DELETED = 'assignment_deleted',
  ASSIGNMENT_SUBMITTED = 'assignment_submitted',
  ASSIGNMENT_REVIEWED = 'assignment_reviewed',
  // Generic
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
}
