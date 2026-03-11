import { parseError } from '@/lib/api/parseError';
import * as assignmentsApi from '@/lib/api/assignments.api';
import type { CreateAssignmentDto, ReviewSubmissionDto, SubmitAssignmentDto } from '@/types/assignments';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ENROLLMENTS_QUERY_KEYS } from './useEnrollments';
import { PORTAL_QUERY_KEYS } from './usePortal';

export const ASSIGNMENTS_QUERY_KEYS = {
  all: ['assignments'] as const,
  lists: () => [...ASSIGNMENTS_QUERY_KEYS.all, 'list'] as const,
  list: (params?: Record<string, any>) => [...ASSIGNMENTS_QUERY_KEYS.lists(), params] as const,
  details: () => [...ASSIGNMENTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ASSIGNMENTS_QUERY_KEYS.details(), id] as const,
  byEnrollment: (enrollmentId: string) => [...ASSIGNMENTS_QUERY_KEYS.all, 'enrollment', enrollmentId] as const,
  summary: (enrollmentId: string) => [...ASSIGNMENTS_QUERY_KEYS.all, 'summary', enrollmentId] as const,
  myAssignments: () => [...ASSIGNMENTS_QUERY_KEYS.all, 'my'] as const,
  myAssignment: (id: string) => [...ASSIGNMENTS_QUERY_KEYS.all, 'my', id] as const,
};

// ---- Admin hooks ----

export const useAssignments = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ASSIGNMENTS_QUERY_KEYS.list(params),
    queryFn: () => assignmentsApi.getAssignments(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAssignment = (id: string) => {
  return useQuery({
    queryKey: ASSIGNMENTS_QUERY_KEYS.detail(id),
    queryFn: () => assignmentsApi.getAssignment(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAssignmentsByEnrollment = (enrollmentId: string, enabled = true) => {
  return useQuery({
    queryKey: ASSIGNMENTS_QUERY_KEYS.byEnrollment(enrollmentId),
    queryFn: () => assignmentsApi.getAssignmentsByEnrollment(enrollmentId),
    enabled: !!enrollmentId && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAssignmentSummary = (enrollmentId: string, enabled = true) => {
  return useQuery({
    queryKey: ASSIGNMENTS_QUERY_KEYS.summary(enrollmentId),
    queryFn: () => assignmentsApi.getAssignmentSummary(enrollmentId),
    enabled: !!enrollmentId && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssignmentDto) => assignmentsApi.createAssignment(data),
    onSuccess: () => {
      toast.success('Assignment created successfully');
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to create assignment'));
    },
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAssignmentDto> & { status?: string } }) =>
      assignmentsApi.updateAssignment(id, data),
    onSuccess: () => {
      toast.success('Assignment updated successfully');
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to update assignment'));
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignmentsApi.deleteAssignment(id),
    onSuccess: () => {
      toast.success('Assignment deleted');
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to delete assignment'));
    },
  });
};

export const useReviewSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, data }: { submissionId: string; data: ReviewSubmissionDto }) =>
      assignmentsApi.reviewSubmission(submissionId, data),
    onSuccess: () => {
      toast.success('Submission reviewed successfully');
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ENROLLMENTS_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to review submission'));
    },
  });
};

// ---- Portal hooks ----

export const useMyAssignments = () => {
  return useQuery({
    queryKey: ASSIGNMENTS_QUERY_KEYS.myAssignments(),
    queryFn: assignmentsApi.getMyAssignments,
    staleTime: 2 * 60 * 1000,
  });
};

export const useMyAssignment = (id: string) => {
  return useQuery({
    queryKey: ASSIGNMENTS_QUERY_KEYS.myAssignment(id),
    queryFn: () => assignmentsApi.getMyAssignment(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, data }: { assignmentId: string; data: SubmitAssignmentDto }) =>
      assignmentsApi.submitAssignment(assignmentId, data),
    onSuccess: () => {
      toast.success('Assignment submitted successfully');
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PORTAL_QUERY_KEYS.enrollments() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to submit assignment'));
    },
  });
};
