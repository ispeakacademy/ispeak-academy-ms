import type { PaginatedResponse } from '@/types/clients';
import type { CreateProgramDto, CreateProgramModuleDto, Program, ProgramModule, QueryProgramsDto, UpdateProgramDto, UpdateProgramModuleDto } from '@/types/programs';
import apiClient from '.';

export const getPrograms = async (query?: QueryProgramsDto): Promise<PaginatedResponse<Program>> => {
  const response = await apiClient.get('/programs', { params: query });
  return response.data?.data;
};

export const getProgram = async (id: string): Promise<Program> => {
  const response = await apiClient.get(`/programs/${id}`);
  return response.data.data;
};

export const createProgram = async (data: CreateProgramDto): Promise<Program> => {
  const response = await apiClient.post('/programs', data);
  return response.data.data;
};

export const updateProgram = async (id: string, data: UpdateProgramDto): Promise<Program> => {
  const response = await apiClient.patch(`/programs/${id}`, data);
  return response.data.data;
};

export const deleteProgram = async (id: string): Promise<void> => {
  await apiClient.delete(`/programs/${id}`);
};

export const getProgramModules = async (programId: string): Promise<ProgramModule[]> => {
  const response = await apiClient.get(`/programs/${programId}/modules`);
  return response.data.data;
};

export const createProgramModule = async (programId: string, data: CreateProgramModuleDto): Promise<ProgramModule> => {
  const response = await apiClient.post(`/programs/${programId}/modules`, data);
  return response.data.data;
};

export const updateProgramModule = async (programId: string, moduleId: string, data: UpdateProgramModuleDto): Promise<ProgramModule> => {
  const response = await apiClient.patch(`/programs/${programId}/modules/${moduleId}`, data);
  return response.data.data;
};

export const deleteProgramModule = async (programId: string, moduleId: string): Promise<void> => {
  await apiClient.delete(`/programs/${programId}/modules/${moduleId}`);
};

export const updateProgramTrainers = async (programId: string, trainerIds: string[]): Promise<Program> => {
  const response = await apiClient.patch(`/programs/${programId}/trainers`, { trainerIds });
  return response.data.data;
};

const programsApi = {
  getPrograms,
  getProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  getProgramModules,
  createProgramModule,
  updateProgramModule,
  deleteProgramModule,
  updateProgramTrainers,
};

export default programsApi;
