import { parseError } from '@/lib/api/parseError';
import * as enrollmentsApi from '@/lib/api/enrollments.api';
import type { CreateEnrollmentDto, ModuleProgress, QueryEnrollmentsDto, UpdateEnrollmentDto } from '@/types/enrollments';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

export const ENROLLMENTS_QUERY_KEYS = {
  all: ['enrollments'] as const,
  lists: () => [...ENROLLMENTS_QUERY_KEYS.all, 'list'] as const,
  list: (query?: QueryEnrollmentsDto) => [...ENROLLMENTS_QUERY_KEYS.lists(), query] as const,
  details: () => [...ENROLLMENTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ENROLLMENTS_QUERY_KEYS.details(), id] as const,
  progress: (id: string) => [...ENROLLMENTS_QUERY_KEYS.all, 'progress', id] as const,
};

export const useEnrollments = (query?: QueryEnrollmentsDto) => {
  return useQuery({
    queryKey: ENROLLMENTS_QUERY_KEYS.list(query),
    queryFn: () => enrollmentsApi.getEnrollments(query),
    staleTime: 5 * 60 * 1000,
  });
};

export const useEnrollment = (id: string) => {
  return useQuery({
    queryKey: ENROLLMENTS_QUERY_KEYS.detail(id),
    queryFn: () => enrollmentsApi.getEnrollment(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useEnrollmentProgress = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ENROLLMENTS_QUERY_KEYS.progress(id),
    queryFn: () => enrollmentsApi.getEnrollmentProgress(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEnrollmentDto) => enrollmentsApi.createEnrollment(data),
    onSuccess: () => {
      toast.success('Enrollment created successfully');
      queryClient.invalidateQueries({ queryKey: ENROLLMENTS_QUERY_KEYS.lists() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to create enrollment'));
    },
  });
};

export const useUpdateEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEnrollmentDto }) => enrollmentsApi.updateEnrollment(id, data),
    onSuccess: (_data, variables) => {
      toast.success('Enrollment updated successfully');
      queryClient.invalidateQueries({ queryKey: ENROLLMENTS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ENROLLMENTS_QUERY_KEYS.detail(variables.id) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to update enrollment'));
    },
  });
};

export const useApproveEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enrollmentsApi.approveEnrollment(id),
    onSuccess: () => {
      toast.success('Enrollment approved');
      queryClient.invalidateQueries({ queryKey: ENROLLMENTS_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to approve enrollment'));
    },
  });
};

export const useRejectEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => enrollmentsApi.rejectEnrollment(id, reason),
    onSuccess: () => {
      toast.success('Enrollment rejected');
      queryClient.invalidateQueries({ queryKey: ENROLLMENTS_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to reject enrollment'));
    },
  });
};

export const useConfirmEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enrollmentsApi.confirmEnrollment(id),
    onSuccess: () => {
      toast.success('Enrollment confirmed');
      queryClient.invalidateQueries({ queryKey: ENROLLMENTS_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to confirm enrollment'));
    },
  });
};

export const useDropEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => enrollmentsApi.dropEnrollment(id, reason),
    onSuccess: () => {
      toast.success('Enrollment dropped');
      queryClient.invalidateQueries({ queryKey: ENROLLMENTS_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to drop enrollment'));
    },
  });
};

export const useDeferEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newCohortId }: { id: string; newCohortId: string }) =>
      enrollmentsApi.deferEnrollment(id, newCohortId),
    onSuccess: () => {
      toast.success('Enrollment deferred');
      queryClient.invalidateQueries({ queryKey: ENROLLMENTS_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to defer enrollment'));
    },
  });
};

export const useCompleteEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enrollmentsApi.completeEnrollment(id),
    onSuccess: () => {
      toast.success('Enrollment completed');
      queryClient.invalidateQueries({ queryKey: ENROLLMENTS_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to complete enrollment'));
    },
  });
};

export const useUpdateModuleProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId, moduleId, data }: { enrollmentId: string; moduleId: string; data: Partial<ModuleProgress> }) =>
      enrollmentsApi.updateModuleProgress(enrollmentId, moduleId, data),
    onSuccess: (_data, variables) => {
      toast.success('Module progress updated');
      queryClient.invalidateQueries({ queryKey: ENROLLMENTS_QUERY_KEYS.progress(variables.enrollmentId) });
      queryClient.invalidateQueries({ queryKey: ENROLLMENTS_QUERY_KEYS.lists() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to update module progress'));
    },
  });
};
