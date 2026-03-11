import type { Client, ClientInteraction, CreateClientDto, CreateInteractionDto, PaginatedResponse, QueryClientsDto, UpdateClientDto } from '@/types/clients';
import apiClient from '.';

export interface ClientsResponse extends PaginatedResponse<Client> {
  financials?: Record<string, { totalInvoiced: number; totalPaid: number; totalOutstanding: number }>;
}

export const getClients = async (query?: QueryClientsDto): Promise<ClientsResponse> => {
  const response = await apiClient.get('/clients', { params: query });
  return response.data?.data;
};

export const searchClients = async (q: string): Promise<Client[]> => {
  const response = await apiClient.get('/clients/search', { params: { q } });
  return response.data.data;
};

export const getClient = async (id: string): Promise<Client> => {
  const response = await apiClient.get(`/clients/${id}`);
  return response.data.data;
};

export const createClient = async (data: CreateClientDto): Promise<Client> => {
  const response = await apiClient.post('/clients', data);
  return response.data.data;
};

export const updateClient = async (id: string, data: UpdateClientDto): Promise<Client> => {
  const response = await apiClient.patch(`/clients/${id}`, data);
  return response.data.data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await apiClient.delete(`/clients/${id}`);
};

export const getClientTimeline = async (id: string): Promise<any[]> => {
  const response = await apiClient.get(`/clients/${id}/timeline`);
  return response.data.data;
};

export const getClientInteractions = async (id: string, page = 1, limit = 20): Promise<PaginatedResponse<ClientInteraction>> => {
  const response = await apiClient.get(`/clients/${id}/interactions`, { params: { page, limit } });
  return response.data?.data;
};

export const addInteraction = async (clientId: string, data: CreateInteractionDto): Promise<ClientInteraction> => {
  const response = await apiClient.post(`/clients/${clientId}/interactions`, data);
  return response.data.data;
};

export const getClientEnrollments = async (id: string, page = 1, limit = 20) => {
  const response = await apiClient.get(`/clients/${id}/enrollments`, { params: { page, limit } });
  return response.data?.data;
};

export const getClientInvoices = async (id: string, page = 1, limit = 20) => {
  const response = await apiClient.get(`/clients/${id}/invoices`, { params: { page, limit } });
  return response.data?.data;
};

export const getClientReferrals = async (id: string) => {
  const response = await apiClient.get(`/clients/${id}/referrals`);
  return response.data.data;
};

export const assignClient = async (clientId: string, employeeId: string): Promise<void> => {
  await apiClient.post(`/clients/${clientId}/assign`, { employeeId });
};

export const convertToProspect = async (clientId: string): Promise<Client> => {
  const response = await apiClient.post(`/clients/${clientId}/convert-to-prospect`);
  return response.data.data;
};

export const sendPortalInvite = async (clientId: string): Promise<{ message: string }> => {
  const response = await apiClient.post(`/clients/${clientId}/send-portal-invite`);
  return response.data;
};

const clientsApi = {
  getClients,
  searchClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientTimeline,
  getClientInteractions,
  addInteraction,
  getClientEnrollments,
  getClientInvoices,
  getClientReferrals,
  assignClient,
  convertToProspect,
  sendPortalInvite,
};

export default clientsApi;
