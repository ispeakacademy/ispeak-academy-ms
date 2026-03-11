import type { Client, Organisation, PaginatedResponse } from '@/types/clients';
import type { Invoice } from '@/types/invoices';
import apiClient from '.';

export const getOrganisations = async (page = 1, limit = 20, search?: string): Promise<PaginatedResponse<Organisation>> => {
  const response = await apiClient.get('/organisations', { params: { page, limit, search } });
  return response.data?.data;
};

export const getOrganisation = async (id: string): Promise<Organisation> => {
  const response = await apiClient.get(`/organisations/${id}`);
  return response.data.data;
};

export const createOrganisation = async (data: Partial<Organisation>): Promise<Organisation> => {
  const response = await apiClient.post('/organisations', data);
  return response.data.data;
};

export const updateOrganisation = async (id: string, data: Partial<Organisation>): Promise<Organisation> => {
  const response = await apiClient.patch(`/organisations/${id}`, data);
  return response.data.data;
};

export const deleteOrganisation = async (id: string): Promise<void> => {
  await apiClient.delete(`/organisations/${id}`);
};

export const getOrganisationContacts = async (id: string, page = 1, limit = 20): Promise<PaginatedResponse<Client>> => {
  const response = await apiClient.get(`/organisations/${id}/contacts`, { params: { page, limit } });
  return response.data?.data;
};

export const getOrganisationInvoices = async (id: string, page = 1, limit = 20): Promise<PaginatedResponse<Invoice>> => {
  const response = await apiClient.get(`/organisations/${id}/invoices`, { params: { page, limit } });
  return response.data?.data;
};

const organisationsApi = {
  getOrganisations,
  getOrganisation,
  createOrganisation,
  updateOrganisation,
  deleteOrganisation,
  getOrganisationContacts,
  getOrganisationInvoices,
};

export default organisationsApi;
