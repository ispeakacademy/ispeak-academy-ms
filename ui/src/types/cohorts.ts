import { AttendanceStatus, CohortStatus, DeliveryMode, SessionStatus } from './enums';

export interface Cohort {
  cohortId: string;
  programId: string;
  name: string;
  batchCode: string;
  deliveryMode: DeliveryMode;
  venue?: string | null;
  meetingLink?: string | null;
  meetingPassword?: string | null;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  currentEnrollment: number;
  status: CohortStatus;
  leadTrainerId?: string | null;
  trainerIds: string[];
  notes?: string | null;
  program?: { programId: string; name: string; code: string };
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  sessionId: string;
  cohortId: string;
  moduleId?: string | null;
  title: string;
  description?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  mode: DeliveryMode;
  venue?: string | null;
  meetingLink?: string | null;
  meetingPassword?: string | null;
  recordingUrl?: string | null;
  materialsUrl?: string | null;
  status: SessionStatus;
  trainerId?: string | null;
  cancelReason?: string | null;
  rescheduleOf?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  attendanceId: string;
  sessionId: string;
  enrollmentId: string;
  clientId: string;
  status: AttendanceStatus;
  joinedAt?: string | null;
  leftAt?: string | null;
  minutesAttended?: number | null;
  markedByEmployeeId?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface CreateCohortDto {
  programId: string;
  name: string;
  batchCode: string;
  deliveryMode: DeliveryMode;
  venue?: string;
  meetingLink?: string;
  meetingPassword?: string;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  status?: CohortStatus;
  leadTrainerId?: string;
  trainerIds?: string[];
  notes?: string;
}

export interface UpdateCohortDto extends Partial<CreateCohortDto> {}

export interface CreateSessionDto {
  moduleId?: string;
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes: number;
  mode: DeliveryMode;
  venue?: string;
  meetingLink?: string;
  meetingPassword?: string;
  trainerId?: string;
}

export interface QueryCohortsDto {
  page?: number;
  limit?: number;
  programId?: string;
  status?: CohortStatus;
}
