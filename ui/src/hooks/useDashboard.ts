import * as dashboardApi from '@/lib/api/dashboard.api';
import { useQuery } from '@tanstack/react-query';

export const DASHBOARD_QUERY_KEYS = {
  all: ['dashboard'] as const,
  overview: () => [...DASHBOARD_QUERY_KEYS.all, 'overview'] as const,
  enrollmentStats: () => [...DASHBOARD_QUERY_KEYS.all, 'enrollment-stats'] as const,
  revenueStats: () => [...DASHBOARD_QUERY_KEYS.all, 'revenue-stats'] as const,
  recentActivity: (limit?: number) => [...DASHBOARD_QUERY_KEYS.all, 'recent-activity', limit] as const,
  programPerformance: () => [...DASHBOARD_QUERY_KEYS.all, 'program-performance'] as const,
  cohortSummary: () => [...DASHBOARD_QUERY_KEYS.all, 'cohort-summary'] as const,
};

export const useDashboardOverview = () => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.overview(),
    queryFn: dashboardApi.getOverview,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useEnrollmentStats = () => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.enrollmentStats(),
    queryFn: dashboardApi.getEnrollmentStats,
    staleTime: 30 * 1000,
  });
};

export const useRevenueStats = () => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.revenueStats(),
    queryFn: dashboardApi.getRevenueStats,
    staleTime: 30 * 1000,
  });
};

export const useRecentActivity = (limit = 10) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.recentActivity(limit),
    queryFn: () => dashboardApi.getRecentActivity(limit),
    staleTime: 30 * 1000,
  });
};

export const useProgramPerformance = () => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.programPerformance(),
    queryFn: dashboardApi.getProgramPerformance,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCohortSummary = () => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.cohortSummary(),
    queryFn: dashboardApi.getCohortSummary,
    staleTime: 5 * 60 * 1000,
  });
};
