import type { ActivityItem, CohortSummary, DashboardOverview, EnrollmentStats, ProgramPerformance, RevenueStats } from '@/types/dashboard';
import apiClient from '.';

export const getOverview = async (): Promise<DashboardOverview> => {
  const response = await apiClient.get('/dashboard/overview');
  return response.data.data;
};

export const getEnrollmentStats = async (): Promise<EnrollmentStats> => {
  const response = await apiClient.get('/dashboard/enrollment-stats');
  return response.data.data;
};

export const getRevenueStats = async (): Promise<RevenueStats> => {
  const response = await apiClient.get('/dashboard/revenue-stats');
  return response.data.data;
};

export const getRecentActivity = async (limit = 10): Promise<ActivityItem[]> => {
  const response = await apiClient.get('/dashboard/recent-activity', { params: { limit } });
  return response.data.data;
};

export const getProgramPerformance = async (): Promise<ProgramPerformance[]> => {
  const response = await apiClient.get('/dashboard/program-performance');
  return response.data.data;
};

export const getCohortSummary = async (): Promise<CohortSummary[]> => {
  const response = await apiClient.get('/dashboard/cohort-summary');
  return response.data.data;
};

const dashboardApi = {
  getOverview,
  getEnrollmentStats,
  getRevenueStats,
  getRecentActivity,
  getProgramPerformance,
  getCohortSummary,
};

export default dashboardApi;
