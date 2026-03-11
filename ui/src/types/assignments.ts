export enum AssignmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum SubmissionStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  REVISION_REQUESTED = 'revision_requested',
}

export interface AssignmentSubmission {
  submissionId: string;
  assignmentId: string;
  clientId: string;
  notes?: string | null;
  attachmentUrls: string[];
  status: SubmissionStatus;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedByEmployeeId?: string | null;
  reviewerFeedback?: string | null;
  score?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  assignmentId: string;
  enrollmentId: string;
  cohortId?: string | null;
  moduleId?: string | null;
  title: string;
  description?: string | null;
  links: string[];
  attachmentUrls: string[];
  dueDate?: string | null;
  status: AssignmentStatus;
  createdByEmployeeId: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  submissions?: AssignmentSubmission[];
  enrollment?: {
    enrollmentId: string;
    clientId: string;
    client?: { clientId: string; firstName: string; lastName: string; email?: string };
    program?: { programId: string; name: string; code: string };
  };
}

export interface AssignmentSummary {
  total: number;
  pending: number;
  submitted: number;
  reviewed: number;
  revisionRequested: number;
}

export interface CreateAssignmentDto {
  enrollmentId?: string;
  cohortId?: string;
  moduleId?: string;
  title: string;
  description?: string;
  links?: string[];
  attachmentUrls?: string[];
  dueDate?: string;
}

export interface SubmitAssignmentDto {
  notes?: string;
  attachmentUrls?: string[];
}

export interface ReviewSubmissionDto {
  status: SubmissionStatus;
  feedback?: string;
  score?: number;
}
