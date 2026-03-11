import type { PaginatedResponse } from '@/types/clients';
import type { CreateEnrollmentDto, Enrollment, EnrollmentProgress, ModuleProgress, QueryEnrollmentsDto, UpdateEnrollmentDto, Waitlist } from '@/types/enrollments';
import apiClient from '.';

export const getEnrollments = async (query?: QueryEnrollmentsDto): Promise<PaginatedResponse<Enrollment>> => {
  const response = await apiClient.get('/enrollments', { params: query });
  return response.data?.data;
};

export const getEnrollment = async (id: string): Promise<Enrollment> => {
  const response = await apiClient.get(`/enrollments/${id}`);
  return response.data.data;
};

export const createEnrollment = async (data: CreateEnrollmentDto): Promise<Enrollment> => {
  const response = await apiClient.post('/enrollments', data);
  return response.data.data;
};

export const updateEnrollment = async (id: string, data: UpdateEnrollmentDto): Promise<Enrollment> => {
  const response = await apiClient.patch(`/enrollments/${id}`, data);
  return response.data.data;
};

export const approveEnrollment = async (id: string): Promise<Enrollment> => {
  const response = await apiClient.patch(`/enrollments/${id}/approve`);
  return response.data.data;
};

export const rejectEnrollment = async (id: string, reason: string): Promise<Enrollment> => {
  const response = await apiClient.patch(`/enrollments/${id}/reject`, { reason });
  return response.data.data;
};

export const confirmEnrollment = async (id: string): Promise<Enrollment> => {
  const response = await apiClient.patch(`/enrollments/${id}/confirm`);
  return response.data.data;
};

export const dropEnrollment = async (id: string, reason: string): Promise<Enrollment> => {
  const response = await apiClient.patch(`/enrollments/${id}/drop`, { reason });
  return response.data.data;
};

export const deferEnrollment = async (id: string, newCohortId: string): Promise<Enrollment> => {
  const response = await apiClient.patch(`/enrollments/${id}/defer`, { newCohortId });
  return response.data.data;
};

export const completeEnrollment = async (id: string): Promise<Enrollment> => {
  const response = await apiClient.post(`/enrollments/${id}/complete`);
  return response.data.data;
};

export const getEnrollmentProgress = async (id: string): Promise<EnrollmentProgress> => {
  const response = await apiClient.get(`/enrollments/${id}/progress`);
  return response.data.data;
};

export const updateModuleProgress = async (enrollmentId: string, moduleId: string, data: Partial<ModuleProgress>): Promise<ModuleProgress> => {
  const response = await apiClient.patch(`/enrollments/${enrollmentId}/progress/${moduleId}`, data);
  return response.data.data;
};

export const addToWaitlist = async (clientId: string, cohortId: string): Promise<Waitlist> => {
  const response = await apiClient.post('/waitlist', { clientId, cohortId });
  return response.data.data;
};

export const getCohortWaitlist = async (cohortId: string): Promise<Waitlist[]> => {
  const response = await apiClient.get(`/waitlist/cohorts/${cohortId}`);
  return response.data.data;
};

const enrollmentsApi = {
  getEnrollments,
  getEnrollment,
  createEnrollment,
  updateEnrollment,
  approveEnrollment,
  rejectEnrollment,
  confirmEnrollment,
  dropEnrollment,
  deferEnrollment,
  completeEnrollment,
  getEnrollmentProgress,
  updateModuleProgress,
  addToWaitlist,
  getCohortWaitlist,
};

export default enrollmentsApi;
