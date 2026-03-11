// ============ Client Enums ============
export enum ClientType {
  STUDENT = 'student',
  PROFESSIONAL = 'professional',
  CORPORATE_CONTACT = 'corporate_contact',
  NGO_LEADER = 'ngo_leader',
  FAITH_LEADER = 'faith_leader',
  PARENT = 'parent',
  EDUCATOR = 'educator',
  SPEAKER_TRAINER = 'speaker_trainer',
  AUTHOR = 'author',
}

export const ClientTypeLabels: Record<ClientType, string> = {
  [ClientType.STUDENT]: 'Student',
  [ClientType.PROFESSIONAL]: 'Professional',
  [ClientType.CORPORATE_CONTACT]: 'Corporate Contact',
  [ClientType.NGO_LEADER]: 'NGO Leader',
  [ClientType.FAITH_LEADER]: 'Faith Leader',
  [ClientType.PARENT]: 'Parent',
  [ClientType.EDUCATOR]: 'Educator',
  [ClientType.SPEAKER_TRAINER]: 'Speaker / Trainer',
  [ClientType.AUTHOR]: 'Author',
};

export enum ClientSegment {
  YOUNG_AFRICAN = 'young_african',
  WORKING_PRO = 'working_pro',
  ASPIRING_LEADER = 'aspiring_leader',
  CONTENT_CREATOR = 'content_creator',
}

export const ClientSegmentLabels: Record<ClientSegment, string> = {
  [ClientSegment.YOUNG_AFRICAN]: 'Young African',
  [ClientSegment.WORKING_PRO]: 'Working Professional',
  [ClientSegment.ASPIRING_LEADER]: 'Aspiring Leader',
  [ClientSegment.CONTENT_CREATOR]: 'Content Creator',
};

export enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  WHATSAPP = 'whatsapp',
  SOCIAL_MEDIA = 'social_media',
  EVENT = 'event',
  PARTNER = 'partner',
  COLD_OUTREACH = 'cold_outreach',
  WALK_IN = 'walk_in',
}

export const LeadSourceLabels: Record<LeadSource, string> = {
  [LeadSource.WEBSITE]: 'Website',
  [LeadSource.REFERRAL]: 'Referral',
  [LeadSource.WHATSAPP]: 'WhatsApp',
  [LeadSource.SOCIAL_MEDIA]: 'Social Media',
  [LeadSource.EVENT]: 'Event',
  [LeadSource.PARTNER]: 'Partner',
  [LeadSource.COLD_OUTREACH]: 'Cold Outreach',
  [LeadSource.WALK_IN]: 'Walk-in',
};

export enum ClientStatus {
  LEAD = 'lead',
  PROSPECT = 'prospect',
  ENROLLED = 'enrolled',
  COMPLETED = 'completed',
  ALUMNI = 'alumni',
  INACTIVE = 'inactive',
  BLACKLISTED = 'blacklisted',
}

export const ClientStatusLabels: Record<ClientStatus, string> = {
  [ClientStatus.LEAD]: 'Lead',
  [ClientStatus.PROSPECT]: 'Prospect',
  [ClientStatus.ENROLLED]: 'Enrolled',
  [ClientStatus.COMPLETED]: 'Completed',
  [ClientStatus.ALUMNI]: 'Alumni',
  [ClientStatus.INACTIVE]: 'Inactive',
  [ClientStatus.BLACKLISTED]: 'Blacklisted',
};

export const ClientStatusColors: Record<ClientStatus, string> = {
  [ClientStatus.LEAD]: 'default',
  [ClientStatus.PROSPECT]: 'processing',
  [ClientStatus.ENROLLED]: 'blue',
  [ClientStatus.COMPLETED]: 'success',
  [ClientStatus.ALUMNI]: 'purple',
  [ClientStatus.INACTIVE]: 'warning',
  [ClientStatus.BLACKLISTED]: 'error',
};

// ============ Program Enums ============
export enum ProgramType {
  FLAGSHIP = 'flagship',
  CUSTOMIZED = 'customized',
  CORPORATE = 'corporate',
  BOOTCAMP = 'bootcamp',
  WORKSHOP = 'workshop',
}

export const ProgramTypeLabels: Record<ProgramType, string> = {
  [ProgramType.FLAGSHIP]: 'Flagship',
  [ProgramType.CUSTOMIZED]: 'Customized',
  [ProgramType.CORPORATE]: 'Corporate',
  [ProgramType.BOOTCAMP]: 'Bootcamp',
  [ProgramType.WORKSHOP]: 'Workshop',
};

