import type { PaginatedResponse } from '@/types/clients';
import type {
  Assignment,
  AssignmentSummary,
  CreateAssignmentDto,
  ReviewSubmissionDto,
  SubmitAssignmentDto,
} from '@/types/assignments';
import apiClient from '.';

// ---- Admin endpoints ----

export const getAssignments = async (params?: Record<string, any>): Promise<PaginatedResponse<Assignment>> => {
  const response = await apiClient.get('/assignments', { params });
  return response.data?.data;
};

export const getAssignment = async (id: string): Promise<Assignment> => {
  const response = await apiClient.get(`/assignments/${id}`);
  return response.data.data;
};

export const createAssignment = async (data: CreateAssignmentDto): Promise<Assignment> => {
  const response = await apiClient.post('/assignments', data);
  return response.data.data;
};

export const updateAssignment = async (id: string, data: Partial<CreateAssignmentDto> & { status?: string }): Promise<Assignment> => {
  const response = await apiClient.patch(`/assignments/${id}`, data);
  return response.data.data;
};

export const deleteAssignment = async (id: string): Promise<void> => {
  await apiClient.delete(`/assignments/${id}`);
};

export const getAssignmentsByEnrollment = async (enrollmentId: string): Promise<Assignment[]> => {
  const response = await apiClient.get(`/assignments/enrollment/${enrollmentId}`);
  return response.data?.data || [];
};

export const getAssignmentSummary = async (enrollmentId: string): Promise<AssignmentSummary> => {
  const response = await apiClient.get(`/assignments/enrollment/${enrollmentId}/summary`);
  return response.data.data;
};

export const reviewSubmission = async (submissionId: string, data: ReviewSubmissionDto): Promise<void> => {
  await apiClient.patch(`/assignments/submissions/${submissionId}/review`, data);
};

// ---- Portal endpoints ----

export const getMyAssignments = async (): Promise<Assignment[]> => {
  const response = await apiClient.get('/portal/assignments');
  return response.data?.data || [];
};

export const getMyAssignment = async (id: string): Promise<Assignment> => {
  const response = await apiClient.get(`/portal/assignments/${id}`);
  return response.data.data;
};

export const submitAssignment = async (assignmentId: string, data: SubmitAssignmentDto): Promise<void> => {
  await apiClient.post(`/portal/assignments/${assignmentId}/submit`, data);
};

const assignmentsApi = {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsByEnrollment,
  getAssignmentSummary,
  reviewSubmission,
  getMyAssignments,
  getMyAssignment,
  submitAssignment,
};

export default assignmentsApi;
