import { parseError } from '@/lib/api/parseError';
import * as employeesApi from '@/lib/api/employees.api';
import type {
  CreateAvailabilityBlockDto,
  CreateEmployeeDto,
  QueryEmployeesDto,
  UpdateEmployeeDto,
} from '@/types/employees';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

export const EMPLOYEES_QUERY_KEYS = {
  all: ['employees'] as const,
  lists: () => [...EMPLOYEES_QUERY_KEYS.all, 'list'] as const,
  list: (query?: QueryEmployeesDto) => [...EMPLOYEES_QUERY_KEYS.lists(), query] as const,
  details: () => [...EMPLOYEES_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EMPLOYEES_QUERY_KEYS.details(), id] as const,
  sessions: (id: string) => [...EMPLOYEES_QUERY_KEYS.all, 'sessions', id] as const,
  cohorts: (id: string) => [...EMPLOYEES_QUERY_KEYS.all, 'cohorts', id] as const,
  workload: (id: string, month?: string) => [...EMPLOYEES_QUERY_KEYS.all, 'workload', id, month] as const,
  availabilityBlocks: (id: string) => [...EMPLOYEES_QUERY_KEYS.all, 'availability', id] as const,
  available: (date: string) => [...EMPLOYEES_QUERY_KEYS.all, 'available', date] as const,
  roles: ['roles'] as const,
};

export const useEmployees = (query?: QueryEmployeesDto) => {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEYS.list(query),
    queryFn: () => employeesApi.getEmployees(query),
    staleTime: 5 * 60 * 1000,
  });
};

export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEYS.detail(id),
    queryFn: () => employeesApi.getEmployee(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useEmployeeSessions = (id: string, enabled = true) => {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEYS.sessions(id),
    queryFn: () => employeesApi.getEmployeeSessions(id),
    enabled: !!id && enabled,
    staleTime: 60 * 1000,
  });
};

export const useEmployeeCohorts = (id: string, enabled = true) => {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEYS.cohorts(id),
    queryFn: () => employeesApi.getEmployeeCohorts(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useEmployeeWorkload = (id: string, month?: string, enabled = true) => {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEYS.workload(id, month),
    queryFn: () => employeesApi.getEmployeeWorkload(id, month),
    enabled: !!id && enabled,
    staleTime: 60 * 1000,
  });
};

export const useAvailabilityBlocks = (id: string, enabled = true) => {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEYS.availabilityBlocks(id),
    queryFn: () => employeesApi.getAvailabilityBlocks(id),
    enabled: !!id && enabled,
    staleTime: 60 * 1000,
  });
};

export const useRoles = () => {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEYS.roles,
    queryFn: () => employeesApi.getRoles(),
    staleTime: 30 * 60 * 1000,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmployeeDto) => employeesApi.createEmployee(data),
    onSuccess: () => {
      toast.success('Employee created successfully');
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEYS.lists() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to create employee'));
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeDto }) => employeesApi.updateEmployee(id, data),
    onSuccess: (_data, variables) => {
      toast.success('Employee updated successfully');
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEYS.detail(variables.id) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to update employee'));
    },
  });
};

export const useUpdateEmployeeRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, roleId }: { employeeId: string; roleId: string }) =>
      employeesApi.updateEmployeeRole(employeeId, roleId),
    onSuccess: (_data, variables) => {
      toast.success('System role updated successfully');
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEYS.detail(variables.employeeId) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to update system role'));
    },
  });
};

export const useDeactivateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesApi.deactivateEmployee(id),
    onSuccess: (_data, id) => {
      toast.success('Employee deactivated');
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEYS.detail(id) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to deactivate employee'));
    },
  });
};

export const useAddAvailabilityBlock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data: CreateAvailabilityBlockDto }) =>
      employeesApi.addAvailabilityBlock(employeeId, data),
    onSuccess: (_data, variables) => {
      toast.success('Availability block added');
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEYS.availabilityBlocks(variables.employeeId) });
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEYS.detail(variables.employeeId) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to add availability block'));
    },
  });
};

export const useDeleteAvailabilityBlock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, blockId }: { employeeId: string; blockId: string }) =>
      employeesApi.deleteAvailabilityBlock(employeeId, blockId),
    onSuccess: (_data, variables) => {
      toast.success('Availability block removed');
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEYS.availabilityBlocks(variables.employeeId) });
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEYS.detail(variables.employeeId) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to remove availability block'));
    },
  });
};