// ============ Cohort Enums ============
export enum DeliveryMode {
  IN_PERSON = 'in_person',
  VIRTUAL = 'virtual',
  HYBRID = 'hybrid',
}

export const DeliveryModeLabels: Record<DeliveryMode, string> = {
  [DeliveryMode.IN_PERSON]: 'In-Person',
  [DeliveryMode.VIRTUAL]: 'Virtual',
  [DeliveryMode.HYBRID]: 'Hybrid',
};

export enum CohortStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  FULL = 'full',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export const CohortStatusLabels: Record<CohortStatus, string> = {
  [CohortStatus.DRAFT]: 'Draft',
  [CohortStatus.OPEN]: 'Open',
  [CohortStatus.FULL]: 'Full',
  [CohortStatus.IN_PROGRESS]: 'In Progress',
  [CohortStatus.COMPLETED]: 'Completed',
  [CohortStatus.CANCELLED]: 'Cancelled',
};

export const CohortStatusColors: Record<CohortStatus, string> = {
  [CohortStatus.DRAFT]: 'default',
  [CohortStatus.OPEN]: 'success',
  [CohortStatus.FULL]: 'warning',
  [CohortStatus.IN_PROGRESS]: 'processing',
  [CohortStatus.COMPLETED]: 'blue',
  [CohortStatus.CANCELLED]: 'error',
};

// ============ Session Enums ============
export enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
}

export const SessionStatusLabels: Record<SessionStatus, string> = {
  [SessionStatus.SCHEDULED]: 'Scheduled',
  [SessionStatus.IN_PROGRESS]: 'In Progress',
  [SessionStatus.COMPLETED]: 'Completed',
  [SessionStatus.CANCELLED]: 'Cancelled',
  [SessionStatus.RESCHEDULED]: 'Rescheduled',
};

// ============ Attendance Enums ============
export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  EXCUSED = 'excused',
  LATE = 'late',
}

export const AttendanceStatusLabels: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'Present',
  [AttendanceStatus.ABSENT]: 'Absent',
  [AttendanceStatus.EXCUSED]: 'Excused',
  [AttendanceStatus.LATE]: 'Late',
};

// ============ Enrollment Enums ============
export enum EnrollmentStatus {
  WAITLISTED = 'waitlisted',
  APPLIED = 'applied',
  APPROVED = 'approved',
  INVOICE_SENT = 'invoice_sent',
  CONFIRMED = 'confirmed',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
  DEFERRED = 'deferred',
}

export const EnrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.WAITLISTED]: 'Waitlisted',
  [EnrollmentStatus.APPLIED]: 'Applied',
  [EnrollmentStatus.APPROVED]: 'Approved',
  [EnrollmentStatus.INVOICE_SENT]: 'Invoice Sent',
  [EnrollmentStatus.CONFIRMED]: 'Confirmed',
  [EnrollmentStatus.ACTIVE]: 'Active',
  [EnrollmentStatus.COMPLETED]: 'Completed',
  [EnrollmentStatus.DROPPED]: 'Dropped',
  [EnrollmentStatus.DEFERRED]: 'Deferred',
};

export const EnrollmentStatusColors: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.WAITLISTED]: 'default',
  [EnrollmentStatus.APPLIED]: 'processing',
  [EnrollmentStatus.APPROVED]: 'blue',
  [EnrollmentStatus.INVOICE_SENT]: 'cyan',
  [EnrollmentStatus.CONFIRMED]: 'geekblue',
  [EnrollmentStatus.ACTIVE]: 'success',
  [EnrollmentStatus.COMPLETED]: 'purple',
  [EnrollmentStatus.DROPPED]: 'error',
  [EnrollmentStatus.DEFERRED]: 'warning',
};

// ============ Progress Enums ============
export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export const ProgressStatusLabels: Record<ProgressStatus, string> = {
  [ProgressStatus.NOT_STARTED]: 'Not Started',
  [ProgressStatus.IN_PROGRESS]: 'In Progress',
  [ProgressStatus.COMPLETED]: 'Completed',
  [ProgressStatus.FAILED]: 'Failed',
};

// ============ Invoice Enums ============
export enum InvoiceType {
  ENROLLMENT = 'enrollment',
  CORPORATE = 'corporate',
  INSTALLMENT = 'installment',
  CUSTOM = 'custom',
  CREDIT_NOTE = 'credit_note',
}

export const InvoiceTypeLabels: Record<InvoiceType, string> = {
  [InvoiceType.ENROLLMENT]: 'Enrollment',
  [InvoiceType.CORPORATE]: 'Corporate',
  [InvoiceType.INSTALLMENT]: 'Installment',
  [InvoiceType.CUSTOM]: 'Custom',
  [InvoiceType.CREDIT_NOTE]: 'Credit Note',
};

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  VOID = 'void',
  REFUNDED = 'refunded',
}

