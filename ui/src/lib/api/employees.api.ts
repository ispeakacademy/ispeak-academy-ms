import type {
  CreateAvailabilityBlockDto,
  CreateEmployeeDto,
  Employee,
  PaginatedResponse,
  QueryEmployeesDto,
  TrainerAvailabilityBlock,
  UpdateEmployeeDto,
  WorkloadSummary,
} from '@/types/employees';
import apiClient from '.';

export const getMyEmployeeProfile = async (): Promise<Employee | null> => {
  const response = await apiClient.get('/employees/me');
  return response.data?.data ?? null;
};

export const updateMyEmployeeProfile = async (data: {
  bio?: string;
  specialization?: string;
  certifications?: string[];
  availableDays?: string[];
  availableHours?: { start: string; end: string };
  phone?: string;
}): Promise<Employee> => {
  const response = await apiClient.patch('/employees/me', data);
  return response.data.data;
};

export const getEmployees = async (query?: QueryEmployeesDto): Promise<PaginatedResponse<Employee>> => {
  const response = await apiClient.get('/employees', { params: query });
  return response.data?.data;
};

export const getEmployee = async (id: string): Promise<Employee> => {
  const response = await apiClient.get(`/employees/${id}`);
  return response.data.data;
};

export const createEmployee = async (data: CreateEmployeeDto): Promise<Employee> => {
  const response = await apiClient.post('/employees', data);
  return response.data.data;
};

export const updateEmployee = async (id: string, data: UpdateEmployeeDto): Promise<Employee> => {
  const response = await apiClient.patch(`/employees/${id}`, data);
  return response.data.data;
};

export const deactivateEmployee = async (id: string): Promise<Employee> => {
  const response = await apiClient.post(`/employees/${id}/deactivate`);
  return response.data.data;
};

export const updateEmployeeRole = async (id: string, roleId: string): Promise<Employee> => {
  const response = await apiClient.patch(`/employees/${id}/role`, { roleId });
  return response.data.data;
};

export const getEmployeeSessions = async (id: string, page = 1, limit = 10) => {
  const response = await apiClient.get(`/employees/${id}/sessions`, { params: { page, limit } });
  return response.data?.data;
};

export const getEmployeeCohorts = async (id: string) => {
  const response = await apiClient.get(`/employees/${id}/cohorts`);
  return response.data.data;
};

export const getEmployeeWorkload = async (id: string, month?: string): Promise<WorkloadSummary> => {
  const response = await apiClient.get(`/employees/${id}/workload`, { params: month ? { month } : {} });
  return response.data.data;
};

export const getAvailabilityBlocks = async (id: string): Promise<TrainerAvailabilityBlock[]> => {
  const response = await apiClient.get(`/employees/${id}/availability-blocks`);
  return response.data.data;
};

export const addAvailabilityBlock = async (id: string, data: CreateAvailabilityBlockDto): Promise<TrainerAvailabilityBlock> => {
  const response = await apiClient.post(`/employees/${id}/availability-blocks`, data);
  return response.data.data;
};

export const deleteAvailabilityBlock = async (employeeId: string, blockId: string): Promise<void> => {
  await apiClient.delete(`/employees/${employeeId}/availability-blocks/${blockId}`);
};

export const getAvailableTrainers = async (date: string): Promise<Employee[]> => {
  const response = await apiClient.get('/employees/available', { params: { date } });
  return response.data.data;
};

export const getRoles = async () => {
  const response = await apiClient.get('/permissions/roles');
  return response.data.data;
};
