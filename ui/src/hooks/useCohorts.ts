import { parseError } from '@/lib/api/parseError';
import * as cohortsApi from '@/lib/api/cohorts.api';
import type { CreateCohortDto, CreateSessionDto, QueryCohortsDto, UpdateCohortDto } from '@/types/cohorts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

export const COHORTS_QUERY_KEYS = {
  all: ['cohorts'] as const,
  lists: () => [...COHORTS_QUERY_KEYS.all, 'list'] as const,
  list: (query?: QueryCohortsDto) => [...COHORTS_QUERY_KEYS.lists(), query] as const,
  details: () => [...COHORTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...COHORTS_QUERY_KEYS.details(), id] as const,
  sessions: (cohortId: string) => [...COHORTS_QUERY_KEYS.all, 'sessions', cohortId] as const,
};

export const useCohorts = (query?: QueryCohortsDto) => {
  return useQuery({
    queryKey: COHORTS_QUERY_KEYS.list(query),
    queryFn: () => cohortsApi.getCohorts(query),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCohort = (id: string) => {
  return useQuery({
    queryKey: COHORTS_QUERY_KEYS.detail(id),
    queryFn: () => cohortsApi.getCohort(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCohortSessions = (cohortId: string, enabled = true) => {
  return useQuery({
    queryKey: COHORTS_QUERY_KEYS.sessions(cohortId),
    queryFn: () => cohortsApi.getCohortSessions(cohortId),
    enabled: !!cohortId && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateCohort = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCohortDto) => cohortsApi.createCohort(data),
    onSuccess: () => {
      toast.success('Cohort created successfully');
      queryClient.invalidateQueries({ queryKey: COHORTS_QUERY_KEYS.lists() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to create cohort'));
    },
  });
};

export const useUpdateCohort = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCohortDto }) => cohortsApi.updateCohort(id, data),
    onSuccess: (_data, variables) => {
      toast.success('Cohort updated successfully');
      queryClient.invalidateQueries({ queryKey: COHORTS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: COHORTS_QUERY_KEYS.detail(variables.id) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to update cohort'));
    },
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cohortId, data }: { cohortId: string; data: CreateSessionDto }) =>
      cohortsApi.createSession(cohortId, data),
    onSuccess: (_data, variables) => {
      toast.success('Session created successfully');
      queryClient.invalidateQueries({ queryKey: COHORTS_QUERY_KEYS.sessions(variables.cohortId) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to create session'));
    },
  });
};

export const useCancelSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cohortsApi.cancelSession(id, reason),
    onSuccess: () => {
      toast.success('Session cancelled');
      queryClient.invalidateQueries({ queryKey: COHORTS_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to cancel session'));
    },
  });
};

export const useCompleteSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, recordingUrl }: { id: string; recordingUrl?: string }) =>
      cohortsApi.completeSession(id, recordingUrl),
    onSuccess: () => {
      toast.success('Session marked as complete');
      queryClient.invalidateQueries({ queryKey: COHORTS_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to complete session'));
    },
  });
};