export const InvoiceStatusLabels: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'Draft',
  [InvoiceStatus.SENT]: 'Sent',
  [InvoiceStatus.PARTIAL]: 'Partial',
  [InvoiceStatus.PAID]: 'Paid',
  [InvoiceStatus.OVERDUE]: 'Overdue',
  [InvoiceStatus.VOID]: 'Void',
  [InvoiceStatus.REFUNDED]: 'Refunded',
};

export const InvoiceStatusColors: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'default',
  [InvoiceStatus.SENT]: 'processing',
  [InvoiceStatus.PARTIAL]: 'warning',
  [InvoiceStatus.PAID]: 'success',
  [InvoiceStatus.OVERDUE]: 'error',
  [InvoiceStatus.VOID]: 'default',
  [InvoiceStatus.REFUNDED]: 'purple',
};

// ============ Payment Enums ============
export enum PaymentMethod {
  MPESA = 'mpesa',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  CASH = 'cash',
  WAIVER = 'waiver',
}

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.MPESA]: 'M-Pesa',
  [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
  [PaymentMethod.CARD]: 'Card',
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.WAIVER]: 'Waiver',
};

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pending',
  [PaymentStatus.CONFIRMED]: 'Confirmed',
  [PaymentStatus.FAILED]: 'Failed',
  [PaymentStatus.REVERSED]: 'Reversed',
};

// ============ Communication Enums ============
export enum CommChannel {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  IN_APP = 'in_app',
}

export const CommChannelLabels: Record<CommChannel, string> = {
  [CommChannel.EMAIL]: 'Email',
  [CommChannel.SMS]: 'SMS',
  [CommChannel.WHATSAPP]: 'WhatsApp',
  [CommChannel.IN_APP]: 'In-App',
};

export enum CommStatus {
  DRAFT = 'draft',
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  BOUNCED = 'bounced',
}

export const CommStatusLabels: Record<CommStatus, string> = {
  [CommStatus.DRAFT]: 'Draft',
  [CommStatus.QUEUED]: 'Queued',
  [CommStatus.SENT]: 'Sent',
  [CommStatus.DELIVERED]: 'Delivered',
  [CommStatus.READ]: 'Read',
  [CommStatus.FAILED]: 'Failed',
  [CommStatus.BOUNCED]: 'Bounced',
};

export const CommStatusColors: Record<CommStatus, string> = {
  [CommStatus.DRAFT]: 'default',
  [CommStatus.QUEUED]: 'processing',
  [CommStatus.SENT]: 'blue',
  [CommStatus.DELIVERED]: 'success',
  [CommStatus.READ]: 'purple',
  [CommStatus.FAILED]: 'error',
  [CommStatus.BOUNCED]: 'warning',
};

export const CommChannelColors: Record<CommChannel, string> = {
  [CommChannel.EMAIL]: 'blue',
  [CommChannel.SMS]: 'green',
  [CommChannel.WHATSAPP]: 'cyan',
  [CommChannel.IN_APP]: 'purple',
};

export enum CommDirection {
  OUTBOUND = 'outbound',
  INBOUND = 'inbound',
}

// ============ Interaction Enums ============
export enum InteractionType {
  CALL = 'call',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  MEETING = 'meeting',
  NOTE = 'note',
}

export const InteractionTypeLabels: Record<InteractionType, string> = {
  [InteractionType.CALL]: 'Call',
  [InteractionType.EMAIL]: 'Email',
  [InteractionType.WHATSAPP]: 'WhatsApp',
  [InteractionType.SMS]: 'SMS',
  [InteractionType.MEETING]: 'Meeting',
  [InteractionType.NOTE]: 'Note',
};

export enum InteractionDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  INTERNAL = 'internal',
}

export const InteractionDirectionLabels: Record<InteractionDirection, string> = {
  [InteractionDirection.INBOUND]: 'Inbound',
  [InteractionDirection.OUTBOUND]: 'Outbound',
  [InteractionDirection.INTERNAL]: 'Internal',
};

// ============ Employee Enums ============
export enum EmployeeRole {
  DIRECTOR = 'director',
  ADMIN = 'admin',
  TRAINER = 'trainer',
  FINANCE = 'finance',
  SALES = 'sales',
  OPERATIONS = 'operations',
}

