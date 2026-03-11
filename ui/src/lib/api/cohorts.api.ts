import type { PaginatedResponse } from '@/types/clients';
import type { Attendance, Cohort, CreateCohortDto, CreateSessionDto, QueryCohortsDto, Session, UpdateCohortDto } from '@/types/cohorts';
import apiClient from '.';

export const getCohorts = async (query?: QueryCohortsDto): Promise<PaginatedResponse<Cohort>> => {
  const response = await apiClient.get('/cohorts', { params: query });
  return response.data?.data;
};

export const getCohort = async (id: string): Promise<Cohort> => {
  const response = await apiClient.get(`/cohorts/${id}`);
  return response.data.data;
};

export const createCohort = async (data: CreateCohortDto): Promise<Cohort> => {
  const response = await apiClient.post('/cohorts', data);
  return response.data.data;
};

export const updateCohort = async (id: string, data: UpdateCohortDto): Promise<Cohort> => {
  const response = await apiClient.patch(`/cohorts/${id}`, data);
  return response.data.data;
};

export const deleteCohort = async (id: string): Promise<void> => {
  await apiClient.delete(`/cohorts/${id}`);
};

export const getCohortSessions = async (cohortId: string): Promise<Session[]> => {
  const response = await apiClient.get(`/cohorts/${cohortId}/sessions`);
  return response.data.data;
};

export const createSession = async (cohortId: string, data: CreateSessionDto): Promise<Session> => {
  const response = await apiClient.post(`/cohorts/${cohortId}/sessions`, data);
  return response.data.data;
};

export const getSession = async (id: string): Promise<Session> => {
  const response = await apiClient.get(`/sessions/${id}`);
  return response.data.data;
};

export const updateSession = async (id: string, data: Partial<CreateSessionDto>): Promise<Session> => {
  const response = await apiClient.patch(`/sessions/${id}`, data);
  return response.data.data;
};

export const cancelSession = async (id: string, reason: string): Promise<void> => {
  await apiClient.post(`/sessions/${id}/cancel`, { reason });
};

export const completeSession = async (id: string, recordingUrl?: string): Promise<void> => {
  await apiClient.post(`/sessions/${id}/complete`, { recordingUrl });
};

export const markAttendance = async (sessionId: string, data: { records: { enrollmentId: string; clientId: string; status: string }[] }): Promise<Attendance[]> => {
  const response = await apiClient.post(`/sessions/${sessionId}/attendance`, data);
  return response.data.data;
};

export const getSessionAttendance = async (sessionId: string): Promise<Attendance[]> => {
  const response = await apiClient.get(`/sessions/${sessionId}/attendance`);
  return response.data.data;
};

export const getCohortAttendanceSummary = async (cohortId: string) => {
  const response = await apiClient.get(`/cohorts/${cohortId}/attendance-summary`);
  return response.data.data;
};

const cohortsApi = {
  getCohorts,
  getCohort,
  createCohort,
  updateCohort,
  deleteCohort,
  getCohortSessions,
  createSession,
  getSession,
  updateSession,
  cancelSession,
  completeSession,
  markAttendance,
  getSessionAttendance,
  getCohortAttendanceSummary,
};

export default cohortsApi;
