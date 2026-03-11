import { parseError } from '@/lib/api/parseError';
import * as programsApi from '@/lib/api/programs.api';
import type { CreateProgramDto, CreateProgramModuleDto, QueryProgramsDto, UpdateProgramDto, UpdateProgramModuleDto } from '@/types/programs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

export const PROGRAMS_QUERY_KEYS = {
  all: ['programs'] as const,
  lists: () => [...PROGRAMS_QUERY_KEYS.all, 'list'] as const,
  list: (query?: QueryProgramsDto) => [...PROGRAMS_QUERY_KEYS.lists(), query] as const,
  details: () => [...PROGRAMS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PROGRAMS_QUERY_KEYS.details(), id] as const,
  modules: (programId: string) => [...PROGRAMS_QUERY_KEYS.all, 'modules', programId] as const,
};

export const usePrograms = (query?: QueryProgramsDto) => {
  return useQuery({
    queryKey: PROGRAMS_QUERY_KEYS.list(query),
    queryFn: () => programsApi.getPrograms(query),
    staleTime: 5 * 60 * 1000,
  });
};

export const useProgram = (id: string) => {
  return useQuery({
    queryKey: PROGRAMS_QUERY_KEYS.detail(id),
    queryFn: () => programsApi.getProgram(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProgramModules = (programId: string, enabled = true) => {
  return useQuery({
    queryKey: PROGRAMS_QUERY_KEYS.modules(programId),
    queryFn: () => programsApi.getProgramModules(programId),
    enabled: !!programId && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProgramDto) => programsApi.createProgram(data),
    onSuccess: () => {
      toast.success('Program created successfully');
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEYS.lists() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to create program'));
    },
  });
};

export const useUpdateProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProgramDto }) => programsApi.updateProgram(id, data),
    onSuccess: (_data, variables) => {
      toast.success('Program updated successfully');
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEYS.detail(variables.id) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to update program'));
    },
  });
};

export const useDeleteProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => programsApi.deleteProgram(id),
    onSuccess: () => {
      toast.success('Program deleted successfully');
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEYS.lists() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to delete program'));
    },
  });
};

export const useCreateProgramModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, data }: { programId: string; data: CreateProgramModuleDto }) =>
      programsApi.createProgramModule(programId, data),
    onSuccess: (_data, variables) => {
      toast.success('Module added successfully');
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEYS.modules(variables.programId) });
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEYS.detail(variables.programId) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to add module'));
    },
  });
};

export const useUpdateProgramModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, moduleId, data }: { programId: string; moduleId: string; data: UpdateProgramModuleDto }) =>
      programsApi.updateProgramModule(programId, moduleId, data),
    onSuccess: (_data, variables) => {
      toast.success('Module updated successfully');
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEYS.modules(variables.programId) });
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEYS.detail(variables.programId) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to update module'));
    },
  });
};

export const useDeleteProgramModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, moduleId }: { programId: string; moduleId: string }) =>
      programsApi.deleteProgramModule(programId, moduleId),
    onSuccess: (_data, variables) => {
      toast.success('Module removed successfully');
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEYS.modules(variables.programId) });
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEYS.detail(variables.programId) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to remove module'));
    },
  });
};

export const useUpdateProgramTrainers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, trainerIds }: { programId: string; trainerIds: string[] }) =>
      programsApi.updateProgramTrainers(programId, trainerIds),
    onSuccess: (_data, variables) => {
      toast.success('Program trainers updated successfully');
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEYS.detail(variables.programId) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to update program trainers'));
    },
  });
};