export const EmployeeRoleLabels: Record<EmployeeRole, string> = {
  [EmployeeRole.DIRECTOR]: 'Director',
  [EmployeeRole.ADMIN]: 'Admin',
  [EmployeeRole.TRAINER]: 'Trainer',
  [EmployeeRole.FINANCE]: 'Finance',
  [EmployeeRole.SALES]: 'Sales',
  [EmployeeRole.OPERATIONS]: 'Operations',
};

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
}

export const EmployeeStatusLabels: Record<EmployeeStatus, string> = {
  [EmployeeStatus.ACTIVE]: 'Active',
  [EmployeeStatus.INACTIVE]: 'Inactive',
  [EmployeeStatus.ON_LEAVE]: 'On Leave',
};

export const EmployeeStatusColors: Record<EmployeeStatus, string> = {
  [EmployeeStatus.ACTIVE]: 'success',
  [EmployeeStatus.INACTIVE]: 'default',
  [EmployeeStatus.ON_LEAVE]: 'warning',
};

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  FREELANCE = 'freelance',
  VOLUNTEER = 'volunteer',
}

export const EmploymentTypeLabels: Record<EmploymentType, string> = {
  [EmploymentType.FULL_TIME]: 'Full Time',
  [EmploymentType.PART_TIME]: 'Part Time',
  [EmploymentType.FREELANCE]: 'Freelance',
  [EmploymentType.VOLUNTEER]: 'Volunteer',
};

export enum BlockType {
  LEAVE = 'leave',
  UNAVAILABLE = 'unavailable',
  TRAINING = 'training',
}

export const BlockTypeLabels: Record<BlockType, string> = {
  [BlockType.LEAVE]: 'Leave',
  [BlockType.UNAVAILABLE]: 'Unavailable',
  [BlockType.TRAINING]: 'Training',
};

// ============ Assignment Enums ============
export enum AssignmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export const AssignmentStatusLabels: Record<AssignmentStatus, string> = {
  [AssignmentStatus.DRAFT]: 'Draft',
  [AssignmentStatus.PUBLISHED]: 'Published',
  [AssignmentStatus.ARCHIVED]: 'Archived',
};

export const AssignmentStatusColors: Record<AssignmentStatus, string> = {
  [AssignmentStatus.DRAFT]: 'default',
  [AssignmentStatus.PUBLISHED]: 'success',
  [AssignmentStatus.ARCHIVED]: 'warning',
};

// ============ Submission Enums ============
export enum SubmissionStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  REVISION_REQUESTED = 'revision_requested',
}

export const SubmissionStatusLabels: Record<SubmissionStatus, string> = {
  [SubmissionStatus.PENDING]: 'Pending',
  [SubmissionStatus.SUBMITTED]: 'Submitted',
  [SubmissionStatus.REVIEWED]: 'Reviewed',
  [SubmissionStatus.REVISION_REQUESTED]: 'Revision Requested',
};

export const SubmissionStatusColors: Record<SubmissionStatus, string> = {
  [SubmissionStatus.PENDING]: 'default',
  [SubmissionStatus.SUBMITTED]: 'processing',
  [SubmissionStatus.REVIEWED]: 'success',
  [SubmissionStatus.REVISION_REQUESTED]: 'warning',
};

// ============ Notification Enums ============
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

export const NotificationTypeLabels: Record<NotificationType, string> = {
  [NotificationType.ASSIGNMENT_POSTED]: 'Assignment Posted',
  [NotificationType.ASSIGNMENT_DUE_SOON]: 'Assignment Due Soon',
  [NotificationType.ASSIGNMENT_OVERDUE]: 'Assignment Overdue',
  [NotificationType.ASSIGNMENT_SUBMITTED]: 'Assignment Submitted',
  [NotificationType.ASSIGNMENT_REVIEWED]: 'Assignment Reviewed',
  [NotificationType.ASSIGNMENT_REVISION_REQUESTED]: 'Revision Requested',
  [NotificationType.SESSION_REMINDER_24H]: 'Session Reminder (24h)',
  [NotificationType.SESSION_REMINDER_1H]: 'Session Reminder (1h)',
  [NotificationType.SESSION_CANCELLED]: 'Session Cancelled',
  [NotificationType.SESSION_RESCHEDULED]: 'Session Rescheduled',
  [NotificationType.ENROLLMENT_APPROVED]: 'Enrollment Approved',
  [NotificationType.ENROLLMENT_CONFIRMED]: 'Enrollment Confirmed',
  [NotificationType.MODULE_PROGRESS_UPDATED]: 'Progress Updated',
  [NotificationType.PAYMENT_RECEIVED]: 'Payment Received',
  [NotificationType.GENERAL]: 'General',
};
