import { EnrollmentStatus, ProgressStatus } from './enums';

export interface Enrollment {
  enrollmentId: string;
  clientId: string;
  cohortId?: string | null;
  programId: string;
  status: EnrollmentStatus;
  applicationDate?: string | null;
  approvalDate?: string | null;
  approvedByEmployeeId?: string | null;
  dropDate?: string | null;
  dropReason?: string | null;
  agreedAmount: number;
  agreedCurrency: string;
  discountCode?: string | null;
  discountPercent: number;
  scholarshipId?: string | null;
  progressPercent: number;
  completionDate?: string | null;
  certificateIssuedAt?: string | null;
  certificateUrl?: string | null;
  selectedModuleIds: string[];
  enrolledByEmployeeId?: string | null;
  enrolledViaPortal?: boolean;
  createdAt: string;
  updatedAt: string;
  client?: { clientId: string; firstName: string; lastName: string; email?: string };
  cohort?: { cohortId: string; name: string; batchCode: string };
  program?: { programId: string; name: string; code: string };
}

export interface ModuleProgress {
  moduleProgressId: string | null;
  enrollmentId: string;
  moduleId: string;
  status: ProgressStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  score?: number | null;
  trainerFeedback?: string | null;
  module?: {
    moduleId: string;
    title: string;
    description?: string | null;
    orderIndex: number;
    estimatedHours?: number | null;
    isOptional: boolean;
    learningObjectives?: string[];
  } | null;
}

export interface Waitlist {
  waitlistId: string;
  clientId: string;
  cohortId: string;
  position: number;
  notifiedAt?: string | null;
  hasResponded: boolean;
  responseDeadline?: string | null;
  convertedToEnrollmentId?: string | null;
  addedAt: string;
}

export interface CreateEnrollmentDto {
  clientId: string;
  cohortId?: string;
  programId: string;
  agreedAmount: number;
  agreedCurrency: string;
  discountCode?: string;
  discountPercent?: number;
  selectedModuleIds?: string[];
}

export interface UpdateEnrollmentDto {
  cohortId?: string;
  agreedAmount?: number;
  agreedCurrency?: string;
  discountCode?: string;
  discountPercent?: number;
  scholarshipId?: string;
}

export interface QueryEnrollmentsDto {
  page?: number;
  limit?: number;
  status?: EnrollmentStatus;
  cohortId?: string;
  programId?: string;
  clientId?: string;
}

export interface AssignmentSummary {
  total: number;
  pending: number;
  submitted: number;
  reviewed: number;
  revisionRequested: number;
}

export interface AttendanceSummary {
  totalSessions: number;
  attended: number;
  absent: number;
  excused: number;
  late: number;
  attendanceRate: number;
}

export interface EnrollmentProgress {
  enrollmentId: string;
  progressPercent: number;
  modules: ModuleProgress[];
  assignmentSummary?: AssignmentSummary;
  attendanceSummary?: AttendanceSummary;
}
